"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { AssistantState, DeviceStatus, SystemSettings } from "@/lib/device-types";

export function AssistantOverlay({ assistant, device, settings }: { assistant: AssistantState; device: DeviceStatus; settings: SystemSettings }) {
  const lastSpoken = useRef("");

  useEffect(() => {
    if (assistant.phase !== "speaking" || !assistant.speak || !assistant.reply || !settings.speakResponses) return;
    const key = `${assistant.interactionId || assistant.updatedAt}:${assistant.reply}`;
    if (lastSpoken.current === key) return;
    lastSpoken.current = key;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(assistant.reply);
      utterance.rate = 1.03;
      utterance.pitch = 0.98;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((voice) => /en-US/i.test(voice.lang) && /google|english|natural/i.test(voice.name))
        || voices.find((voice) => /en/i.test(voice.lang));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [assistant, settings.speakResponses]);

  if (!settings.assistantEnabled || assistant.phase === "idle") return null;

  const label = assistant.phase === "listening"
    ? "LISTENING"
    : assistant.phase === "thinking"
      ? "THINKING"
      : assistant.phase === "speaking"
        ? "GO"
        : "ASSISTANT";

  return <div className={`assistant-overlay assistant-${assistant.phase}`}>
    <div className="assistant-orb"><Image src="/brand/gocreate-icon.png" alt="" width={76} height={72}/><i/><i/><i/></div>
    <div className="assistant-copy">
      <span>{label}</span>
      {settings.showTranscript && assistant.transcript && <p className="assistant-transcript">“{assistant.transcript}”</p>}
      {assistant.reply && <p className="assistant-reply">{assistant.reply}</p>}
      {assistant.visualPrompt && <small>{assistant.visualPrompt}</small>}
    </div>
    <div className="assistant-device"><i className={device.microphoneReady ? "ok" : ""}/>MIC <i className={device.cameraReady ? "ok" : ""}/>CAM</div>
  </div>;
}

export function PresenceSleep({ sleeping, style }: { sleeping: boolean; style: SystemSettings["sleepStyle"] }) {
  if (!sleeping) return null;
  return <div className={`presence-sleep sleep-${style}`}>
    {style === "icon" && <Image src="/brand/gocreate-icon.png" alt="GoCreate" width={122} height={116}/>} 
  </div>;
}
