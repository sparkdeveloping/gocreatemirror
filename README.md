# GoCreateMirror v2

Portrait smart-mirror UI for a Raspberry Pi 3B+ driving a 22/23-inch vertical display.

The Pi remains a thin kiosk client. Next.js runs on Vercel, so normal UI updates never require SSHing into the Pi.

## What changed in v2

- Five switchable mirror layouts at `/admin`
- **Signature v2** tuned from the real mirror photo: larger clock, weather, status, and studio labels
- **Twin Rails** for maximum clear reflection space
- **Halo** centered-brand layout
- **Studio Grid** for stronger makerspace visibility
- **Icon Only** — just the GoCreate icon dead center on black glass
- Mirror polls its remote layout state every 5 seconds
- New Vercel deployments are detected automatically every 15 seconds and the mirror reloads itself
- 60-minute full-reload fallback
- Weather now goes through `/api/weather` on Vercel instead of directly from Chromium on the Pi
- Last successful weather reading is cached in the browser as a fallback
- Old service-worker registrations are removed so cached code cannot hold the mirror on an old deployment

## Routes

- `/` — the actual mirror
- `/admin` — remote layout control
- `/api/mirror-state` — current selected layout
- `/api/version` — deployment fingerprint used for auto-update detection
- `/api/weather` — server-side Open-Meteo proxy

## Local development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/admin
```

## Deploy updates

Push normally:

```bash
git add .
git commit -m "Update GoCreateMirror"
git push
```

Vercel deploys it. The Pi polls `/api/version`. When the production alias moves to the new deployment, the mirror notices the changed deployment fingerprint, displays a short `NEW BUILD / Updating mirror…` message, and reloads itself. Default poll time is 15 seconds.

No Pi reboot is required for normal UI updates.

## Make `/admin` control the Pi remotely

A serverless Vercel deployment needs a tiny persistent store so your laptop and the Pi share the same selected layout. This project supports Upstash Redis directly and does not require an extra npm package.

### Recommended Vercel setup

1. Open your GoCreateMirror project in Vercel.
2. Open **Marketplace / Integrations**.
3. Add **Upstash Redis** to this project.
4. Create or link a Redis database.
5. Confirm Vercel has added:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
6. Redeploy the project once.
7. Open `https://gocreatemirror.vercel.app/admin`.

The admin screen will say **PERSISTENT REMOTE CONTROL** when it is connected. Selecting a card changes the real mirror within a few seconds.

The code also understands the older/common `KV_REST_API_URL` + `KV_REST_API_TOKEN` names.

### Optional admin PIN

Add this Vercel environment variable:

```text
ADMIN_PIN=your-pin-here
```

Redeploy. `/admin` will then require that PIN before a layout change is accepted. The PIN stays server-side and is never compiled into the mirror bundle.

## Layouts

### Signature v2

Default. Designed around the photo of the installed mirror. It deliberately keeps a large central reflection area while increasing the size of the things that were too small at real standing distance.

### Twin Rails

Time/weather on one edge and status/studios on the other. The middle is almost untouched mirror.

### Halo

Centered GoCreate mark with a subtle ring treatment, plus restrained live information at the top and bottom.

### Studio Grid

Bolder layout for showing the six studio areas from farther away.

### Icon Only

Black background plus the official GoCreate symbol in the exact center. No clock, weather, copy, or footer.

## Weather

The browser now calls:

```text
/api/weather
```

Vercel then calls Open-Meteo. This avoids making the Pi's Chromium browser depend directly on the third-party weather endpoint and should address the `WEATHER OFFLINE` state seen on the installed mirror.

No weather API key is required.

## Environment variables

See `.env.example`.

Useful defaults:

```text
NEXT_PUBLIC_DEPLOY_POLL_SECONDS=15
NEXT_PUBLIC_STATE_POLL_SECONDS=5
NEXT_PUBLIC_FALLBACK_RELOAD_MINUTES=60
```

## Raspberry Pi

The existing one-shot kiosk installer is still included:

```bash
bash scripts/install-kiosk.sh
```

It targets:

```text
https://gocreatemirror.vercel.app
```

and configures the Pi for the vertical Chromium kiosk. You do **not** need to rerun the installer when deploying this v2 UI if the Pi is already displaying that URL.

If the display is mounted the opposite direction:

```bash
bash scripts/install-kiosk.sh 270
```

## Main files

```text
app/
  page.tsx
  admin/page.tsx
  api/mirror-state/route.ts
  api/version/route.ts
  api/weather/route.ts
  globals.css
components/
  MirrorDashboard.tsx
  WeatherGlyph.tsx
lib/
  layouts.ts
  mirror-config.ts
  mirror-store.ts
  facility-hours.ts
  weather.ts
public/brand/
  gocreate-color.svg
  gocreate-white.svg
  gocreate-icon.png
  wsu-white.svg
scripts/
  install-kiosk.sh
```

## Editing the UI

Most visual work is in:

```text
app/globals.css
components/MirrorDashboard.tsx
```

Layout names/options are in:

```text
lib/layouts.ts
```

Operational values, studios, copy, and polling intervals are in:

```text
lib/mirror-config.ts
```
