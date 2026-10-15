// Void Run: a Run 3 style space runner. Steer freely across floating tiles, jump the gaps, avoid blocks.
// Desktop: arrows or A/D to steer, Space or Up to jump. Touch: drag to steer, tap to jump.
function voidrun(el){
  const W=360,H=560,F=14,HY=160,Y0=470,TP=46,COLS=5,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const Sc=D=>F/(F+D),gy=D=>HY+(Y0-HY)*Sc(D),X=(xw,D)=>W/2+xw*TP*Sc(D);
  function shade(h,a){const n=parseInt(h.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v+a*(a<0?v:255-v))));return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`}
  const HUES=['#22d3ee','#a78bfa','#f472b6','#34d399','#fbbf24'];
  const JV=9.5,GR=30,AIR=2*JV/GR; // jump speed, gravity, airtime (seconds)

  let rows,nextK,pathCol,hue,t,time=0,dist,v,px,jy,vy,grounded,coyote,buffer,falling,over,started,orbs,total=0,deadT,reason,lastTxt,stars,steer=0,target=null,holds={l:0,r:0};
  try{total=+localStorage.getItem('void-orbs')||0}catch(e){}

  function reset(){
    rows=new Map();nextK=0;pathCol=2;hue=0;t=0;dist=0;v=9;px=0;jy=0;vy=0;grounded=true;coyote=0;buffer=0;falling=false;over=false;started=false;orbs=0;deadT=0;reason='';lastTxt='';target=null;
    stars=[...Array(70)].map(()=>({a:R(0,6.28),r:R(.05,1)}));
    solid(10,true);
    hud();
  }
  const score=()=>Math.floor(dist);

  /* ---------- level ---------- */
  function addRow(tiles,blocks,orb){rows.set(nextK,{k:nextK,tiles,blocks:blocks||[0,0,0,0,0],orb:orb||[0,0,0,0,0],hue});nextK++}
  function solid(n,plain){
    const lv=Math.min(1,t/120);
    for(let i=0;i<n;i++){
      const tiles=[1,1,1,1,1];
      if(!plain){
        const wide=lv<.5?1:0;
        pathCol=clamp(pathCol+(Math.random()<.3?(Math.random()<.5?-1:1):0),0,4);
        for(let cc=0;cc<COLS;cc++)if(Math.abs(cc-pathCol)>wide&&Math.random()<.1+lv*.25)tiles[cc]=0;
      }
      const orb=[0,0,0,0,0];
      if(!plain&&i%2==0&&Math.random()<.35)orb[pathCol]=1;
      addRow(tiles,null,orb);
    }
  }
  function gap(){
    const lv=Math.min(1,t/120),maxG=Math.max(2,Math.floor(v*.5)-1);
    const g=Math.min(maxG,2+rnd(2+Math.round(lv*2)));
    for(let i=0;i<g;i++)addRow([0,0,0,0,0]);
    return g;
  }
  function blocksRow(){
    const lv=Math.min(1,t/120),free=rnd(COLS),b=[0,0,0,0,0];
    for(let cc=0;cc<COLS;cc++)if(cc!=free&&Math.random()<.45+lv*.25)b[cc]=1;
    pathCol=free;addRow([1,1,1,1,1],b);
  }
  function zig(n){
    let pc=pathCol;
    for(let i=0;i<n;i++){
      pc=clamp(pc+(Math.random()<.4?(Math.random()<.5?-1:1):0),0,4);
      const tiles=[0,0,0,0,0];for(let cc=pc-1;cc<=pc+1;cc++)if(cc>=0&&cc<COLS)tiles[cc]=1;
      const orb=[0,0,0,0,0];if(i%3==1)orb[pc]=1;
      addRow(tiles,null,orb);
    }
    pathCol=pc;
  }
  function chunk(){
    hue=(hue+1)%HUES.length;
    const lv=Math.min(1,t/120),r=Math.random();
    if(r<.38){const g=gap();solid(3);}
    else if(r<.6&&lv>.05){solid(3);blocksRow();solid(3);if(lv>.4){blocksRow()}}
    else if(r<.8&&lv>.1){zig(8+rnd(6));solid(3)}
    else solid(5+rnd(4));
    if(Math.random()<.5)solid(2);
  }

  /* ---------- gameplay ---------- */
  function hud(){
    const s=over?`${reason} Score ${score()}. Best ${best('void',score())}. Tap or press Space to retry.`
      :started?`${score()} m   ${orbs} orbs   Total orbs ${total}`
      :'Arrows or drag to steer, Space or tap to jump.';
    if(s!==lastTxt){lastTxt=s;st(s)}
  }
  function tileAt(k,xw){
    const r=rows.get(k);if(!r)return false;
    const col=Math.floor(xw+COLS/2);return col>=0&&col<COLS&&!!r.tiles[col];
  }
  function groundBelow(){
    const k=Math.floor(dist);
    return tileAt(k,px)||tileAt(k,px-.22)||tileAt(k,px+.22);
  }
  function jump(){
    if(over||falling)return;
    if(!started){started=true;hud()}
    if(grounded||coyote>0){vy=JV;grounded=false;coyote=0;buffer=0;sfx('hop')}else buffer=.13;
  }
  function die(msg,snd){if(over)return;over=true;deadT=0;reason=msg;sfx(snd);hud()}
  function update(dt){
    time+=dt;
    if(over){deadT+=dt;stars.forEach(s=>s.r+=dt*.1);hud();return}
    if(!started){stars.forEach(s=>{s.r+=dt*.15;if(s.r>1.2)s.r=.05});hud();return}
    v=9+Math.min(9,t*.075);t+=dt;
    const dir=(holds.r-holds.l);
    if(target!==null){px+=clamp(target-px,-9*dt,9*dt)}else px+=dir*4.6*dt;
    px=clamp(px,-3.2,3.2);
    if(!falling)dist+=v*dt;else dist+=v*dt*.6;
    while(nextK<dist+45)chunk();
    for(const k of rows.keys())if(k<dist-6)rows.delete(k);
    // vertical motion
    if(grounded){if(!groundBelow()){grounded=false;coyote=.09;vy=0}}
    else{
      jy+=vy*dt;vy-=GR*dt;
      if(!falling&&vy<=0&&jy<=0){
        if(groundBelow()){jy=0;vy=0;grounded=true;if(buffer>0){buffer=0;vy=JV;grounded=false;sfx('hop')}}
        else if(jy<-.25)falling=true;
      }
    }
    if(coyote>0)coyote-=dt;
    if(buffer>0)buffer-=dt;
    if(falling&&jy<-14)die('You fell into the void.','lose');
    // blocks and orbs (player spans about 0.8 deep)
    if(!falling){
      for(let k=Math.floor(dist-.4);k<=Math.floor(dist+.4);k++){
        const r=rows.get(k);if(!r)continue;
        for(let cc=0;cc<COLS;cc++){
          const cx=cc-COLS/2+.5;
          if(r.blocks[cc]&&Math.abs(px-cx)<.62&&jy<1.15){die('You hit a block.','crash');return}
          if(r.orb[cc]&&Math.abs(px-cx)<.6&&jy<2.4){r.orb[cc]=0;orbs++;total++;sfx('coin');try{localStorage.setItem('void-orbs',total)}catch(e){}}
        }
      }
    }
    stars.forEach(s=>{s.r+=dt*(.25+v*.02);if(s.r>1.3){s.r=.03;s.a=R(0,6.28)}});
    hud();
  }

  /* ---------- drawing ---------- */
  function poly(p,col){x.fillStyle=col;x.beginPath();x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);x.closePath();x.fill()}
  function drawRow(r){
    const D0=Math.max(r.k-dist,-3),D1=r.k+1-dist;if(D1<=-3||D0>60)return;
    const col=HUES[r.hue],s0=Sc(D0),s1=Sc(D1),y0=gy(D0),y1=gy(D1);
    x.globalAlpha=D0>48?clamp((60-D0)/12,0,1):1;
    for(let cc=0;cc<COLS;cc++){
      const xa=cc-COLS/2,xb=xa+1;
      if(r.tiles[cc]){
        const top=(r.k+cc)%2?shade(col,-.45):shade(col,-.55);
        poly([X(xa,D0),y0,X(xb,D0),y0,X(xb,D1),y1,X(xa,D1),y1],top);
        if(D0>-.5){x.fillStyle=shade(col,-.75);x.fillRect(X(xa,D0),y0,TP*s0,9*s0)}
        x.strokeStyle=shade(col,.1);x.globalAlpha*=.55;x.lineWidth=1.2;x.strokeRect(X(xa,D0),y1,(X(xb,D1)-X(xa,D1)),y0-y1);x.globalAlpha=D0>48?clamp((60-D0)/12,0,1):1;
      }
      if(r.blocks[cc]){
        const h=34;
        poly([X(xa,D0),y0-h*s0,X(xb,D0),y0-h*s0,X(xb,D1),y1-h*s1,X(xa,D1),y1-h*s1],'#ff9ad0');
        x.fillStyle='#e0287e';x.fillRect(X(xa,D0),y0-h*s0,TP*s0,h*s0);
        x.fillStyle='#fff7';x.fillRect(X(xa,D0),y0-h*s0,TP*s0,2*s0+1);
      }
      if(r.orb[cc]){
        const cx=X(xa+.5,r.k+.5-dist),oy=gy(r.k+.5-dist)-(30+Math.sin(time*4+r.k)*4)*Sc(r.k+.5-dist),rr=9*Sc(r.k+.5-dist);
        x.fillStyle='#67e8f9';x.shadowColor='#22d3ee';x.shadowBlur=10;x.beginPath();x.arc(cx,oy,rr,0,7);x.fill();x.shadowBlur=0;
        x.fillStyle='#fff';x.beginPath();x.arc(cx-rr*.3,oy-rr*.3,rr*.35,0,7);x.fill();
      }
    }
    x.globalAlpha=1;
  }
  function alien(){
    const cx=X(px,0),gb=Y0-Math.max(jy,-1000)*18,fall=falling?clamp(-jy/14,0,1):0;
    const ph=time*(started&&!over?14:4),run=grounded&&started?Math.sin(ph):0;
    x.save();x.globalAlpha=1-fall*.6;
    x.fillStyle='rgba(0,0,0,.35)';if(!falling){x.beginPath();x.ellipse(cx,Y0,15-jy*3,5,0,0,7);x.fill()}
    x.lineCap='round';x.strokeStyle='#14532d';x.lineWidth=6;
    for(const sd of[-1,1]){x.beginPath();x.moveTo(cx+sd*5,gb-22);x.lineTo(cx+sd*5+Math.sin(run*sd)*5,gb-(grounded?Math.max(0,4-Math.cos(run*sd)*6):10));x.stroke()}
    x.fillStyle='#4ade80';x.beginPath();x.ellipse(cx,gb-32,12,14,0,0,7);x.fill();
    x.fillStyle='#22c55e';x.beginPath();x.ellipse(cx,gb-30,8,10,0,0,7);x.fill();
    x.fillStyle='#86efac';x.beginPath();x.arc(cx,gb-50,11,0,7);x.fill();
    x.strokeStyle='#86efac';x.lineWidth=2;x.beginPath();x.moveTo(cx,gb-60);x.lineTo(cx+Math.sin(time*5)*3,gb-70);x.stroke();
    x.fillStyle='#fde047';x.beginPath();x.arc(cx+Math.sin(time*5)*3,gb-71,3,0,7);x.fill();
    x.restore();
  }
  function text(s,px,py,size,col,al){
    x.font=`${size}px Impact,"Arial Black",sans-serif`;x.textAlign=al||'center';x.lineWidth=Math.max(3,size/7);x.strokeStyle='#000a';x.strokeText(s,px,py);x.fillStyle=col;x.fillText(s,px,py);
  }
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#05030f');g.addColorStop(.45,'#1b0f3d');g.addColorStop(1,'#07131f');x.fillStyle=g;x.fillRect(0,0,W,H);
    const ng=x.createRadialGradient(W*.7,HY-30,5,W*.7,HY-30,150);ng.addColorStop(0,'#7c3aed66');ng.addColorStop(1,'#7c3aed00');x.fillStyle=ng;x.fillRect(0,0,W,HY+120);
    stars.forEach(s=>{const r0=s.r*s.r,r1=Math.max(0,(s.r-.04*(v/9)))*Math.max(0,s.r-.04*(v/9));
      const x0=W/2+Math.cos(s.a)*r0*380,y0=HY-20+Math.sin(s.a)*r0*300,x1=W/2+Math.cos(s.a)*r1*380,y1=HY-20+Math.sin(s.a)*r1*300;
      x.globalAlpha=clamp(s.r*1.4,0,1);x.strokeStyle='#fff';x.lineWidth=s.r>.6?1.8:1;x.beginPath();x.moveTo(x1,y1);x.lineTo(x0,y0);x.stroke()});x.globalAlpha=1;
    const kc=Math.floor(dist);
    for(let k=Math.floor(dist+60);k>=kc-3;k--){
      const r=rows.get(k);if(r)drawRow(r);
      if(k==kc)alien();
    }
    text(String(score()),14,46,40,'#fff','left');
    x.fillStyle='#67e8f9';x.beginPath();x.arc(W-86,34,8,0,7);x.fill();text(String(orbs),W-14,44,26,'#fff','right');
    if(!started){x.fillStyle='#0008';x.fillRect(0,H/2-70,W,150);text('VOID RUN',W/2,H/2-14,46,'#67e8f9');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Arrows or drag to steer, Space or tap to jump',W/2,H/2+20);x.fillText('Tap or press Space to start',W/2,H/2+44)}
    if(over&&deadT>.4){x.fillStyle='#000b';x.fillRect(0,H/2-90,W,180);text('GAME OVER',W/2,H/2-28,46,'#67e8f9');text(score()+' m',W/2,H/2+16,32,'#fff');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Best '+best('void',score())+'   Tap or press Space to retry',W/2,H/2+52)}
  }

  /* ---------- input and loop ---------- */
  on(document,'keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const k=e.key;
    if(k=='ArrowLeft'||k=='a'||k=='A'){e.preventDefault();holds.l=1;target=null}
    else if(k=='ArrowRight'||k=='d'||k=='D'){e.preventDefault();holds.r=1;target=null}
    else if(k==' '||k=='ArrowUp'||k=='w'||k=='W'||k=='Enter'){
      e.preventDefault();if(e.repeat)return;
      if(over){if(deadT>.4){reset();started=true}}else jump();
    }
  });
  on(document,'keyup',e=>{const k=e.key;if(k=='ArrowLeft'||k=='a'||k=='A')holds.l=0;if(k=='ArrowRight'||k=='d'||k=='D')holds.r=0});
  on(window,'blur',()=>{holds.l=holds.r=0});
  let pd=null;
  const toX=e=>{const rc=c.getBoundingClientRect();return((e.clientX-rc.left)/rc.width*W-W/2)/TP};
  on(c,'pointerdown',e=>{e.preventDefault();pd={x:e.clientX,y:e.clientY,t:performance.now(),moved:false};try{c.setPointerCapture(e.pointerId)}catch(_){}});
  on(c,'pointermove',e=>{
    if(!pd)return;
    if(Math.hypot(e.clientX-pd.x,e.clientY-pd.y)>12)pd.moved=true;
    if(pd.moved&&started&&!over)target=clamp(toX(e),-2.4,2.4);
  });
  const end=e=>{
    if(!pd)return;const quick=!pd.moved&&performance.now()-pd.t<350;pd=null;target=null;
    if(quick){if(over){if(deadT>.4){reset();started=true}}else jump()}
  };
  on(c,'pointerup',end);on(c,'pointercancel',()=>{pd=null;target=null});
  reset();
  let last=performance.now(),raf;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
