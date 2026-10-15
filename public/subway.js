// Subway Rush: a three lane runner in real perspective.
// Obstacles spawn far away so you can see them coming, trains get a warning sign and horn,
// every row always has a way through, and you have two hearts so one mistake is not the end.
function lanes(el){
  const W=360,H=560,LW=96,F=16,HY=170,Y0=480,DMAX=70,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const Sc=D=>F/(F+D),gy=D=>HY+(Y0-HY)*Sc(D),X=(xw,D)=>W/2+xw*Sc(D);
  function shade(h,a){const n=parseInt(h.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v+a*(a<0?v:255-v))));return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`}
  const TRAIN=['#3b82f6','#f97316','#16a34a','#a855f7'];

  let objs,gapLeft,rowN,lastPat,t,time=0,dist,v,plane,lane,jy,vy,sl,pend,hearts,inv,over,started,coins,total=0,shake,parts,deadT,lastTxt;
  try{total=+localStorage.getItem('lane-coins')||0}catch(e){}
  // scenery made once
  const city=[];for(let i=0;i<16;i++){const w=22+rnd(26),h=30+rnd(95),wins=[];for(let k=0;k<w*h/90;k++)wins.push([3+rnd(w-8),4+rnd(Math.max(1,h-10)),Math.random()<.55]);city.push({x:i*24-10,w,h,wins})}

  function reset(){
    objs=[];gapLeft=0;rowN=0;lastPat='';t=0;dist=0;v=13;plane=lane=1;jy=vy=sl=0;pend=false;hearts=2;inv=0;over=false;started=false;coins=0;shake=0;parts=[];deadT=0;lastTxt='';
    hud();
  }
  const score=()=>Math.floor(dist/2)+coins*5;
  function hud(){
    const s=over?`Busted! ${score()} points, ${coins} coins. Best ${best('lanes',score())}. Tap or press Enter.`
      :started?`${score()} pts   ${coins} coins   Total coins ${total}`
      :'Tap or press any key to start. Swipe or arrows: left, right, Up jump, Down slide.';
    if(s!==lastTxt){lastTxt=s;st(s)}
  }

  /* ---------- level generation ---------- */
  function coinLine(l,n,d0,air){for(let i=0;i<n;i++)objs.push({k:'coin',lane:l,d:d0+i*2.2,len:0,air:air?1:0})}
  function coinArc(l,d){for(let i=-1;i<=1;i++)objs.push({k:'coin',lane:l,d:d+i*1.6,len:0,air:1})}
  function spawnRow(){
    const lv=Math.min(1,t/100),d=DMAX;let len=1.2,pat;
    const easy=rowN<3;
    const pool=easy?[['coins',30],['bar',20]]
      :[['coins',22],['bar',24],['over',18],['train',lv<.05?0:24],['mix',lv<.3?0:16]];
    let tot=pool.reduce((a,b)=>a+b[1],0),r=Math.random()*tot;
    pat=pool[0][0];for(const[k,w]of pool){if(r<w){pat=k;break}r-=w}
    if(pat==lastPat&&pat!='coins')pat='coins';
    lastPat=pat;rowN++;
    const free=rnd(3);
    if(pat=='coins'){
      const l=rnd(3);coinLine(l,6,d);len=13;
      if(lv>.3&&Math.random()<.5){coinLine((l+1+rnd(2))%3,5,d+3)}
    }else if(pat=='bar'||pat=='over'){
      const ls=[0,1,2].filter(l=>lv<.3?l!=free:Math.random()<.8);
      const use=ls.length?ls:[0];
      use.forEach(l=>objs.push({k:pat,lane:l,d,len:1.2}));
      if(pat=='bar')coinArc(use[rnd(use.length)],d+1);
      else coinLine(free,5,d-3);
    }else if(pat=='train'||pat=='mix'){
      len=R(15,25);
      const two=lv>.35&&Math.random()<.45&&pat=='train';
      const tl=two?[0,1,2].filter(l=>l!=free):[rnd(3)];
      tl.forEach(l=>objs.push({k:'train',lane:l,d,len,col:TRAIN[rnd(4)],horn:0}));
      const open=[0,1,2].filter(l=>!tl.includes(l));
      if(pat=='mix'){const b=open[rnd(open.length)];objs.push({k:Math.random()<.5?'bar':'over',lane:b,d:d+2,len:1.2});
        const c2=open.find(l=>l!=b);if(c2!=null)coinLine(c2,6,d)}
      else if(open.length)coinLine(open[rnd(open.length)],6,d+2);
    }
    gapLeft=len+v*(1.3-.5*lv);
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
    for(let i=0;i<12;i++)parts.push({x:X((plane-1)*LW,0),y:Y0-30-jy,vx:R(-120,120),vy:R(-220,40),life:R(.4,.8),col:['#ffd21f','#e63027','#fff'][rnd(3)]});
    if(hearts<=0){over=true;deadT=0;sfx('lose')}
  }
  function update(dt){
    time+=dt;
    parts=parts.filter(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=500*dt;q.life-=dt;return q.life>0});
    if(shake>0)shake-=dt;
    if(over){deadT+=dt;hud();return}
    if(!started){hud();return}
    v=13+Math.min(15,t*.15);t+=dt;dist+=v*dt;
    gapLeft-=v*dt;if(gapLeft<=0)spawnRow();
    objs.forEach(o=>{o.d-=v*dt});
    objs=objs.filter(o=>o.d+o.len>-6);
    plane+=clamp(lane-plane,-9*dt,9*dt);
    if(jy>0||vy>0){jy+=vy*dt;vy-=1800*dt;if(jy<=0){jy=0;vy=0;if(pend){sl=.7;pend=false}}}
    if(sl>0)sl-=dt;
    if(inv>0)inv-=dt;
    for(const o of objs){
      if(o.k=='train'&&!o.horn&&o.d<42){o.horn=1;sfx('train')}
      if(o.k=='coin'){
        if(Math.abs(plane-o.lane)<.6&&Math.abs(o.d)<1.1){o.gone=1;coins++;total++;sfx('coin');try{localStorage.setItem('lane-coins',total)}catch(e){}
          parts.push({x:X((o.lane-1)*LW,0),y:Y0-40,vx:0,vy:-120,life:.4,col:'#ffd21f'})}
        continue;
      }
      if(o.hit||inv>0)continue;
      if(Math.abs(plane-o.lane)<.5&&o.d<.8&&o.d+o.len>-.8){
        if(o.k=='train')hit(o);
        else if(o.k=='bar'&&jy<32)hit(o);
        else if(o.k=='over'&&!(sl>0&&jy==0))hit(o);
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
    x.fillStyle=front;x.fillRect(X(x0,dn),gN-z1*sN,(x1-x0)*sN,(z1-z0)*sN);
    return{l:X(x0,dn),t:gN-z1*sN,w:(x1-x0)*sN,h:(z1-z0)*sN,s:sN,g:gN};
  }
  function fade(d){return d>DMAX-10?clamp((DMAX-d)/10,0,1):1}
  function drawObj(o){
    x.globalAlpha=fade(o.d);
    const cx=(o.lane-1)*LW,x0=cx-LW*.42,x1=cx+LW*.42;
    if(o.k=='train'){
      const b=block(x0,x1,o.d,o.len,0,92,shade(o.col,-.1),shade('#cfd6e4',0),shade('#6c748a',0));
      if(b){
        x.fillStyle='#10131c';x.fillRect(b.l+b.w*.12,b.t+b.h*.12,b.w*.76,b.h*.3);
        x.fillStyle='#fde68a';x.beginPath();x.arc(b.l+b.w*.2,b.t+b.h*.72,b.w*.07,0,7);x.arc(b.l+b.w*.8,b.t+b.h*.72,b.w*.07,0,7);x.fill();
        x.fillStyle=shade(o.col,-.35);x.fillRect(b.l,b.t+b.h*.52,b.w,b.h*.08);
      }
    }else if(o.k=='bar'){
      const b=block(x0,x1,o.d,o.len,0,28,'#e63027','#ff9a92','#a81d17');
      if(b){x.fillStyle='#fff';for(let i=0;i<6;i+=2)x.fillRect(b.l+b.w*i/6,b.t,b.w/6,b.h)}
    }else if(o.k=='over'){
      block(x0,x0+9,o.d,o.len,0,100,'#8d93a3','#c3c8d4','#5d6372');
      block(x1-9,x1,o.d,o.len,0,100,'#8d93a3','#c3c8d4','#5d6372');
      const b=block(x0,x1,o.d,o.len,48,74,'#ffd21f','#fff3a0','#b8960f');
      if(b){x.fillStyle='#17171a';for(let i=0;i<8;i+=2)x.fillRect(b.l+b.w*i/8,b.t,b.w/8,b.h)}
    }else{
      const s=Sc(o.d),cxp=X(cx,o.d),cy=gy(o.d)-(o.air?62:24)*s,w=Math.abs(Math.cos(time*5+o.d))*9*s+2*s;
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
    for(const o of objs)if(o.k=='train'&&o.d<48&&o.d>5&&Math.floor(time*5)%2==0){
      const px=X((o.lane-1)*LW,12),py=236;
      poly([px,py-16,px+16,py+12,px-16,py+12],'#e63027');
      x.fillStyle='#fff';x.font='bold 17px system-ui';x.textAlign='center';x.fillText('!',px,py+10);
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
    const list=objs.filter(o=>o.d>-3.5||o.k=='train').sort((a,b)=>b.d-a.d);
    let drew=false;
    const pl=()=>{drew=true;
      if(inv>0&&Math.floor(time*14)%2==0&&!over)return;
      runner(X((plane-1)*LW,0),Y0,jy,sl>0&&jy==0,time*(started&&!over?13:4),jy>0)};
    for(const o of list){if(!drew&&o.d<0)pl();drawObj(o)}
    if(!drew)pl();
    warns();
    parts.forEach(q=>{x.globalAlpha=clamp(q.life*2,0,1);x.fillStyle=q.col;x.fillRect(q.x-2,q.y-2,4,4)});x.globalAlpha=1;
    x.restore();
    text(String(score()),14,44,38,'#fff','left');
    x.font='26px system-ui';x.textAlign='right';x.fillStyle='#e63027';x.fillText('♥'.repeat(Math.max(0,hearts)),W-12,40);
    x.fillStyle='#ffd21f';x.beginPath();x.arc(W-90,70,8,0,7);x.fill();text(String(coins),W-12,78,24,'#fff','right');
    if(!started){x.fillStyle='#0008';x.fillRect(0,H/2-80,W,150);text('SUBWAY RUSH',W/2,H/2-20,42,'#ffd21f');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Tap or press any key to start',W/2,H/2+14);x.fillText('Swipe or arrows: move, jump, slide',W/2,H/2+38)}
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
