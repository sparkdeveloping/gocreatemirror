#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://YOUR-PROJECT.vercel.app}"
AUTOSTART_DIR="$HOME/.config/labwc"
AUTOSTART_FILE="$AUTOSTART_DIR/autostart"

sudo apt update
sudo apt -y full-upgrade
sudo apt -y install chromium
mkdir -p "$AUTOSTART_DIR"

cat > "$AUTOSTART_FILE" <<EOT
# GoCreateMirror kiosk
chromium "$URL" \\
  --kiosk \\
  --noerrdialogs \\
  --disable-infobars \\
  --no-first-run \\
  --enable-features=OverlayScrollbar \\
  --start-maximized \\
  --disable-session-crashed-bubble \\
  --disable-features=Translate &
EOT

sudo raspi-config nonint do_boot_behaviour B4 || true
sudo raspi-config nonint do_boot_wait 1 || true

echo ""
echo "GoCreateMirror kiosk configured."
echo "URL: $URL"
echo "IMPORTANT: disable Screen Blanking in Raspberry Pi Control Centre > Display."
echo "Reboot when ready: sudo reboot"
