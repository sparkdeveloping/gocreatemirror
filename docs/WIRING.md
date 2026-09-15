# GoCreateMirror hardware wiring

## HC-SR04 ultrasonic distance sensor

The common HC-SR04 has four pins: VCC, TRIG, ECHO and GND.

### Important voltage warning

The Raspberry Pi GPIO input is designed for 3.3V logic. HC-SR04 ECHO is approximately 5V. Direct ECHO-to-GPIO wiring can damage the Pi.

Use a level shifter or resistor divider.

### Default pins used by this project

| HC-SR04 | Raspberry Pi | Physical pin |
|---|---|---:|
| VCC | 5V | 2 or 4 |
| GND | Ground | 6 or another GND |
| TRIG | GPIO23 | 16 |
| ECHO | GPIO24 through divider | 18 |

### 1k / 2k divider

```text
HC-SR04 ECHO ---- 1kΩ ----+---- GPIO24
                          |
                         2kΩ
                          |
                         GND
```

This produces approximately `5 × 2/(1+2) = 3.33V` at the GPIO node.

Mount the sensor so its two transducers face the person using the mirror. Ultrasonic readings can be unreliable at extreme angles or with soft/absorbent material; tune `Far / presence limit` in `/admin -> AI + Hardware` after mounting.

## Raspberry Pi Camera

1. Power the Pi off.
2. Open the CSI connector latch.
3. Insert the ribbon in the correct orientation for the Pi/camera revision.
4. Close the latch.
5. Boot and test with the project's camera test command.

The v5 agent initializes Picamera2 only for an explicit visual request.

## USB microphone

Use a USB mic or USB audio dongle. List capture devices with:

```bash
arecord -l
```

If multiple devices exist, set `AUDIO_INPUT_DEVICE` in `/etc/gocreatemirror/agent.env` and restart:

```bash
sudo systemctl restart gocreatemirror-agent
```

## Audio output

GoCreateMirror v5 speaks through Chromium's Web Speech API. Audio therefore follows Chromium/PipeWire output: HDMI monitor speakers, the Pi analog output, USB audio or another desktop-selected sink.
