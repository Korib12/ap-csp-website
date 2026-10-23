# Echo

**Echo turns a phone into a contactless breathing monitor using sonar.** The phone's speaker plays a steady high tone (about 16.6–17 kHz), the microphone listens to the echo off the person's chest or belly, and Echo tracks tiny changes in that echo to measure breathing, with nothing to wear and no camera.

**Try it:** https://korib12.github.io/ap-csp-website/app/ (open on a phone in Safari or Chrome and allow the microphone).
**Demo without a microphone:** https://korib12.github.io/ap-csp-website/app/?sim=pause&speed=5

Built for the 2026 Congressional App Challenge (California's 14th district).

> Echo is not a medical device. It does not diagnose anything. Talk to a doctor about any concerns.

## Who it's for

People who want to know what their breathing does at night but have never had a sleep test, for example someone who snores or wakes up tired. Sleep studies are expensive and most breathing problems during sleep are thought to go undiagnosed. Echo uses a phone people already own and keeps everything on that phone.

## What it does

| | |
|---|---|
| **Tonight** | One tap to start. An aim check helps point the phone. Live breathing rate and breathing wave. A dim night screen. Echo saves the night every 30 seconds, so a dead battery or a closed tab doesn't lose it. |
| **Reports** | A summary of each night: a one-sentence summary, a timeline of what Echo could see, the breathing rate through the night, pauses of 10 seconds or more, a data-confidence badge and a Share button. |
| **Sleep Check** | "Should I get checked for sleep apnea?" Combines the last 3 good nights with 6 questions from NHLBI's list of sleep apnea signs and gives one next step: *nothing concerning in what Echo saw*, *worth mentioning to your doctor*, or *talk to a doctor about a sleep test*, with the reasons. Never a diagnosis. |
| **Doctor summary** | A printable page (or PDF) in English to bring to an appointment: the nights, pauses per hour of breathing seen, snoring, the signs reported, Echo's suggestion and questions to ask. It says plainly what Echo can't measure, and uses no clinical index names Echo can't back up. |
| **What affects breathing** | Tap what was different about a night (slept on side or back, stuffy nose, sick, alcohol, late meal). With 3+ nights each way, Trends compares snoring, pauses and breathing rate, with general, hedged tips. |
| **Send to family** | One tap texts the family contact a short morning summary. |
| **Trends** | Learns the person's normal nightly breathing rate and flags nights well above it. |
| **Science view** | The raw echo (I/Q plane) and the breathing spectrum, live. |
| **Get help nearby** | When to talk to a doctor and where to find low-cost help. |
| **Languages** | English, Spanish, Chinese (Simplified and Traditional) and Vietnamese. Translations are machine-made and still need a native-speaker check. |
| **Waxing-and-waning pattern** *(experimental)* | Breathing that repeatedly grows deeper, shallower, then pauses. Only counted while Echo can see breathing for 80%+ of a 4-minute window, and only reported after it shows up for 5 minutes in total. The first overnight test showed the old rule fired on noise (it also fired on 4 of 17 short test recordings, including an empty room); the new rule fires on none of them and still catches the simulated pattern. |
| **Snoring** *(experimental)* | Regular bursts of low, loud sound. Only tested on synthetic audio so far. |
| **Out of bed or out of view** *(experimental)* | 90 seconds without seeing breathing after a stretch of clear breathing. Tested in simulation and on short real recordings. |

## How it works

1. **Send a tone.** The speaker plays a steady tone near 16.6 kHz (Echo picks the best frequency the phone can play and hear).
2. **I/Q demodulation.** The microphone signal is multiplied by the cosine and sine of the tone, then averaged every 100 ms. What's left is the echo as a slowly moving point (I, Q).
3. **Chest motion.** Still echoes (walls, the speaker leaking straight into the mic) sit at a fixed point, and the moving chest makes the echo swing around it. Echo turns that swing into chest displacement two ways (fitting a circle to the arc, and the main direction of motion) and keeps whichever shows the clearer rhythm. Slow drift is removed with a 10-second moving average.
4. **Breathing rate.** A Fourier analysis of the last ~28 seconds finds the strongest rhythm between 5 and 36 breaths per minute. The number shown is the middle value of the last 20 seconds of readings, so one bad reading can't make it jump. Readings far from it, or under 8 per minute, stay out of the night's average.
5. **Data only when it can see clearly.** Echo records only when breathing clearly stands out: strong breathing-band motion compared with fast noise, plus at least one of: a clean spectral peak, breaths well above the jitter, or breath-sized motion that repeats with a steady 2–8 second rhythm. Otherwise it says "Can't see breathing clearly" and records nothing. It doesn't guess.
6. **Pauses.** A pause of 10 seconds or more is logged two ways:
   - **Breath counting:** no breath found for 10 s, right after 20+ s of clear breathing, with no big movement before it.
   - **Quiet chest:** the chest motion goes still (under 40% of the breathing just before it) after breathing that was clear and full right up to the stop, with no jolt at the start (a jolt means rolling over, bumping the phone or getting up). A "pause" with no breathing back within 60 s is dropped as "probably out of view".

## How we tested it

**Real recordings.** 17 raw recordings (the last 4 minutes of the echo) from real rooms are in [`data/recordings/`](data/recordings/). They cover breathing at 10–40 cm, T-shirt and hoodies, empty rooms, a misaimed phone, rolling over, leaving the room and breath holds. Every change to the breathing engine is replayed against all of them with `tools/replay.js`.

| Test | Result |
|---|---|
| A full empty-room recording and a misaimed phone | 0% "seen", no breathing rate, no pauses |
| Clean breath holds of 15 and 20 s (2 recordings) | Both logged as pauses (19 s and 18 s) |
| 8 s breath hold | Logged as 12 s. Pause lengths are about ±4 s. |
| Rolling over, turning away, leaving the room | No false pauses |
| Breath hold right after bumping the phone | Not logged (on purpose: Echo distrusts motion right after a jolt) |
| Breath hold recorded on a phone with a weak mic | Not logged (signal too weak) |

**Breathing-rate accuracy.** Early check against timed breathing (phone about 20 cm away, Oct 13): 10 → 10, 15 → 15, 30 → 29 breaths/min. The app has a built-in **accuracy test** (Settings → testing tools): a breathing guide at 10, 15 and 20 breaths/min, 2 minutes each, that compares the number Echo shows with the guide over the last 75 seconds of each step.

Result (Oct 21, phone about 20 cm away, lying on the back, T-shirt):

| Guide | Echo | Error | Breathing seen |
|---|---|---|---|
| 10 /min | 9.8 /min | −0.2 | 100% |
| 15 /min | 14.9 /min | −0.1 | 100% |
| 20 /min | 19.9 /min | −0.1 | 100% |

Average error: 0.1 breaths/min. This is one person in one position; more people and positions are next.

**Overnight (Oct 21, iPhone 15 Pro Max).** About 6 hours in two sessions (1:30–5:22 a.m. and 5:41–7:48 a.m.; the sleeper stopped and restarted it once). Echo ran the whole time without stopping or crashing.

| Session | Breathing seen | Average rate | Notes |
|---|---|---|---|
| 1:30–5:22 a.m. | 64% | 17 /min (typical 14–20) | 2 pauses (longest 19 s), 5 min of snoring |
| 5:41–7:48 a.m. | 35% | 15 /min (typical 13–16) | Sleeper faced away from the phone, so Echo reported "can't see" instead of guessing. 17 min of snoring. |

The sleeper does snore. Both reports also said "waxing-and-waning pattern: seen", which was a false alarm and led to the stricter rule above. Battery: about 35% over roughly 6 hours (around 6% per hour), mostly from keeping the screen on. A web page has to keep the screen awake to keep the sound playing.

**Simulation.** `?sim=` modes (steady, irregular, pause, waxing-and-waning, rolls over, empty room, walks away, gets up) run 5+ minutes each: steady 97% seen, 3 of 3 pauses logged, 0 false pauses when rolling over, 0% seen in an empty room.

## Limitations (honest list)

- **Aim matters.** At this wavelength (about 2 cm), sound reflects off the body like a mirror. The bottom edge of the phone has to point at the chest or belly, about 10–25 cm away. Echo's aim check helps. When the person moves out of the beam, Echo reports "can't see" instead of guessing.
- **Every threshold was tuned on a small set of recordings** from one household, so results on new people and rooms may be worse.
- **Pause detection has been confirmed on breath holds lying on the back.** Holds while lying on the side haven't been tested yet.
- **Some people can hear the tone,** especially young people and pets.
- **Phones differ.** One phone with a muffled mic gave a much weaker signal.
- **Snoring and out-of-bed tracking are experimental.**

## What's next

- **A native phone app.** Native iPhone and Android apps can keep playing and listening with the screen off. That would cut battery use a lot and remove the need to keep the screen awake.
- **Testing with more people,** including side sleepers and people who have had a sleep study, to compare Echo's results with a real test.
- **Confirming the experimental features** (snoring, out of bed, waxing-and-waning) on real nights.

## Privacy

Everything runs on the phone. No audio is recorded or uploaded, there are no accounts, and saved nights stay in that phone's browser storage. Echo only keeps the breathing numbers it measures.

## Running it yourself

The app is one file, `app/index.html`, with no server code. The microphone needs `https` or `localhost`:

```
python3 -m http.server 8000      # then open http://localhost:8000/app/
```

**Demo mode** (no microphone): add `?sim=steady`, `?sim=pause`, `?sim=wax`, `?sim=irregular`, `?sim=roll`, `?sim=empty`, `?sim=away` or `?sim=bathroom`, plus `&speed=5` to run 5× faster.

**Replay a real recording:** `node tools/replay.js data/recordings/<file>.json` (needs Playwright).

**Other tests:** `node tests/sim_rate.js` (breathing rate across motion sizes, rates and noise) and `node tests/sim_pattern.js` (steady, irregular, sigh and waxing-and-waning patterns).

## What's here

| Path | What it is |
|---|---|
| `app/index.html` | The Echo app (one file: HTML, CSS, JavaScript) |
| `app/echo-breathing-scope.html` | Early engineering view |
| `tools/` | Replay tool, translation builder, first hardware test |
| `tests/` | Simulation tests for the signal processing |
| `data/recordings/` | Raw real-room recordings used for testing |
| `data/echo-test-data.xlsx` | Test results spreadsheet |
| `assets/photos/` | Photos (see credits) |

## Sources (facts used in the app and video)

- Benjafield AV et al. Estimation of the global prevalence and burden of obstructive sleep apnoea. *The Lancet Respiratory Medicine*, 2019. https://pubmed.ncbi.nlm.nih.gov/31300334/ (936 million adults aged 30–69 worldwide)
- American Academy of Sleep Medicine and Frost & Sullivan. Hidden health crisis costing America billions, 2016. https://aasm.org/resources/pdf/sleep-apnea-economic-crisis.pdf (29.4 million U.S. adults; 23.5 million undiagnosed; $149.6 billion a year)
- American Medical Association. What doctors want patients to know about sleep apnea, 2025. https://www.ama-assn.org/public-health/prevention-wellness/what-doctors-wish-patients-knew-about-sleep-apnea (about 30 million in the U.S.; builds over years; alcohol and body position; links to heart attacks and strokes)
- National Heart, Lung, and Blood Institute. Sleep apnea symptoms. https://www.nhlbi.nih.gov/health/sleep-apnea/symptoms (the signs, and the Sleep Check questions)
- Johns Hopkins Medicine. Obstructive sleep apnea. https://www.hopkinsmedicine.org/health/conditions-and-diseases/obstructive-sleep-apnea (up to 9 in 10 don't know they have it)
- Cleveland Clinic. Sleep apnea. https://my.clevelandclinic.org/health/diseases/8718-sleep-apnea (complications; severity by events per hour)

## Credits

- Breath-by-breath analysis and the RMSSD regularity score are adapted from [PhysioMetrics](https://github.com/RyanSeanPhillips/PhysioMetrics) by Ryan Sean Phillips (MIT License). See `THIRD_PARTY_NOTICES.md`.
- Photos from Unsplash by Polina Kuzovkova, Charmil Gandhi, Jerry Wang, Julia, Samira Sadeqi, Sophie Lee-Tin-Yien, Archee Lal, Tabitha Turner, Paulina Herpel, Joshua Hoehne and Oluwaseyi Johnson. See `assets/photos/CREDITS.md`.
- Intro animation uses [three.js](https://threejs.org) (MIT). Font: Bricolage Grotesque (SIL Open Font License).
- Phone sonar for breathing builds on earlier research, such as the University of Washington's ApneaApp.
