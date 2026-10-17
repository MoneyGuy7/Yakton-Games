// Void Run: a Run 3 style space runner. You run down a square tunnel with four faces (floor, both walls and the ceiling).
// Every face has floating tiles with holes. Run left or right and you keep going around the corner onto the wall,
// then the ceiling, and the whole tunnel spins so you are always "on the floor". Jump holes and pink blocks.
// Desktop: arrows or A/D to run around, Space or Up to jump. Touch: drag to run around, tap to jump.
function voidrun(el){
  const W=360,H=560,F=14,VY=322,TPc=58,COLS=5,N=COLS*4,HH=COLS/2,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mod=i=>((i%N)+N)%N,Sc=D=>F/(F+D);
  function shade(h,a){const n=parseInt(h.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v+a*(a<0?v:255-v))));return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`}
  const HUES=['#22d3ee','#a78bfa','#f472b6','#34d399','#fbbf24'];
  const JV=9.5,GR=30; // jump speed and gravity (tile units per second)
  // unrotated square outline: vertex i of the perimeter (q = i), face f = floor(i/COLS). Face 0 floor, 1 right wall, 2 ceiling, 3 left wall.
  const NRM=[[0,1],[1,0],[0,-1],[-1,0]];
  function perim(q){q=((q%N)+N)%N;const f=Math.floor(q/COLS),t=q-f*COLS;
    return f==0?[t-HH,HH]:f==1?[HH,HH-t]:f==2?[HH-t,-HH]:[-HH,t-HH]}
  let VR=[]; // rotated outline vertices for this frame (N+1 of them)

  let rows,nextK,pc,turnDir,hue,t,time=0,dist,v,q,jy,vy,grounded,coyote,buffer,falling,over,started,orbs,total=0,deadT,reason,lastTxt,stars,phi=0,face=0,holds={l:0,r:0},ana=0,pd=null;
  try{total=+localStorage.getItem('void-orbs')||0}catch(e){}

  function reset(){
    rows=new Map();nextK=0;pc=2.5;turnDir=0;hue=0;t=0;dist=0;v=9;q=2.5;face=0;phi=0;jy=0;vy=0;grounded=true;coyote=0;buffer=0;falling=false;over=false;started=false;orbs=0;deadT=0;reason='';lastTxt='';ana=0;
    stars=[...Array(70)].map(()=>({a:R(0,6.28),r:R(.05,1)}));
    solid(10,true);
    hud();
  }
  const score=()=>Math.floor(dist);

  /* ---------- level ---------- */
  const lvl=()=>Math.min(1,t/120);
  function addRow(tiles,blocks,orb){rows.set(nextK,{k:nextK,tiles,blocks:blocks||Array(N).fill(0),orb:orb||Array(N).fill(0),hue});nextK++}
  const pcol=()=>mod(Math.floor(pc));
  // other faces: scattered tiles with holes. The route (3 tiles wide, then 1 tile wide later) is always there.
  function scatter(P,wide){
    const tiles=Array(N).fill(0);
    for(let i=0;i<N;i++)if(Math.random()<P)tiles[i]=1;
    for(let d=-wide;d<=wide;d++)tiles[mod(Math.floor(pc)+d)]=1;
    return tiles;
  }
  function solid(n,plain){
    const lv=lvl();
    for(let i=0;i<n;i++){
      let tiles;
      if(plain)tiles=Array(N).fill(1);
      else{
        if(Math.random()<.18)pc+=Math.random()<.5?-1:1;
        tiles=scatter(.78-lv*.28,lv<.55?1:0);
      }
      const orb=Array(N).fill(0);
      if(!plain&&i%2==0&&Math.random()<.35)orb[pcol()]=1;
      addRow(tiles,null,orb);
    }
  }
  function gap(){
    const lv=lvl(),maxG=Math.max(2,Math.floor(v*.5)-1);
    const g=Math.min(maxG,2+rnd(2+Math.round(lv*2)));
    for(let i=0;i<g;i++)addRow(Array(N).fill(0));
    return g;
  }
  function blocksRow(){
    const lv=lvl(),b=Array(N).fill(0),c0=Math.floor(pc);
    for(let i=0;i<N;i++){
      const d=Math.min(mod(i-c0),mod(c0-i));
      if(d>1&&d<=4&&Math.random()<.45+lv*.25)b[i]=1;
    }
    // always leave the route's own tile (and often a neighbour) free so a jump is never forced into a wall of blocks
    addRow(scatter(.9,1),b);
  }
  // the route curves around the tunnel: you end up on the wall, then the ceiling
  function turn(n,dir){
    for(let i=0;i<n;i++){
      pc+=dir/3;
      const tiles=scatter(.4,0);
      const c0=Math.floor(pc);for(let d=-1;d<=1;d++)tiles[mod(c0+d)]=1;
      const orb=Array(N).fill(0);if(i%3==1)orb[mod(c0)]=1;
      addRow(tiles,null,orb);
    }
  }
  function chunk(){
    hue=(hue+1)%HUES.length;
    const lv=lvl(),r=Math.random();
    if(r<.26){gap();solid(3)}
    else if(r<.42&&lv>.05){solid(3);blocksRow();solid(3);if(lv>.4)blocksRow()}
    else if(r<.78){turn(9+rnd(8),Math.random()<.5?-1:1);solid(3)}
    else solid(5+rnd(4));
    if(Math.random()<.5)solid(2);
  }

  /* ---------- gameplay ---------- */
  function hud(){
    const s=over?`${reason} Score ${score()}. Best ${best('void',score())}. Tap or press Space to retry.`
      :started?`${score()} m   ${orbs} orbs   Total orbs ${total}`
      :'Arrows or drag to run around the tunnel (onto the walls and ceiling), Space or tap to jump.';
    if(s!==lastTxt){lastTxt=s;st(s)}
  }
  function tileAt(k,qq){const r=rows.get(k);return !!(r&&r.tiles[mod(Math.floor(qq))])}
  function groundBelow(){const k=Math.floor(dist);return tileAt(k,q)||tileAt(k,q-.22)||tileAt(k,q+.22)}
  function jump(){
    if(over||falling)return;
    if(!started){started=true;hud()}
    if(grounded||coyote>0){vy=JV;grounded=false;coyote=0;buffer=0;sfx('hop')}else buffer=.13;
  }
  function die(msg,snd){if(over)return;over=true;deadT=0;reason=msg;sfx(snd);hud()}
  function update(dt){
    time+=dt;
    // camera spin follows the face you are on
    phi+=(face*Math.PI/2-phi)*Math.min(1,dt*11);
    if(over){deadT+=dt;stars.forEach(s=>s.r+=dt*.1);hud();return}
    if(!started){stars.forEach(s=>{s.r+=dt*.15;if(s.r>1.2)s.r=.05});hud();return}
    v=9+Math.min(9,t*.075);t+=dt;
    const dir=ana!==0?ana:(holds.r-holds.l);
    if(!falling){const nf=Math.floor((q+dir*5.2*dt)/COLS);q+=dir*5.2*dt;if(nf!=face){face=nf;sfx('swipe')}}
    if(!falling)dist+=v*dt;else dist+=v*dt*.6;
    while(nextK<dist+45)chunk();
    for(const k of rows.keys())if(k<dist-6)rows.delete(k);
    // vertical motion (away from the surface you stand on)
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
      const base=Math.floor(q);
      for(let k=Math.floor(dist-.4);k<=Math.floor(dist+.4);k++){
        const r=rows.get(k);if(!r)continue;
        for(let d=-1;d<=2;d++){
          const idx=base+d,i=mod(idx),cx=idx+.5;
          if(r.blocks[i]&&Math.abs(q-cx)<.62&&jy<1.15){die('You hit a block.','crash');return}
          if(r.orb[i]&&Math.abs(q-cx)<.6&&jy<2.4){r.orb[i]=0;orbs++;total++;sfx('coin');try{localStorage.setItem('void-orbs',total)}catch(e){}}
        }
      }
    }
    stars.forEach(s=>{s.r+=dt*(.25+v*.02);if(s.r>1.3){s.r=.03;s.a=R(0,6.28)}});
    hud();
  }

  /* ---------- drawing ---------- */
  function poly(p,col){x.fillStyle=col;x.beginPath();x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);x.closePath();x.fill()}
  const rot=(a,b)=>{const cs=Math.cos(phi),sn=Math.sin(phi);return[a*cs-b*sn,a*sn+b*cs]};
  const sx=(a,s)=>W/2+a*TPc*s,sy=(b,s)=>VY+b*TPc*s;
  function buildRing(){VR=[];for(let i=0;i<=N;i++){const p=perim(i);VR.push(rot(p[0],p[1]))}}
  // screen point of perimeter position qq at depth D, pushed `up` tile units inward from the surface
  function pt(qq,D,up){const f=Math.floor(mod(qq)/COLS),p=perim(qq),n=NRM[f],r=rot(p[0]-n[0]*up,p[1]-n[1]*up),s=Sc(D);return[sx(r[0],s),sy(r[1],s)]}
  function drawRow(r){
    const D0=Math.max(r.k-dist,-3),D1=r.k+1-dist;if(D1<=-3||D0>60)return;
    const col=HUES[r.hue],s0=Sc(D0),s1=Sc(D1),fadeA=D0>48?clamp((60-D0)/12,0,1):1,near=D0<26;
    x.globalAlpha=fadeA;
    for(let i=0;i<N;i++){
      if(!r.tiles[i])continue;
      const f=Math.floor(i/COLS),a=VR[i],b=VR[i+1];
      const sh=((r.k+i)%2?-.42:-.52)-(f&1?.08:0);
      poly([sx(a[0],s0),sy(a[1],s0),sx(b[0],s0),sy(b[1],s0),sx(b[0],s1),sy(b[1],s1),sx(a[0],s1),sy(a[1],s1)],shade(col,sh));
      if(near){x.strokeStyle=shade(col,.12);x.globalAlpha=fadeA*.5;x.lineWidth=1.1;x.beginPath();x.moveTo(sx(a[0],s0),sy(a[1],s0));x.lineTo(sx(b[0],s0),sy(b[1],s0));x.lineTo(sx(b[0],s1),sy(b[1],s1));x.stroke();x.globalAlpha=fadeA}
    }
    // blocks and orbs sit on top of the tiles
    for(let i=0;i<N;i++){
      if(r.blocks[i]){
        const hb=.72,A0=pt(i,D0,0),B0=pt(i+1,D0,0),A0u=pt(i,D0,hb),B0u=pt(i+1,D0,hb),A1=pt(i,D1,0),B1=pt(i+1,D1,0),A1u=pt(i,D1,hb),B1u=pt(i+1,D1,hb);
        poly([...A0,...A0u,...A1u,...A1],'#b8195f');poly([...B0,...B0u,...B1u,...B1],'#b8195f');
        poly([...A0u,...B0u,...B1u,...A1u],'#ff9ad0');
        poly([...A0,...B0,...B0u,...A0u],'#e0287e');
        x.fillStyle='#fff7';x.beginPath();x.moveTo(A0u[0],A0u[1]);x.lineTo(B0u[0],B0u[1]);x.lineTo(B0u[0],B0u[1]+2*s0);x.lineTo(A0u[0],A0u[1]+2*s0);x.fill();
      }
      if(r.orb[i]){
        const Dm=r.k+.5-dist,p=pt(i+.5,Dm,.8+Math.sin(time*4+r.k)*.08),rr=9*Sc(Dm);
        x.fillStyle='#67e8f9';x.shadowColor='#22d3ee';x.shadowBlur=10;x.beginPath();x.arc(p[0],p[1],rr,0,7);x.fill();x.shadowBlur=0;
        x.fillStyle='#fff';x.beginPath();x.arc(p[0]-rr*.3,p[1]-rr*.3,rr*.35,0,7);x.fill();
      }
    }
    x.globalAlpha=1;
  }
  function alien(){
    const base=pt(q,0,0),n=NRM[Math.floor(mod(q)/COLS)],nr=rot(n[0],n[1]),psi=Math.atan2(-nr[0],nr[1]);
    const fall=falling?clamp(-jy/14,0,1):0,ph=time*(started&&!over?14:4),run=grounded&&started?Math.sin(ph):0,gb=-jy*30;
    x.save();x.translate(base[0],base[1]);
    x.fillStyle='rgba(0,0,0,.35)';if(!falling){x.save();x.rotate(psi);x.beginPath();x.ellipse(0,0,15-jy*3,5,0,0,7);x.fill();x.restore()}
    x.rotate(psi);x.globalAlpha=1-fall*.6;
    x.lineCap='round';x.strokeStyle='#14532d';x.lineWidth=6;
    for(const sd of[-1,1]){x.beginPath();x.moveTo(sd*5,gb-22);x.lineTo(sd*5+Math.sin(run*sd)*5,gb-(grounded?Math.max(0,4-Math.cos(run*sd)*6):10));x.stroke()}
    x.fillStyle='#4ade80';x.beginPath();x.ellipse(0,gb-32,12,14,0,0,7);x.fill();
    x.fillStyle='#22c55e';x.beginPath();x.ellipse(0,gb-30,8,10,0,0,7);x.fill();
    x.fillStyle='#86efac';x.beginPath();x.arc(0,gb-50,11,0,7);x.fill();
    x.strokeStyle='#86efac';x.lineWidth=2;x.beginPath();x.moveTo(0,gb-60);x.lineTo(Math.sin(time*5)*3,gb-70);x.stroke();
    x.fillStyle='#fde047';x.beginPath();x.arc(Math.sin(time*5)*3,gb-71,3,0,7);x.fill();
    x.restore();
  }
  function text(s,px,py,size,col,al){
    x.font=`${size}px Impact,"Arial Black",sans-serif`;x.textAlign=al||'center';x.lineWidth=Math.max(3,size/7);x.strokeStyle='#000a';x.strokeText(s,px,py);x.fillStyle=col;x.fillText(s,px,py);
  }
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#05030f');g.addColorStop(.45,'#1b0f3d');g.addColorStop(1,'#07131f');x.fillStyle=g;x.fillRect(0,0,W,H);
    const ng=x.createRadialGradient(W/2,VY,5,W/2,VY,170);ng.addColorStop(0,'#7c3aed88');ng.addColorStop(1,'#7c3aed00');x.fillStyle=ng;x.fillRect(0,0,W,H);
    stars.forEach(s=>{const r0=s.r*s.r,r1=Math.max(0,(s.r-.04*(v/9)))*Math.max(0,s.r-.04*(v/9));
      const x0=W/2+Math.cos(s.a)*r0*380,y0=VY+Math.sin(s.a)*r0*300,x1=W/2+Math.cos(s.a)*r1*380,y1=VY+Math.sin(s.a)*r1*300;
      x.globalAlpha=clamp(s.r*1.4,0,1)*.7;x.strokeStyle='#fff';x.lineWidth=s.r>.6?1.8:1;x.beginPath();x.moveTo(x1,y1);x.lineTo(x0,y0);x.stroke()});x.globalAlpha=1;
    buildRing();
    const kc=Math.floor(dist);
    for(let k=Math.floor(dist+60);k>=kc-3;k--){
      const r=rows.get(k);if(r)drawRow(r);
      if(k==kc)alien();
    }
    text(String(score()),14,46,40,'#fff','left');
    x.fillStyle='#67e8f9';x.beginPath();x.arc(W-86,34,8,0,7);x.fill();text(String(orbs),W-14,44,26,'#fff','right');
    if(!started){x.fillStyle='#0008';x.fillRect(0,H/2-86,W,176);text('VOID RUN',W/2,H/2-30,46,'#67e8f9');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Arrows or drag: run around the tunnel',W/2,H/2+2);x.fillText('Walls and ceiling count. Space or tap: jump',W/2,H/2+26);x.fillText('Tap or press Space to start',W/2,H/2+54)}
    if(over&&deadT>.4){x.fillStyle='#000b';x.fillRect(0,H/2-90,W,180);text('GAME OVER',W/2,H/2-28,46,'#67e8f9');text(score()+' m',W/2,H/2+16,32,'#fff');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Best '+best('void',score())+'   Tap or press Space to retry',W/2,H/2+52)}
  }

  /* ---------- input and loop ---------- */
  on(document,'keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const k=e.key;
    if(k=='ArrowLeft'||k=='a'||k=='A'){e.preventDefault();holds.l=1}
    else if(k=='ArrowRight'||k=='d'||k=='D'){e.preventDefault();holds.r=1}
    else if(k==' '||k=='ArrowUp'||k=='w'||k=='W'||k=='Enter'){
      e.preventDefault();if(e.repeat)return;
      if(over){if(deadT>.4){reset();started=true}}else jump();
    }
  });
  on(document,'keyup',e=>{const k=e.key;if(k=='ArrowLeft'||k=='a'||k=='A')holds.l=0;if(k=='ArrowRight'||k=='d'||k=='D')holds.r=0});
  on(window,'blur',()=>{holds.l=holds.r=0});
  // touch: drag left or right from where you touched; the further you drag, the faster you run around
  on(c,'pointerdown',e=>{e.preventDefault();pd={x:e.clientX,y:e.clientY,t:performance.now(),moved:false};try{c.setPointerCapture(e.pointerId)}catch(_){}});
  on(c,'pointermove',e=>{
    if(!pd)return;
    if(Math.hypot(e.clientX-pd.x,e.clientY-pd.y)>12)pd.moved=true;
    if(pd.moved&&started&&!over){const rc=c.getBoundingClientRect();ana=clamp((e.clientX-pd.x)/(rc.width*.12),-1,1)}
  });
  const end=e=>{
    if(!pd)return;const quick=!pd.moved&&performance.now()-pd.t<350;pd=null;ana=0;
    if(quick){if(over){if(deadT>.4){reset();started=true}}else jump()}
  };
  on(c,'pointerup',end);on(c,'pointercancel',()=>{pd=null;ana=0});
  reset();
  c.__vr={st(){return{q,dist,face,phi,jy,over,started,falling,t,rows,pc}},step:update,reset,jump,hold(l,r){holds.l=l;holds.r=r},manual:0};
  let last=performance.now(),raf;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!c.__vr.manual)update(dt);draw();raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
