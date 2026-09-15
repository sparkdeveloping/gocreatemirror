# GoCreateMirror v4 — Screen Studio

A remotely managed smart-mirror system for the GoCreate Raspberry Pi kiosk. The mirror itself remains a lightweight browser. The entire visual system is controlled from Next.js + Firebase Realtime Database.

## What v4 adds

- **20 polished screen designs** across Signature, Minimal, Brand, Information, Productivity, Events, Media, Graphic, and Animated categories.
- **Animated layouts** with glow, float, breathe, pulse, drift, fade, ticker, slide, and shimmer motion.
- A true **Live View** at `/admin` showing exactly what the physical mirror is rendering.
- **Edit Live View**: manually edit the active screen and publish it directly. Selecting any template or custom screen later intentionally overrides the manual Live View.
- **Custom Screens**: create, save, edit, delete and publish unlimited custom layouts.
- Full drag-and-drop **screen editor** built around the mirror's native 1080×1920 portrait canvas.
- Widget positioning, width/height, rotation, scale, opacity, layer order, locking, animation, colors, borders, padding, glow and blur controls.
- Image uploads are resized in-browser before being saved into a custom screen.
- Admin login now happens **before `/admin` opens**. Enter the PIN once; a signed HTTP-only admin session remains valid for seven days.
- Firebase Realtime Database still pushes the resolved live screen to the Pi immediately.
- New Vercel deployments are detected automatically by the mirror and trigger a refresh.

## Widget library

The editor currently includes 27 widget types:

- Clock
- Date
- Full weather
- Standalone temperature
- GoCreate open/closed status
- Time-aware greeting
- Text
- Quote
- Calendar / agenda
- Countdown
- Animated ticker / marquee
- GoCreate studio grid
- GoCreate logo / icon
- Photo / image
- Web iframe
- Connection status
- Custom metric
- Badge
- Divider
- Shape
- Wind speed
- Feels-like temperature
- Day progress
- ISO week number
- Video
- Editable list
- Progress bar

### Calendar widget

The Calendar widget accepts a public HTTPS iCal URL. For example, a public Google Calendar or Outlook ICS feed can be pasted into the widget inspector. The mirror proxies and caches that feed through `/api/calendar`.

### Photo widget

You can either paste an image URL or upload a photo from the admin editor. Uploaded images are resized to a maximum dimension of 1600px and JPEG-compressed before being stored with the screen definition. For large galleries, hosted image URLs are preferable.

## Admin behavior

### `/admin/login`

Enter `ADMIN_PIN` once. The PIN is checked only on the server. The browser receives a signed HTTP-only cookie; JavaScript cannot read the session value.

### `/admin`

The admin application has three primary sections:

1. **Live View** — exact screen currently rendered by the Pi.
2. **Screen Library** — 20 ready-to-use designs. `Go Live` publishes immediately. `Edit copy` opens any template in the full editor.
3. **Custom Screens** — your persistent user-created layouts.

### Live View override model

The server always stores one fully resolved `screen` object in Firebase:

```text
/gocreatemirror/state
```

When you select a template:

```text
Template -> resolved screen -> Firebase state -> Pi
```

When you select a saved custom screen:

```text
Custom screen -> Firebase state -> Pi
```

When you choose **Edit Live View**:

```text
Current live screen -> editor -> publish exact edited screen -> Firebase state -> Pi
```

That manual screen is marked as `kind: live`. The next template/custom selection replaces it by design.

Saved custom screens live privately at:

```text
/gocreatemirror/screens/{screen-id}
```

The supplied Firebase rules allow public read access only to the resolved live state. Saved custom designs remain inaccessible through the browser Firebase SDK.

## Firebase setup

The client configuration already contains the Firebase web settings supplied for the `jollytiles` project. The web API key is not an admin credential.

### 1. Make sure Realtime Database is active

Firebase Console -> Build -> Realtime Database.

If the old `jollytiles` database is deactivated, re-enable it or create an active Realtime Database instance. Copy the **exact database URL Firebase shows**.

Set that URL in Vercel for both:

```text
FIREBASE_DATABASE_URL=<exact URL>
NEXT_PUBLIC_FIREBASE_DATABASE_URL=<exact URL>
```

### 2. Rules

Firebase Console -> Realtime Database -> Rules, paste `database.rules.json`:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "gocreatemirror": {
      "state": {
        ".read": true,
        ".write": false
      },
      "screens": {
        ".read": false,
        ".write": false
      }
    }
  }
}
```

The Vercel server uses Firebase Admin and can still write despite these browser rules.

### 3. Firebase Admin credentials

Firebase Console -> Project Settings -> Service accounts -> Generate new private key.

In Vercel add:

```text
FIREBASE_PROJECT_ID=jollytiles
FIREBASE_DATABASE_URL=<exact active RTDB URL>
FIREBASE_CLIENT_EMAIL=<client_email from service account JSON>
FIREBASE_PRIVATE_KEY=<private_key from service account JSON>
```

Or provide the complete service-account JSON as:

```text
FIREBASE_SERVICE_ACCOUNT_JSON={...}
```

Never commit a Firebase service-account private key to GitHub.

## Admin PIN setup

In Vercel -> Project -> Settings -> Environment Variables:

```text
ADMIN_PIN=your-pin
```

Recommended:

```text
ADMIN_SESSION_SECRET=a-long-random-secret-value
```

Redeploy after setting these values.

After that:

```text
https://gocreatemirror.vercel.app/admin
```

redirects to:

```text
/admin/login
```

until a valid PIN session exists.

To lock the admin browser again immediately, click **Lock admin** in the top-right corner.

## Development

Requires Node 22+.

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000          mirror
http://localhost:3000/admin    screen studio
```

For local development, create `.env.local` from `.env.example`.

Without Firebase Admin credentials, the project uses an in-process fallback for admin development. That fallback is not reliable across Vercel server instances; production should use Firebase Admin.

## Raspberry Pi

If your Pi is already opening:

```text
https://gocreatemirror.vercel.app
```

**nothing needs to change on the Pi.** Deploy v4 to the same Vercel project. The old mirror build will detect the new deployment and reload.

For a new Raspberry Pi OS 64-bit Desktop installation:

```bash
bash setup-gocreatemirror.sh
```

The setup script installs Chromium kiosk mode, disables blanking, enables autologin, rotates the display to portrait, opens the production site, and reboots.

If the monitor is mounted the opposite portrait direction:

```bash
bash setup-gocreatemirror.sh 270
```

## Important files

```text
app/admin/login/page.tsx             PIN-first admin login
app/admin/page.tsx                   protected admin entry
components/admin/AdminStudio.tsx     Live View + library + custom screens
components/admin/ScreenEditor.tsx    full custom editor
components/ScreenRenderer.tsx        generic mirror rendering engine
lib/templates.ts                     20-screen design library
lib/widget-catalog.ts                widget catalog/defaults
lib/screen-types.ts                  screen/widget schema
lib/mirror-store.ts                  Firebase state + custom screen storage
lib/admin-auth.ts                    signed admin session
app/api/admin/*                      protected admin APIs
app/api/calendar/route.ts            public iCal proxy/parser
app/api/weather/route.ts             live weather proxy
database.rules.json                  Firebase RTDB rules
setup-gocreatemirror.sh              one-shot Pi setup
```

## Notes on screen size

The editor and renderer use a fixed **1080 × 1920** logical canvas because that is the intended portrait display resolution. The renderer scales the canvas to the actual browser viewport, so it also previews correctly on laptops and phones.
