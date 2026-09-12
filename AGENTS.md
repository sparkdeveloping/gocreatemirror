# GoCreateMirror developer notes

- Keep the physical-mirror use case first: true black background and generous negative space.
- Primary target is a 1080×1920 portrait kiosk.
- Avoid heavy client libraries; Raspberry Pi 3B+ is the display client.
- Brand accent colors are #FBBF11 and #0499DB.
- Facility hours live in `lib/facility-hours.ts`.
- User-facing editable content lives in `lib/mirror-config.ts`.
- Weather must remain keyless unless intentionally changed.
- Do not require secrets for the default deployment.
