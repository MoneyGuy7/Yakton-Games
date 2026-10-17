/* Step 3: Traffic Racer rebuilt. Five modes, lives, combos, trucks, lane-changers, coins, nitro cans, biomes and a night mode. */
function racer(el){
  const W=360,H=560,[c,x]=hd(el,W,H,1.25),RX=30,RW=300,PY=470,D=c.width/W,k={},ptr=new Map(),touch=matchMedia('(pointer:coarse)').matches;
  const MODES=[
    {id:'cruise',name:'Cruise',desc:'3 lives. Relaxed traffic. Learn the road.',lives:3,lanes:4,cap:9.5,ramp:.0016,gap:[300,140],trucks:0,chg:0,col:'#4ade80'},
    {id:'endless',name:'Endless',desc:'2 lives. Traffic keeps getting faster.',lives:2,lanes:4,cap:14,ramp:.0028,gap:[260,120],trucks:.12,chg:.12,col:'#38bdf8'},
    {id:'rush',name:'Rush Hour',desc:'1 life. 5 lanes, trucks and lane swappers.',lives:1,lanes:5,cap:12.5,ramp:.003,gap:[200,90],trucks:.28,chg:.38,city:1,col:'#fb923c'},
    {id:'time',name:'Time Attack',desc:'60 seconds. Gates add time, crashes cost time.',lives:99,lanes:4,cap:13,ramp:.003,gap:[240,110],trucks:.1,chg:.1,time:60,col:'#facc15'},
    {id:'night',name:'Night Run',desc:'2 lives. Dark road. Headlights only.',lives:2,lanes:4,cap:12,ramp:.0025,gap:[250,110],trucks:.1,chg:.15,night:1,col:'#a78bfa'}];
  const TY={car:{hw:16,hh:31},van:{hw:18,hh:38},truck:{hw:20,hh:58},me:{hw:15,hh:29}};
  const CARC=['#3b82f6','#22c55e','#f97316','#a855f7','#eab308','#e5e7eb','#14b8a6','#ec4899'],BIO=[
    {g1:'#2f7a3b',g2:'#286a33',k:'tree'},{g1:'#d8b36c',g2:'#c9a25b',k:'cactus'},{g1:'#e8f0f7',g2:'#d4e0ea',k:'pine'}];
  let scene='menu',M=MODES[1],mi=1,px,vx,v,sp,cars,coins,cans,gates,deco,parts,dist,off,nit,bonus,combo,comboT,lives,inv,time,shake,msg,msgT,gap,cgap,nextGate,T=0,paused=0,hit=-1,lean,flash,tdir,tN,newBest;
  const LCx=(l,n)=>RX+RW/n*(l+.5),score=()=>Math.floor(dist/10)+bonus;
  const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),mix=(a,b,t)=>{const A=hex(a),B=hex(b);return'#'+A.map((q,i)=>Math.round(q+(B[i]-q)*t).toString(16).padStart(2,'0')).join('')};
  const shade=(h,a)=>'#'+hex(h).map(q=>Math.max(0,Math.min(255,Math.round(q+a))).toString(16).padStart(2,'0')).join('');
  const dk=document.createElement('canvas');dk.width=c.width;dk.height=c.height;const dx=dk.getContext('2d');dx.scale(D,D);

  function reset(m){mi=m;M=MODES[m];scene='play';px=W/2;vx=0;v=6;sp=6;cars=[];coins=[];cans=[];gates=[];parts=[];dist=0;off=0;nit=100;bonus=0;combo=1;comboT=0;lives=M.lives;inv=0;time=M.time||0;shake=0;msgT=0;gap=100;cgap=900;nextGate=1600;lean=0;flash=0;tdir=0;tN=0;newBest=0;paused=0;
    deco=[];for(let y=-40;y<H+60;y+=84){deco.push(mkDeco(y,-1),mkDeco(y+30,1))}
    st(M.id=='time'?'Drive through the gates to add time.':'Dodge traffic. Space or Up is nitro, Down brakes.')}
  function mkDeco(y,side){return{y:y+Math.random()*30,side,r:Math.random(),kind:0}}
  const bio=()=>{const b=Math.floor(dist/6500)%3,n=(b+1)%3,t=Math.max(0,((dist%6500)-5900)/600);return{g1:mix(BIO[b].g1,BIO[n].g1,t),g2:mix(BIO[b].g2,BIO[n].g2,t),k:t>.5?BIO[n].k:BIO[b].k}};
  const pop=(t,col)=>{msg=t;msgT=.9;msgC=col||'#ffd21f'};let msgC;

  // ---------- spawning ----------
  function spawn(){const n=M.lanes,occ=new Set(cars.filter(e=>e.y<220).map(e=>e.l));if(occ.size>=n-1)return 20;
    const free=[...Array(n).keys()].filter(l=>!cars.some(e=>(e.l==l||e.tl==l)&&e.y<170));if(!free.length)return 20;
    const l=free[rnd(free.length)],r=Math.random();let ty='car',ev=2.5+Math.random()*2.5;
    if(r<M.trucks){ty='truck';ev=1.4+Math.random()*1}else if(r<M.trucks+.18){ty='van';ev=2.2+Math.random()*1.6}
    const e={l,x:LCx(l,n),y:-80,ty,ev,col:ty=='truck'?'#d33':CARC[rnd(CARC.length)],near:99,cd:.8+Math.random()*1.6,warn:0,tl:null};if(Math.random()>M.chg||ty=='truck'||(M.id=='cruise'))e.cd=999;
    cars.push(e);return Math.max(60,M.gap[0]-sp*9+rnd(M.gap[1]))}
  function spawnCoins(){const n=M.lanes,l=rnd(n),xx=LCx(l,n);if(cars.some(e=>e.l==l&&e.y<260))return;for(let i=0;i<5;i++)coins.push({x:xx,y:-30-i*34,t:0})}

  // ---------- update ----------
  const upd=dt=>{T+=dt;bangUpd(parts,dt,0);shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt);
    if(scene=='menu'){off+=3;return}if(paused)return;
    if(scene=='over'){off+=.5;return}
    const f=dt*60,nb=(k.shift||k[' ']||k.arrowup||k.w||tN)&&nit>0,br=k.arrowdown||k.s;
    nit=nb?nit-.65*f:Math.min(100,nit+.1*f);if(msgT>0)msgT-=dt;if(inv>0)inv-=dt;comboT-=dt;if(comboT<=0&&combo>1){combo=1}
    sp=Math.min(M.cap,sp+M.ramp*f);const tv=sp+(nb?4:0)-(br?3.5:0);v+=(tv-v)*Math.min(1,.08*f);
    const d=(k.arrowright||k.d||tdir>0?1:0)-(k.arrowleft||k.a||tdir<0?1:0);vx+=(d*5.6-vx)*Math.min(1,.2*f);px+=vx*f;
    const lo=RX+17,hi=RX+RW-17;if(px<lo){px=lo;vx=0}if(px>hi){px=hi;vx=0}lean+=(vx*.03-lean)*.3;
    off+=v*f;dist+=v*f;gap-=v*f;cgap-=v*f;
    if(nb&&Math.random()<.8)bang(parts,px+(Math.random()-.5)*10,PY+36,Math.random()<.5?'#ffb020':'#7dd3fc',1,70);
    if(M.time){time-=dt;if(time<=0){time=0;return finish('TIME UP')}if(dist>=nextGate){gates.push({y:-30,got:0});nextGate+=1900+dist*.05}}
    if(gap<0)gap=spawn();if(cgap<0){cgap=700+rnd(600);spawnCoins();if(Math.random()<.35&&nit<80){const l=rnd(M.lanes);cans.push({x:LCx(l,M.lanes),y:-120})}}
    // scenery
    deco.forEach(o=>{o.y+=v*f;if(o.y>H+70){o.y-=H+170;o.r=Math.random()}});
    gates.forEach(g=>{g.y+=v*f;if(!g.got&&g.y>PY){g.got=1;time+=10;pop('GATE +10s','#7dd3fc');fx('coin');bang(parts,W/2,PY,'#7dd3fc',24,200)}});gates=gates.filter(g=>g.y<H+80);
    coins.forEach(q=>{q.y+=v*f;q.t+=dt;if(Math.abs(q.x-px)<22&&Math.abs(q.y-PY)<26&&!q.g){q.g=1;bonus+=5*combo;fx('coin');bang(parts,q.x,q.y,'#ffd21f',6,90)}});coins=coins.filter(q=>q.y<H+40&&!q.g);
    cans.forEach(q=>{q.y+=v*f;if(Math.abs(q.x-px)<22&&Math.abs(q.y-PY)<26&&!q.g){q.g=1;nit=Math.min(100,nit+40);pop('NITRO +','#7dd3fc');fx('coin');bang(parts,q.x,q.y,'#7dd3fc',14,120)}});cans=cans.filter(q=>q.y<H+40&&!q.g);
    // traffic
    for(const e of cars){const T_=TY[e.ty];e.y+=(v-e.ev)*f;
      if(e.warn>0){e.warn-=dt;if(e.warn<=0){e.tl=e.l+e.dir}}
      else if(e.tl!=null){const tx=LCx(e.tl,M.lanes),dxx=tx-e.x,s=Math.min(Math.abs(dxx),70*dt);e.x+=Math.sign(dxx)*s;if(Math.abs(tx-e.x)<.5){e.x=tx;e.l=e.tl;e.tl=null;e.cd=1.5+Math.random()*2}}
      else if(e.y>30&&e.y<330){e.cd-=dt;if(e.cd<=0){const dir=Math.random()<.5?-1:1,nl=e.l+dir;if(nl>=0&&nl<M.lanes&&!cars.some(o=>o!==e&&(o.l==nl||o.tl==nl)&&Math.abs(o.y-e.y)<130)&&Math.abs(nl*0+LCx(nl,M.lanes)-px)>0){e.dir=dir;e.warn=.85}else e.cd=.8}}
      const TH=TY[e.ty],dxm=Math.abs(e.x-px),dym=Math.abs(e.y-PY);
      if(dym<TH.hh+60&&dxm<80)e.near=Math.min(e.near,dxm);
      if(inv<=0&&dxm<TH.hw+TY.me.hw-3&&dym<TH.hh+TY.me.hh-5){crash(e);if(scene!='play')return;continue}
      if(!e.pass&&e.y>PY+TH.hh+30){e.pass=1;if(e.near<TH.hw+TY.me.hw+24&&e.near>0){combo=Math.min(5,combo+1);comboT=5;const b=15*combo;bonus+=b;pop(`Close call +${b}  x${combo}`);fx('coin')}}}
    cars=cars.filter(e=>e.y<H+100&&!e.dead)};
  function crash(e){fx('crash');shake=.45;flash=.2;combo=1;comboT=0;bang(parts,px,PY,'#ffb020',34,230);bang(parts,px,PY,'#888',14,120);vx=(e.x<px?1:-1)*6;sp=Math.max(5,sp*.7);v*=.5;inv=1.7;
    e.dead=1;bang(parts,e.x,e.y,e.col,16,160);
    if(M.time){time=Math.max(0,time-4);pop('CRASH -4s','#ff6b4a');return}
    lives--;if(lives<=0)finish('CRASHED');else pop(lives+' '+(lives==1?'life':'lives')+' left','#ff6b4a')}
  function finish(t){scene='over';const sc=score(),pb=+(localStorage.getItem('best-racer-'+M.id)||0);newBest=sc>pb;best('racer-'+M.id,sc);over_t=t;fx(t=='TIME UP'?'win':'lose');st(`${t}! ${sc} points on ${M.name}. Best ${best('racer-'+M.id,sc)}. Enter retry, M menu.`)}
  let over_t='';

  // ---------- drawing ----------
  function veh(cx,cy,ty,col,o={}){x.save();x.translate(cx,cy);if(o.tilt)x.rotate(o.tilt);const q=TY[ty]||TY.car,hw=q.hw,hh=q.hh;
    x.fillStyle='rgba(0,0,0,.32)';rr(x,-hw-1,-hh+5,hw*2+6,hh*2,8);x.fill();
    x.fillStyle='#0b0b0e';[[-hw-3,-hh*.6],[hw-2,-hh*.6],[-hw-3,hh*.4],[hw-2,hh*.4]].forEach(w=>{rr(x,w[0],w[1],5,14,2);x.fill()});
    if(ty=='truck'){x.fillStyle='#d9dde3';rr(x,-hw-1,-hh+40,hw*2+2,hh*2-40,3);x.fill();x.fillStyle='#b9bec7';for(let y=-hh+50;y<hh-4;y+=14)x.fillRect(-hw+1,y,hw*2-2,2);x.fillStyle=col;x.fillRect(-hw-1,-hh+66,hw*2+2,8);
      const g=x.createLinearGradient(-hw,0,hw,0);g.addColorStop(0,shade(col,-30));g.addColorStop(.5,shade(col,40));g.addColorStop(1,shade(col,-30));x.fillStyle=g;rr(x,-hw,-hh,hw*2,42,7);x.fill();
      x.fillStyle='#0c1a2e';rr(x,-hw+3,-hh+7,hw*2-6,13,3);x.fill();x.fillStyle='#ffffff30';x.fillRect(-hw+5,-hh+9,9,3)}
    else{const g=x.createLinearGradient(-hw,0,hw,0);g.addColorStop(0,shade(col,-45));g.addColorStop(.35,shade(col,35));g.addColorStop(.65,col);g.addColorStop(1,shade(col,-45));x.fillStyle=g;rr(x,-hw,-hh,hw*2,hh*2,ty=='van'?6:9);x.fill();
      if(ty=='van'){x.fillStyle='#f3f4f6';rr(x,-hw+3,-hh+20,hw*2-6,hh*2-26,4);x.fill();x.fillStyle='#0c1a2e';rr(x,-hw+3,-hh+5,hw*2-6,12,3);x.fill()}
      else{x.fillStyle='#0c1a2e';rr(x,-hw+3,-hh*.42,hw*2-6,hh*.34,4);x.fill();rr(x,-hw+4,hh*.2,hw*2-8,hh*.26,3);x.fill();x.fillStyle=shade(col,-18);rr(x,-hw+4,-hh*.06,hw*2-8,hh*.26,3);x.fill();x.fillStyle='#ffffff2e';x.beginPath();x.moveTo(-hw+5,-hh*.4);x.lineTo(-hw+13,-hh*.4);x.lineTo(-hw+7,-hh*.12);x.fill()}
      if(o.me){x.fillStyle='#ffffffcc';x.fillRect(-4,-hh+1,3,hh*2-3);x.fillRect(1,-hh+1,3,hh*2-3);x.fillStyle='#16161a';rr(x,-hw-1,hh-6,hw*2+2,6,2);x.fill()}}
    x.fillStyle=o.me?'#fff7c2':'#fde68a';x.fillRect(-hw+2,-hh,5,3);x.fillRect(hw-7,-hh,5,3);
    const bl=o.brake?'#ff3b30':'#b91c1c';x.fillStyle=bl;x.fillRect(-hw+1,hh-3,6,3);x.fillRect(hw-7,hh-3,6,3);if(o.brake){x.fillStyle='#ff3b3055';x.beginPath();x.arc(-hw+4,hh+2,7,0,7);x.arc(hw-4,hh+2,7,0,7);x.fill()}
    if(o.blink&&Math.floor(T*6)%2){x.fillStyle='#ffa500';const s=o.dir>0?hw-1:-hw-3;x.fillRect(s,-hh+2,4,5);x.fillRect(s,hh-7,4,5)}
    x.restore()}
  function tree(o,side,b){const bx=side<0?15:W-15,y=o.y,r=o.r;
    if(M.city){x.fillStyle=side<0?'#555764':'#4d4f5c';x.fillRect(side<0?0:RX+RW,y-40,RX,80);return}
    if(b.k=='tree'){x.fillStyle='#0003';x.beginPath();x.arc(bx+4,y+5,10+r*5,0,7);x.fill();x.fillStyle=mix('#1f6b30','#2f8f45',r);x.beginPath();x.arc(bx,y,9+r*5,0,7);x.fill();x.fillStyle='#ffffff18';x.beginPath();x.arc(bx-3,y-3,5,0,7);x.fill()}
    else if(b.k=='cactus'){x.fillStyle='#2f7a45';rr(x,bx-3,y-12,6,24,3);x.fill();rr(x,bx-10,y-4,5,10,2);x.fill();rr(x,bx+5,y-8,5,10,2);x.fill()}
    else{x.fillStyle='#0002';x.beginPath();x.arc(bx+3,y+4,11,0,7);x.fill();x.fillStyle='#2e6a52';x.beginPath();x.moveTo(bx,y-13);x.lineTo(bx+11,y+9);x.lineTo(bx-11,y+9);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(bx,y-13);x.lineTo(bx+6,y-2);x.lineTo(bx-6,y-2);x.fill()}}
  function building(o,side){const w=22+o.r*16,bx=side<0?2:W-w-2,h=60+o.r*30;x.fillStyle='#454857';x.fillRect(bx,o.y-h/2,w,h);x.fillStyle='#5b5f70';x.fillRect(bx+2,o.y-h/2+2,w-4,h-4);x.fillStyle='#8a8f9f';x.fillRect(bx+5,o.y-6,8,8);x.fillStyle='#2a2c36';x.fillRect(bx+4,o.y+10,w-8,3)}
  function world(){
    const b=bio(),city=M.city;x.fillStyle=city?'#5e606b':b.g1;x.fillRect(-10,-10,W+20,H+20);
    if(!city){x.fillStyle=b.g2;for(let y=-60+off%60;y<H;y+=60){x.fillRect(0,y,22,30);x.fillRect(338,y,22,30)}}
    deco.forEach(o=>{city?building(o,o.side):tree(o,o.side,b)});
    // road
    const g=x.createLinearGradient(RX,0,RX+RW,0);g.addColorStop(0,'#26262b');g.addColorStop(.5,'#303036');g.addColorStop(1,'#26262b');x.fillStyle=g;x.fillRect(RX,0,RW,H);
    x.fillStyle='#00000018';for(let l=0;l<M.lanes;l++){const cx=LCx(l,M.lanes);x.fillRect(cx-16,0,6,H);x.fillRect(cx+10,0,6,H)}
    const rum=(sx)=>{for(let y=-40+off%40;y<H;y+=20){x.fillStyle=((y+off)/20|0)%2?'#e63027':'#f4f4f0';x.fillRect(sx,y,5,20)}};x.save();x.beginPath();x.rect(0,0,W,H);x.clip();for(let y=-40+(off%40);y<H;y+=40){x.fillStyle='#e63027';x.fillRect(RX-5,y,5,20);x.fillRect(RX+RW,y,5,20);x.fillStyle='#f4f4f0';x.fillRect(RX-5,y+20,5,20);x.fillRect(RX+RW,y+20,5,20)}x.restore();
    x.fillStyle='#f4f4f0';x.fillRect(RX+2,0,3,H);x.fillRect(RX+RW-5,0,3,H);
    for(let l=1;l<M.lanes;l++){const lx=RX+RW/M.lanes*l;for(let y=-80+off%80;y<H;y+=80){x.fillStyle=M.city&&l==Math.floor(M.lanes/2)?'#facc15':'#f4f4f0cc';x.fillRect(lx-1.5,y,3,38)}}
    gates.forEach(q=>{x.fillStyle='#0c1a2e';x.fillRect(RX-6,q.y-6,RW+12,12);x.fillStyle=q.got?'#4ade80':'#38bdf8';for(let i=0;i<10;i++)x.fillRect(RX-4+i*31,q.y-4,16,8);x.fillStyle='#fff';x.font='bold 10px system-ui';x.textAlign='center';x.fillText('CHECKPOINT',W/2,q.y+3)});
    coins.forEach(q=>{const s=Math.abs(Math.cos(q.t*5));x.fillStyle='#b8860b';x.beginPath();x.ellipse(q.x,q.y,8*s+1,8,0,0,7);x.fill();x.fillStyle='#ffd21f';x.beginPath();x.ellipse(q.x,q.y,6*s+.5,6,0,0,7);x.fill()});
    cans.forEach(q=>{x.fillStyle='#0c1a2e';rr(x,q.x-9,q.y-12,18,24,5);x.fill();x.fillStyle='#38bdf8';rr(x,q.x-7,q.y-10,14,20,4);x.fill();x.fillStyle='#fff';x.font='bold 13px system-ui';x.textAlign='center';x.fillText('N',q.x,q.y+5)});
    cars.forEach(e=>veh(e.x,e.y,e.ty,e.col,{blink:e.warn>0,dir:e.dir,brake:e.ev<2}));
    if(scene!='menu'){const flick=inv>0&&Math.floor(T*14)%2;if(!flick){const nb=(k.shift||k[' ']||k.arrowup||k.w||tN)&&nit>0&&scene=='play';
      if(nb){const fl=10+Math.random()*14;x.fillStyle='#ffb020aa';x.beginPath();x.moveTo(px-9,PY+30);x.lineTo(px-5,PY+30+fl);x.lineTo(px-1,PY+30);x.moveTo(px+1,PY+30);x.lineTo(px+5,PY+30+fl);x.lineTo(px+9,PY+30);x.fill();x.fillStyle='#7dd3fcaa';x.beginPath();x.moveTo(px-6,PY+30);x.lineTo(px-4,PY+30+fl*.6);x.lineTo(px-2,PY+30);x.moveTo(px+2,PY+30);x.lineTo(px+4,PY+30+fl*.6);x.lineTo(px+6,PY+30);x.fill()}
      veh(px,PY,'me','#e63027',{me:1,tilt:lean,brake:k.arrowdown||k.s})}}
    if(v>10.5&&scene=='play'){x.fillStyle='#ffffff22';for(let i=0;i<9;i++){const sx=i<5?RX+4+i*9:RX+RW-8-(i-5)*9,sy=((T*900*(1+i%3*.3)+i*97)%(H+160))-80;x.fillRect(sx,sy,1.5,60+i%3*24)}}
    bangDrw(x,parts)}
  function night(){dx.globalCompositeOperation='source-over';dx.clearRect(0,0,W,H);dx.fillStyle='rgba(3,5,16,.88)';dx.fillRect(0,0,W,H);dx.globalCompositeOperation='destination-out';
    const bx=scene=='menu'?W/2:px,g=dx.createLinearGradient(0,PY-20,0,PY-260);g.addColorStop(0,'rgba(0,0,0,.95)');g.addColorStop(1,'rgba(0,0,0,0)');dx.fillStyle=g;dx.beginPath();dx.moveTo(bx-12,PY-24);dx.lineTo(bx-78,PY-260);dx.lineTo(bx+78,PY-260);dx.lineTo(bx+12,PY-24);dx.fill();
    let rg=dx.createRadialGradient(bx,PY,4,bx,PY,70);rg.addColorStop(0,'rgba(0,0,0,.9)');rg.addColorStop(1,'rgba(0,0,0,0)');dx.fillStyle=rg;dx.fillRect(bx-70,PY-70,140,140);
    cars.forEach(e=>{const r=dx.createRadialGradient(e.x,e.y+TY[e.ty].hh,2,e.x,e.y+TY[e.ty].hh,38);r.addColorStop(0,'rgba(0,0,0,.7)');r.addColorStop(1,'rgba(0,0,0,0)');dx.fillStyle=r;dx.fillRect(e.x-40,e.y+TY[e.ty].hh-40,80,80)});
    coins.forEach(q=>{dx.fillStyle='rgba(0,0,0,.6)';dx.beginPath();dx.arc(q.x,q.y,14,0,7);dx.fill()});gates.forEach(q=>{dx.fillStyle='rgba(0,0,0,.85)';dx.fillRect(RX-8,q.y-14,RW+16,28)});
    x.drawImage(dk,0,0,W,H);
    cars.forEach(e=>{x.fillStyle='#ff3b30';const hh=TY[e.ty].hh;x.fillRect(e.x-TY[e.ty].hw+1,e.y+hh-3,6,3);x.fillRect(e.x+TY[e.ty].hw-7,e.y+hh-3,6,3)})}
  function hud(){x.textAlign='left';x.fillStyle='#000a';rr(x,6,6,112,64,8);x.fill();x.font='bold 18px system-ui';x.fillStyle='#fff';x.fillText(score()+' pts',14,28);x.font='13px system-ui';x.fillStyle='#ccc';x.fillText(Math.round(v*12)+' km/h',14,46);
    for(let i=0;i<Math.min(M.lives,5);i++){x.fillStyle=i<lives?'#ff4d5e':'#ffffff22';x.font='14px system-ui';x.fillText('♥',14+i*16,63)}
    x.fillStyle='#000a';rr(x,W-122,10,112,18,6);x.fill();x.fillStyle='#333';x.fillRect(W-116,15,100,8);x.fillStyle=nit>25?'#38bdf8':'#ff6b4a';x.fillRect(W-116,15,Math.max(0,nit),8);
    if(combo>1){x.fillStyle='#000a';rr(x,W-70,34,60,24,8);x.fill();x.fillStyle='#ffd21f';x.font='bold 15px system-ui';x.textAlign='center';x.fillText('COMBO x'+combo,W-40,50)}
    if(M.time){x.textAlign='center';x.font='bold 30px Impact,sans-serif';x.fillStyle=time<10?'#ff6b4a':'#fff';x.strokeStyle='#000';x.lineWidth=4;x.strokeText(time.toFixed(1),W/2,44);x.fillText(time.toFixed(1),W/2,44)}
    if(msgT>0){x.globalAlpha=Math.min(1,msgT*2);x.textAlign='center';x.font='bold 18px system-ui';x.strokeStyle='#000';x.lineWidth=4;x.strokeText(msg,W/2,110);x.fillStyle=msgC;x.fillText(msg,W/2,110);x.globalAlpha=1}
    if(touch){x.fillStyle='#38bdf855';x.beginPath();x.arc(W-42,H-48,30,0,7);x.fill();x.strokeStyle='#38bdf8';x.lineWidth=2;x.stroke();x.fillStyle='#fff';x.font='bold 11px system-ui';x.textAlign='center';x.fillText('NITRO',W-42,H-44)}
    if(flash>0){x.fillStyle=`rgba(255,80,60,${flash*1.6})`;x.fillRect(0,0,W,H)}}
  const CY=i=>196+i*62;
  function menu(){x.fillStyle='#000b';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#fff';x.font='40px Impact,"Arial Black",sans-serif';x.fillText('TRAFFIC RACER',W/2,78);x.font='13px system-ui';x.fillStyle='#fbbf24';x.fillText('Choose a mode (click or press 1 to 5)',W/2,104);
    veh(W/2,152,'me','#e63027',{me:1,tilt:Math.sin(T*2)*.05});
    MODES.forEach((m,i)=>{const y=CY(i);x.fillStyle=hit==i?'#ffffff26':'#ffffff12';rr(x,24,y,W-48,54,10);x.fill();x.fillStyle=m.col;rr(x,24,y,6,54,3);x.fill();x.textAlign='left';x.fillStyle='#fff';x.font='bold 16px system-ui';x.fillText(`${i+1}. ${m.name}`,40,y+22);x.font='11px system-ui';x.fillStyle='#cbd5e1';x.fillText(m.desc,40,y+40);
      x.textAlign='right';x.fillStyle='#ffd21f';x.font='bold 12px system-ui';x.fillText('Best '+(+localStorage.getItem('best-racer-'+m.id)||0),W-34,y+22)})}
  function over(){x.fillStyle='#000b';x.fillRect(0,H/2-90,W,180);x.textAlign='center';x.fillStyle=over_t=='TIME UP'?'#7dd3fc':'#ff6b4a';x.font='38px Impact,"Arial Black",sans-serif';x.fillText(over_t,W/2,H/2-40);x.fillStyle='#fff';x.font='bold 22px system-ui';x.fillText(score()+' pts',W/2,H/2-8);x.font='13px system-ui';x.fillStyle='#ffd21f';x.fillText(newBest?'New best!':'Best '+(+localStorage.getItem('best-racer-'+M.id)||0)+' on '+M.name,W/2,H/2+14);
    x.fillStyle='#fff';x.font='bold 14px system-ui';x.fillText('Enter / tap: retry     M: menu',W/2,H/2+48);x.fillStyle='#ffffff22';rr(x,W/2-50,H/2+60,100,22,8);x.fill();x.fillStyle='#fff';x.font='12px system-ui';x.fillText('Menu',W/2,H/2+75)}
  function draw(){x.save();if(shake>0)x.translate((Math.random()-.5)*9,(Math.random()-.5)*9);world();if(M.night)night();x.restore();
    if(scene=='menu')menu();else{hud();if(scene=='over')over();if(paused){x.fillStyle='#000a';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.font='30px Impact,sans-serif';x.textAlign='center';x.fillText('PAUSED',W/2,H/2)}}}

  // ---------- input ----------
  const toMenu=()=>{scene='menu';M=MODES[mi];if(!cars)reset(mi);scene='menu';st('Pick a mode.')};
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow')||n==' ')e.preventDefault();
    if(scene=='menu'&&n>='1'&&n<='5')reset(+n-1);else if(scene=='over'&&(n=='enter'||n==' '))reset(mi);else if(n=='m'||(n=='escape'&&scene!='menu'))toMenu();else if(n=='p'&&scene=='play')paused=!paused});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});on(window,'blur',()=>{for(const q in k)k[q]=0;ptr.clear();tdir=0;tN=0;if(scene=='play')paused=1});
  const lp=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]};
  const sync=()=>{let l=0,r=0,n=0;ptr.forEach(t=>{if(t=='l')l=1;if(t=='r')r=1;if(t=='n')n=1});tdir=r-l;tN=n};
  on(c,'pointerdown',e=>{const[lx,ly]=lp(e);try{c.setPointerCapture(e.pointerId)}catch(_){}
    if(scene=='menu'){for(let i=0;i<5;i++)if(ly>CY(i)&&ly<CY(i)+54){reset(i);return}return}
    if(scene=='over'){if(ly>H/2+60&&ly<H/2+84&&Math.abs(lx-W/2)<50)toMenu();else reset(mi);return}
    if(paused){paused=0;return}
    ptr.set(e.pointerId,(touch&&Math.hypot(lx-(W-42),ly-(H-48))<38)?'n':lx<W/2?'l':'r');sync()});
  on(c,'pointermove',e=>{if(scene=='menu'){const[,ly]=lp(e);hit=-1;for(let i=0;i<5;i++)if(ly>CY(i)&&ly<CY(i)+54)hit=i}});
  const up=e=>{ptr.delete(e.pointerId);sync()};on(c,'pointerup',up);on(c,'pointercancel',up);
  reset(1);scene='menu';st('Pick a mode.');return gloop(upd,draw);
}
