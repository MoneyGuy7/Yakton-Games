// Drift King: a one button drifting game in isometric view (a Drift Boss style game).
// The car goes up-right. Hold to drift up-left, let go to go up-right again. Stay on the road.
// Turns are exact (no overshoot), the car gently steers itself toward the middle of the road, and the camera
// follows tightly so you can line up a turn. Collect gems and spend them in the Garage under the game.
function drift(el){
  const W=360,H=560,IX=26,IY=13,ZH=26,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function shade(h,a){const n=parseInt(h.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v+a*(a<0?v:255-v))));return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`}

  let segs,coinsL,shields,lock,flash,cu,cv,camU,camV,dirB,theta,speed,dist,hw,started,over,falling,fz,fvz,spin,deadT,coins,total=0,parts,time=0,ignore,holds=new Set(),lastDir,lastTxt,sc;
  try{total=+localStorage.getItem('drift-coins')||0}catch(e){}
  /* ---------- garage: upgrades and cars ---------- */
  const UPS=[
    {id:'grip',name:'Grip',desc:'Steers toward the road middle and forgives the edges',max:5,cost:[25,50,90,140,210]},
    {id:'mag',name:'Gem magnet',desc:'Grabs gems from further away',max:5,cost:[20,40,80,130,200]},
    {id:'shield',name:'Shield',desc:'Saves you from one fall per level, every run',max:3,cost:[60,120,220]},
    {id:'pay',name:'Gem pay',desc:'Every gem is worth more',max:3,cost:[50,120,250]}];
  const CARS=[
    {id:'red',name:'Rookie',top:'#ef4444',side:'#b91c1c',cab:'#fca5a5',cabS:'#e5736f',L:1.9,Wd:1.05,cost:0,perk:'',note:'Starter car'},
    {id:'teal',name:'Cruiser',top:'#14b8a6',side:'#0f766e',cab:'#99f6e4',cabS:'#5fc9bd',L:2.1,Wd:1.05,cost:80,perk:'grip',note:'+1 Grip'},
    {id:'gold',name:'Muscle',top:'#f59e0b',side:'#b45309',cab:'#fde68a',cabS:'#e0b44a',L:2.0,Wd:1.2,cost:200,perk:'mag',note:'+1 Magnet'},
    {id:'violet',name:'Phantom',top:'#8b5cf6',side:'#5b21b6',cab:'#ddd6fe',cabS:'#a98ff0',L:2.2,Wd:1.0,cost:400,perk:'shield',note:'+1 Shield'}];
  const gar={up:{grip:0,mag:0,shield:0,pay:0},owned:['red'],car:'red'};
  try{const g=JSON.parse(localStorage.getItem('drift-garage'));if(g){Object.assign(gar.up,g.up);if(Array.isArray(g.owned))gar.owned=g.owned;if(CARS.some(q=>q.id==g.car))gar.car=g.car}}catch(e){}
  const saveG=()=>{try{localStorage.setItem('drift-garage',JSON.stringify(gar));localStorage.setItem('drift-coins',total)}catch(e){}};
  const car=()=>CARS.find(q=>q.id==gar.car)||CARS[0];
  const lvl=id=>{const u=UPS.find(q=>q.id==id);return Math.min(u.max,(gar.up[id]|0)+(car().perk==id?1:0))};
  const panel=mk('div',{class:'garage'});el.append(panel);
  function renderGarage(){
    panel.innerHTML='';
    panel.append(mk('h3',{},'Garage  -  '+total+' gems'));
    const row=(label,sub,btn)=>{const r=mk('div',{class:'grow'});const t=mk('div');t.append(mk('b',{},label),mk('small',{},sub));r.append(t,btn);panel.append(r)};
    UPS.forEach(u=>{
      const n=gar.up[u.id]|0,maxed=n>=u.max,price=u.cost[n];
      const b=mk('button',{type:'button'},maxed?'Maxed':'Buy '+price);b.disabled=maxed||total<price;
      b.onclick=()=>{if(total>=price&&n<u.max){total-=price;gar.up[u.id]=n+1;saveG();sfx('win');renderGarage();hud()}b.blur()};
      row(`${u.name}  ${lvl(u.id)}/${u.max}`,u.desc,b);
    });
    panel.append(mk('h3',{},'Cars'));
    CARS.forEach(q=>{
      const own=gar.owned.includes(q.id),sel=gar.car==q.id;
      const b=mk('button',{type:'button'},sel?'Driving':own?'Drive':'Buy '+q.cost);b.disabled=sel||(!own&&total<q.cost);
      b.onclick=()=>{if(own)gar.car=q.id;else if(total>=q.cost){total-=q.cost;gar.owned.push(q.id);gar.car=q.id;sfx('win')}saveG();renderGarage();hud();b.blur()};
      const r=mk('div',{class:'grow'});const t=mk('div');
      const sw=mk('i',{class:'sw'});sw.style.background=q.top;
      t.append(sw,mk('b',{},q.name),mk('small',{},q.note));r.append(t,b);panel.append(r);
    });
  }

  function reset(){
    segs=[{ax:'A',a0:0,a1:11,f:0}];coinsL=[];cu=0;cv=0;camU=0;camV=0;dirB=false;theta=0;speed=5.5;dist=0;hw=1.8;
    shields=lvl('shield');lock=0;flash=0;
    started=false;over=false;falling=false;fz=0;fvz=0;spin=0;deadT=0;coins=0;parts=[];ignore=false;lastDir=false;lastTxt='';sc=0;
    while(needMore())addSeg();
    renderGarage();hud();
  }
  const score=()=>Math.floor(dist/2);
  function hud(){
    const s=over?`Crashed at ${score()}. Best ${best('drift',score())}. Tap or press Space to retry.`
      :started?`${score()} pts   ${coins} gems   Total gems ${total}   Shields ${shields}`
      :'Hold Space or press the screen to drift. Let go to go straight. Spend gems in the Garage below.';
    if(s!==lastTxt){lastTxt=s;st(s)}
  }

  /* ---------- road ---------- */
  function end(s){return s.ax=='A'?{u:s.a1,v:s.f}:{u:s.f,v:s.a1}}
  const needMore=()=>{const e=end(segs[segs.length-1]);return(e.u-cu)+(e.v-cv)<70};
  function addSeg(){
    const last=segs[segs.length-1],e=end(last),ax=last.ax=='A'?'B':'A',lv=Math.min(1,dist/260);
    const len=R(8.5-lv*2.5,11.5-lv*2.5);
    const s=ax=='A'?{ax,a0:e.u,a1:e.u+len,f:e.v}:{ax,a0:e.v,a1:e.v+len,f:e.u};
    segs.push(s);
    if(Math.random()<.6){const n=2+rnd(3);for(let i=0;i<n;i++){const a=s.a0+len*(i+1)/(n+1);coinsL.push(ax=='A'?{u:a,v:s.f,got:0}:{u:s.f,v:a,got:0})}}
  }
  function inSeg(s,u,v,m){
    const h=hw+m;
    return s.ax=='A'?(u>=s.a0-h&&u<=s.a1+h&&Math.abs(v-s.f)<=h):(v>=s.a0-h&&v<=s.a1+h&&Math.abs(u-s.f)<=h);
  }

  /* ---------- projection and shapes ---------- */
  const P=(u,v,z)=>[W/2+((u-camU)-(v-camV))*IX,H*.66-((u-camU)+(v-camV))*IY-z*ZH];
  function polyPath(pts){x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)x.lineTo(pts[i][0],pts[i][1]);x.closePath()}
  // extruded footprint: draws visible side faces, then the top
  function slab(corners,z0,z1,top,side,edge){
    const cx=corners.reduce((a,p)=>a+p[0],0)/corners.length,cy=corners.reduce((a,p)=>a+p[1],0)/corners.length;
    for(let i=0;i<corners.length;i++){
      const a=corners[i],b=corners[(i+1)%corners.length];
      let nu=b[1]-a[1],nv=-(b[0]-a[0]);
      if(nu*((a[0]+b[0])/2-cx)+nv*((a[1]+b[1])/2-cy)<0){nu=-nu;nv=-nv}
      if(-nu-nv<=0)continue;
      const l=Math.hypot(nu,nv)||1;
      x.fillStyle=shade(side,(nu/l)*-.15+.05);
      polyPath([P(a[0],a[1],z1),P(b[0],b[1],z1),P(b[0],b[1],z0),P(a[0],a[1],z0)]);x.fill();
    }
    polyPath(corners.map(p=>P(p[0],p[1],z1)));x.fillStyle=top;x.fill();
    if(edge){x.strokeStyle=edge;x.lineWidth=2;x.stroke()}
  }
  const rect=(s)=>{const h=hw;return s.ax=='A'?[[s.a0-h,s.f-h],[s.a1+h,s.f-h],[s.a1+h,s.f+h],[s.a0-h,s.f+h]]:[[s.f-h,s.a0-h],[s.f+h,s.a0-h],[s.f+h,s.a1+h],[s.f-h,s.a1+h]]};
  const carBox=(L,Wd,ang,uc,vc)=>{const fu=Math.cos(ang),fv=Math.sin(ang),ru=-fv,rv=fu;
    return[[1,1],[1,-1],[-1,-1],[-1,1]].map(([a,b])=>[uc+fu*L/2*a+ru*Wd/2*b,vc+fv*L/2*a+rv*Wd/2*b])};

  /* ---------- gameplay ---------- */
  function press(src){
    holds.add(src);
    if(over){if(deadT>.4){reset();started=true;ignore=true}return}
    if(!started){started=true;ignore=true;hud()}
  }
  function release(src){holds.delete(src)}
  function crash(){
    falling=true;fvz=0;sfx('lose');
    for(let i=0;i<10;i++)parts.push({u:cu,v:cv,z:.3,vu:R(-1,1),vv:R(-1,1),vz:R(1,4),life:R(.4,.8),s:R(3,5),col:'#e5e7eb'});
  }
  // a shield puts the car back on the nearest bit of road ahead
  function rescue(){
    let bd=1e9,bu=cu,bv=cv,bx='A';
    for(const s of segs){
      const e=end(s);if(e.u+e.v<cu+cv-1)continue;
      const pu=s.ax=='A'?clamp(cu,s.a0,s.a1):s.f,pv=s.ax=='A'?s.f:clamp(cv,s.a0,s.a1),d=Math.hypot(pu-cu,pv-cv);
      if(d<bd){bd=d;bu=pu;bv=pv;bx=s.ax}
    }
    cu=bu;cv=bv;dirB=bx=='B';theta=dirB?Math.PI/2:0;lock=.7;flash=1;ignore=true;sfx('win');
    for(let i=0;i<14;i++)parts.push({u:cu,v:cv,z:.5,vu:R(-2,2),vv:R(-2,2),vz:R(0,3),life:R(.4,.8),s:R(3,6),col:'#67e8f9'});
  }
  function update(dt){
    time+=dt;if(flash>0)flash-=dt*1.6;
    parts=parts.filter(q=>{q.u+=q.vu*dt;q.v+=q.vv*dt;q.z+=q.vz*dt;q.vz-=6*dt;if(q.z<0)q.z=0;q.life-=dt;return q.life>0});
    if(over){deadT+=dt;hud();return}
    if(!started){hud();return}
    if(ignore&&holds.size==0)ignore=false;
    const want=holds.size>0&&!ignore;
    if(!falling){
      if(lock>0){lock-=dt}else if(want!=dirB){dirB=want;sfx('swipe')}
      // speed starts gentle and builds slowly
      speed=5+Math.min(5.5,dist*.012);dist+=speed*dt;
      if(dirB)cv+=speed*dt;else cu+=speed*dt;
      hw=1.8-Math.min(.5,dist*.0014);
      // steering assist: drift toward the middle of the road you are on, stronger with Grip upgrades
      const sg=segs.find(s=>dirB?(s.ax=='B'&&cv>=s.a0&&cv<=s.a1&&Math.abs(cu-s.f)<hw):(s.ax=='A'&&cu>=s.a0&&cu<=s.a1&&Math.abs(cv-s.f)<hw));
      if(sg){const k=Math.min(1,(1.4+.7*lvl('grip'))*dt);if(dirB)cu+=(sg.f-cu)*k;else cv+=(sg.f-cv)*k}
      if(lock<=0&&!segs.some(s=>inSeg(s,cu,cv,.25+.07*lvl('grip')))){if(shields>0){shields--;rescue()}else crash()}
      const rad=1.1+.45*lvl('mag'),val=1+lvl('pay');
      for(const q of coinsL){
        const dd=Math.hypot(q.u-cu,q.v-cv);
        if(!q.got&&dd<rad){q.got=1;coins+=val;total+=val;sfx('coin');saveG()}
      }
    }else{
      fvz-=22*dt;fz+=fvz*dt;spin+=dt*3;
      if(dirB)cv+=speed*.5*dt;else cu+=speed*.5*dt;
      if(fz<-9){over=true;deadT=0;renderGarage();hud()}
    }
    // heading eases toward the direction (this is the drifting look)
    // quick, never overshoots: the car turns exactly 90 degrees and stops (no sway)
    const tt=dirB?Math.PI/2:0;theta+=clamp(tt-theta,-dt*11,dt*11);
    if(!falling&&Math.abs(tt-theta)>.12&&Math.random()<.7)parts.push({u:cu-Math.cos(theta)*.8,v:cv-Math.sin(theta)*.8,z:.15,vu:R(-.4,.4),vv:R(-.4,.4),vz:R(.3,1),life:R(.35,.6),s:R(4,7),col:'#cbd5e1'});
    camU+=(cu-camU)*Math.min(1,dt*11);camV+=(cv-camV)*Math.min(1,dt*11);
    while(needMore())addSeg();
    while(segs.length>6&&end(segs[1]).u+end(segs[1]).v<cu+cv-14)segs.shift();
    coinsL=coinsL.filter(q=>q.u+q.v>cu+cv-14);
    hud();
  }

  /* ---------- drawing ---------- */
  function text(s,px,py,size,col,al){
    x.font=`${size}px Impact,"Arial Black",sans-serif`;x.textAlign=al||'center';x.lineWidth=Math.max(3,size/7);x.strokeStyle='#000a';x.strokeText(s,px,py);x.fillStyle=col;x.fillText(s,px,py);
  }
  const stars=[...Array(40)].map(()=>({x:R(0,W),y:R(0,H*.6),r:R(.6,1.8),p:R(0,6)}));
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#150f3a');g.addColorStop(.55,'#5b2a86');g.addColorStop(1,'#d94f8a');x.fillStyle=g;x.fillRect(0,0,W,H);
    stars.forEach(s=>{x.globalAlpha=.4+.4*Math.sin(time*2+s.p);x.fillStyle='#fff';x.fillRect(s.x,s.y,s.r,s.r)});x.globalAlpha=1;
    x.fillStyle='#ffb36b';x.beginPath();x.arc(W*.75,H*.3,34,0,7);x.fill();
    // road, far to near
    for(let i=segs.length-1;i>=0;i--){
      const s=segs[i],r=rect(s);
      const mid=P((r[0][0]+r[2][0])/2,(r[0][1]+r[2][1])/2,0)[1];if(mid<-200||mid>H+260)continue;
      slab(r,-1,0,i%2?'#4b5173':'#444a69','#262a42','#7dd3fc');
      x.strokeStyle='#ffffff55';x.lineWidth=2;x.setLineDash([7,9]);
      const a=s.ax=='A'?P(s.a0,s.f,0):P(s.f,s.a0,0),b=s.ax=='A'?P(s.a1,s.f,0):P(s.f,s.a1,0);
      x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();x.setLineDash([]);
    }
    // coins
    coinsL.forEach((q,i)=>{if(q.got)return;const p=P(q.u,q.v,.7+Math.sin(time*3+i)*.1),w=Math.abs(Math.cos(time*4+i))*7+2;
      x.fillStyle='#38bdf8';x.strokeStyle='#e0f2fe';x.lineWidth=2;x.beginPath();x.moveTo(p[0],p[1]-10);x.lineTo(p[0]+w,p[1]);x.lineTo(p[0],p[1]+10);x.lineTo(p[0]-w,p[1]);x.closePath();x.fill();x.stroke()});
    // smoke
    parts.forEach(q=>{const p=P(q.u,q.v,q.z);x.globalAlpha=clamp(q.life*1.6,0,.7);x.fillStyle=q.col;x.beginPath();x.arc(p[0],p[1],q.s*(1.2-q.life*.5),0,7);x.fill()});x.globalAlpha=1;
    // car
    const ang=theta+(falling?spin:0),z0=Math.max(fz,-12);
    x.fillStyle='rgba(0,0,0,.28)';if(!falling){const sp=P(cu,cv,0);x.beginPath();x.ellipse(sp[0],sp[1],20,9,0,0,7);x.fill()}
    const cr=car();
    slab(carBox(cr.L,cr.Wd,ang,cu,cv),z0+.12,z0+.5,cr.top,cr.side);
    slab(carBox(cr.L*.52,cr.Wd*.86,ang,cu-Math.cos(ang)*.1,cv-Math.sin(ang)*.1),z0+.5,z0+.85,cr.cab,cr.cabS);
    if(shields>0&&!falling){const sp=P(cu,cv,.5);x.strokeStyle=`rgba(103,232,249,${.45+.25*Math.sin(time*6)})`;x.lineWidth=3;x.beginPath();x.ellipse(sp[0],sp[1],30,22,0,0,7);x.stroke()}
    if(flash>0){x.fillStyle=`rgba(103,232,249,${clamp(flash,0,1)*.35})`;x.fillRect(0,0,W,H)}
    // hud
    text(String(score()),W/2,60,54,'#fff');
    x.fillStyle='#38bdf8';x.beginPath();x.moveTo(W-70,30);x.lineTo(W-62,40);x.lineTo(W-70,50);x.lineTo(W-78,40);x.closePath();x.fill();
    text(String(coins),W-14,50,26,'#fff','right');
    if(shields>0)text('SHIELD x'+shields,14,34,18,'#67e8f9','left');
    if(!started){x.fillStyle='#0008';x.fillRect(0,H/2-70,W,150);text('DRIFT KING',W/2,H/2-14,46,'#ffd21f');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Hold to drift left, let go to go right',W/2,H/2+20);x.fillText('Tap or press Space to start',W/2,H/2+44)}
    if(over&&deadT>.3){x.fillStyle='#000b';x.fillRect(0,H/2-90,W,180);text('CRASHED',W/2,H/2-28,50,'#ffd21f');text(score()+' pts',W/2,H/2+16,32,'#fff');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Best '+best('drift',score())+'   Tap or press Space to retry',W/2,H/2+52)}
  }

  /* ---------- input and loop ---------- */
  const HK=new Set([' ','ArrowUp','ArrowLeft','ArrowRight','ArrowDown','w','a','d','s','z','x','Enter']);
  on(document,'keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||!HK.has(e.key))return;e.preventDefault();if(!e.repeat)press('k'+e.key)});
  on(document,'keyup',e=>{release('k'+e.key)});
  on(window,'blur',()=>holds.clear());
  on(c,'pointerdown',e=>{e.preventDefault();press('p'+e.pointerId);try{c.setPointerCapture(e.pointerId)}catch(_){}});
  const up=e=>release('p'+e.pointerId);
  on(c,'pointerup',up);on(c,'pointercancel',up);on(c,'lostpointercapture',up);
  reset();
  let last=performance.now(),raf;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
