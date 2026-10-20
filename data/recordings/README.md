# Real recordings

Raw echo data saved from the app's test panel ("Save raw recording"): 10 (I, Q) samples per second at the tone shown in each file.
Replay any file through the app engine with `node tools/replay.js <file>` (needs Playwright).

| File | What happened | Recorded | Rate while recording |
|---|---|---|---|
| 2026-10-19_breathing-turn-away-back-oversized-hoodie.json | Breathing (~50–90 s), turned away (~93–160 s), turned back in an oversized hoodie (~160–240 s) | 38% | 18–19, then 17–19 in the hoodie; turning away logged no pause |
| 2026-10-19_empty-then-25cm-then-40cm.json | One run: empty room (~45–100 s), breathing at about 25 cm (10 in, ~105–130 s), then about 40 cm (16 in, ~150–180 s) | 27% (empty part 0%) | 19–21 close, 17–18 farther |
| 2026-10-19_empty-room.json | Nobody in the room (205 s) | 0% | — |
| 2026-10-18_standing-in-room_breathing-at-start.json | Breathing at the phone for a minute, then standing and moving in the room (189 s) | 17% | 19 during the breathing; a few wrong readings (6–9) while standing |
| 2026-10-19_10cm_tshirt_breathing.json | Side, 10 cm, T-shirt (99 s) | 73% | 15–17 (one 7) |
| 2026-10-18_side-facing-phone_breathing.json | Side facing the phone, breathing (94 s) | 49% | 13–15 |
| 2026-10-19_40cm_tshirt_breathing.json | Side, 40 cm, T-shirt (89 s) | 12% | 15–16 |
| 2026-10-19_40cm_hoodie_breathing.json | Side, 40 cm, hoodie (86 s) | 11% | 16, one 6 |

At 40 cm the breathing was barely above the noise of an empty room, so Echo mostly declines to record there. At 10–20 cm the rhythm is clear and the rate is steady.

What the numbers showed:
- Motion vs noise (band SNR), 30 s medians: empty room 4–27, person standing in the room 10–90, breathing at 40 cm 15–185, breathing at 10–20 cm 110–1500. Cutoff: 50.
- Rate fix: on the 10 cm recording the circle fit turned a clean 16 /min into 6–7 /min (a bad fit to a blob, R/spread near 1). Echo now also tries a straight projection and keeps whichever shows the clearer rhythm, and removes slow drift before measuring the rate.
