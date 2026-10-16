// Breathing pattern analysis for Echo.
// Breath-by-breath approach and RMSSD regularity score adapted from
// PhysioMetrics (MIT License, Ryan Sean Phillips): https://github.com/RyanSeanPhillips/PhysioMetrics
//
// Input: chest displacement samples d[] at fs Hz (already detrended).
// Output: breaths, pauses, regularity, and whether a waxing-and-waning
// (crescendo-decrescendo) pattern repeats.

function movingAverage(x, w) {
  const n = x.length, out = new Float64Array(n);
  let s = 0;
  const h = Math.floor(w / 2);
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + x[i];
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - h), b = Math.min(n, i + h + 1);
    out[i] = (pre[b] - pre[a]) / (b - a);
  }
  return out;
}

function median(arr) {
  if (!arr.length) return 0;
  const s = Array.from(arr).sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function quantile(arr, q) {
  if (!arr.length) return 0;
  const s = Array.from(arr).sort((a, b) => a - b);
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

// Find individual breaths: smooth, remove slow baseline, then detect each
// rise from a trough to a peak using hysteresis so noise during pauses
// doesn't count as breaths.
function detectBreaths(d, fs) {
  const smooth = movingAverage(d, Math.max(1, Math.round(0.4 * fs)));
  const base = movingAverage(smooth, Math.round(8 * fs));
  const x = new Float64Array(d.length);
  for (let i = 0; i < d.length; i++) x[i] = smooth[i] - base[i];

  // scale = typical breath size, from the larger swings in the window
  const absx = Array.from(x, Math.abs);
  const scale = quantile(absx, 0.9);
  const hyst = 0.12 * scale;

  // walk the signal: alternate between looking for a trough and a peak
  const breaths = [];
  let mode = 'trough', tIdx = 0, tVal = x[0], pIdx = 0, pVal = x[0];
  for (let i = 1; i < x.length; i++) {
    const v = x[i];
    if (mode === 'trough') {
      if (v < tVal) { tVal = v; tIdx = i; }
      else if (v > tVal + hyst) { mode = 'peak'; pVal = v; pIdx = i; }
    } else {
      if (v > pVal) { pVal = v; pIdx = i; }
      else if (v < pVal - hyst) {
        breaths.push({ onset: tIdx, peak: pIdx, amp: pVal - tVal });
        mode = 'trough'; tVal = v; tIdx = i;
      }
    }
  }
  // drop tiny wiggles (noise), relative to the typical breath
  const medAmp = median(breaths.map(b => b.amp));
  return { breaths: breaths.filter(b => b.amp > 0.15 * medAmp), signal: x };
}

// Main analysis.
function analyzePattern(d, fs, opts = {}) {
  const pauseSec = opts.pauseSec || 10;
  const n = d.length, durSec = n / fs;
  const { breaths } = detectBreaths(d, fs);
  const res = { durSec, breathCount: breaths.length, pauses: [], rmssd: null,
                regular: null, waxWane: false, cycleSec: null, cycleStrength: 0,
                depth: 0, ampSeries: [], label: 'Not enough data' };
  if (breaths.length < 4 || durSec < 60) return res;

  // pauses: gaps between breath onsets longer than pauseSec
  // (also counts a pause at the start or end of the window)
  const onsetsSec = breaths.map(b => b.onset / fs);
  const gaps = [];
  for (let i = 1; i < onsetsSec.length; i++) gaps.push([onsetsSec[i - 1], onsetsSec[i]]);
  for (const [a, b] of gaps) if (b - a > pauseSec) res.pauses.push({ start: a, end: b, len: b - a });

  // regularity: RMSSD of breath-to-breath intervals (seconds), ignoring pauses
  const ibis = gaps.map(([a, b]) => b - a).filter(v => v <= pauseSec);
  if (ibis.length >= 3) {
    let s = 0;
    for (let i = 1; i < ibis.length; i++) s += (ibis[i] - ibis[i - 1]) ** 2;
    res.rmssd = Math.sqrt(s / (ibis.length - 1));
    const meanIbi = ibis.reduce((a, b) => a + b, 0) / ibis.length;
    // overall spread of timing and size, using the 10th-90th percentile range
    // so one sigh or one odd breath doesn't count as irregular breathing
    const amps = breaths.map(b => b.amp);
    res.ibiSpread = (quantile(ibis, 0.9) - quantile(ibis, 0.1)) / median(ibis);
    res.ampSpread = (quantile(amps, 0.9) - quantile(amps, 0.1)) / median(amps);
    // regular = small breath-to-breath jumps AND small overall spread
    res.regular = res.rmssd / meanIbi < 0.25 && res.ibiSpread < 0.5 && res.ampSpread < 0.7;
  }

  // breath-size envelope at 1 Hz: each second takes the size of the breath
  // that covers it, and 0 during pauses
  const env = new Float64Array(Math.floor(durSec));
  for (let k = 0; k < breaths.length; k++) {
    const a = Math.floor(onsetsSec[k]);
    const b = k + 1 < breaths.length ? Math.floor(onsetsSec[k + 1]) : env.length;
    const len = b - a;
    const val = len > pauseSec ? 0 : breaths[k].amp;
    for (let s = a; s < Math.min(b, env.length); s++) env[s] = val;
    if (len > pauseSec) for (let s = a; s < Math.min(a + 4, env.length); s++) env[s] = breaths[k].amp;
  }
  res.ampSeries = breaths.map((b, k) => ({ t: onsetsSec[k], amp: b.amp }));

  // smooth the envelope a little, then look for a repeating cycle 25–120 s long
  const e = movingAverage(env, 5);
  const mean = e.reduce((a, b) => a + b, 0) / e.length;
  const c = Array.from(e, v => v - mean);
  let var0 = 0; for (const v of c) var0 += v * v;
  const p90 = quantile(e, 0.9), p10 = quantile(e, 0.1);
  res.depth = p90 > 0 ? (p90 - p10) / p90 : 0;
  // autocorrelation for every lag, then take the FIRST strong peak, since a
  // repeating pattern also correlates at 2x and 3x its true cycle length
  const maxLag = Math.min(120, Math.floor(e.length / 2));
  const R = {};
  for (let lag = 20; lag <= maxLag + 1; lag++) {
    let s = 0;
    for (let i = 0; i + lag < c.length; i++) s += c[i] * c[i + lag];
    R[lag] = var0 > 0 ? Math.min(1, (s / var0) * (c.length / (c.length - lag))) : 0;
  }
  let best = 0;
  for (let lag = 25; lag <= maxLag; lag++) best = Math.max(best, R[lag]);
  let bestLag = null;
  for (let lag = 25; lag <= maxLag; lag++) {
    const isPeak = R[lag] >= R[lag - 1] && R[lag] >= (R[lag + 1] ?? -1);
    if (isPeak && R[lag] >= 0.8 * best) { bestLag = lag; best = R[lag]; break; }
  }
  res.cycleStrength = best;
  res.cycleSec = bestLag;
  const enoughCycles = bestLag && durSec >= 2 * bestLag;
  res.waxWane = !!(enoughCycles && best > 0.35 && res.depth > 0.6);

  if (res.waxWane) res.label = 'Waxing-and-waning pattern';
  else if (res.regular === false || res.pauses.length > 0) res.label = 'Irregular';
  else res.label = 'Steady';
  return res;
}

if (typeof module !== 'undefined') module.exports = { analyzePattern, detectBreaths };
