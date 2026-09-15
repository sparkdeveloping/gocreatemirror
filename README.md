# GoCreateMirror v6 — Team Pulse + Screen Studio + Go AI + Pi Hardware

GoCreateMirror is a remotely managed 1080×1920 portrait smart mirror for a Raspberry Pi 3B+. The Raspberry Pi remains a lightweight kiosk; the Next.js application lives on Vercel and Firebase Realtime Database pushes visual state to the mirror.

v6 adds a structured **GoCreate weekly team schedule** layer on top of the v5 AI/hardware stack. The default mirror can now show who is on shift right now, who is coming in next, today’s roster and a full weekly schedule. The schedule is editable from `/admin` and updates the mirror in realtime.

## What is in this project

### Mirror / Screen Studio

- Portrait 1080×1920 mirror renderer.
- 38 polished templates, including **Team Pulse / Default** and **Full Team Week** plus the AI/hardware screens.
- `/admin` PIN gate with a signed HTTP-only 7-day session.
- Live View, template library and persistent custom screens.
- Full drag/resize/rotate/scale visual screen editor.
- 35 widget types: clock, weather, calendar, image, video, web frame, text, facility status, logo, metrics, animated content, hardware widgets, plus **Who’s In Now**, **Coming Up**, **Today’s Team** and **Weekly Team Schedule**.
- Firebase Realtime Database for instant screen switching.
- Automatic Vercel deployment detection and browser refresh.
- Logo/image glow is disabled by default and ignored for legacy `glow` values, so transparent brand assets render cleanly on the glass.


### Team schedule / staffing layer

- Weekly roster transcribed from the schedule photo supplied on 2026-09-15.
- `/admin -> Team Schedule` gives you a spreadsheet-style editor for names and all seven days.
- Current staff is calculated from the configured `America/Chicago` time, including split shifts.
- The **Who’s In Now** widget shows active staff and when each person leaves.
- **Coming Up** shows the next scheduled arrivals.
- **Today’s Team** shows every shift for the current day.
- **Weekly Team Schedule** shows the complete week and highlights today automatically.
- Team data lives at `/gocreatemirror/teamSchedule` in Firebase and can fall back to the bundled photo-seeded schedule if Firebase is unavailable.
- Go AI receives the current/next staff context, so questions like “Hey Go, who’s in right now?” can be answered from the same schedule.

### Go AI

- Local wake phrase: **“Hey Go”**.
- Wake recognition runs locally on the Pi using Vosk; it does not continuously stream room audio to the cloud.
- After wake, the Pi records only the following question.
- Groq Whisper endpoint for speech-to-text.
- Groq LLM by default for general conversation and mirror-control commands.
- Spoken replies use local `espeak-ng` on the Pi by default, so response TTS has no per-character API cost. Browser `speechSynthesis` remains available for admin-triggered/test speech.
- Optional Gemini vision: say **“Hey Go, look at this…”** and the Pi Camera captures a single image for that request.
- AI can switch templates/custom screens and perform selected live-screen edits such as adding text, changing text, resizing/rotating/styling widgets and removing a widget.

### Hardware layer

- HC-SR04 distance sensing.
- Presence-based mirror sleep/wake.
- Pi Camera readiness and on-demand capture.
- USB microphone input.
- Raspberry Pi companion heartbeat in `/admin -> AI + Hardware`.
- Hardware diagnostics and test commands.
- Systemd service with automatic restart.

## Architecture

```text
                   ┌────────────────────────────────────────┐
                   │              VERCEL                    │
                   │                                        │
Admin browser ───► │ Next.js /admin Screen Studio          │
                   │ /api/assistant/*                       │
                   │ /api/device/*                          │
                   └───────────────┬────────────────────────┘
                                   │
                         Firebase Realtime DB
                                   │
                   ┌───────────────▼────────────────────────┐
                   │        Raspberry Pi 3B+                │
                   │                                        │
                   │ Chromium kiosk ─► mirror UI            │
                   │                                        │
                   │ gocreatemirror-agent.service           │
                   │   ├─ USB microphone                    │
                   │   ├─ Vosk “Hey Go”                     │
                   │   ├─ HC-SR04 distance sensor           │
                   │   └─ Pi Camera                         │
                   └────────────────────────────────────────┘
```

Voice flow:

```text
room audio
   ↓
LOCAL Vosk keyword recognition
   ↓ only when “Hey Go” is detected
question recording
   ↓
/api/assistant/transcribe → Groq Whisper
   ↓
/api/assistant/chat → Groq LLM
   ↓
Firebase assistant state
   ↓
mirror overlay + local espeak-ng audio
```

Camera flow is intentionally different:

```text
“Hey Go, look at this. What is it?”
              ↓
explicit visual-intent phrase detected
              ↓
Pi Camera captures ONE image
              ↓
Gemini vision (if configured)
              ↓
spoken + on-screen answer
```

The camera is not continuously uploaded or analyzed.

---


# Team schedule quick start

After deploying v6, open:

```text
https://gocreatemirror.vercel.app/admin
```

Enter your admin PIN once, then open **Team Schedule**. The photo-seeded roster is already present as the fallback. Review/edit it and press **Save schedule** once to persist it into Firebase.

The Screen Library contains:

- **Team Pulse / Default** — current team + next arrivals + today’s roster while preserving a large reflection area.
- **Full Team Week** — the complete Monday–Sunday schedule.

If the mirror already has an older screen selected in Firebase, deployment will not forcibly replace that live selection. Choose **Team Pulse / Default → Go Live** once from the Screen Library. After that it behaves like any other remotely selected screen.

All four schedule widgets can also be added to any custom screen and moved, resized, rotated, recolored and animated in Screen Studio.

---

# 1. Web application setup

## Node

Use Node 22+.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/admin
```

## Firebase

The supplied browser config targets your `jollytiles` Firebase project. Make sure Realtime Database is active and copy its exact database URL.

Deploy `database.rules.json` or paste it into Firebase Console -> Realtime Database -> Rules.

The rules allow public read access only to the data the physical mirror needs:

- `/gocreatemirror/state`
- `/gocreatemirror/assistant`
- `/gocreatemirror/device/status`
- `/gocreatemirror/settings`
- `/gocreatemirror/teamSchedule`

Saved custom screens remain private to Firebase Admin.

## Vercel environment variables

Start from `.env.example`.

Required for persistent admin/screen control:

```text
ADMIN_PIN=your-pin
ADMIN_SESSION_SECRET=a-long-random-secret

FIREBASE_PROJECT_ID=jollytiles
FIREBASE_DATABASE_URL=<exact active RTDB URL>
FIREBASE_CLIENT_EMAIL=<service-account client_email>
FIREBASE_PRIVATE_KEY=<service-account private_key>

NEXT_PUBLIC_FIREBASE_DATABASE_URL=<same exact active RTDB URL>
```

### Device authentication

Generate a strong random value, for example:

```bash
openssl rand -hex 24
```

Set it in Vercel:

```text
MIRROR_DEVICE_TOKEN=<random value>
```

The same value must be in `/etc/gocreatemirror/agent.env` on the Pi. This protects the LLM/STT endpoints from arbitrary internet use.

### Voice AI

Default provider:

```text
AI_PROVIDER=groq
GROQ_API_KEY=<your Groq API key>
GROQ_STT_MODEL=whisper-large-v3-turbo
GROQ_LLM_MODEL=openai/gpt-oss-20b
```

The models are environment-configurable so the app does not depend on a hard-coded provider model forever.

### Optional camera vision

```text
GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_VISION_MODEL=gemini-2.5-flash
```

Without a Gemini key, everything except visual understanding still works.

Redeploy after changing Vercel environment variables.

---

# 2. Raspberry Pi setup

Target: Raspberry Pi 3B+ running Raspberry Pi OS 64-bit with Desktop.

## Fresh Pi: one setup script

From this project on the Pi:

```bash
MIRROR_DEVICE_TOKEN='THE-SAME-TOKEN-AS-VERCEL' bash setup-gocreatemirror.sh
```

The script configures:

- OS updates
- Chromium kiosk
- portrait rotation
- desktop autologin
- screen blanking disabled
- SSH
- GoCreateMirror website
- microphone/GPIO/camera dependencies
- local Vosk model
- GoCreateMirror companion service
- automatic startup/restart

Default portrait rotation is 90°. If the monitor is upside down:

```bash
MIRROR_DEVICE_TOKEN='THE-SAME-TOKEN-AS-VERCEL' bash setup-gocreatemirror.sh 270
```

## Existing mirror: only add the AI/hardware service

```bash
MIRROR_DEVICE_TOKEN='THE-SAME-TOKEN-AS-VERCEL' bash scripts/install-ai-hardware.sh
```

Then either reboot or check:

```bash
sudo systemctl status gocreatemirror-agent
journalctl -u gocreatemirror-agent -f
```

The installer uses GPIO23 for TRIG and GPIO24 for ECHO by default. Override before running if desired:

```bash
HC_SR04_TRIGGER_PIN=17 \
HC_SR04_ECHO_PIN=27 \
MIRROR_DEVICE_TOKEN='...' \
bash scripts/install-ai-hardware.sh
```

---

# 3. HC-SR04 wiring — read this before connecting it

**The Raspberry Pi GPIO is 3.3V only. The HC-SR04 ECHO pin outputs approximately 5V. Do not connect ECHO directly to a Pi GPIO.**

Recommended default wiring:

```text
HC-SR04                      Raspberry Pi 3B+
--------                     ----------------
VCC     ------------------>  5V
GND     ------------------>  GND
TRIG    ------------------>  GPIO23 / physical pin 16

ECHO ----[ 1 kΩ ]----+---->  GPIO24 / physical pin 18
                     |
                   [ 2 kΩ ]
                     |
                     +---->  GND
```

The 1k/2k resistor divider reduces the ~5V ECHO signal to about 3.3V.

See `docs/WIRING.md` for additional detail.

---

# 4. Pi Camera

Connect the Raspberry Pi Camera to the CSI connector while the Pi is powered off.

The companion service uses Picamera2. It does not keep the camera continuously streaming to the server. A camera is opened when an explicit visual question requires a capture, then closed again.

Test:

```bash
sudo systemctl stop gocreatemirror-agent
/opt/gocreatemirror-agent/venv/bin/python /opt/gocreatemirror-agent/gocreate_agent.py --test camera
sudo systemctl start gocreatemirror-agent
```

A successful test writes:

```text
~/gocreatemirror-camera-test.jpg
```

---

# 5. Microphone and “Hey Go”

The installer adds a small English Vosk model to:

```text
/opt/gocreatemirror-agent/models/vosk-model-small-en-us-0.15
```

The wake detector runs locally at 16 kHz and watches for the phrase configured in:

```text
/admin -> AI + Hardware -> Wake Phrase
```

Default:

```text
hey go
```

Test microphone:

```bash
sudo systemctl stop gocreatemirror-agent
/opt/gocreatemirror-agent/venv/bin/python /opt/gocreatemirror-agent/gocreate_agent.py --test mic
sudo systemctl start gocreatemirror-agent
```

Test wake recognition:

```bash
sudo systemctl stop gocreatemirror-agent
/opt/gocreatemirror-agent/venv/bin/python /opt/gocreatemirror-agent/gocreate_agent.py --test wake
sudo systemctl start gocreatemirror-agent
```

If the wrong microphone is selected, set `AUDIO_INPUT_DEVICE` in:

```text
/etc/gocreatemirror/agent.env
```

Use this to list ALSA devices:

```bash
arecord -l
```

---

# 6. Presence behavior

The distance daemon publishes approximately every few seconds while measuring locally more frequently.

Admin settings include:

- Presence on/off
- far/presence threshold
- sleep timeout
- sleep style
  - pure black
  - tiny GoCreate icon
  - dim live screen

The mirror will not sleep while Go AI is listening/thinking/speaking.

If the sensor/agent goes offline, the web UI deliberately stops enforcing presence sleep rather than accidentally leaving the mirror black forever.

Test sensor:

```bash
sudo systemctl stop gocreatemirror-agent
/opt/gocreatemirror-agent/venv/bin/python /opt/gocreatemirror-agent/gocreate_agent.py --test sensor
sudo systemctl start gocreatemirror-agent
```

---

# 7. AI screen control

When `Allow AI screen control` is enabled, the LLM may return a constrained action list. Supported actions are intentionally limited to mirror operations, not arbitrary shell access.

Examples:

```text
“Hey Go, switch to Go AI Halo.”
“Hey Go, switch to the Sensor Lab screen.”
“Hey Go, make the clock 20 percent bigger.”
“Hey Go, rotate the logo 10 degrees.”
“Hey Go, add the words Welcome Makers near the middle.”
“Hey Go, remove the quote.”
```

The server can execute:

- activate template
- activate custom screen
- update text
- add text
- remove widget
- change scale / rotation / font size / color / opacity

The AI never receives shell access to the Raspberry Pi.

---

# 8. Admin AI + Hardware page

After logging into `/admin`, open **AI + Hardware**.

It displays:

- Pi agent online/offline
- current distance
- presence state
- wake engine readiness
- microphone readiness
- Pi Camera readiness
- Groq configuration
- Gemini vision configuration
- current AI phase/transcript/reply

It also lets you configure behavior and send test listening/speech overlays to the physical mirror.

---

# 9. New hardware widgets

The normal Screen Studio now includes:

- **Distance Sensor** — current HC-SR04 reading in cm
- **Presence** — person-near / area-clear state
- **Go AI Status** — idle/listening/thinking/speaking/error
- **Camera Status** — camera-ready/offline indicator

These can be placed, scaled, rotated and animated like every other widget.

New templates:

- Go AI Halo
- Sensor Lab
- Voice Welcome
- Vision Bench

---

# 10. Privacy / security design

- Wake phrase recognition is local.
- Room audio is not continuously sent to a cloud service.
- Only the post-wake question is sent for transcription.
- Camera capture requires an explicit visual-intent phrase.
- Firebase browser writes are disabled by Security Rules.
- Firebase Admin credentials stay only in Vercel.
- Groq/Gemini keys stay only in Vercel.
- The Pi has only a separate `MIRROR_DEVICE_TOKEN`.
- AI mirror tools are allow-listed and do not execute shell commands.
- Admin PIN becomes an HTTP-only session cookie; you do not repeatedly transmit a PIN on every update.

Because `/gocreatemirror/assistant` is readable by the physical web client, a short-lived transcript can be visible in Realtime Database while an interaction is active. The companion clears it after the response finishes. If this installation will handle sensitive conversations, disable `Show transcript` and consider putting the mirror UI behind stronger device-specific authentication.

---

# Project map

```text
app/
  admin/                         admin login + studio
  api/
    admin/                       authenticated screen/system management
    assistant/
      chat/                      LLM + vision + mirror tools
      state/                     current voice overlay state
      transcribe/                Groq Whisper proxy
    device/
      config/                    Pi configuration
      status/                    Pi heartbeat/sensors

components/
  AssistantOverlay.tsx          mirror listening/thinking/speaking UI
  MirrorDashboard.tsx           realtime mirror shell
  ScreenRenderer.tsx            all widgets + editor renderer
  admin/
    AdminStudio.tsx
    ScreenEditor.tsx
    SystemPanel.tsx              AI/hardware control center

hardware/pi/
  gocreate_agent.py             Raspberry Pi companion daemon
  requirements.txt

lib/
  assistant-engine.ts           LLM + constrained mirror actions
  device-auth.ts
  device-store.ts
  device-types.ts
  mirror-store.ts
  screen-types.ts
  templates.ts
  widget-catalog.ts

scripts/
  install-ai-hardware.sh
  install-kiosk.sh

setup-gocreatemirror.sh         fresh-Pi one-shot installer
```

## Commands

```bash
npm run typecheck
npm run build
```

Pi logs:

```bash
journalctl -u gocreatemirror-agent -f
```

Kiosk logs:

```bash
tail -f ~/.local/state/gocreatemirror/kiosk.log
```
