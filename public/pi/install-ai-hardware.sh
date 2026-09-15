#!/usr/bin/env bash
set -Eeuo pipefail

# GoCreateMirror v5 AI + hardware companion installer.
# Run as the normal desktop user, not sudo.
#
# Usage:
#   bash scripts/install-ai-hardware.sh
#   MIRROR_DEVICE_TOKEN='same-value-as-vercel' bash scripts/install-ai-hardware.sh
#
# Optional pin overrides:
#   HC_SR04_TRIGGER_PIN=23 HC_SR04_ECHO_PIN=24 bash scripts/install-ai-hardware.sh

MIRROR_URL="${MIRROR_URL:-https://gocreatemirror.vercel.app}"
DEVICE_TOKEN="${MIRROR_DEVICE_TOKEN:-}"
TRIGGER_PIN="${HC_SR04_TRIGGER_PIN:-23}"
ECHO_PIN="${HC_SR04_ECHO_PIN:-24}"
INSTALL_DIR="/opt/gocreatemirror-agent"
CONFIG_DIR="/etc/gocreatemirror"
MODEL_DIR="$INSTALL_DIR/models"
MODEL_NAME="vosk-model-small-en-us-0.15"
MODEL_URL="https://alphacephei.com/vosk/models/${MODEL_NAME}.zip"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log(){ printf '\n\033[1;36m[GoCreate AI]\033[0m %s\n' "$*"; }
warn(){ printf '\n\033[1;33m[GoCreate AI]\033[0m %s\n' "$*" >&2; }
die(){ printf '\n\033[1;31m[GoCreate AI]\033[0m %s\n' "$*" >&2; exit 1; }

[[ "$EUID" -ne 0 ]] || die "Run this as your normal Raspberry Pi user, not sudo."
command -v sudo >/dev/null || die "sudo is required."

if [[ -z "$DEVICE_TOKEN" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    DEVICE_TOKEN="$(openssl rand -hex 24)"
  else
    DEVICE_TOKEN="$(date +%s)-$(hostname)-$RANDOM-$RANDOM"
  fi
  warn "No MIRROR_DEVICE_TOKEN was supplied, so a device token was generated and will be saved on this Pi."
  printf '%s\n' "Add this exact environment variable in Vercel and redeploy:" "MIRROR_DEVICE_TOKEN=$DEVICE_TOKEN"
fi

log "Installing Raspberry Pi audio/camera/GPIO dependencies..."
sudo apt update
sudo DEBIAN_FRONTEND=noninteractive apt -y install \
  python3 python3-venv python3-pip python3-dev \
  libportaudio2 portaudio19-dev alsa-utils espeak-ng \
  curl unzip ca-certificates
sudo DEBIAN_FRONTEND=noninteractive apt -y install python3-gpiozero || warn "python3-gpiozero package not available; sensor support may require manual install."
sudo DEBIAN_FRONTEND=noninteractive apt -y install python3-picamera2 || warn "python3-picamera2 package not available; camera support may require Raspberry Pi OS Desktop packages."

log "Creating companion service..."
sudo mkdir -p "$INSTALL_DIR" "$MODEL_DIR" "$CONFIG_DIR"
sudo chown -R "$USER:$USER" "$INSTALL_DIR"

if [[ -f "$PROJECT_DIR/hardware/pi/gocreate_agent.py" ]]; then
  cp "$PROJECT_DIR/hardware/pi/gocreate_agent.py" "$INSTALL_DIR/gocreate_agent.py"
  cp "$PROJECT_DIR/hardware/pi/requirements.txt" "$INSTALL_DIR/requirements.txt"
else
  curl -fsSL "$MIRROR_URL/pi/gocreate_agent.py" -o "$INSTALL_DIR/gocreate_agent.py"
  curl -fsSL "$MIRROR_URL/pi/requirements.txt" -o "$INSTALL_DIR/requirements.txt"
fi
chmod +x "$INSTALL_DIR/gocreate_agent.py"

if [[ ! -d "$INSTALL_DIR/venv" ]]; then
  python3 -m venv --system-site-packages "$INSTALL_DIR/venv"
fi
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip wheel
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt"

if [[ ! -d "$MODEL_DIR/$MODEL_NAME" ]]; then
  log "Downloading the small offline speech model used to hear 'Hey Go'..."
  TMP_ZIP="$(mktemp --suffix=.zip)"
  curl -fL --retry 3 "$MODEL_URL" -o "$TMP_ZIP"
  unzip -q "$TMP_ZIP" -d "$MODEL_DIR"
  rm -f "$TMP_ZIP"
fi

log "Writing hardware configuration..."
sudo tee "$CONFIG_DIR/agent.env" >/dev/null <<ENVEOF
MIRROR_URL=$MIRROR_URL
MIRROR_DEVICE_TOKEN=$DEVICE_TOKEN
VOSK_MODEL_PATH=$MODEL_DIR/$MODEL_NAME
HC_SR04_TRIGGER_PIN=$TRIGGER_PIN
HC_SR04_ECHO_PIN=$ECHO_PIN
QUESTION_MAX_SECONDS=14
QUESTION_SILENCE_SECONDS=1.25
MIC_RMS_THRESHOLD=560
TTS_ENGINE=espeak
ESPEAK_VOICE=en-us
ESPEAK_SPEED=168
ENVEOF
sudo chmod 600 "$CONFIG_DIR/agent.env"

sudo usermod -aG audio,video,gpio "$USER" 2>/dev/null || true

log "Installing systemd service..."
sudo tee /etc/systemd/system/gocreatemirror-agent.service >/dev/null <<SERVICEEOF
[Unit]
Description=GoCreateMirror AI and hardware companion
After=network-online.target sound.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
Group=$USER
SupplementaryGroups=audio video gpio
EnvironmentFile=$CONFIG_DIR/agent.env
ExecStart=$INSTALL_DIR/venv/bin/python $INSTALL_DIR/gocreate_agent.py
Restart=always
RestartSec=3
TimeoutStopSec=8

[Install]
WantedBy=multi-user.target
SERVICEEOF
sudo systemctl daemon-reload
sudo systemctl enable gocreatemirror-agent.service
sudo systemctl restart gocreatemirror-agent.service

# Existing mirrors may have been installed before v5. Add the Chromium flag that
# guarantees programmatic spoken replies can play in kiosk mode.
KIOSK_LAUNCHER="$HOME/.local/bin/gocreatemirror-kiosk"
if [[ -f "$KIOSK_LAUNCHER" ]] && ! grep -q -- "--autoplay-policy=no-user-gesture-required" "$KIOSK_LAUNCHER"; then
  sed -i '/--disable-notifications/a\    --autoplay-policy=no-user-gesture-required \\' "$KIOSK_LAUNCHER" || true
fi

log "AI + hardware companion installed."
printf '%s\n' \
  "Service        : gocreatemirror-agent.service" \
  "Mirror URL     : $MIRROR_URL" \
  "Wake phrase    : Hey Go (controlled from /admin -> AI + Hardware)" \
  "HC-SR04 TRIG   : GPIO $TRIGGER_PIN" \
  "HC-SR04 ECHO   : GPIO $ECHO_PIN THROUGH A 5V->3.3V VOLTAGE DIVIDER" \
  "Camera         : Pi Camera via CSI" \
  "Config         : $CONFIG_DIR/agent.env" \
  "Logs           : journalctl -u gocreatemirror-agent -f"

warn "IMPORTANT: HC-SR04 ECHO is 5V. Never wire ECHO directly to a Raspberry Pi GPIO. Use a resistor divider/level shifter."
