// Step 3: Flappy Pizza and Brick Breaker rebuilt to the Road Hop standard.
// Both use the shared helpers from retouch.js (hd, gloop, fx, bang, rr, bannerT).
// Flappy Pizza: chimneys, day to night sky, coins, 6 pizza skins to unlock, medals.
// Brick Breaker: 6 hand-made layouts, tough / metal / bomb bricks, power-ups, lasers, multiball, combos.

const CL=(v,a,b)=>Math.max(a,Math.min(b,v));
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mixC=(a,b,f)=>{const A=hexRGB(a),B=hexRGB(b);return`rgb(${A.map((q,i)=>Math.round(q+(B[i]-q)*f)).join(',')})`};
const hash1=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const strokeText=(x,t,px,py,sz,fill,al='center',font='Impact,"Arial Black",sans-serif')=>{x.textAlign=al;x.font=`${sz}px ${font}`;x.lineJoin='round';x.lineWidth=Math.max(3,sz/6);x.strokeStyle='#0b1020';x.strokeText(t,px,py);x.fillStyle=fill;x.fillText(t,px,py)};
const pill=(x,px,py,w,h,col,label,sz=15)=>{x.fillStyle='#0b1020';rr(x,px-2,py-2,w+4,h+4,h/2+2);x.fill();x.fillStyle=col;rr(x,px,py,w,h,h/2);x.fill();x.fillStyle='#ffffff55';rr(x,px+4,py+3,w-8,h/3,h/6);x.fill();strokeText(x,label,px+w/2,py+h/2+sz*.35,sz,'#fff')};

/* ============================ Flappy Pizza ============================ */
function flappy(el){
  const W=320,H=480,GY=H-44,[c,x]=hd(el,W,H,1.25);
  const SK=[
    {n:'Pepperoni',a:'#f2c14e',b:'#d62f27',cost:0},{n:'Cheese',a:'#ffe27a',b:'#fff4c2',cost:20},
    {n:'Veggie',a:'#f2c14e',b:'#35a853',cost:40},{n:'Supreme',a:'#e8b04a',b:'#7a3b12',cost:70},
    {n:'Hawaiian',a:'#f6d365',b:'#ffe94d',cost:100,sq:1},{n:'Golden',a:'#ffd700',b:'#ff9f1a',cost:200,gold:1}];
  const sv=saveGet('flappy-save',{coins:0,own:[0],sel:0});
  const save=()=>savePut('flappy-save',sv);
  let scr='menu',y=210,v=0,ps=[],sc=0,run=0,tm=0,bgx=0,gx=0,rot=0,wing=0,parts=[],smoke=[],flash=0,shake=0,overT=0,newBest=false,made=0,spawnT=0,note='',noteT=0;
  const cl=[...Array(4)].map((_,i)=>({x:i*100,y:50+hash1(i)*150,s:.7+hash1(i+9)*.7}));
  const PAL=[['#4fb3ff','#cdeeff'],['#ff7e5f','#ffd9a0'],['#0f1838','#3d3b78']];
  const sky=()=>{const ph=sc/10,i=Math.floor(ph)%3,f=ph-Math.floor(ph),e=f*f*(3-2*f);return{top:mixC(PAL[i][0],PAL[(i+1)%3][0],e),bot:mixC(PAL[i][1],PAL[(i+1)%3][1],e),night:i==1?e:i==2?1-e:0}};
  const medal=s=>s>=100?['Platinum','#b9f2ff']:s>=50?['Gold','#ffd21f']:s>=25?['Silver','#d0d6e0']:s>=10?['Bronze','#cd7f32']:null;
  const owned=i=>sv.own.includes(i);
  function say(s){note=s;noteT=1.4}
  function begin(){scr='play';y=200;v=-330;ps=[];sc=0;run=0;tm=0;rot=0;made=0;parts=[];smoke=[];newBest=false;st('Score 0')}
  function die(){if(scr!='play')return;scr='over';overT=0;flash=.25;shake=.3;fx('crash');bang(parts,80,y,SK[sv.sel].a,24,220);
    newBest=sc>0&&sc>(+localStorage.getItem('best-flappy')||0);const b=best('flappy',sc);save();st(`Game over: ${sc}. Best ${b}. Tap to retry.`)}
  function flap(){
    if(scr=='menu'){if(!owned(sv.sel)){buy();return}begin();return}
    if(scr=='over'){if(overT>.45)begin();return}
    v=-370;fx('hop');wing=1;for(let i=0;i<3;i++)parts.push({x:70,y:y+8,vx:-40-Math.random()*50,vy:20+Math.random()*40,t:0,l:.35,c:'#ffffffaa'})}
  function buy(){const k=SK[sv.sel];if(sv.coins>=k.cost){sv.coins-=k.cost;sv.own.push(sv.sel);save();fx('win');say('Unlocked '+k.n+'!')}else{fx('lose');say('Need '+(k.cost-sv.coins)+' more coins')}}
  function pick(d){sv.sel=(sv.sel+d+SK.length)%SK.length;fx('click');save()}
  function spawn(){const gap=Math.max(116,152-sc*.9),m=gap/2+46;
    ps.push({x:W+30,g:m+Math.random()*(GY-2*m),gap,amp:sc>=12?Math.min(34,(sc-10)*2.2):0,ph:Math.random()*6,s:0,coin:made%3==2?1:0,cy:0});made++}
  function circleRect(cx,cy,r,rx,ry,rw,rh){const nx=CL(cx,rx,rx+rw),ny=CL(cy,ry,ry+rh);return(cx-nx)**2+(cy-ny)**2<r*r}
  const upd=dt=>{
    bangUpd(parts,dt);smoke.forEach(q=>{q.t+=dt;q.x+=q.vx*dt;q.y-=22*dt});smoke=smoke.filter(q=>q.t<q.l);
    flash=Math.max(0,flash-dt);shake=Math.max(0,shake-dt);noteT=Math.max(0,noteT-dt);wing=Math.max(0,wing-dt*4);
    cl.forEach(q=>{q.x-=10*q.s*dt;if(q.x<-70){q.x=W+50;q.y=40+Math.random()*160}});
    if(scr=='menu'){y=215+Math.sin(performance.now()/260)*8;rot=0;gx=(gx+40*dt)%24;bgx+=30*dt;return}
    if(scr=='over'){overT+=dt;v+=1400*dt;y=Math.min(GY-12,y+v*dt);rot=Math.min(1.6,rot+dt*5);return}
    tm+=dt;const sp=144+Math.min(sc,30)*1.4;
    v+=1350*dt;y+=v*dt;rot=CL(v/500,-.5,1.2);gx=(gx+sp*dt)%24;bgx+=sp*dt;
    if(!ps.length||ps[ps.length-1].x<W-170)spawn();
    for(const p of ps){p.x-=sp*dt;p.cy=p.g+Math.sin(tm*1.6+p.ph)*p.amp;
      if(p.x<W&&Math.random()<dt*3)smoke.push({x:p.x+26,y:p.cy+p.gap/2-18,vx:6+Math.random()*10,t:0,l:.9+Math.random()*.5});
      const tb=p.cy-p.gap/2,bt=p.cy+p.gap/2;
      if(p.x<110&&p.x>-60&&(circleRect(80,y,11,p.x,0,52,tb)||circleRect(80,y,11,p.x-4,tb-20,60,20)||circleRect(80,y,11,p.x,bt,52,GY-bt)||circleRect(80,y,11,p.x-4,bt,60,20)))die();
      if(!p.s&&p.x+52<80){p.s=1;sc++;fx('coin');st('Score '+sc);if(sc==10||sc==25||sc==50||sc==100)say(medal(sc)[0]+' pace!')}
      if(p.coin&&Math.hypot(80-(p.x+26),y-p.cy)<20){p.coin=0;sv.coins++;save();fx('coin');bang(parts,p.x+26,p.cy,'#ffd21f',10,120)}}
    ps=ps.filter(p=>p.x>-70);
    if(y<12||y>GY-12){y=CL(y,12,GY-12);die()}
  };
  function brick(px,top,h,flip){
    x.fillStyle='#b5532f';x.fillRect(px,top,52,h);
    x.fillStyle='#8f3c20';for(let r=0;r*12<h;r++){const yy=flip?top+h-(r+1)*12:top+r*12;x.fillRect(px,yy,52,2);const o=r%2?0:13;for(let q=o;q<52;q+=26)x.fillRect(px+q,yy,2,12)}
    x.fillStyle='#ffffff22';x.fillRect(px+2,top,5,h);x.fillStyle='#0003';x.fillRect(px+45,top,7,h);
    const cy=flip?top+h-20:top;x.fillStyle='#7d3418';x.fillRect(px-5,cy,62,20);x.fillStyle='#a9482a';x.fillRect(px-5,cy,62,6);
    x.strokeStyle='#2a0f08';x.lineWidth=2;x.strokeRect(px,top,52,h);x.strokeRect(px-5,cy,62,20)}
  function pizza(px,py,r,k,spin){
    x.save();x.translate(px,py);x.rotate(spin);
    x.fillStyle='#c98a2b';x.beginPath();x.arc(0,0,r,0,7);x.fill();x.strokeStyle='#7a4f12';x.lineWidth=2;x.stroke();
    x.fillStyle=k.a;x.beginPath();x.arc(0,0,r-3.5,0,7);x.fill();
    x.fillStyle=k.b;[[-5,-4],[4,-2],[-1,5],[5,6]].forEach(d=>{if(k.sq)x.fillRect(d[0]-2.5,d[1]-2.5,5,5);else{x.beginPath();x.arc(d[0],d[1],2.8,0,7);x.fill()}});
    if(k.gold){x.fillStyle='#ffffff88';x.beginPath();x.ellipse(-4,-6,5,2.5,-.6,0,7);x.fill()}
    x.restore();
    x.fillStyle='#fff';x.beginPath();x.arc(px+6,py-5,4.2,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(px+7.2,py-5,2,0,7);x.fill();
    x.fillStyle='#fffffff0';x.strokeStyle='#9bb';x.lineWidth=1;const wy=py+3-(wing>0?7*wing:0);x.beginPath();x.ellipse(px-8,wy,7,4,-.5,0,7);x.fill();x.stroke()}
  function draw(){
    x.save();if(shake>0)x.translate((Math.random()-.5)*7,(Math.random()-.5)*7);
    const S=sky(),g=x.createLinearGradient(0,0,0,GY);g.addColorStop(0,S.top);g.addColorStop(1,S.bot);x.fillStyle=g;x.fillRect(-10,-10,W+20,H+20);
    if(S.night>0){x.fillStyle='#fff';for(let i=0;i<40;i++){x.globalAlpha=S.night*(.4+.6*Math.abs(Math.sin(performance.now()/700+i)));x.fillRect(hash1(i)*W,hash1(i+60)*(GY-120),i%5?1.5:2.5,i%5?1.5:2.5)}x.globalAlpha=S.night;x.fillStyle='#f5f1d8';x.beginPath();x.arc(250,70,16,0,7);x.fill();x.fillStyle=S.top;x.beginPath();x.arc(256,66,14,0,7);x.fill();x.globalAlpha=1}
    x.globalAlpha=1-S.night;x.fillStyle='#fff7c2';x.beginPath();x.arc(248,74,22,0,7);x.fill();x.globalAlpha=1;
    x.fillStyle=`rgba(255,255,255,${.85-S.night*.6})`;cl.forEach(q=>{x.beginPath();x.ellipse(q.x,q.y,30*q.s,11*q.s,0,0,7);x.ellipse(q.x+14*q.s,q.y-6*q.s,18*q.s,10*q.s,0,0,7);x.fill()});
    for(const[par,col,bw,h0,h1]of[[.12,'#1e2f58',42,50,120],[.3,'#142446',54,36,90]]){
      x.globalAlpha=.55;x.fillStyle=col;const i0=Math.floor(bgx*par/bw)-1;
      for(let i=i0;i<i0+W/bw+3;i++){const bx=i*bw-bgx*par,bh=h0+hash1(i*3+bw)*(h1-h0);x.fillRect(bx,GY-bh,bw-4,bh);
        if(S.night>.3){x.fillStyle='#ffd86b';x.globalAlpha=S.night*.7;for(let r=0;r<bh-10;r+=14)for(let q=6;q<bw-12;q+=12)if(hash1(i*50+r+q)>.55)x.fillRect(bx+q,GY-bh+r+6,4,5);x.fillStyle=col;x.globalAlpha=.55}}
      x.globalAlpha=1}
    for(const q of smoke){x.globalAlpha=.4*(1-q.t/q.l);x.fillStyle='#e5e7eb';x.beginPath();x.arc(q.x,q.y,4+q.t*7,0,7);x.fill()}x.globalAlpha=1;
    for(const p of ps){const tb=p.cy-p.gap/2,bt=p.cy+p.gap/2;brick(p.x,0,tb,1);brick(p.x,bt,GY-bt,0);
      if(p.coin){const sw=Math.max(.25,Math.abs(Math.cos(tm*5+p.ph)));x.fillStyle='#0b1020';x.beginPath();x.ellipse(p.x+26,p.cy,10*sw+2,12,0,0,7);x.fill();x.fillStyle='#ffc933';x.beginPath();x.ellipse(p.x+26,p.cy,10*sw,10,0,0,7);x.fill();x.fillStyle='#ffe58a';x.beginPath();x.ellipse(p.x+26,p.cy,5*sw,5.5,0,0,7);x.fill()}}
    x.fillStyle='#d8c27a';x.fillRect(0,GY,W,44);x.fillStyle='#7ec850';x.fillRect(0,GY,W,9);x.fillStyle='#5fa23c';for(let i=-1;i<W/24+1;i++)x.fillRect(i*24-gx,GY,12,9);x.fillStyle='#0003';x.fillRect(0,GY+9,W,3);
    bangDrw(x,parts);
    pizza(80+(scr=='menu'?W/2-80:0),y,13,SK[sv.sel],scr=='menu'?0:rot);
    x.restore();
    if(scr=='play')strokeText(x,sc,W/2,64,44,'#fff');
    // coin counter
    x.fillStyle='#0b1020';x.beginPath();x.arc(W-22,22,11,0,7);x.fill();x.fillStyle='#ffc933';x.beginPath();x.arc(W-22,22,8.5,0,7);x.fill();strokeText(x,sv.coins,W-38,29,20,'#fff','right');
    if(scr=='menu'){
      strokeText(x,'FLAPPY PIZZA',W/2,110,40,'#ffd21f');
      for(const d of[-1,1]){const ax=W/2+d*92;x.fillStyle='#0b1020';x.beginPath();x.moveTo(ax-d*14,215-22);x.lineTo(ax+d*14,215);x.lineTo(ax-d*14,215+22);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(ax-d*9,215-15);x.lineTo(ax+d*8,215);x.lineTo(ax-d*9,215+15);x.fill()}
      const k=SK[sv.sel];strokeText(x,k.n,W/2,268,22,'#fff');
      if(owned(sv.sel))pill(x,W/2-80,290,160,40,'#22c55e','TAP TO PLAY');else pill(x,W/2-90,290,180,40,sv.coins>=k.cost?'#f59e0b':'#6b7280','Unlock  '+k.cost+' coins',16);
      strokeText(x,'Best '+(+localStorage.getItem('best-flappy')||0),W/2,366,20,'#fff');
      strokeText(x,'Collect coins to unlock new pizzas',W/2,392,13,'#fff','center','system-ui');
    }
    if(scr=='over'&&overT>.3){
      x.fillStyle='#000a';x.fillRect(0,0,W,H);x.fillStyle='#fff4d6';rr(x,40,110,W-80,250,16);x.fill();x.strokeStyle='#0b1020';x.lineWidth=4;x.stroke();
      strokeText(x,'GAME OVER',W/2,152,34,'#e63027');
      const m=medal(sc);x.fillStyle='#0b1020';x.beginPath();x.arc(100,222,30,0,7);x.fill();x.fillStyle=m?m[1]:'#c9c2ae';x.beginPath();x.arc(100,222,26,0,7);x.fill();strokeText(x,m?m[0][0]:'-',100,232,28,'#fff');
      x.textAlign='left';x.font='16px system-ui';x.fillStyle='#3a2a10';x.fillText('Score',150,208);x.fillText('Best',150,240);
      strokeText(x,sc,W-60,210,26,'#fff','right');strokeText(x,+localStorage.getItem('best-flappy')||0,W-60,242,26,'#fff','right');
      if(newBest)strokeText(x,'NEW BEST!',W/2,276,20,'#ffd21f');
      pill(x,56,300,100,40,'#22c55e','Retry');pill(x,W-156,300,100,40,'#6366f1','Skins');
    }
    if(noteT>0){x.globalAlpha=CL(noteT,0,1);strokeText(x,note,W/2,170,20,'#ffd21f');x.globalAlpha=1}
    if(flash>0){x.fillStyle=`rgba(255,255,255,${flash*3})`;x.fillRect(0,0,W,H)}
  }
  on(document,'keydown',e=>{
    const n=e.key;
    if(n==' '||n=='ArrowUp'||n=='w'||n=='Enter'){e.preventDefault();if(!e.repeat)flap()}
    else if(scr=='menu'&&(n=='ArrowLeft'||n=='a'))pick(-1);else if(scr=='menu'&&(n=='ArrowRight'||n=='d'))pick(1);
    else if(scr=='over'&&(n=='s'||n=='S')&&overT>.3){scr='menu'}});
  on(c,'pointerdown',e=>{
    e.preventDefault();const r=c.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*W,my=(e.clientY-r.top)/r.height*H;
    if(scr=='menu'){
      if(my>180&&my<250&&mx<W/2-50){pick(-1);return}if(my>180&&my<250&&mx>W/2+50){pick(1);return}
      if(my>285&&my<335&&!owned(sv.sel)){if(mx>W/2-95&&mx<W/2+95)buy();return}
      if(!owned(sv.sel))return;begin();return}
    if(scr=='over'){if(overT<.45)return;if(my>295&&my<345&&mx>W-160&&mx<W-50){scr='menu';return}begin();return}
    flap()});
  return gloop(upd,draw);
}

/* ============================ Brick Breaker ============================ */
function breakout(el){
  const W=480,H=400,BW=44,BH=18,[c,x]=hd(el,W,H,1.3),k={};
  // layouts: 1/2/3 = hit points, M = metal (cannot be broken), B = bomb (breaks its neighbours too)
  const PAT=[
    ['1111111111','1111111111','1111111111','1111111111'],
    ['....11....','...1111...','..222222..','.11111111.','1111111111'],
    ['1.1.1.1.1.','.1.1.1.1.1','1.1.1.1.1.','.2.2.2.2.2'],
    ['M........M','M.222222.M','M.211112.M','M.222222.M'],
    ['1111111111','1B11B11B11','1111111111','11B11B11B1','1111111111'],
    ['2..2222..2','.22.22.22.','2222222222','2.222222.2','2M2.22.2M2','.........2']
  ];
  const sv=saveGet('brick-save',{stars:0});
  let px,pw,br,balls,items,bolts,parts,flash,sc,lives,lv,over,combo,comboT,t,pow,clearT,msg,msgT,shake;
  const stars=[...Array(50)].map((_,i)=>({x:hash1(i)*W,y:hash1(i+70)*H,s:hash1(i+130)*1.6+.4}));
  const POW={W:{col:'#22c55e',n:'WIDE',d:14},M:{col:'#22d3ee',n:'MULTI',d:0},S:{col:'#60a5fa',n:'SLOW',d:12},L:{col:'#ef4444',n:'LASER',d:10},H:{col:'#f472b6',n:'LIFE',d:0}};
  const spd=()=>Math.min(300+lv*20,500);
  function build(){
    const p=PAT[lv%PAT.length],extra=Math.floor(lv/PAT.length);br=[];
    p.forEach((row,r)=>{for(let i=0;i<10;i++){const ch=row[i];if(ch=='.')continue;
      const b={x:i*48+4,y:50+r*22,hue:(lv*40+r*28+i*3)%360,on:1,hp:1,metal:0,bomb:0,i,r};
      if(ch=='M')b.metal=1;else if(ch=='B'){b.bomb=1}else b.hp=Math.min(4,+ch+(extra>0&&r<2?1:0));br.push(b)}});
  }
  function serve(){pw=pow&&pow.W>0?120:80;balls=[{x:px,y:H-40,vx:0,vy:0,stuck:1,trail:[]}];items=[];bolts=[];combo=0}
  function reset(){px=W/2;sc=0;lives=3;lv=0;over=0;parts=[];flash=0;shake=0;t=0;clearT=0;msg='';msgT=0;pow={W:0,S:0,L:0,cd:0};build();serve()}
  function launch(){
    if(over){reset();return}
    const b=balls.find(q=>q.stuck);if(b){b.stuck=0;const a=(Math.random()-.5)*.7,s=spd();b.vx=Math.sin(a)*s;b.vy=-Math.cos(a)*s;fx('hop');return}
    if(pow.L>0&&pow.cd<=0&&clearT<=0){pow.cd=.28;bolts.push({x:px-pw/2+8,y:H-34},{x:px+pw/2-8,y:H-34});fx('click')}}
  function say(s){msg=s;msgT=1.4}
  function dmg(b,n=1){
    if(b.metal)return false;b.hp-=n;
    if(b.hp>0){fx('click');return false}
    b.on=0;sc+=10*Math.min(combo+1,8);fx('coin');bang(parts,b.x+22,b.y+9,`hsl(${b.hue} 80% 60%)`,9,160);
    if(b.bomb){fx('bump');shake=.18;bang(parts,b.x+22,b.y+9,'#ffb347',18,260);
      for(const o of br)if(o.on&&o!==b&&Math.abs(o.i-b.i)<=1&&Math.abs(o.r-b.r)<=1)dmg(o,2)}
    else if(Math.random()<.17){const ks=Object.keys(POW);items.push({x:b.x+22,y:b.y+9,k:ks[rnd(ks.length)]})}
    return true}
  function take(k){
    fx('win');const P=POW[k];say(P.n+'!');
    if(k=='W'){pow.W=P.d;pw=120}else if(k=='S')pow.S=P.d;else if(k=='L')pow.L=P.d;
    else if(k=='H')lives=Math.min(5,lives+1);
    else if(k=='M'){const a=balls.filter(q=>!q.stuck);if(a.length)for(let i=0;i<2;i++){const q=a[i%a.length],s=Math.hypot(q.vx,q.vy),an=Math.atan2(q.vx,-q.vy)+(i?.5:-.5);balls.push({x:q.x,y:q.y,vx:Math.sin(an)*s,vy:-Math.cos(an)*s,stuck:0,trail:[]})}}}
  const upd=dt=>{
    bangUpd(parts,dt);flash=Math.max(0,flash-dt);shake=Math.max(0,shake-dt);msgT=Math.max(0,msgT-dt);t+=dt;if(over)return;
    if(clearT>0){clearT-=dt;if(clearT<=0){lv++;build();serve();pow.W=pow.S=pow.L=0}return}
    const mv=((k.arrowright||k.d?1:0)-(k.arrowleft||k.a?1:0))*440*dt;px=CL(px+mv,pw/2,W-pw/2);
    pow.cd-=dt;['W','S','L'].forEach(q=>{if(pow[q]>0){pow[q]-=dt;if(pow[q]<=0&&q=='W')pw=80}});
    pw=pow.W>0?Math.min(120,pw+240*dt):Math.max(80,pw-240*dt);
    for(const b of balls){
      if(b.stuck){b.x=px;b.y=H-40;continue}
      const steps=4;for(let n=0;n<steps;n++){const d=dt/steps*(pow.S>0?.72:1);b.x+=b.vx*d;b.y+=b.vy*d;
        if(b.x<6){b.x=6;b.vx=Math.abs(b.vx)}if(b.x>W-6){b.x=W-6;b.vx=-Math.abs(b.vx)}if(b.y<6){b.y=6;b.vy=Math.abs(b.vy)}
        if(b.vy>0&&b.y>H-34&&b.y<H-16&&Math.abs(b.x-px)<pw/2+6){
          const f=CL((b.x-px)/(pw/2),-1,1),a=f*1.05,s=spd();b.vx=Math.sin(a)*s;b.vy=-Math.cos(a)*s;b.y=H-34;fx('bump');combo=0}
        for(const o of br){if(!o.on)continue;
          if(b.x>o.x-6&&b.x<o.x+BW+6&&b.y>o.y-6&&b.y<o.y+BH+6){
            const ox=Math.min(b.x-(o.x-6),o.x+BW+6-b.x),oy=Math.min(b.y-(o.y-6),o.y+BH+6-b.y);if(ox<oy)b.vx=-b.vx;else b.vy=-b.vy;
            if(o.metal){fx('click');bang(parts,b.x,b.y,'#cfd6e4',4,90)}else{dmg(o);combo++}
            break}}}
      b.trail.push([b.x,b.y]);if(b.trail.length>9)b.trail.shift();
      if(Math.abs(b.vy)<90)b.vy=b.vy<0?-90:90}
    balls=balls.filter(b=>b.y<=H+10);
    for(const q of bolts){q.y-=560*dt;for(const o of br){if(o.on&&q.x>o.x&&q.x<o.x+BW&&q.y>o.y&&q.y<o.y+BH){q.y=-99;if(!o.metal)dmg(o);else fx('click');break}}}
    bolts=bolts.filter(q=>q.y>0);
    for(const it of items){it.y+=95*dt;if(it.y>H-34&&it.y<H-12&&Math.abs(it.x-px)<pw/2+10){it.y=H+99;take(it.k)}}
    items=items.filter(it=>it.y<H+20);
    if(!balls.length){lives--;fx('lose');flash=.25;combo=0;pow.W=pow.S=pow.L=0;if(lives<0){over=1;const b=best('breakout',sc);if(sc>sv.stars)sv.stars=sc;savePut('brick-save',sv);st(`Game over: ${sc}. Best ${b}. Click to retry.`)}else serve()}
    if(!br.some(b=>b.on&&!b.metal)){clearT=1.6;fx('win');sc+=100*(lv+1);bang(parts,W/2,H/2,'#ffd21f',40,320)}
    if(!over)st(`Score ${sc}   Lives ${Math.max(0,lives)}   Level ${lv+1}${combo>2?'   Combo x'+Math.min(combo,8):''}`)};
  function brickDraw(o){
    const h=o.hue;
    if(o.metal){x.fillStyle='#8b93a6';rr(x,o.x,o.y,BW,BH,4);x.fill();x.fillStyle='#c9d0de';x.fillRect(o.x+3,o.y+2,BW-6,4);x.fillStyle='#4b5163';[6,BW-8].forEach(d=>x.fillRect(o.x+d,o.y+BH-7,3,3));return}
    const l=o.bomb?30:o.hp>=3?36:o.hp==2?46:58;x.fillStyle=o.bomb?'#7a1d1d':`hsl(${h} 78% ${l}%)`;rr(x,o.x,o.y,BW,BH,4);x.fill();
    x.fillStyle='#ffffff40';x.fillRect(o.x+3,o.y+2,BW-6,4);x.fillStyle='#00000030';x.fillRect(o.x+2,o.y+BH-4,BW-4,3);
    if(o.hp>1){x.strokeStyle='#fffb';x.lineWidth=1.5;for(let q=1;q<o.hp;q++){x.beginPath();x.moveTo(o.x+8,o.y+BH-3-q*4);x.lineTo(o.x+BW-8,o.y+BH-3-q*4);x.stroke()}}
    if(o.bomb){x.fillStyle='#ffb347';x.beginPath();x.arc(o.x+BW/2,o.y+BH/2+1,5,0,7);x.fill();x.strokeStyle='#ffb347';x.lineWidth=2;x.beginPath();x.moveTo(o.x+BW/2+2,o.y+BH/2-3);x.lineTo(o.x+BW/2+6,o.y+BH/2-7);x.stroke()}}
  function draw(){
    x.save();if(shake>0)x.translate((Math.random()-.5)*6,(Math.random()-.5)*6);
    const hb=(lv*40)%360,g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,`hsl(${hb+240} 55% 14%)`);g.addColorStop(1,`hsl(${hb+260} 60% 7%)`);x.fillStyle=g;x.fillRect(-8,-8,W+16,H+16);
    stars.forEach(s=>{x.globalAlpha=.3+.4*Math.abs(Math.sin(t*s.s+s.x));x.fillStyle='#fff';x.fillRect(s.x,(s.y+t*s.s*6)%H,s.s,s.s)});x.globalAlpha=1;
    br.forEach(o=>{if(o.on)brickDraw(o)});bangDrw(x,parts);
    items.forEach(it=>{const P=POW[it.k];x.fillStyle='#0b1020';rr(x,it.x-13,it.y-8,26,16,8);x.fill();x.fillStyle=P.col;rr(x,it.x-11,it.y-6,22,12,6);x.fill();strokeText(x,it.k=='H'?'\u2665':it.k,it.x,it.y+4,11,'#fff','center','system-ui')});
    x.fillStyle='#ff6b6b';bolts.forEach(q=>x.fillRect(q.x-1.5,q.y,3,12));
    // paddle
    x.shadowColor='#38e8ff';x.shadowBlur=pow.L>0?16:8;x.fillStyle='#e8ecf6';rr(x,px-pw/2,H-28,pw,11,5);x.fill();x.shadowBlur=0;x.fillStyle='#38e8ff';x.fillRect(px-pw/2+7,H-25,pw-14,2.5);
    if(pow.L>0){x.fillStyle='#ef4444';x.fillRect(px-pw/2+4,H-33,7,6);x.fillRect(px+pw/2-11,H-33,7,6)}
    balls.forEach(b=>{b.trail.forEach((q,i)=>{x.globalAlpha=i/b.trail.length*.35;x.fillStyle='#ffd21f';x.beginPath();x.arc(q[0],q[1],6*i/b.trail.length,0,7);x.fill()});x.globalAlpha=1;
      x.fillStyle='#ffe066';x.shadowColor='#ffd21f';x.shadowBlur=12;x.beginPath();x.arc(b.x,b.y,6,0,7);x.fill();x.shadowBlur=0});
    x.restore();
    // HUD
    x.textAlign='left';x.font='bold 14px system-ui';x.fillStyle='#fffc';x.fillText('Score '+sc,8,18);
    x.textAlign='center';x.fillStyle='#ff6b8b';x.fillText('\u2665'.repeat(Math.max(0,lives)),W/2,18);
    x.textAlign='right';x.fillStyle='#fffc';x.fillText('Level '+(lv+1),W-8,18);
    let bx=8;[['W','WIDE'],['S','SLOW'],['L','LASER']].forEach(([q,n])=>{if(pow[q]>0){x.fillStyle=POW[q].col;rr(x,bx,H-18,64,13,6);x.fill();x.fillStyle='#fff';x.font='bold 10px system-ui';x.textAlign='center';x.fillText(n+' '+Math.ceil(pow[q]),bx+32,H-8);bx+=70}});
    if(combo>2){x.textAlign='center';strokeText(x,'x'+Math.min(combo,8)+' combo',W/2,H/2+60,22,'#ffd21f')}
    if(balls.some(b=>b.stuck)&&!over&&clearT<=0){x.textAlign='center';x.fillStyle='#fff';x.font='16px system-ui';x.fillText(pow.L>0?'Click or Space to launch (then to fire)':'Click or press Space to launch',W/2,H/2+90)}
    if(msgT>0){x.globalAlpha=CL(msgT,0,1);strokeText(x,msg,W/2,H/2+20,28,'#fff');x.globalAlpha=1}
    if(clearT>0)bannerT(x,W,H,'LEVEL '+(lv+1)+' CLEARED','Bonus +'+100*(lv+1));
    if(over)bannerT(x,W,H,'GAME OVER','Score '+sc+'   Click to retry');
    if(flash>0){x.fillStyle=`rgba(255,80,80,${flash})`;x.fillRect(0,0,W,H)}}
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow')||n==' ')e.preventDefault();if((n==' '||n=='enter')&&!e.repeat)launch()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});on(window,'blur',()=>{for(const q in k)k[q]=0});
  const mv=e=>{const r=c.getBoundingClientRect();px=CL((e.clientX-r.left)/r.width*W,pw/2,W-pw/2)};
  on(c,'pointermove',mv);on(c,'pointerdown',e=>{e.preventDefault();mv(e);launch()});
  reset();return gloop(upd,draw);
}

/* ============================ Snake ============================ */
// Smooth gliding snake, 5 modes (Classic, Wrap Around, Maze, Time Attack, Power-Ups), 3 speeds, a best score per mode and speed.
function snake(el){
  const N=16,S=30,W=N*S,[c,x]=hd(el,W,W,1.2);
  const V={l:[-1,0],r:[1,0],u:[0,-1],d:[0,1]},DV=Object.values(V);
  const MODES=[
    {id:'classic',n:'Classic',d:'Walls are deadly. Eat, grow, survive.'},
    {id:'wrap',n:'Wrap Around',d:'Slip through a wall and come out the other side.',wrap:1},
    {id:'maze',n:'Maze',d:'Rocks block the way, and a new one drops every 5 apples.'},
    {id:'time',n:'Time Attack',d:'60 seconds on the clock. Eat as much as you can.'},
    {id:'arcade',n:'Power-Ups',d:'Gold stars, ice and ghost pickups appear.'}];
  const SPD=[{n:'Chill',b:150,m:95},{n:'Normal',b:125,m:66},{n:'Fast',b:96,m:50}];
  const sv=saveGet('snake-save',{speed:1,mode:0,bests:{}});
  const save=()=>savePut('snake-save',sv);
  let scr='menu',mode=CL(sv.mode|0,0,4),spd=CL(sv.speed|0,0,2),sel=mode;
  let s=[],prev=[],d=V.r,q=[],f=null,rocks=[],sc=0,apples=0,streak=0,streakT=0,over=0,overT=0,wait=1,paused=0,acc=0,bul=[],parts=[],floats=[],shake=0,t=0,chomp=0,timeLeft=60,item=null,itemT=8,pu={ice:0,ghost:0},newBest=false,endTxt='GAME OVER';
  const M=()=>MODES[mode],key=()=>MODES[mode].id+'-'+spd,bestNow=()=>sv.bests[key()]||0;
  const hit=(a,b)=>a[0]==b[0]&&a[1]==b[1];
  const occ=(cx,cy)=>s.some(p=>p[0]==cx&&p[1]==cy)||rocks.some(p=>p[0]==cx&&p[1]==cy)||(f&&f.x==cx&&f.y==cy)||(item&&item.x==cx&&item.y==cy);
  function freeCell(far=0){for(let i=0;i<300;i++){const cx=rnd(N),cy=rnd(N);if(occ(cx,cy))continue;if(far&&Math.abs(cx-s[0][0])+Math.abs(cy-s[0][1])<far)continue;return[cx,cy]}return null}
  function connected(){const seen=new Set(),st2=[s[0].join()];seen.add(st2[0]);let n=0;
    while(st2.length){const[a,b]=st2.pop().split(',').map(Number);n++;for(const v of DV){const cx=a+v[0],cy=b+v[1],k=cx+','+cy;if(cx<0||cy<0||cx>=N||cy>=N||seen.has(k)||rocks.some(r=>r[0]==cx&&r[1]==cy))continue;seen.add(k);st2.push(k)}}
    return n==N*N-rocks.length}
  function rockCluster(n){
    const cells=[];let tries=0;
    while(cells.length<n&&tries++<60){let p;
      if(!cells.length)p=freeCell(4);
      else{const b=cells[cells.length-1],v=DV[rnd(4)];p=[b[0]+v[0],b[1]+v[1]];if(p[0]<0||p[1]<0||p[0]>=N||p[1]>=N||occ(p[0],p[1])||Math.abs(p[0]-s[0][0])+Math.abs(p[1]-s[0][1])<4)continue}
      if(p){cells.push(p);rocks.push(p)}}
    if(!connected()){cells.forEach(()=>rocks.pop());return false}return cells.length>0}
  function food(){const p=freeCell();if(!p){finish('BOARD FULL!');return}f={x:p[0],y:p[1],born:t}}
  function reset(){
    s=[[8,8],[7,8],[6,8]];prev=s.map(p=>p.slice());d=V.r;q=[];rocks=[];sc=0;apples=0;streak=0;streakT=0;over=0;overT=0;wait=1;paused=0;acc=0;bul=[];parts=[];floats=[];shake=0;chomp=0;
    timeLeft=60;item=null;itemT=6+Math.random()*4;pu={ice:0,ghost:0};newBest=false;endTxt='GAME OVER';f=null;
    if(M().id=='maze'){let k=0,g=0;while(k<4&&g++<30)if(rockCluster(2+rnd(2)))k++}
    food();st(M().n+': press an arrow key, WASD, or swipe to start.')}
  function startGame(i){mode=i;sel=i;sv.mode=i;save();scr='play';reset()}
  function finish(txt,die=false){
    if(over)return;over=1;overT=0;endTxt=txt;shake=.35;fx(die?'crash':'win');
    const hx=(s[0][0]+.5)*S,hy=(s[0][1]+.5)*S;bang(parts,hx,hy,'#4ade80',28,200);
    newBest=sc>bestNow();if(newBest)sv.bests[key()]=sc;best('snake',sc);save();
    st(`${txt}: ${sc} points in ${M().n}. Best ${bestNow()}. Press Enter or tap to play again, Esc for the menu.`)}
  const stepMs=()=>{const P=SPD[spd];let m=Math.max(P.m,P.b-apples*(P.b-P.m)/22);if(pu.ice>0)m*=1.7;return m};
  function say(txt,px,py,col='#ffd21f'){floats.push({t:0,x:px,y:py,s:txt,c:col})}
  function tick(){
    if(q.length)d=q.shift();
    let hx=s[0][0]+d[0],hy=s[0][1]+d[1];
    if(M().wrap){hx=(hx+N)%N;hy=(hy+N)%N}
    const wall=!M().wrap&&(hx<0||hy<0||hx>=N||hy>=N);
    if(wall||rocks.some(r=>r[0]==hx&&r[1]==hy)||(!(pu.ghost>0)&&s.slice(0,-1).some(p=>p[0]==hx&&p[1]==hy))){finish('GAME OVER',true);return}
    prev=s.map(p=>p.slice());s.unshift([hx,hy]);bul=bul.map(b=>b+1).filter(b=>b<s.length);
    const px=(hx+.5)*S,py=(hy+.5)*S;
    if(f&&hx==f.x&&hy==f.y){
      apples++;streak=streakT>0?Math.min(5,streak+1):1;streakT=4;const pts=10*streak;sc+=pts;chomp=.25;shake=.12;fx('coin');
      bul.unshift(0);bang(parts,px,py,'#ff5d8f',14,170);say('+'+pts+(streak>1?'  x'+streak:''),px,py-14,streak>1?'#ffd21f':'#fff');
      if(M().id=='maze'&&apples%5==0){let g=0;while(g++<10&&!rockCluster(1+rnd(2)));say('New rocks!',W/2,40,'#fca5a5')}
      food();
    } else s.pop();
    if(item&&hx==item.x&&hy==item.y){
      fx('win');
      if(item.k=='star'){sc+=50;say('+50',px,py-14,'#ffd21f');bang(parts,px,py,'#ffd21f',20,220)}
      else if(item.k=='ice'){pu.ice=6;say('SLOW',px,py-14,'#7dd3fc');bang(parts,px,py,'#7dd3fc',16,200)}
      else{pu.ghost=6;say('GHOST',px,py-14,'#d8b4fe');bang(parts,px,py,'#d8b4fe',16,200)}
      item=null;itemT=7+Math.random()*5}
  }
  function turn(k){
    if(scr!='play'||over||paused)return;
    const v=V[k],last=q.length?q[q.length-1]:d;
    if(v[0]+last[0]==0&&v[1]+last[1]==0)return;if(v[0]==last[0]&&v[1]==last[1])return;
    if(q.length<2)q.push(v);if(wait){wait=0;st('Go!')}}
  dirs(c,turn);
  on(document,'keydown',e=>{
    const n=e.key;
    if(scr=='menu'){
      if(n=='ArrowUp'||n=='w'){sel=(sel+4)%5;fx('click')}else if(n=='ArrowDown'||n=='s'){sel=(sel+1)%5;fx('click')}
      else if(n=='ArrowLeft'||n=='a'){spd=(spd+2)%3;sv.speed=spd;save();fx('click')}else if(n=='ArrowRight'||n=='d'){spd=(spd+1)%3;sv.speed=spd;save();fx('click')}
      else if(n=='Enter'||n==' '){e.preventDefault();startGame(sel)}
      else if(n>='1'&&n<='5')startGame(+n-1);
      return}
    if(over){if((n=='Enter'||n==' ')&&overT>.35){e.preventDefault();startGame(mode)}else if(n=='Escape'||n=='m'||n=='M'){scr='menu';st('Pick a mode.')}return}
    if(n=='Escape'||n=='m'||n=='M'){scr='menu';st('Pick a mode.')}
    else if(n=='p'||n=='P'){if(!wait)paused=!paused}});
  on(window,'blur',()=>{if(scr=='play'&&!over&&!wait)paused=1});
  on(c,'pointerdown',e=>{
    const r=c.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*W,my=(e.clientY-r.top)/r.height*W;
    if(scr=='menu'){
      if(my>=92&&my<92+5*58){startGame(Math.floor((my-92)/58));return}
      if(my>=408&&my<=444){const i=Math.floor((mx-W/2+150)/100);if(i>=0&&i<3){spd=i;sv.speed=i;save();fx('click')}}
      return}
    if(over&&overT>.35){if(my>300&&my<344){if(mx>W/2-150&&mx<W/2-10)startGame(mode);else if(mx>W/2+10&&mx<W/2+150){scr='menu';st('Pick a mode.')}}return}
    if(paused)paused=0});
  const upd=dt=>{
    bangUpd(parts,dt,0);floats.forEach(p=>{p.t+=dt;p.y-=26*dt});floats=floats.filter(p=>p.t<.9);
    shake=Math.max(0,shake-dt);chomp=Math.max(0,chomp-dt);
    if(scr=='menu')t+=dt*.5;
    t+=dt;if(scr!='play')return;
    if(over){overT+=dt;return}
    if(wait||paused)return;
    streakT=Math.max(0,streakT-dt);if(!streakT)streak=0;
    pu.ice=Math.max(0,pu.ice-dt);pu.ghost=Math.max(0,pu.ghost-dt);
    if(M().id=='time'){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;finish('TIME UP')}}
    if(M().id=='arcade'){
      if(item){item.life-=dt;if(item.life<=0){item=null;itemT=6+Math.random()*4}}
      else{itemT-=dt;if(itemT<=0){const p=freeCell(3);if(p){const ks=['star','ice','ghost'];item={x:p[0],y:p[1],k:ks[rnd(3)],life:9};fx('click')}else itemT=3}}}
    acc+=dt*1000;while(acc>=stepMs()&&!over){acc-=stepMs();tick()}};
  /* ---------- drawing ---------- */
  function star(px,py,r,col){x.fillStyle=col;x.beginPath();for(let i=0;i<10;i++){const a=-1.5708+i*.6283,rr2=i%2?r*.45:r;x.lineTo(px+Math.cos(a)*rr2,py+Math.sin(a)*rr2)}x.closePath();x.fill()}
  function drawItem(){
    if(!item)return;const px=(item.x+.5)*S,py=(item.y+.5)*S+Math.sin(t*5)*2,k=item.k,col=k=='star'?'#ffd21f':k=='ice'?'#7dd3fc':'#d8b4fe';
    x.fillStyle='#0b1020';x.beginPath();x.arc(px,py,14,0,7);x.fill();x.strokeStyle=col;x.lineWidth=3;x.beginPath();x.arc(px,py,12,-1.5708,-1.5708+6.283*CL(item.life/9,0,1));x.stroke();
    if(k=='star')star(px,py,9,col);
    else if(k=='ice'){x.strokeStyle=col;x.lineWidth=2;for(let i=0;i<3;i++){const a=i*1.0472;x.beginPath();x.moveTo(px-Math.cos(a)*8,py-Math.sin(a)*8);x.lineTo(px+Math.cos(a)*8,py+Math.sin(a)*8);x.stroke()}}
    else{x.fillStyle=col;x.beginPath();x.arc(px,py-2,6,Math.PI,0);x.lineTo(px+6,py+7);x.lineTo(px+3,py+4);x.lineTo(px,py+7);x.lineTo(px-3,py+4);x.lineTo(px-6,py+7);x.closePath();x.fill();x.fillStyle='#0b1020';x.fillRect(px-3.5,py-4,2,3);x.fillRect(px+1.5,py-4,2,3)}}
  function drawFood(){
    if(!f)return;const age=t-f.born,pop=age<.25?Math.sin(age/.25*1.5708)*1.15:1+Math.sin(t*5)*.04,px=(f.x+.5)*S,py=(f.y+.5)*S+Math.sin(t*3)*1;
    x.save();x.translate(px,py);x.scale(pop,pop);
    x.fillStyle='#0003';x.beginPath();x.ellipse(0,11,8,3,0,0,7);x.fill();
    x.fillStyle='#e63946';x.beginPath();x.arc(-3.5,1,8.5,0,7);x.arc(3.5,1,8.5,0,7);x.fill();
    x.fillStyle='#ff7b86';x.beginPath();x.ellipse(-5,-3,3,2,-.5,0,7);x.fill();
    x.strokeStyle='#5b3a1a';x.lineWidth=2;x.beginPath();x.moveTo(0,-6);x.lineTo(1.5,-11);x.stroke();
    x.fillStyle='#4ade80';x.beginPath();x.ellipse(5,-9,5,2.5,-.5,0,7);x.fill();x.restore()}
  function drawSnake(){
    const al=(scr=='play'&&!over&&!wait&&!paused)?CL(acc/stepMs(),0,1):(over?1:1),n=s.length;
    const P=s.map((p,i)=>{const a=prev[Math.min(i,prev.length-1)]||p;const jump=Math.abs(p[0]-a[0])>1.5||Math.abs(p[1]-a[1])>1.5;return jump?[(p[0]+.5)*S,(p[1]+.5)*S]:[(a[0]+(p[0]-a[0])*al+.5)*S,(a[1]+(p[1]-a[1])*al+.5)*S]});
    const wd=i=>S*(.74-.24*i/n)*(bul.includes(i)?1.28:1);
    x.lineCap='round';x.lineJoin='round';x.globalAlpha=pu.ghost>0?.55:1;
    const seg=(i,extra,col)=>{const a=P[i],b=P[i-1];if(Math.hypot(a[0]-b[0],a[1]-b[1])>S*1.6)return;x.strokeStyle=col;x.lineWidth=(wd(i)+wd(i-1))/2+extra;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()};
    for(let i=n-1;i>0;i--)seg(i,5,'#0a1f1a');
    for(let i=n-1;i>0;i--)seg(i,0,`hsl(${150+i*2.2} 62% ${44-Math.min(i,20)*.5}%)`);
    for(let i=n-1;i>0;i--){const a=P[i],b=P[i-1];if(Math.hypot(a[0]-b[0],a[1]-b[1])>S*1.6)continue;x.strokeStyle='#ffffff26';x.lineWidth=wd(i)*.38;x.beginPath();x.moveTo(a[0],a[1]-2);x.lineTo(b[0],b[1]-2);x.stroke()}
    // pattern dots
    for(let i=2;i<n;i+=2){x.fillStyle='#0a1f1a55';x.beginPath();x.arc(P[i][0],P[i][1],wd(i)*.16,0,7);x.fill()}
    // head
    const hx=P[0][0],hy=P[0][1],hr=S*.45*(1+chomp*.9),fx0=d[0],fy0=d[1],px0=-fy0,py0=fx0;
    x.fillStyle='#0a1f1a';x.beginPath();x.arc(hx,hy,hr+2.5,0,7);x.fill();x.fillStyle='#34d399';x.beginPath();x.arc(hx,hy,hr,0,7);x.fill();x.fillStyle='#ffffff30';x.beginPath();x.arc(hx-2,hy-3,hr*.55,0,7);x.fill();
    const tl=Math.max(0,Math.sin(t*4.5)-.55)*2.2;
    if(tl>0&&!over){x.strokeStyle='#ef4444';x.lineWidth=2;x.beginPath();const bx=hx+fx0*hr,by=hy+fy0*hr,ex=bx+fx0*S*.5*tl,ey=by+fy0*S*.5*tl;x.moveTo(bx,by);x.lineTo(ex,ey);x.moveTo(ex,ey);x.lineTo(ex+fx0*4+px0*4,ey+fy0*4+py0*4);x.moveTo(ex,ey);x.lineTo(ex+fx0*4-px0*4,ey+fy0*4-py0*4);x.stroke()}
    let lx=0,ly=0;if(f){const dx=(f.x+.5)*S-hx,dy=(f.y+.5)*S-hy,m=Math.hypot(dx,dy)||1;lx=dx/m*2.2;ly=dy/m*2.2}
    for(const sd of[-1,1]){const ex=hx+fx0*hr*.3+px0*sd*hr*.5,ey=hy+fy0*hr*.3+py0*sd*hr*.5;x.fillStyle='#fff';x.beginPath();x.arc(ex,ey,S*.15,0,7);x.fill();x.fillStyle=over?'#ef4444':'#0b1020';x.beginPath();x.arc(ex+lx,ey+ly,S*.075,0,7);x.fill()}
    x.globalAlpha=1}
  function board(){
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){x.fillStyle=(i+j)%2?'#152a3a':'#112333';x.fillRect(i*S,j*S,S,S)}
    if(M().wrap){x.strokeStyle='#22d3ee88';x.lineWidth=4;x.setLineDash([10,8]);x.strokeRect(2,2,W-4,W-4);x.setLineDash([])}
    else{x.strokeStyle='#ef444499';x.lineWidth=5;x.strokeRect(2.5,2.5,W-5,W-5)}
    for(const r of rocks){const px=r[0]*S,py=r[1]*S;x.fillStyle='#0b1020';rr(x,px+1,py+1,S-2,S-2,6);x.fill();x.fillStyle='#7b8499';rr(x,px+2,py+2,S-4,S-5,6);x.fill();x.fillStyle='#a8b0c4';rr(x,px+5,py+4,S-14,6,3);x.fill();x.fillStyle='#5a6177';x.fillRect(px+7,py+S-12,S-14,3)}}
  function hud(){
    strokeText(x,'Score '+sc,10,24,20,'#fff','left');
    strokeText(x,'Best '+Math.max(bestNow(),sc),W-10,24,16,'#cbd5e1','right');
    if(M().id=='time')strokeText(x,Math.ceil(timeLeft)+'s',W/2,32,34,timeLeft<10&&Math.floor(t*4)%2?'#ef4444':'#fff');
    if(streak>1){strokeText(x,'x'+streak,10,46,16,'#ffd21f','left');x.fillStyle='#0b1020';x.fillRect(38,36,52,8);x.fillStyle='#ffd21f';x.fillRect(39,37,50*streakT/4,6)}
    let bx=10;[['ice','SLOW','#7dd3fc'],['ghost','GHOST','#d8b4fe']].forEach(([k,n,col])=>{if(pu[k]>0){x.fillStyle='#0b1020';rr(x,bx-2,W-26,74,20,10);x.fill();x.fillStyle=col;rr(x,bx,W-24,70,16,8);x.fill();strokeText(x,n+' '+Math.ceil(pu[k]),bx+35,W-11,12,'#fff','center','system-ui');bx+=80}})}
  function menu(){
    const g=x.createLinearGradient(0,0,0,W);g.addColorStop(0,'#0e2a2a');g.addColorStop(1,'#0b1626');x.fillStyle=g;x.fillRect(0,0,W,W);
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){if((i+j)%2){x.fillStyle='#ffffff06';x.fillRect(i*S,j*S,S,S)}}
    strokeText(x,'SNAKE',W/2,66,50,'#4ade80');
    // little decorative snake
    x.lineCap='round';x.strokeStyle='#0a1f1a';x.lineWidth=14;x.beginPath();for(let i=0;i<=40;i++){const px=W/2+70+i*3.2,py=48+Math.sin(i*.45+t*3)*7;i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();
    x.strokeStyle='#34d399';x.lineWidth=9;x.stroke();
    MODES.forEach((m,i)=>{const y=92+i*58,on=i==sel;
      x.fillStyle=on?'#1f5b4d':'#142d3c';rr(x,24,y,W-48,52,12);x.fill();x.strokeStyle=on?'#4ade80':'#ffffff18';x.lineWidth=on?3:1;rr(x,24,y,W-48,52,12);x.stroke();
      strokeText(x,(i+1)+'  '+m.n,40,y+24,20,'#fff','left');x.textAlign='left';x.font='12px system-ui';x.fillStyle='#cbd5e1';x.fillText(m.d,42,y+43);
      const b=sv.bests[m.id+'-'+spd]||0;strokeText(x,b?'Best '+b:'New',W-40,y+30,16,b?'#ffd21f':'#7dd3fc','right')});
    x.textAlign='center';x.font='13px system-ui';x.fillStyle='#cbd5e1';x.fillText('Speed',W/2-170,431);
    SPD.forEach((p,i)=>{const px=W/2-150+i*100;x.fillStyle=i==spd?'#4ade80':'#142d3c';rr(x,px+4,408,92,36,18);x.fill();x.strokeStyle=i==spd?'#fff':'#ffffff22';x.lineWidth=2;rr(x,px+4,408,92,36,18);x.stroke();strokeText(x,p.n,px+50,432,16,i==spd?'#0b1020':'#fff')});
    x.font='12px system-ui';x.fillStyle='#94a3b8';x.fillText('Click a mode to play. Keys: Up and Down choose, Left and Right set speed, Enter plays.',W/2,466)}
  function draw(){
    if(scr=='menu'){menu();return}
    x.save();if(shake>0)x.translate((Math.random()-.5)*5,(Math.random()-.5)*5);
    board();drawFood();drawItem();drawSnake();bangDrw(x,parts);
    floats.forEach(p=>{x.globalAlpha=CL(1-p.t/.9,0,1);strokeText(x,p.s,p.x,p.y,18,p.c);x.globalAlpha=1});
    x.restore();hud();
    if(wait&&!over){x.fillStyle='#000a';x.fillRect(0,W/2-50,W,100);strokeText(x,M().n.toUpperCase(),W/2,W/2-8,34,'#4ade80');x.textAlign='center';x.font='15px system-ui';x.fillStyle='#fff';x.fillText('Press an arrow key, WASD or swipe to start',W/2,W/2+24)}
    if(paused){x.fillStyle='#000b';x.fillRect(0,0,W,W);strokeText(x,'PAUSED',W/2,W/2,44,'#fff');x.textAlign='center';x.font='15px system-ui';x.fillStyle='#fff';x.fillText('Press P or tap to resume',W/2,W/2+34)}
    if(over&&overT>.3){x.fillStyle='#000a';x.fillRect(0,0,W,W);x.fillStyle='#10303a';rr(x,70,110,W-140,270,18);x.fill();x.strokeStyle='#4ade80';x.lineWidth=3;x.stroke();
      strokeText(x,endTxt,W/2,160,38,endTxt=='TIME UP'?'#ffd21f':'#ff6b6b');
      strokeText(x,sc+' points',W/2,208,34,'#fff');strokeText(x,M().n+' / '+SPD[spd].n,W/2,236,15,'#94a3b8','center','system-ui');
      strokeText(x,newBest?'NEW BEST!':'Best '+bestNow(),W/2,274,24,newBest?'#ffd21f':'#cbd5e1');
      pill(x,W/2-140,300,130,44,'#22c55e','Play again',16);pill(x,W/2+10,300,130,44,'#6366f1','Menu',16)}}
  reset();scr='menu';st('Pick a mode.');
  return gloop(upd,draw);
}
