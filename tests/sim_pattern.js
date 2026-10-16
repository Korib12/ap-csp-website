const {displacementFrom}=require('./displacement.js');
const {analyzePattern}=require('./pattern.js');
const fs=10, T=240, lam=343/16600;
let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
// breathing generator: env(t) = breath depth (mm), rate(t) breaths/min
function makeIQ(depthFn, rateFn, noise=0.002){
  const I=[],Q=[]; let ph=0;
  for(let k=0;k<fs*T;k++){const t=k/fs;
    ph+=2*Math.PI*rateFn(t)/60/fs;
    const dmm=depthFn(t)*0.5*(1-Math.cos(ph)); // 0..depth mm
    const ang=4*Math.PI*(0.25+dmm/1000)/lam;
    I.push(1.0+0.05*Math.cos(ang)+noise*(rnd()*2-1)); Q.push(0.4+0.05*Math.sin(ang)+noise*(rnd()*2-1));}
  return {I,Q};
}
function csr(cycle,pause,maxmm){ return t=>{const p=t%cycle, on=cycle-pause; return p<on? maxmm*Math.sin(Math.PI*p/on):0;}; }
const randRate=(()=>{const v=[];for(let i=0;i<60;i++)v.push(10+rnd()*15);return t=>v[Math.floor(t/4)];})();
const randDepth=(()=>{const v=[];for(let i=0;i<300;i++)v.push(2+rnd()*5);return t=>v[Math.floor(t/3)];})();
const cases=[
 ['Steady 15/min, 4 mm',            ()=>4, ()=>15],
 ['Steady 15/min, deep 8 mm',       ()=>8, ()=>15],
 ['Steady 12/min, noisy',           ()=>3, ()=>12, 0.02],
 ['Steady + one sigh at 120 s',     t=>(t>118&&t<123)?12:4, ()=>15],
 ['Irregular rate and depth',       randDepth, randRate],
 ['Waxing-waning 55 s cycle, 15 s pause', csr(55,15,8), ()=>18],
 ['Waxing-waning 45 s cycle, 10 s pause', csr(45,10,6), ()=>16],
 ['Your test: 40 s up/down + 10 s pause', csr(50,10,8), ()=>15],
 ['Waxing-waning, no full pause',   t=>1+7*Math.abs(Math.sin(Math.PI*t/60)), ()=>16],
];
for(const [name,dF,rF,nz] of cases){
  const {I,Q}=makeIQ(dF,rF,nz);
  const {d}=displacementFrom(I,Q);
  const r=analyzePattern(Array.from(d),fs);
  console.log(name.padEnd(40), '->', r.label.padEnd(26),
    `breaths ${String(r.breathCount).padStart(3)}  pauses ${r.pauses.length}  cycle ${r.cycleSec??'-'}s r=${r.cycleStrength.toFixed(2)} depth=${r.depth.toFixed(2)} rmssd=${r.rmssd?.toFixed(2)} ibiSp=${r.ibiSpread?.toFixed(2)} ampSp=${r.ampSpread?.toFixed(2)}`);
}
