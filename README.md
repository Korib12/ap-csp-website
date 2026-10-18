# Echo

Echo turns a phone into a contactless breathing monitor using sonar. The phone's speaker plays an inaudible tone (about 16–20 kHz), the microphone listens to the echo off the person's chest, and the app tracks the echo's phase to measure chest movement down to fractions of a millimeter. No camera, no wearable, and it works in the dark.

Built for the 2026 Congressional App Challenge (California's 14th district).

Echo is not a medical device.

## What's here

| Path | What it is |
|---|---|
| `app/index.html` | **The Echo app.** **Tonight:** one-tap start, automatic tone tuning, live breathing, a dim bedside-clock night screen and the pause alarm. **Reports:** a summary of each night with a breathing-rate graph, pause times and a Share button. **Trends:** learns the person's normal nightly breathing rate and flags nights 3+ breaths/min above it. **Settings:** alarm time, sound and a family contact |
| `app/echo-breathing-scope.html` | Engineering view: live breathing rate, chest-motion wave, carrier graph and the breathing pattern detector |
| `tools/echo-sonar-test.html` | The first hardware test: checks that a phone can send and hear the ultrasonic tone |
| `tests/` | Simulation tests for the signal processing (run with Node) |

## How it works

1. **Emit a carrier.** The speaker plays a steady tone near 16.6 kHz.
2. **I/Q demodulation.** The raw microphone signal is multiplied by the cosine and sine of the carrier, then averaged every 100 ms (a boxcar low-pass filter). That leaves the echo as a slowly moving point (I, Q).
3. **Phase tracking with a circle fit.** Static echoes (walls, direct speaker-to-mic leak) set a fixed center, and the chest echo rotates around it. The echo's phase equals 4π × distance ÷ wavelength, so the unwrapped angle around the fitted circle is chest displacement.
4. **Breathing rate.** A windowed Fourier analysis of the last ~28 s of displacement finds the strongest rhythm between 5 and 36 breaths per minute.
5. **Breathing pattern.** Each breath is found and measured. The detector reports steady, irregular, or a repeating waxing-and-waning pattern (breaths growing deeper, then shallower, then pausing).

## Results so far

Accuracy against timed breathing (phone about 20 cm from the chest, Oct 13, 2026):

| Real pace | Echo reading |
|---|---|
| 10 breaths/min | 10 |
| 15 breaths/min | 15 |
| 30 breaths/min | 29 |

## Running it

The pages need the microphone, which browsers only allow on `https` or `localhost`.

```
cd echo-breathing-monitor
python3 -m http.server 8000
ngrok http 8000          # in a second terminal, for an https link to open on a phone
```

Then open `https://<your-ngrok-link>/app/index.html` on the phone (or `app/echo-breathing-scope.html` for the engineering view).

**Simulation mode** (no microphone): add `?sim=steady`, `?sim=pause`, `?sim=wax` or `?sim=irregular` to the link, plus `&speed=10` to run 10× faster. `pause` breathes normally, then stops for 40 s every 2 minutes, which should set off the alarm.

## Saved nights, Reports and Trends

Every session is saved on the phone only (browser storage). Each saved night keeps the median breathing rate for every 30 seconds, every pause of 10 s or more, alarms, and whether a waxing-and-waning pattern appeared.

Trends uses nights of 30 minutes or more. A night's "normal" is the median of the nightly averages from up to 14 earlier nights (at least 3 needed). A night is flagged when its average is 3 or more breaths/min above normal. The Trends tab can load 14 labeled sample nights for demos.

## Data-only by default

Real-person testing (Oct 17) showed sonar reflects off the body like a mirror at this wavelength (about 2 cm), so the phone must face the chest directly. It works well for side sleepers with the phone at mattress height facing the chest, poorly when the phone is beside someone lying on their back, and poorly through a blanket hanging in front of a side sleeper.

So Echo records data for a morning report instead of acting as an alarm:

- **Seeing:** breaths are found and stand out clearly (spectral clarity 6+ or breath-to-jitter ratio 12+). Breathing rate is recorded.
- **Pause:** breaths stop with no big movement just before. Logged as a pause.
- **Lost:** breaths stop right after a big movement (rolling over), or the signal is unclear. Nothing is recorded and nothing is guessed.

Each night reports how much of it Echo could see. Nights where breathing was seen less than half the time are left out of Trends. Alerts are an optional, experimental setting.

In simulation (5+ minutes each): steady 97% seen, irregular 92%, stops logged correctly (3 of 3), rolling over gave 0 false pauses and 0 false alarms.

## Pause alarm (optional, experimental)

Echo arms itself once it has seen steady breathing (6 or more breaths in the last minute). While armed, it sounds an alarm if no breath is detected for the set time (15, 20 or 30 s, default 20). In simulation, steady, irregular and waxing-and-waning breathing ran 5 minutes each with no alarms, and breathing that stopped at 70, 190 and 310 s set off alarms at 93, 212 and 331 s.

## Tests

```
cd tests
node sim_rate.js       # breathing rate across chest motion sizes, rates, and noise
node sim_pattern.js    # pattern detector: steady, irregular, sigh, waxing-and-waning
```

## Credits

The breath-by-breath analysis and RMSSD regularity score are adapted from [PhysioMetrics](https://github.com/RyanSeanPhillips/PhysioMetrics) by Ryan Sean Phillips (MIT License). See `THIRD_PARTY_NOTICES.md`.
