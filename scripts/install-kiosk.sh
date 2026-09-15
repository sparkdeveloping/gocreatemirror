#!/usr/bin/env bash
set -Eeuo pipefail

# GoCreateMirror — one-shot Raspberry Pi kiosk installer
# Target: Raspberry Pi 3B+ / Raspberry Pi OS 64-bit with Desktop (labwc/Wayland)
#
# Normal use:
#   bash setup-gocreatemirror.sh
#
# If portrait is upside-down:
#   bash setup-gocreatemirror.sh 270

MIRROR_URL="https://gocreatemirror.vercel.app"
ROTATION="${1:-90}"
HOSTNAME="gocreatemirror"
TIMEZONE="America/Chicago"

log()  { printf '\n\033[1;36m[GoCreateMirror]\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m[GoCreateMirror]\033[0m %s\n' "$*" >&2; }
die()  { printf '\n\033[1;31m[GoCreateMirror]\033[0m %s\n' "$*" >&2; exit 1; }

trap 'rc=$?; printf "\n\033[1;31m[GoCreateMirror]\033[0m Setup stopped at line %s (exit %s).\n" "$LINENO" "$rc" >&2; exit "$rc"' ERR

case "$ROTATION" in
  90|270) ;;
  *) die "Portrait rotation must be 90 or 270." ;;
esac

if [[ "$EUID" -eq 0 ]]; then
  die "Run this as your normal Raspberry Pi user, not with sudo. The script uses sudo itself."
fi

command -v sudo >/dev/null 2>&1 || die "sudo is required."
command -v raspi-config >/dev/null 2>&1 || die "raspi-config is missing. Install Raspberry Pi OS 64-bit with Desktop."

if [[ -r /proc/device-tree/model ]]; then
  MODEL="$(tr -d '\0' < /proc/device-tree/model)"
  log "Detected: $MODEL"
fi

log "Requesting administrator access..."
sudo -v

# Keep sudo alive while the long OS upgrade runs.
(
  while true; do
    sudo -n true 2>/dev/null || exit
    sleep 50
  done
) &
SUDO_KEEPALIVE_PID=$!
trap 'kill "$SUDO_KEEPALIVE_PID" 2>/dev/null || true' EXIT

log "Updating Raspberry Pi OS..."
sudo apt update
sudo DEBIAN_FRONTEND=noninteractive apt -y full-upgrade

log "Installing kiosk packages..."
sudo DEBIAN_FRONTEND=noninteractive apt -y install \
  chromium \
  wlr-randr \
  ca-certificates \
  curl \
  openssh-server

log "Configuring hostname, timezone, desktop autologin, SSH, and blanking..."

# Use systemd directly for settings that don't need raspi-config.
sudo hostnamectl set-hostname "$HOSTNAME"
sudo timedatectl set-timezone "$TIMEZONE"

# B4 = desktop boot with automatic login.
sudo raspi-config nonint do_boot_behaviour B4

# These are helpful but non-fatal if Raspberry Pi changes a helper later.
if ! sudo raspi-config nonint do_blanking 1; then
  warn "raspi-config could not disable desktop blanking; continuing with fallback settings."
fi
if ! sudo raspi-config nonint do_ssh 0; then
  warn "raspi-config SSH setting failed; enabling ssh.service directly."
fi
sudo systemctl enable ssh.service >/dev/null 2>&1 || true
sudo systemctl start ssh.service >/dev/null 2>&1 || true

# Prevent Linux console blanking too.
CMDLINE_FILE="/boot/firmware/cmdline.txt"
if [[ -f "$CMDLINE_FILE" ]]; then
  if grep -qE '(^| )consoleblank=' "$CMDLINE_FILE"; then
    sudo sed -E -i 's/(^| )consoleblank=[0-9]+/ consoleblank=0/g' "$CMDLINE_FILE"
  else
    sudo sed -i '1 s/$/ consoleblank=0/' "$CMDLINE_FILE"
  fi
fi

BIN_DIR="$HOME/.local/bin"
LABWC_DIR="$HOME/.config/labwc"
LAUNCHER="$BIN_DIR/gocreatemirror-kiosk"
AUTOSTART="$LABWC_DIR/autostart"
LOG_DIR="$HOME/.local/state/gocreatemirror"

mkdir -p "$BIN_DIR" "$LABWC_DIR" "$LOG_DIR"

log "Creating portrait display + Chromium kiosk launcher..."
cat > "$LAUNCHER" <<LAUNCHER_EOF
#!/usr/bin/env bash
set -u

MIRROR_URL=$(printf '%q' "$MIRROR_URL")
ROTATION=$(printf '%q' "$ROTATION")
LOG_DIR=$(printf '%q' "$LOG_DIR")
mkdir -p "\$LOG_DIR"
exec >>"\$LOG_DIR/kiosk.log" 2>&1

echo "==== GoCreateMirror kiosk start: \$(date -Is) ===="

# labwc can start before the HDMI output is fully exposed.
sleep 5

OUTPUT=""
for _ in \$(seq 1 40); do
  OUTPUT="\$(wlr-randr 2>/dev/null | awk '/^[A-Za-z0-9_.-]+[[:space:]]/ {print \$1; exit}')"
  [[ -n "\$OUTPUT" ]] && break
  sleep 1
done

if [[ -z "\$OUTPUT" ]]; then
  OUTPUT="HDMI-A-1"
fi

echo "Using display output: \$OUTPUT; transform: \$ROTATION"
wlr-randr --output "\$OUTPUT" --transform "\$ROTATION" 2>/dev/null || \
  wlr-randr --output HDMI-A-1 --transform "\$ROTATION" 2>/dev/null || true

sleep 3

# Current Pi OS removed raspi-config's do_boot_wait helper. Wait for the site
# here instead. After ~90 seconds Chromium launches anyway and can recover later.
for _ in \$(seq 1 45); do
  if curl -fsSIL --max-time 4 "\$MIRROR_URL" >/dev/null 2>&1; then
    echo "Mirror site reachable."
    break
  fi
  sleep 2
done

# Keep the kiosk alive forever.
while true; do
  chromium "\$MIRROR_URL" \\
    --kiosk \\
    --start-maximized \\
    --ozone-platform=wayland \\
    --noerrdialogs \\
    --no-first-run \\
    --no-default-browser-check \\
    --disable-infobars \\
    --disable-session-crashed-bubble \\
    --disable-features=Translate,TranslateUI \\
    --disable-notifications \\
    --autoplay-policy=no-user-gesture-required \\
    --disable-pinch \\
    --overscroll-history-navigation=0 \\
    --password-store=basic \\
    --user-data-dir="\$HOME/.config/chromium-gocreatemirror"

  echo "Chromium exited; restarting in 3 seconds."
  sleep 3
done
LAUNCHER_EOF
chmod +x "$LAUNCHER"

log "Configuring labwc autostart..."
touch "$AUTOSTART"

TMP_AUTOSTART="$(mktemp)"
awk '
  /# BEGIN GoCreateMirror/ {skip=1; next}
  /# END GoCreateMirror/   {skip=0; next}
  !skip {print}
' "$AUTOSTART" > "$TMP_AUTOSTART"
mv "$TMP_AUTOSTART" "$AUTOSTART"

cat >> "$AUTOSTART" <<AUTOSTART_EOF

# BEGIN GoCreateMirror
"$LAUNCHER" &
# END GoCreateMirror
AUTOSTART_EOF

cat > "$LOG_DIR/install-info.txt" <<INFO_EOF
Installed: $(date -Is)
Mirror URL: $MIRROR_URL
Rotation: $ROTATION
Hostname: $HOSTNAME
Timezone: $TIMEZONE
Launcher: $LAUNCHER
Autostart: $AUTOSTART
INFO_EOF

# Install the optional AI + camera + distance-sensor companion before rebooting.
if [[ "${INSTALL_AI_HARDWARE:-1}" == "1" ]]; then
  log "Installing Go AI + hardware companion..."
  THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  AI_INSTALLER=""
  if [[ -f "$THIS_DIR/scripts/install-ai-hardware.sh" ]]; then
    AI_INSTALLER="$THIS_DIR/scripts/install-ai-hardware.sh"
  elif [[ -f "$THIS_DIR/install-ai-hardware.sh" ]]; then
    AI_INSTALLER="$THIS_DIR/install-ai-hardware.sh"
  else
    AI_INSTALLER="$(mktemp)"
    if ! curl -fsSL "$MIRROR_URL/pi/install-ai-hardware.sh" -o "$AI_INSTALLER"; then
      warn "Could not download AI companion installer; kiosk setup will still finish."
      AI_INSTALLER=""
    fi
  fi
  if [[ -n "$AI_INSTALLER" ]]; then
    MIRROR_URL="$MIRROR_URL" MIRROR_DEVICE_TOKEN="${MIRROR_DEVICE_TOKEN:-}" bash "$AI_INSTALLER" || warn "AI/hardware companion setup failed; kiosk itself is still configured."
  fi
fi

log "Setup complete."
printf '%s\n' \
  "Mirror URL : $MIRROR_URL" \
  "Portrait   : ${ROTATION} degrees" \
  "Hostname   : $HOSTNAME" \
  "Timezone   : $TIMEZONE" \
  "Autologin  : enabled" \
  "Blanking   : disabled" \
  "SSH        : enabled" \
  "Kiosk      : starts automatically"

kill "$SUDO_KEEPALIVE_PID" 2>/dev/null || true
trap - EXIT
sync

log "Rebooting into GoCreateMirror..."
sudo reboot
