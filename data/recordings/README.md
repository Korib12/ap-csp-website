# Real recordings

Raw echo data saved from the app's test panel ("Save raw recording"): 10 (I, Q) samples per second at the tone shown in each file.
Replay any file through the app engine with `node tools/replay.js <file>` (needs Playwright).

| File | What happened | Result with current rules |
|---|---|---|
| 2026-10-18_standing-in-room_breathing-at-start.json | Breathing at the phone for the first minute, then standing and moving around the room (189 s) | Recorded only the breathing at the start (rate 19); the rest rejected |
| 2026-10-18_side-facing-phone_breathing.json | Lying on side facing the phone, breathing (94 s) | Recorded from 45 s on, rate 13–17 /min |

What the numbers showed:
- Motion vs noise (band SNR): breathing 400–1500, person moving in the room 10–90, noise about 1.
- Breath stroke vs jitter: breathing 14–22, person moving in the room 2–9.
