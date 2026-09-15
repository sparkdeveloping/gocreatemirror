# GoCreateMirror v3 — Firebase Realtime

Portrait smart-mirror UI for a Raspberry Pi 3B+ kiosk and a 22/23-inch vertical display.

## What is included

- Five switchable mirror layouts at `/admin`
- **Firebase Realtime Database** for persistent remote layout state
- Actual Firebase realtime subscriptions on the Pi and `/admin` — no normal state polling delay
- Secure server-side admin writes through `firebase-admin`
- Automatic Vercel deployment detection and refresh
- Live weather proxy, facility hours, branding, and kiosk scripts
- Icon-only mode with the GoCreate mark dead center

## Run locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000` — mirror
- `http://localhost:3000/admin` — layout control

## Firebase project already wired in

The project uses the Firebase web configuration supplied for:

- Project: `jollytiles`
- Realtime Database: `https://jollytiles.firebaseio.com`
- Mirror state path: `/gocreatemirror/state`

The Firebase web API key is intentionally client-visible and is not an admin secret. **Do not put a service-account private key in the source code.**

## One-time Firebase setup

### 1. Set Realtime Database Rules

Firebase Console -> **Realtime Database** -> **Rules** and use the contents of `database.rules.json`:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "gocreatemirror": {
      "state": {
        ".read": true,
        ".write": false,
        ".validate": "newData.hasChildren(['layout', 'updatedAt']) && newData.child('layout').isString() && newData.child('updatedAt').isString()"
      }
    }
  }
}
```

This exposes only the selected mirror layout for realtime reading and blocks direct browser writes. The Vercel API uses Firebase Admin and can write securely despite that rule.

### 2. Give Vercel Firebase Admin credentials

Firebase Console -> **Project settings** -> **Service accounts** -> **Generate new private key**.

Download the JSON file. In Vercel -> GoCreateMirror -> **Settings** -> **Environment Variables**, add:

```text
FIREBASE_PROJECT_ID=jollytiles
FIREBASE_DATABASE_URL=https://jollytiles.firebaseio.com
FIREBASE_CLIENT_EMAIL=<client_email from the JSON file>
FIREBASE_PRIVATE_KEY=<private_key from the JSON file>
```

For `FIREBASE_PRIVATE_KEY`, paste the full value including:

```text
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

Vercel supports multiline environment values. The code also accepts a value containing literal `\n` sequences.

Alternatively set a single `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable to the complete downloaded JSON document.

**Never commit the service-account JSON or private key to GitHub.**

### 3. Optional admin PIN

In Vercel add:

```text
ADMIN_PIN=your-pin
```

Then redeploy.

## How remote switching works

```text
/admin
  -> POST /api/mirror-state
  -> ADMIN_PIN checked on Vercel
  -> Firebase Admin writes /gocreatemirror/state
  -> Firebase Realtime Database pushes the new value
  -> Pi changes layout immediately
```

The Pi has a normal API polling fallback in case the Firebase websocket cannot connect.

## Automatic code deployment detection

The mirror separately checks `/api/version` every 15 seconds. When Vercel moves production to a new deployment, the mirror shows an update message and reloads into the new build. This is independent of Firebase layout switching.

## Raspberry Pi

For an already configured Pi pointing at `https://gocreatemirror.vercel.app`, no Pi changes are required. Deploy this version to the same Vercel domain.

For a fresh Pi with Raspberry Pi OS 64-bit Desktop:

```bash
bash setup-gocreatemirror.sh
```

Default rotation is 90 degrees. If the monitor is upside down:

```bash
bash setup-gocreatemirror.sh 270
```

## Useful files

```text
app/admin/page.tsx             remote control UI
app/api/mirror-state/route.ts  secure state API
components/MirrorDashboard.tsx mirror + Firebase realtime subscription
lib/firebase-client.ts         browser realtime subscription
lib/firebase-config.ts         jollytiles web configuration
lib/mirror-store.ts            Firebase Admin reads/writes
database.rules.json            recommended RTDB rules
lib/layouts.ts                 available UI layouts
app/globals.css                mirror + admin styling
```
