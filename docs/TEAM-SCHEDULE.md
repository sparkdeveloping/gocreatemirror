# Team Schedule system

GoCreateMirror v6 includes a structured recurring weekly team schedule. It was seeded from the printed GoCreate weekly team schedule photo supplied on 2026-09-15.

## Admin editing

Open `/admin`, unlock with the admin PIN, then choose **Team Schedule**.

Each cell accepts:

```text
8:45 AM-5:00 PM Opening
```

Split shift example:

```text
9:30 AM-12:15 PM / 2:00 PM-9:00 PM Split
```

Or:

```text
OFF
```

Press **Save schedule** to write it to Firebase. Every connected mirror receives the updated roster automatically.

## Widgets

### Who’s In Now

Calculates the current local weekday/time and displays every active shift segment that contains the current time. Split shifts are handled correctly.

### Coming Up

Shows the next shift starts later today.

### Today’s Team

Shows all people scheduled for the current day, with their full shift(s).

### Weekly Team Schedule

Shows all seven days in a mirror-readable grouped layout rather than reproducing the dense paper spreadsheet.

## Data source

Persistent path:

```text
/gocreatemirror/teamSchedule
```

Bundled fallback:

```text
lib/team-schedule.ts
```

The fallback contains only team members with non-zero scheduled hours from the supplied photo. Rows that were entirely `OFF` were intentionally omitted from the mirror roster to keep the UI useful.

## Privacy note

The physical mirror needs to read the roster from the browser, so the provided Firebase rules grant public read access to `/gocreatemirror/teamSchedule`, matching the other mirror runtime state. Do not put private contact information, payroll data, or other sensitive employee information in this schedule structure.
