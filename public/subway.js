// Subway Rush: a three lane runner in real perspective.
// Obstacles: low barriers (jump), overhead signs (slide), concrete walls, parked trains, fast moving trains,
// holes in the track (switch lane) and short gaps (jump). Speed keeps ramping up the longer you run.
// Ramps lead up onto the roof of a parked train: ride it, grab the coins up there, and drop off the back.
// Every row is built around a safe lane so there is always a way through, and you have two hearts.
function lanes(el){
  const W=360,H=560,LW=96,F=16,HY=170,Y0=480,DMAX=100,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const Sc=D=>F/(F+D),gy=D=>HY+(Y0-HY)*Sc(D),X=(xw,D)=>W/2+xw*Sc(D);
  function shade(h,a){const n=parseInt(h.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v+a*(a<0?v:255-v))));return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`}
  const TRAIN=['#3b82f6','#f97316','#16a34a','#a855f7'];

  let base=0,objs,gapLeft,rowN,lastPat,t,time=0,dist,v,plane,lane,jy,vy,sl,pend,hearts,inv,over,started,coins,total=0,shake,parts,deadT,lastTxt;
  try{total=+localStorage.getItem('lane-coins')||0}catch(e){}
  // scenery made once
  const city=[];for(let i=0;i<16;i++){const w=22+rnd(26),h=30+rnd(95),wins=[];for(let k=0;k<w*h/90;k++)wins.push([3+rnd(w-8),4+rnd(Math.max(1,h-10)),Math.random()<.55]);city.push({x:i*24-10,w,h,wins})}

  function reset(){
    objs=[];base=0;gapLeft=0;rowN=0;lastPat='';t=0;dist=0;v=13;plane=lane=1;jy=vy=sl=0;pend=false;hearts=2;inv=0;over=false;started=false;coins=0;shake=0;parts=[];deadT=0;lastTxt='';
    hud();
  }
  const score=()=>Math.floor(dist/2)+coins*5;
  function hud(){
    const s=over?`Busted! ${score()} points, ${coins} coins. Best ${best('lanes',score())}. Tap or press Enter.`
      :started?`${score()} pts   ${coins} coins   Speed ${Math.round(v*3.6)} km/h`
      :'Tap or press any key to start. Swipe or arrows: left, right, Up jump, Down slide.';
    if(s!==lastTxt){lastTxt=s;st(s)}
  }

  /* ---------- level generation ---------- */
  const ob=(k,l,d,len,ex)=>objs.push(Object.assign({k,lane:l,d,len,horn:0},ex||{}));
  function coinLine(l,n,d0,air){for(let i=0;i<n;i++)objs.push({k:'coin',lane:l,d:d0+i*2.2,len:0,air:air?(air===2?2:1):0})}
  function coinArc(l,d){for(let i=-1;i<=1;i++)objs.push({k:'coin',lane:l,d:d+i*1.6,len:0,air:1})}
  const others=s=>[0,1,2].filter(l=>l!=s);
  const pick=a=>a[rnd(a.length)];
  const holeLen=()=>Math.max(12,v*.7+6);
  function spawnRow(){
    const lv=clamp(t/90,0,1),d=DMAX;let len=2,gapMin=0;
    const pool=rowN<3?[['coins',3],['jump',3],['slide',2]]
      :[['coins',lv<.5?2:1],['jump',3],['slide',3],['course',2+4*lv],['blocks',3],['train',3],
        ['mtrain',lv<.12?0:3.5],['holes',lv<.1?0:3],['gaps',lv<.05?0:2],['stairs',lv<.3?0:3],['ramp',lv<.05?0:4]];
    let tot=pool.reduce((a,b)=>a+b[1],0),r=Math.random()*tot,pat=pool[0][0];
    for(const[k,w]of pool){if(r<w){pat=k;break}r-=w}
    if(pat==lastPat&&pat!='coins')pat='coins';
    lastPat=pat;rowN++;
    const safe=rnd(3),oth=others(safe);
    if(pat=='coins'){
      const l=rnd(3);coinLine(l,7,d);len=15;
      if(lv>.3&&Math.random()<.5)coinLine(pick(others(l)),5,d+3);
    }else if(pat=='jump'||pat=='slide'){
      const k=pat=='jump'?'bar':'over';
      const use=lv<.2?[pick(oth)]:(lv<.5?oth:(Math.random()<.35?[0,1,2]:oth));
      use.forEach(l=>ob(k,l,d,1.2));len=2;
      if(k=='bar')coinArc(use[rnd(use.length)],d+1);
      if(!use.includes(safe))coinLine(safe,5,d-3);
    }else if(pat=='course'){
      // every lane gets something different; at least one lane needs only a jump, a slide or nothing
      let walls=0;
      for(let l=0;l<3;l++){
        let kk=pick(['bar','over','none','wall']);
        if(kk=='wall'&&(walls>=1||l==safe))kk=pick(['bar','over']);
        if(kk=='wall')walls++;
        if(kk=='none')coinLine(l,4,d-2);else if(kk=='wall')ob('wall',l,d,2.5);else ob(kk,l,d,1.2);
      }
      len=3;
    }else if(pat=='blocks'){
      len=2.5;
      oth.forEach(l=>{if(Math.random()<.5)ob('wall',l,d,2.5);else{const tl=R(8,14);ob('train',l,d,tl,{col:pick(TRAIN)});len=Math.max(len,tl)}});
      if(lv>.3&&Math.random()<.6)ob(pick(['bar','over']),safe,d+2,1.2);else coinLine(safe,5,d+1);
    }else if(pat=='train'){
      len=R(15,25);
      const two=lv>.3&&Math.random()<.5;
      const tl=two?oth:[pick(oth)];
      tl.forEach(l=>ob('train',l,d,len,{col:pick(TRAIN)}));
      coinLine(safe,6,d+2);
    }else if(pat=='mtrain'){
      // Fast trains close in on you. They are placed so they reach you only after the rows ahead
      // have cleared, and the next row waits until they have gone by, so there is always time to switch.
      len=R(12,20);
      const two=lv>.5&&Math.random()<.5;
      const tl=two?oth:[pick(oth)];
      const u=R(7,10)+lv*8;
      const E=objs.reduce((m,o)=>o.k=='coin'?m:Math.max(m,o.d+o.len),0);
      const Ta=Math.max(DMAX/(v+u),E/v+.9),dR=Ta*v;
      tl.forEach(l=>ob('train',l,Ta*(v+u),len,{col:pick(TRAIN),u}));
      others(tl[0]).filter(l=>!tl.includes(l)).forEach(l=>{
        if(l!=safe&&lv>.3)ob(pick(['bar','over']),l,dR+3,1.2);else coinLine(l,6,dR+2)});
      gapMin=v*(Ta+len/(v+u)+.5-DMAX/v);
      len=Math.max(0,dR-DMAX)+4;
    }else if(pat=='holes'){
      const hl=holeLen();len=hl;
      const hs=lv<.4?[pick(oth)]:oth;
      hs.forEach(l=>ob('hole',l,d,hl));
      const rest=oth.filter(l=>!hs.includes(l));
      rest.forEach(l=>ob(pick(['bar','over']),l,d+hl/2,1.2));
      if(lv>.5&&Math.random()<.5){ob('gap',safe,d+hl*.4,3);coinArc(safe,d+hl*.4+1.5)}else coinLine(safe,Math.floor(hl/2.2),d+1);
    }else if(pat=='gaps'){
      len=3;[0,1,2].forEach(l=>ob('gap',l,d,3));coinArc(1,d+1.5);
    }else if(pat=='ramp'){
      // ramp up onto a parked train roof with coins on top; another lane has a hazard, the safe lane stays clear
      const rl=pick(oth),ol=oth.find(l=>l!=rl),RL=8,TL=R(15,22);
      ob('ramp',rl,d,RL);ob('train',rl,d+RL,TL,{col:pick(TRAIN),ride:1,horn:1});
      coinLine(rl,Math.floor(TL/2.2),d+RL+1,2);
      if(Math.random()<.5)ob('wall',ol,d+RL,2.5);else ob(pick(['bar','over']),ol,d+RL,1.2);
      coinLine(safe,5,d+2);len=RL+TL;
    }else if(pat=='stairs'){
      // three trains one after another in different lanes. Wait in the last lane, then cross over
      // through the gap in the middle lane (g) once the first two have gone by.
      const S=Math.max(11,v*.8),g=Math.max(6,v*.45),L=S-g,order=Math.random()<.5?[0,1,2]:[2,1,0];
      order.forEach((l,i)=>ob('train',l,d+i*S,L,{col:pick(TRAIN)}));
      len=2*S+L;coinLine(order[2],5,d+S*.5);
    }
    gapLeft=Math.max(len+v*(.62-.3*lv)+2,gapMin);
  }

  /* ---------- gameplay ---------- */
  function start(){started=true;hud()}
  function act(a){
    if(over)return;
    if(!started){start()}
    if(a=='l'&&lane>0){lane--;sfx('swipe')}
    else if(a=='r'&&lane<2){lane++;sfx('swipe')}
    else if(a=='u'&&jy==0&&!pend){vy=520;jy=.01;sl=0;sfx('hop')}
    else if(a=='d'){if(jy>0){vy=-900;pend=true}else{sl=.7;sfx('slide')}}
  }
  function hit(o){
    o.hit=1;hearts--;inv=1.6;shake=.35;sfx('crash');
    if(o.k=='hole'||o.k=='gap'){vy=640;jy=.01;sl=0;pend=false}   // you scramble out of the hole
    for(let i=0;i<12;i++)parts.push({x:X((plane-1)*LW,0),y:Y0-30-jy,vx:R(-120,120),vy:R(-220,40),life:R(.4,.8),col:['#ffd21f','#e63027','#fff'][rnd(3)]});
    if(hearts<=0){over=true;deadT=0;sfx('lose')}
  }
  function update(dt){
    time+=dt;
    parts=parts.filter(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=500*dt;q.life-=dt;return q.life>0});
    if(shake>0)shake-=dt;
    if(over){deadT+=dt;hud();return}
    if(!started){hud();return}
    v=13+Math.min(27,t*.27);t+=dt;dist+=v*dt;
    gapLeft-=v*dt;if(gapLeft<=0)spawnRow();
    for(const o of objs){
      let sp=v;
      // fast trains close in on you, but never run through something ahead of them in their lane
      if(o.u&&!objs.some(p=>p!==o&&p.lane==o.lane&&p.k!='coin'&&p.k!='hole'&&p.k!='gap'&&p.d<o.d&&p.d+p.len>o.d-1.5))sp=v+o.u;
      o.d-=sp*dt;
    }
    objs=objs.filter(o=>o.d+o.len>-6);
    plane+=clamp(lane-plane,-10*dt,10*dt);
    if(jy>0||vy>0){jy+=vy*dt;vy-=1800*dt;if(jy<=0){jy=0;vy=0;if(pend){sl=.7;pend=false}}}
    if(sl>0)sl-=dt;
    if(inv>0)inv-=dt;
    {let tg=0;const rl=Math.round(plane);
      for(const o of objs){if(o.lane!=rl||!(o.d<=0&&o.d+o.len>0))continue;
        if(o.k=='ramp')tg=Math.max(tg,-o.d/o.len*92);else if(o.ride)tg=Math.max(tg,92)}
      if(tg>=base)base=tg;else base=Math.max(tg,base-900*dt)}
    const HT=base+jy;
    for(const o of objs){
      if(o.k=='train'&&!o.horn&&o.d/(v+(o.u||0))<(o.u?2.8:2.2)){o.horn=1;sfx('train')}
      if(o.k=='coin'){
        if(Math.abs(plane-o.lane)<.6&&Math.abs(o.d)<1.1&&(o.air!=2||HT>60)){o.gone=1;coins++;total++;sfx('coin');try{localStorage.setItem('lane-coins',total)}catch(e){}
          parts.push({x:X((o.lane-1)*LW,0),y:Y0-40,vx:0,vy:-120,life:.4,col:'#ffd21f'})}
        continue;
      }
      if(o.hit||inv>0)continue;
      if(Math.abs(plane-o.lane)<.5&&o.d<.8&&o.d+o.len>-.8){
        if(o.k=='train'||o.k=='wall'){if(HT<(o.k=='wall'?76:84))hit(o)}
        else if((o.k=='hole'||o.k=='gap')&&HT<3&&o.d<.3&&o.d+o.len>-.3)hit(o);
        else if(o.k=='bar'&&HT<32)hit(o);
        else if(o.k=='over'&&!(sl>0&&jy==0)&&!(base>20))hit(o);
      }
    }
    objs=objs.filter(o=>!o.gone);
    hud();
  }

  /* ---------- drawing ---------- */
  function poly(pts,col){x.fillStyle=col;x.beginPath();x.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)x.lineTo(pts[i],pts[i+1]);x.closePath();x.fill()}
  // a box in the world: x0..x1 across (px at scale 1), d..d+len deep, z0..z1 tall
  function block(x0,x1,d,len,z0,z1,front,roof,side){
    const dn=Math.max(d,-3),df=d+len;if(df<=-3)return;
    const sN=Sc(dn),sF=Sc(df),gN=gy(dn),gF=gy(df);
    if(len>0){
      poly([X(x0,dn),gN-z1*sN,X(x1,dn),gN-z1*sN,X(x1,df),gF-z1*sF,X(x0,df),gF-z1*sF],roof);
      if(x1<=0)poly([X(x1,dn),gN-z0*sN,X(x1,dn),gN-z1*sN,X(x1,df),gF-z1*sF,X(x1,df),gF-z0*sF],side);
      if(x0>=0)poly([X(x0,dn),gN-z0*sN,X(x0,dn),gN-z1*sN,X(x0,df),gF-z1*sF,X(x0,df),gF-z0*sF],side);
    }
    if(d>=-3)x.fillStyle=front,x.fillRect(X(x0,dn),gN-z1*sN,(x1-x0)*sN,(z1-z0)*sN);
    return{l:X(x0,dn),t:gN-z1*sN,w:(x1-x0)*sN,h:(z1-z0)*sN,s:sN,g:gN};
  }
  function fade(d){return d>DMAX-10?clamp((DMAX-d)/10,0,1):1}
  function drawObj(o){
    x.globalAlpha=fade(o.d);
    const cx=(o.lane-1)*LW,x0=cx-LW*.42,x1=cx+LW*.42;
    if(o.k=='train'){
      const b=block(x0,x1,o.d,o.len,0,92,shade(o.col,-.1),shade('#cfd6e4',0),shade('#6c748a',0));
      if(b&&o.d>=-3){
        x.fillStyle='#10131c';x.fillRect(b.l+b.w*.12,b.t+b.h*.12,b.w*.76,b.h*.3);
        const fast=!!o.u,hl=fast&&Math.floor(time*8)%2==0;
        x.fillStyle=hl?'#ff4d4d':'#fde68a';x.beginPath();x.arc(b.l+b.w*.2,b.t+b.h*.72,b.w*(fast?.1:.07),0,7);x.arc(b.l+b.w*.8,b.t+b.h*.72,b.w*(fast?.1:.07),0,7);x.fill();
        if(fast){x.fillStyle='#fff';x.fillRect(b.l,b.t+b.h*.92,b.w,Math.max(2,b.h*.06))}
        x.fillStyle=shade(o.col,-.35);x.fillRect(b.l,b.t+b.h*.52,b.w,b.h*.08);
      }
    }else if(o.k=='ramp'){
      const dn=Math.max(o.d,-3),df=o.d+o.len;
      if(df>-3){
        const H=92,tn=(dn-o.d)/o.len,hN=H*tn,sN=Sc(dn),sF=Sc(df),gN=gy(dn),gF=gy(df);
        if(x1<=0)poly([X(x1,dn),gN-hN*sN,X(x1,dn),gN,X(x1,df),gF,X(x1,df),gF-H*sF],'#a8620b');
        if(x0>=0)poly([X(x0,dn),gN-hN*sN,X(x0,dn),gN,X(x0,df),gF,X(x0,df),gF-H*sF],'#a8620b');
        poly([X(x0,dn),gN-hN*sN,X(x1,dn),gN-hN*sN,X(x1,df),gF-H*sF,X(x0,df),gF-H*sF],'#f5a524');
        x.strokeStyle='#17171a';x.lineWidth=Math.max(1,3*sN);
        for(let i=1;i<6;i++){const tt=i/6;if(tt<tn)continue;const dd=o.d+o.len*tt,ss=Sc(dd),yy=gy(dd)-H*tt*ss;x.beginPath();x.moveTo(X(x0,dd),yy);x.lineTo(X(x1,dd),yy);x.stroke()}
        x.fillStyle='#ffe08a';x.fillRect(X(x0,dn),gN-hN*sN-2,(x1-x0)*sN,2)
      }
    }else if(o.k=='bar'){
      const b=block(x0,x1,o.d,o.len,0,28,'#e63027','#ff9a92','#a81d17');
      if(b){x.fillStyle='#fff';for(let i=0;i<6;i+=2)x.fillRect(b.l+b.w*i/6,b.t,b.w/6,b.h)}
    }else if(o.k=='wall'){
      const b=block(x0,x1,o.d,o.len,0,84,'#9aa0ad','#d3d7e0','#6b7180');
      if(b){x.fillStyle='#ffd21f';for(let i=0;i<4;i++){x.beginPath();x.moveTo(b.l+b.w*(i*2)/8,b.t+b.h);x.lineTo(b.l+b.w*(i*2+1)/8,b.t+b.h);x.lineTo(b.l+b.w*(i*2+2)/8,b.t+b.h*.7);x.lineTo(b.l+b.w*(i*2+1)/8,b.t+b.h*.7);x.fill()}}
    }else if(o.k=='over'){
      block(x0,x0+9,o.d,o.len,0,100,'#8d93a3','#c3c8d4','#5d6372');
      block(x1-9,x1,o.d,o.len,0,100,'#8d93a3','#c3c8d4','#5d6372');
      const b=block(x0,x1,o.d,o.len,48,74,'#ffd21f','#fff3a0','#b8960f');
      if(b){x.fillStyle='#17171a';for(let i=0;i<8;i+=2)x.fillRect(b.l+b.w*i/8,b.t,b.w/8,b.h)}
    }else{
      const s=Sc(o.d),cxp=X(cx,o.d),cy=gy(o.d)-(o.air==2?122:o.air?62:24)*s,w=Math.abs(Math.cos(time*5+o.d))*9*s+2*s;
      x.fillStyle='#ffd21f';x.strokeStyle='#b45309';x.lineWidth=Math.max(1,2*s);x.beginPath();x.ellipse(cxp,cy,w,9*s,0,0,7);x.fill();x.stroke();
    }
    x.globalAlpha=1;
  }
  function scene(){
    const g=x.createLinearGradient(0,0,0,HY);g.addColorStop(0,'#1d1448');g.addColorStop(.7,'#c2475f');g.addColorStop(1,'#ff9a59');x.fillStyle=g;x.fillRect(0,0,W,HY);
    x.fillStyle='#ffd9a0';x.beginPath();x.arc(W/2+60,HY-26,26,0,7);x.fill();
    city.forEach(b=>{x.fillStyle='#231a3f';x.fillRect(b.x,HY-b.h,b.w,b.h);x.fillStyle='#ffd27a';b.wins.forEach(w=>{if(w[2])x.fillRect(b.x+w[0],HY-b.h+w[1],2,3)})});
    // ground
    const gg=x.createLinearGradient(0,HY,0,H);gg.addColorStop(0,'#4a3f56');gg.addColorStop(1,'#1b1722');x.fillStyle=gg;x.fillRect(0,HY,W,H-HY);
    poly([X(-1.55*LW,DMAX+30),gy(DMAX+30),X(1.55*LW,DMAX+30),gy(DMAX+30),X(1.55*LW,-3),gy(-3),X(-1.55*LW,-3),gy(-3)],'#2b2733');
    // sleepers and rails
    const off=dist%2.4;
    for(let l=0;l<3;l++){
      const cx=(l-1)*LW;x.fillStyle='#4d3a2c';
      for(let D=-2.4+(2.4-off);D<DMAX+10;D+=2.4){const s=Sc(D),y=gy(D);x.fillRect(X(cx-LW*.4,D),y-3*s,LW*.8*s,Math.max(1,4*s))}
      x.strokeStyle='#aab0bd';x.lineWidth=2.5;
      for(const sd of[-.26,.26]){x.beginPath();x.moveTo(X(cx+sd*LW,DMAX+30),gy(DMAX+30));x.lineTo(X(cx+sd*LW,-3),gy(-3));x.stroke()}
    }
    // holes and gaps in the track
    for(const o of objs){
      if(o.k!='hole'&&o.k!='gap')continue;
      const dn=Math.max(o.d,-3),df=Math.min(o.d+o.len,DMAX+30);if(df<=dn)continue;
      const cx=(o.lane-1)*LW,x0=cx-LW*.46,x1=cx+LW*.46;
      poly([X(x0,dn),gy(dn),X(x1,dn),gy(dn),X(x1,df),gy(df),X(x0,df),gy(df)],'#050309');
      // far wall of the pit so it reads as a drop
      if(df>=o.d+o.len-.01){const sF=Sc(df);poly([X(x0,df),gy(df),X(x1,df),gy(df),X(x1,df),gy(df)+14*sF,X(x0,df),gy(df)+14*sF],'#2a2236')}
      if(o.d>-3){const sN=Sc(o.d);x.fillStyle='#ffd21f';x.fillRect(X(x0,o.d),gy(o.d)-2*sN,(x1-x0)*sN,Math.max(1.5,3*sN));
        x.fillStyle='#17171a';for(let i=1;i<8;i+=2)x.fillRect(X(x0,o.d)+(x1-x0)*sN*i/8,gy(o.d)-2*sN,(x1-x0)*sN/8,Math.max(1.5,3*sN))}
    }
    // lamp posts for speed
    for(const side of[-1,1])for(let D=-1+(8-dist%8);D<DMAX;D+=8){
      const s=Sc(D),px=X(side*1.95*LW,D),y=gy(D);
      x.strokeStyle='#15121c';x.lineWidth=Math.max(1,4*s);x.beginPath();x.moveTo(px,y);x.lineTo(px,y-120*s);x.stroke();
      x.fillStyle='#ffe9a8';x.beginPath();x.arc(px,y-122*s,Math.max(1,5*s),0,7);x.fill();
    }
  }
  function runner(cx,gb,h,crouch,ph,air){
    const sq=crouch?.55:1,y=gb-h,hipY=y-26*sq,shY=y-(crouch?34:50),hdY=y-(crouch?42:60);
    x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(cx,gb,16-h*.06,5,0,0,7);x.fill();
    x.lineCap='round';
    const a=air?.7:Math.sin(ph)*.9;
    for(const sd of[-1,1]){
      const ang=a*sd,fx=cx+sd*5+Math.sin(ang)*12,fy=hipY+Math.cos(ang)*22*sq*(air&&sd<0?.6:1);
      x.strokeStyle='#243b72';x.lineWidth=7;x.beginPath();x.moveTo(cx+sd*5,hipY);x.lineTo(fx,fy);x.stroke();
      x.fillStyle='#fff';x.fillRect(fx-5,fy-2,10,5);
    }
    x.fillStyle='#e63027';x.fillRect(cx-11,shY,22,hipY-shY+5);
    x.fillStyle='#ffd21f';x.fillRect(cx-8,shY+3,16,Math.max(8,hipY-shY-5));
    for(const sd of[-1,1]){
      const ang=-a*sd*(air?1.5:1),hx=cx+sd*13+Math.sin(ang)*9,hy=shY+4+Math.cos(ang)*17*sq;
      x.strokeStyle='#c4231b';x.lineWidth=6;x.beginPath();x.moveTo(cx+sd*12,shY+3);x.lineTo(hx,hy);x.stroke();
      x.fillStyle='#f1c27d';x.beginPath();x.arc(hx,hy,3.2,0,7);x.fill();
    }
    x.fillStyle='#f1c27d';x.beginPath();x.arc(cx,hdY,9,0,7);x.fill();
    x.fillStyle='#1e3a8a';x.beginPath();x.arc(cx,hdY-1,9.5,Math.PI,0);x.fill();x.fillRect(cx-9.5,hdY-2,19,5);
  }
  function warns(){
    for(const o of objs){
      if(o.k!='train'||o.ride)continue;
      const ta=o.d/(v+(o.u||0));
      if(ta>(o.u?3:2.2)||o.d<4||Math.floor(time*(o.u?9:5))%2)continue;
      const px=X((o.lane-1)*LW,12),py=236;
      poly([px,py-16,px+16,py+12,px-16,py+12],o.u?'#e63027':'#f59e0b');
      x.fillStyle='#fff';x.font='bold 17px system-ui';x.textAlign='center';x.fillText(o.u?'!!':'!',px,py+10);
    }
  }
  function text(s,px,py,size,col,al){
    x.font=`${size}px Impact,"Arial Black",sans-serif`;x.textAlign=al||'center';x.lineWidth=Math.max(3,size/7);x.strokeStyle='#000a';x.strokeText(s,px,py);x.fillStyle=col;x.fillText(s,px,py);
  }
  function draw(){
    x.save();
    if(shake>0)x.translate(R(-4,4),R(-4,4));
    x.clearRect(-10,-10,W+20,H+20);
    scene();
    const list=objs.filter(o=>o.k!='hole'&&o.k!='gap'&&(o.d>-3.5||o.k=='train'||o.k=='ramp')).sort((a,b)=>b.d-a.d);
    let drew=false;
    const pl=()=>{drew=true;
      if(inv>0&&Math.floor(time*14)%2==0&&!over)return;
      runner(X((plane-1)*LW,0),Y0,jy+base,sl>0&&jy==0,time*(started&&!over?13:4),jy>0)};
    for(const o of list){if(!drew&&o.d<0&&!(o.k=='ramp'||o.ride))pl();drawObj(o)}
    if(!drew)pl();
    warns();
    parts.forEach(q=>{x.globalAlpha=clamp(q.life*2,0,1);x.fillStyle=q.col;x.fillRect(q.x-2,q.y-2,4,4)});x.globalAlpha=1;
    x.restore();
    text(String(score()),14,44,38,'#fff','left');
    x.font='26px system-ui';x.textAlign='right';x.fillStyle='#e63027';x.fillText('♥'.repeat(Math.max(0,hearts)),W-12,40);
    x.fillStyle='#ffd21f';x.beginPath();x.arc(W-90,70,8,0,7);x.fill();text(String(coins),W-12,78,24,'#fff','right');
    if(!started){x.fillStyle='#0008';x.fillRect(0,H/2-80,W,150);text('SUBWAY RUSH',W/2,H/2-20,42,'#ffd21f');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Tap or press any key to start',W/2,H/2+14);x.fillText('Switch lanes around holes and trains',W/2,H/2+38)}
    if(over&&deadT>.5){x.fillStyle='#000b';x.fillRect(0,H/2-90,W,180);text('BUSTED',W/2,H/2-28,50,'#ffd21f');text(score()+' pts',W/2,H/2+16,32,'#fff');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Best '+best('lanes',score())+'   Tap or press Enter to retry',W/2,H/2+52)}
  }

  /* ---------- input and loop ---------- */
  const KM={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',a:'l',d:'r',w:'u',s:'d',A:'l',D:'r',W:'u',S:'d',' ':'u'};
  on(document,'keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(over){if(e.key=='Enter'||e.key==' '){e.preventDefault();if(deadT>.4)reset()}return}
    const a=KM[e.key];
    if(a){e.preventDefault();act(a)}else if(e.key=='Enter'&&!started){start()}
  });
  let pd=null;
  on(c,'pointerdown',e=>{pd={x:e.clientX,y:e.clientY,done:false};try{c.setPointerCapture(e.pointerId)}catch(_){}});
  on(c,'pointermove',e=>{
    if(!pd||pd.done)return;const dx=e.clientX-pd.x,dy=e.clientY-pd.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))>26){pd.done=true;act(Math.abs(dx)>Math.abs(dy)?(dx<0?'l':'r'):(dy<0?'u':'d'))}
  });
  on(c,'pointerup',e=>{
    if(!pd)return;const m=Math.hypot(e.clientX-pd.x,e.clientY-pd.y),done=pd.done;pd=null;
    if(!done&&m<12){if(over){if(deadT>.4)reset()}else if(!started)start()}
  });
  reset();
  let last=performance.now(),raf;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
