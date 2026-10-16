const {displacementFrom}=require('./displacement.js');
const fs=48000,f0=16600,c=343,SLOW_HZ=10,N=600;
function run(bpm,ampMM,noise,label,chestAmp=0.05){
  const fb=bpm/60,T=60; let ringI=[],ringQ=[];
  let phase=0,aI=0,aQ=0,aN=0; const w=2*Math.PI*f0/fs,per=fs/SLOW_HZ;
  for(let n=0;n<fs*T;n++){const t=n/fs;
    const d=0.25+ampMM/1000*Math.sin(2*Math.PI*fb*t)*(1+0.15*Math.sin(2*Math.PI*fb*2*t));
    const x=Math.cos(2*Math.PI*f0*t+0.3)+0.4*Math.cos(2*Math.PI*f0*(t-2*0.9/c))+chestAmp*Math.cos(2*Math.PI*f0*(t-2*d/c))+noise*(Math.random()*2-1);
    aI+=x*Math.cos(phase);aQ-=x*Math.sin(phase);phase+=w;if(phase>2*Math.PI)phase-=2*Math.PI;aN++;
    if(aN>=per){ringI.push(aI/aN);ringQ.push(aQ/aN);aI=aQ=aN=0;}}
  const M=SLOW_HZ*28; const {d:x0,used}=displacementFrom(ringI.slice(-M),ringQ.slice(-M)); const x=Array.from(x0);
  for(let k=0;k<M;k++)x[k]*=0.5-0.5*Math.cos(2*Math.PI*k/(M-1));
  const fLo=0.08,fHi=0.6,steps=130,P=[];let bs=0,bp=0,tot=0;
  for(let s=0;s<=steps;s++){const f=fLo+(fHi-fLo)*s/steps;let re=0,im=0;
    for(let k=0;k<M;k++){const ph=2*Math.PI*f*k/SLOW_HZ;re+=x[k]*Math.cos(ph);im-=x[k]*Math.sin(ph);}
    P[s]=re*re+im*im;tot+=P[s];if(P[s]>bp){bp=P[s];bs=s;}}
  let f=fLo+(fHi-fLo)*bs/steps;const fh=f/2;
  if(fh>=fLo){const sh=Math.round((fh-fLo)/(fHi-fLo)*steps);let ph=0;for(let s=Math.max(0,sh-2);s<=Math.min(steps,sh+2);s++)ph=Math.max(ph,P[s]);if(ph>0.5*bp){f=fh;bp=ph;}}
  console.log(`${label.padEnd(30)} true ${String(bpm).padStart(2)} -> app ${(f*60).toFixed(1).padStart(5)}  [${used}]`);
}
for(const mm of [1,2,4,8,12]) for(const bpm of [6,10,15,20,30]) run(bpm,mm,0.2,`${mm} mm chest motion`);
run(15,4,0.6,'very noisy, 4 mm'); run(10,8,0.6,'very noisy, 8 mm'); run(15,3,0.2,'weak echo, 3 mm',0.01);
