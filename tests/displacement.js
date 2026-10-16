// displacement(I,Q): circle-fit angle when the arc is large, PCA when small.
function displacementFrom(Iin,Qin){
  const M=Iin.length, I=Float64Array.from(Iin), Q=Float64Array.from(Qin);
  let mi=0,mq=0; for(let k=0;k<M;k++){mi+=I[k];mq+=Q[k];} mi/=M;mq/=M;
  let sxx=0,syy=0,sxy=0;
  for(let k=0;k<M;k++){I[k]-=mi;Q[k]-=mq;sxx+=I[k]*I[k];syy+=Q[k]*Q[k];sxy+=I[k]*Q[k];}
  const spread=Math.sqrt((sxx+syy)/M);
  const d=new Float64Array(M); let used='pca';
  // Kasa circle fit on centered points: x^2+y^2 + D x + E y + F = 0
  let a11=0,a12=0,a13=0,a22=0,a23=0,b1=0,b2=0,b3=0;
  for(let k=0;k<M;k++){const x=I[k],y=Q[k],z=-(x*x+y*y);
    a11+=x*x;a12+=x*y;a13+=x;a22+=y*y;a23+=y;b1+=x*z;b2+=y*z;b3+=z;}
  const A=[[a11,a12,a13],[a12,a22,a23],[a13,a23,M]], B=[b1,b2,b3];
  const det3=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
  const D0=det3(A);
  if(Math.abs(D0)>1e-30){
    const sol=[0,1,2].map(j=>{const m=A.map((r,i)=>r.map((v,c)=>c===j?B[i]:v));return det3(m)/D0;});
    const cx=-sol[0]/2, cy=-sol[1]/2, R=Math.sqrt(Math.max(0,cx*cx+cy*cy-sol[2]));
    if(R>0 && R<4*spread){ // arc is a big fraction of the circle -> use true angle
      let prev=Math.atan2(Q[0]-cy,I[0]-cx), acc=0; d[0]=0;
      for(let k=1;k<M;k++){const a=Math.atan2(Q[k]-cy,I[k]-cx); let da=a-prev;
        if(da>Math.PI)da-=2*Math.PI; if(da<-Math.PI)da+=2*Math.PI; acc+=da; d[k]=acc; prev=a;}
      used='circle';
    }
  }
  if(used==='pca'){const ang=0.5*Math.atan2(2*sxy,sxx-syy),c=Math.cos(ang),s=Math.sin(ang);
    for(let k=0;k<M;k++)d[k]=I[k]*c+Q[k]*s;}
  let st=0,sd=0,stt=0,std=0; for(let k=0;k<M;k++){st+=k;sd+=d[k];stt+=k*k;std+=k*d[k];}
  const den=M*stt-st*st, sl=den?(M*std-st*sd)/den:0, ic=(sd-sl*st)/M;
  for(let k=0;k<M;k++)d[k]-=ic+sl*k;
  return {d,used};
}
module.exports={displacementFrom};
