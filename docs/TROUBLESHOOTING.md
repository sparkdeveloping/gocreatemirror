# Troubleshooting GoCreateMirror v5

## `/admin -> AI + Hardware` says PI AGENT OFFLINE

```bash
sudo systemctl status gocreatemirror-agent --no-pager
journalctl -u gocreatemirror-agent -n 120 --no-pager
```

Verify `/etc/gocreatemirror/agent.env` contains the same `MIRROR_DEVICE_TOKEN` configured in Vercel.

## Agent gets HTTP 401

The Vercel and Pi device tokens do not match.

Vercel:

```text
MIRROR_DEVICE_TOKEN=...
```

Pi:

```text
/etc/gocreatemirror/agent.env
MIRROR_DEVICE_TOKEN=...
```

Restart after editing:

```bash
sudo systemctl restart gocreatemirror-agent
```

## Wake phrase never triggers

Stop the service and test directly:

```bash
sudo systemctl stop gocreatemirror-agent
/opt/gocreatemirror-agent/venv/bin/python /opt/gocreatemirror-agent/gocreate_agent.py --test wake
```

If `wake_ready=False`, inspect the reported error and confirm the Vosk model exists.

## Microphone clips or never stops recording

Edit:

```text
/etc/gocreatemirror/agent.env
```

The main tuning value is:

```text
MIC_RMS_THRESHOLD=560
```

Raise it in noisy rooms; lower it for a quiet/soft microphone.

## Sensor always shows 0 / maximum / offline

- Confirm common ground.
- Confirm TRIG/ECHO pins match the env file.
- Confirm ECHO uses the voltage divider.
- Keep the transducers unobstructed.
- Test with `--test sensor`.

## Camera not ready

Run:

```bash
rpicam-hello --list-cameras
```

Then run the project camera test. Reseat the ribbon with the Pi powered off if no camera is listed.

## Mirror shows text response but does not speak

The kiosk launcher includes:

```text
--autoplay-policy=no-user-gesture-required
```

Make sure the monitor/HDMI/USB output is selected in Raspberry Pi OS and volume is not muted.

## AI says Groq is not configured

Add `GROQ_API_KEY` in Vercel and redeploy.

## Visual question says vision is not configured

Add `GEMINI_API_KEY` in Vercel and redeploy, then enable `Camera vision on request` in `/admin -> AI + Hardware`.
