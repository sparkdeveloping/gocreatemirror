#!/usr/bin/env python3
"""GoCreateMirror Raspberry Pi companion.

Responsibilities:
- HC-SR04 distance/presence sensing
- local "Hey Go" wake phrase with Vosk
- question recording after wake
- cloud STT + LLM through the GoCreateMirror Next.js API
- Pi Camera capture only when the spoken request explicitly asks for vision
- heartbeat/status publishing

No cloud API keys are stored on the Pi. The Pi only stores MIRROR_DEVICE_TOKEN.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import math
import os
import queue
import re
import signal
import subprocess
import sys
import tempfile
import threading
import time
import wave
from array import array
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import requests

AGENT_VERSION = "5.0.0"
RATE = 16000
CHANNELS = 1
SAMPLE_WIDTH = 2


def env_bool(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def normalize_phrase(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", text.lower()).replace("  ", " ").strip()


def rms_pcm16(data: bytes) -> float:
    if not data:
        return 0.0
    samples = array("h")
    samples.frombytes(data)
    if sys.byteorder == "big":
        samples.byteswap()
    if not samples:
        return 0.0
    return math.sqrt(sum(sample * sample for sample in samples) / len(samples))


@dataclass
class RuntimeSettings:
    assistantEnabled: bool = True
    wakePhrase: str = "hey go"
    speakResponses: bool = True
    showTranscript: bool = True
    allowScreenControl: bool = True
    visionEnabled: bool = True
    presenceEnabled: bool = True
    sleepAfterSeconds: int = 45
    sleepStyle: str = "icon"
    nearDistanceCm: float = 90.0
    farDistanceCm: float = 220.0
    visualIntentWords: list[str] = field(default_factory=lambda: ["look at this", "what is this", "what am i holding", "what do you see", "use the camera", "scan this"])

    @classmethod
    def from_json(cls, raw: dict[str, Any]) -> "RuntimeSettings":
        current = cls()
        for key in current.__dict__.keys():
            if key in raw:
                setattr(current, key, raw[key])
        return current


class Api:
    def __init__(self, base_url: str, token: str):
        self.base = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": f"GoCreateMirrorAgent/{AGENT_VERSION}"})
        if token:
            self.session.headers.update({"x-gocreate-device-token": token})

    def get(self, path: str, timeout: float = 12) -> Any:
        response = self.session.get(f"{self.base}{path}", timeout=timeout)
        response.raise_for_status()
        return response.json()

    def post(self, path: str, payload: dict[str, Any], timeout: float = 25) -> Any:
        response = self.session.post(f"{self.base}{path}", json=payload, timeout=timeout)
        response.raise_for_status()
        return response.json()

    def post_audio(self, wav_bytes: bytes, timeout: float = 45) -> str:
        response = self.session.post(
            f"{self.base}/api/assistant/transcribe",
            files={"file": ("question.wav", wav_bytes, "audio/wav")},
            timeout=timeout,
        )
        response.raise_for_status()
        return str(response.json().get("text", "")).strip()


class PresenceSensor:
    def __init__(self, trigger_pin: int, echo_pin: int):
        self.sensor = None
        self.error = ""
        try:
            from gpiozero import DistanceSensor  # type: ignore
            self.sensor = DistanceSensor(echo=echo_pin, trigger=trigger_pin, max_distance=4.0, queue_len=3, partial=True)
        except Exception as exc:
            self.error = str(exc)

    def read_cm(self) -> float | None:
        if not self.sensor:
            return None
        try:
            value = float(self.sensor.distance) * 100.0
            return round(value, 1) if math.isfinite(value) else None
        except Exception as exc:
            self.error = str(exc)
            return None

    def close(self) -> None:
        try:
            if self.sensor:
                self.sensor.close()
        except Exception:
            pass


class PiCamera:
    @staticmethod
    def available() -> bool:
        try:
            from picamera2 import Picamera2  # type: ignore
            return bool(Picamera2.global_camera_info())
        except Exception:
            return False

    @staticmethod
    def capture_jpeg() -> bytes:
        from picamera2 import Picamera2  # type: ignore
        camera = Picamera2()
        try:
            camera.configure(camera.create_still_configuration(main={"size": (1024, 768), "format": "RGB888"}))
            camera.start()
            time.sleep(0.7)
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as handle:
                path = handle.name
            camera.capture_file(path)
            data = Path(path).read_bytes()
            Path(path).unlink(missing_ok=True)
            return data
        finally:
            try:
                camera.stop()
            except Exception:
                pass
            try:
                camera.close()
            except Exception:
                pass


class Audio:
    def __init__(self, input_device: str | int | None = None):
        self.input_device = input_device
        self.sd = None
        self.error = ""
        try:
            import sounddevice as sd  # type: ignore
            self.sd = sd
        except Exception as exc:
            self.error = str(exc)

    def ready(self) -> bool:
        if not self.sd:
            return False
        try:
            self.sd.check_input_settings(device=self.input_device, samplerate=RATE, channels=CHANNELS, dtype="int16")
            return True
        except Exception as exc:
            self.error = str(exc)
            return False

    def raw_stream(self, callback):
        if not self.sd:
            raise RuntimeError("sounddevice is not available")
        return self.sd.RawInputStream(
            samplerate=RATE,
            blocksize=4000,
            device=self.input_device,
            dtype="int16",
            channels=CHANNELS,
            callback=callback,
        )

    def record_question(self, max_seconds: float = 14.0, silence_seconds: float = 1.25, threshold: float = 560.0) -> bytes:
        if not self.sd:
            raise RuntimeError("Microphone is unavailable")
        chunks: list[bytes] = []
        speaking = False
        quiet_for = 0.0
        started = time.monotonic()
        chunk_frames = 1600  # 100ms
        with self.sd.RawInputStream(samplerate=RATE, blocksize=chunk_frames, device=self.input_device, dtype="int16", channels=CHANNELS) as stream:
            while time.monotonic() - started < max_seconds:
                data, _overflowed = stream.read(chunk_frames)
                piece = bytes(data)
                level = rms_pcm16(piece)
                if level >= threshold:
                    speaking = True
                    quiet_for = 0.0
                elif speaking:
                    quiet_for += chunk_frames / RATE
                chunks.append(piece)
                if speaking and quiet_for >= silence_seconds:
                    break
        if not speaking:
            return b""
        output = io.BytesIO()
        with wave.open(output, "wb") as wav:
            wav.setnchannels(CHANNELS)
            wav.setsampwidth(SAMPLE_WIDTH)
            wav.setframerate(RATE)
            wav.writeframes(b"".join(chunks))
        return output.getvalue()


class WakeDetector:
    def __init__(self, audio: Audio, model_path: str):
        self.audio = audio
        self.model_path = model_path
        self.error = ""
        self.vosk = None
        self.model = None
        try:
            from vosk import KaldiRecognizer, Model, SetLogLevel  # type: ignore
            SetLogLevel(-1)
            self.vosk = (KaldiRecognizer, Model)
            if Path(model_path).exists():
                self.model = Model(model_path)
            else:
                self.error = f"Vosk model not found: {model_path}"
        except Exception as exc:
            self.error = str(exc)

    def ready(self) -> bool:
        return bool(self.vosk and self.model and self.audio.ready())

    def wait(self, phrase: str, stop_event: threading.Event, on_tick=None) -> bool:
        if not self.ready():
            time.sleep(2)
            return False
        KaldiRecognizer, _Model = self.vosk
        recognizer = KaldiRecognizer(self.model, RATE, json.dumps([target, "[unk]"]))
        q: queue.Queue[bytes] = queue.Queue(maxsize=12)
        target = normalize_phrase(phrase)

        def callback(indata, frames, time_info, status):
            del frames, time_info, status
            try:
                q.put_nowait(bytes(indata))
            except queue.Full:
                try:
                    q.get_nowait()
                except queue.Empty:
                    pass

        last_tick = 0.0
        with self.audio.raw_stream(callback):
            while not stop_event.is_set():
                try:
                    data = q.get(timeout=0.4)
                except queue.Empty:
                    if on_tick and time.monotonic() - last_tick > 1:
                        on_tick()
                        last_tick = time.monotonic()
                    continue
                recognizer.AcceptWaveform(data)
                try:
                    partial = json.loads(recognizer.PartialResult()).get("partial", "")
                except Exception:
                    partial = ""
                spoken = normalize_phrase(str(partial))
                if target and target in spoken:
                    return True
                if on_tick and time.monotonic() - last_tick > 1:
                    on_tick()
                    last_tick = time.monotonic()
        return False


class Agent:
    def __init__(self):
        self.url = os.environ.get("MIRROR_URL", "https://gocreatemirror.vercel.app").rstrip("/")
        self.token = os.environ.get("MIRROR_DEVICE_TOKEN", "").strip()
        self.api = Api(self.url, self.token)
        input_device: str | int | None = os.environ.get("AUDIO_INPUT_DEVICE") or None
        if isinstance(input_device, str) and input_device.isdigit():
            input_device = int(input_device)
        self.audio = Audio(input_device)
        self.wake = WakeDetector(self.audio, os.environ.get("VOSK_MODEL_PATH", "/opt/gocreatemirror-agent/models/vosk-model-small-en-us-0.15"))
        self.sensor = PresenceSensor(int(os.environ.get("HC_SR04_TRIGGER_PIN", "23")), int(os.environ.get("HC_SR04_ECHO_PIN", "24")))
        self.camera_ready = PiCamera.available()
        self.settings = RuntimeSettings()
        self.stop_event = threading.Event()
        self.distance_cm: float | None = None
        self.presence = True
        self.proximity = "none"
        self.last_config = 0.0
        self.last_heartbeat = 0.0
        self.sensor_thread = threading.Thread(target=self.sensor_loop, daemon=True)

    def pull_settings(self, force: bool = False) -> None:
        if not force and time.monotonic() - self.last_config < 20:
            return
        try:
            self.settings = RuntimeSettings.from_json(self.api.get("/api/device/config"))
            self.last_config = time.monotonic()
        except Exception as exc:
            print(f"[agent] config: {exc}", flush=True)

    def post_status(self, note: str = "") -> None:
        if time.monotonic() - self.last_heartbeat < 4 and not note:
            return
        payload = {
            "online": True,
            "presence": bool(self.presence),
            "distanceCm": self.distance_cm,
            "proximity": self.proximity,
            "cameraReady": self.camera_ready,
            "microphoneReady": self.audio.ready(),
            "wakeReady": self.wake.ready(),
            "wakeEngine": "vosk-keyphrase" if self.wake.ready() else "unavailable",
            "wakePhrase": self.settings.wakePhrase,
            "agentVersion": AGENT_VERSION,
            "note": note or (self.sensor.error if self.sensor.error else ""),
        }
        try:
            self.api.post("/api/device/status", payload, timeout=10)
            self.last_heartbeat = time.monotonic()
        except Exception as exc:
            print(f"[agent] heartbeat: {exc}", flush=True)

    def sensor_loop(self) -> None:
        while not self.stop_event.is_set():
            self.pull_settings()
            if self.settings.presenceEnabled and self.sensor.sensor:
                distance = self.sensor.read_cm()
                self.distance_cm = distance
                self.presence = bool(distance is not None and distance <= float(self.settings.farDistanceCm))
                if distance is None or not self.presence:
                    self.proximity = "none"
                elif distance <= float(self.settings.nearDistanceCm):
                    self.proximity = "near"
                else:
                    self.proximity = "far"
            else:
                self.distance_cm = None
                self.presence = True
                self.proximity = "none"
            self.post_status()
            time.sleep(0.55)

    def vision_requested(self, text: str) -> bool:
        normalized = normalize_phrase(text)
        return self.settings.visionEnabled and any(normalize_phrase(item) in normalized for item in self.settings.visualIntentWords if item)

    def set_assistant(self, phase: str, **kwargs: Any) -> None:
        try:
            self.api.post("/api/assistant/state", {"phase": phase, **kwargs}, timeout=10)
        except Exception as exc:
            print(f"[agent] assistant state: {exc}", flush=True)

    def speak_local(self, text: str) -> None:
        if not self.settings.speakResponses or not text.strip():
            return
        engine = os.environ.get("TTS_ENGINE", "espeak").strip().lower()
        if engine in {"off", "none"}:
            return
        if engine == "espeak":
            command = os.environ.get("ESPEAK_COMMAND", "espeak-ng")
            voice = os.environ.get("ESPEAK_VOICE", "en-us")
            speed = os.environ.get("ESPEAK_SPEED", "168")
            try:
                subprocess.run([command, "-v", voice, "-s", speed, text[:1800]], check=False, timeout=45)
            except Exception as exc:
                print(f"[agent] local TTS: {exc}", flush=True)

    def interaction(self) -> None:
        interaction_id = f"pi-{int(time.time() * 1000)}"
        self.set_assistant("listening", transcript="", reply="", speak=False, interactionId=interaction_id)
        time.sleep(0.18)
        try:
            wav = self.audio.record_question(
                max_seconds=float(os.environ.get("QUESTION_MAX_SECONDS", "14")),
                silence_seconds=float(os.environ.get("QUESTION_SILENCE_SECONDS", "1.25")),
                threshold=float(os.environ.get("MIC_RMS_THRESHOLD", "560")),
            )
            if not wav:
                self.set_assistant("error", reply="I didn't catch a question.", speak=True, interactionId=interaction_id)
                time.sleep(2.5)
                self.set_assistant("idle", transcript="", reply="", speak=False, interactionId=interaction_id)
                return
            self.set_assistant("thinking", transcript="", reply="", speak=False, interactionId=interaction_id)
            text = self.api.post_audio(wav)
            if not text:
                raise RuntimeError("Speech recognition returned no text.")
            image_b64 = ""
            if self.vision_requested(text):
                if self.camera_ready:
                    self.set_assistant("thinking", transcript=text, reply="", visualPrompt="CAMERA ACTIVE ON REQUEST", speak=False, interactionId=interaction_id)
                    image_b64 = base64.b64encode(PiCamera.capture_jpeg()).decode("ascii")
                else:
                    print("[agent] visual request received, but Pi Camera is unavailable", flush=True)
            result = self.api.post("/api/assistant/chat", {
                "text": text,
                "imageBase64": image_b64,
                "mimeType": "image/jpeg",
                "interactionId": interaction_id,
                "localTts": True,
            }, timeout=70)
            reply = str(result.get("reply", "")).strip()
            self.speak_local(reply)
            wait_seconds = min(28.0, max(4.0, len(reply) / 14.0 + 2.5))
            time.sleep(wait_seconds)
            self.set_assistant("idle", transcript="", reply="", visualPrompt="", speak=False, interactionId=interaction_id)
        except Exception as exc:
            print(f"[agent] interaction: {exc}", flush=True)
            self.set_assistant("error", reply=f"I hit an error: {str(exc)[:180]}", speak=True, interactionId=interaction_id)
            time.sleep(5)
            self.set_assistant("idle", transcript="", reply="", speak=False, interactionId=interaction_id)

    def run(self) -> None:
        self.pull_settings(force=True)
        self.sensor_thread.start()
        self.post_status("agent started")
        print(f"[agent] GoCreateMirror {AGENT_VERSION} -> {self.url}", flush=True)
        print(f"[agent] wake phrase: {self.settings.wakePhrase!r}; wake ready={self.wake.ready()}", flush=True)
        while not self.stop_event.is_set():
            self.pull_settings()
            self.post_status()
            if not self.settings.assistantEnabled:
                time.sleep(1)
                continue
            woke = self.wake.wait(self.settings.wakePhrase, self.stop_event, on_tick=lambda: (self.pull_settings(), self.post_status()))
            if woke and not self.stop_event.is_set():
                print("[agent] wake phrase detected", flush=True)
                self.interaction()
                time.sleep(0.35)

    def stop(self) -> None:
        self.stop_event.set()
        self.sensor.close()
        try:
            self.api.post("/api/device/status", {"online": False, "presence": False, "agentVersion": AGENT_VERSION}, timeout=3)
        except Exception:
            pass


def test_hardware(agent: Agent, what: str) -> int:
    if what == "sensor":
        for _ in range(8):
            print(f"distance_cm={agent.sensor.read_cm()} error={agent.sensor.error!r}")
            time.sleep(0.5)
        return 0
    if what == "camera":
        print(f"camera_available={agent.camera_ready}")
        if agent.camera_ready:
            out = Path.home() / "gocreatemirror-camera-test.jpg"
            out.write_bytes(PiCamera.capture_jpeg())
            print(f"saved={out}")
        return 0
    if what == "mic":
        print(f"microphone_ready={agent.audio.ready()} error={agent.audio.error!r}")
        if agent.audio.ready():
            print("Speak now. Recording until silence…")
            data = agent.audio.record_question(max_seconds=8)
            out = Path.home() / "gocreatemirror-mic-test.wav"
            out.write_bytes(data)
            print(f"saved={out} bytes={len(data)}")
        return 0
    if what == "wake":
        print(f"wake_ready={agent.wake.ready()} error={agent.wake.error!r}")
        print(f"Say {agent.settings.wakePhrase!r}…")
        ok = agent.wake.wait(agent.settings.wakePhrase, threading.Event())
        print(f"detected={ok}")
        return 0
    return 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", choices=["sensor", "camera", "mic", "wake"])
    args = parser.parse_args()
    agent = Agent()
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: agent.stop())
    if args.test:
        agent.pull_settings(force=True)
        return test_hardware(agent, args.test)
    try:
        agent.run()
    finally:
        agent.stop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
