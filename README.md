# GoCreateMirror

A portrait-first Next.js smart mirror designed for a 22–23 inch monitor behind two-way mirror glass. The Raspberry Pi is intentionally treated as a lightweight kiosk client; build and deploy the application elsewhere (Vercel is ideal), then let Chromium on the Pi display it.

## What is included

- Portrait smart-mirror UI tuned for 1080×1920
- Official GoCreate / Wichita State logo assets from the supplied brand package
- Live clock and date in the configured timezone
- GoCreate open / closed status using published hours
- Current weather from Open-Meteo (no API key)
- Auto-refresh for remote deployments
- Online/offline indicator
- Lightweight service worker for basic offline resilience
- Rotating maker prompts
- Current GoCreate studio grid
- Raspberry Pi kiosk install helper

## 1. Run locally

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 2. Configure

Copy the example environment file:

```bash
cp .env.example .env.local
```

Defaults already target GoCreate / Wichita. You can change:

```env
NEXT_PUBLIC_MIRROR_NAME=GoCreateMirror
NEXT_PUBLIC_MIRROR_TIMEZONE=America/Chicago
NEXT_PUBLIC_MIRROR_LOCATION=Wichita, KS
NEXT_PUBLIC_MIRROR_LATITUDE=37.7195
NEXT_PUBLIC_MIRROR_LONGITUDE=-97.2934
NEXT_PUBLIC_AUTO_RELOAD_MINUTES=10
```

For visual/content changes, edit `lib/mirror-config.ts` and `app/globals.css`.

## 3. Deploy to Vercel

Push this folder to GitHub, import the repository into Vercel, and deploy. The app needs no secrets or paid API keys.

Each time you push to the production branch, Vercel will produce a new deployment. The mirror performs a full page refresh on the interval configured by `NEXT_PUBLIC_AUTO_RELOAD_MINUTES`, so deployed changes arrive automatically.

## 4. Raspberry Pi setup

Recommended hardware / software:

- Raspberry Pi 3B+
- Raspberry Pi OS 64-bit with Desktop
- Chromium
- 1080×1920 portrait monitor
- Two-way mirror glass/acrylic

Once Raspberry Pi OS is running, copy this project or just the installer script onto the Pi and run:

```bash
chmod +x scripts/install-kiosk.sh
./scripts/install-kiosk.sh https://YOUR-PROJECT.vercel.app
sudo reboot
```

The script installs Chromium, enables desktop autologin + network wait, and creates a `labwc` autostart entry that launches the site full-screen using the same kiosk approach documented by Raspberry Pi.

### Keep the mirror awake

In Raspberry Pi OS, open **Preferences → Control Centre → Display** and turn **Screen Blanking** off. This prevents the mirror from going dark after inactivity.

### Rotate the physical display

On current Raspberry Pi OS Desktop, use **Preferences → Screen Configuration** and set the display rotation to 90° or 270° so Chromium sees a portrait desktop. This is preferable to rotating the web page with CSS.

## Design notes

A smart mirror works best when the interface does **not** occupy every pixel. GoCreateMirror deliberately keeps the central reflection zone mostly empty. White, yellow and blue pixels show strongly through the mirror while true black disappears into the reflective surface.

The UI uses the supplied GoCreate colors:

- Yellow `#FBBF11`
- Blue `#0499DB`
- True black background

## Updating the mirror

Normal workflow:

```bash
git add .
git commit -m "Update mirror"
git push
```

Vercel deploys the update. The Pi does not need Node.js, Git, or a local app build; it only needs Chromium and network access.

## Build check

```bash
npm run typecheck
npm run build
```

## Data sources

- Weather: Open-Meteo public API
- Facility hours / studio labels: current GoCreate public website at the time this starter was built

If GoCreate changes operating hours, edit `lib/facility-hours.ts`.
# gocreatemirror
