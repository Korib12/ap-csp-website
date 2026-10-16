# Echo

Echo turns a phone into a contactless breathing monitor using sonar. The phone's speaker plays an inaudible tone (about 16–20 kHz), the microphone listens to the echo off the person's chest, and the app tracks the echo's phase to measure chest movement down to fractions of a millimeter. No camera, no wearable, and it works in the dark.

Built for the 2026 Congressional App Challenge (California's 14th district).

Echo is not a medical device.

## What's here

| Path | What it is |
|---|---|
| `app/echo-breathing-scope.html` | The current app: live breathing rate, chest-motion wave, and the breathing pattern detector |
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

Then open `https://<your-ngrok-link>/app/echo-breathing-scope.html` on the phone.

**Simulation mode** (no microphone): add `?sim=steady`, `?sim=wax` or `?sim=irregular` to the link, plus `&speed=10` to run 10× faster.

## Tests

```
cd tests
node sim_rate.js       # breathing rate across chest motion sizes, rates, and noise
node sim_pattern.js    # pattern detector: steady, irregular, sigh, waxing-and-waning
```

## Credits

The breath-by-breath analysis and RMSSD regularity score are adapted from [PhysioMetrics](https://github.com/RyanSeanPhillips/PhysioMetrics) by Ryan Sean Phillips (MIT License). See `THIRD_PARTY_NOTICES.md`.
