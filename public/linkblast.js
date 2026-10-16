// Link Blast: a connect-the-dots shooter.
// Drag from node to node to link them. Every linked node fires, and the lines themselves are lasers.
// Drag back to the first node to close a loop: the circle blasts everything inside it and drops a power-up.
// Power-ups: more shots per node, more damage, piercing bullets, freeze, fast recharge, extra life, bomb.
function linkblast(el){
  const W=360,H=560,BASE=H-46,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none;cursor:crosshair`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const COOL=2.2;
  const POW={
    shots:{t:'+SHOT',col:'#22d3ee',w:5,tip:'More shots per node'},
    dmg:{t:'+DAMAGE',col:'#f97316',w:4,tip:'Bullets hit harder'},
    pierce:{t:'+PIERCE',col:'#a3e635',w:4,tip:'Bullets pass through enemies'},
    freeze:{t:'FREEZE',col:'#93c5fd',w:3,tip:'Enemies freeze for 4 seconds'},
    charge:{t:'FAST CHARGE',col:'#facc15',w:3,tip:'Nodes recharge quickly for 10 seconds'},
    heal:{t:'+LIFE',col:'#f43f5e',w:2,tip:'Heal one heart'},
    bomb:{t:'BOMB',col:'#fb7185',w:3,tip:'Blast every enemy'}
  };
  const pickPow=()=>{const ks=Object.keys(POW);let tot=0;ks.forEach(k=>tot+=POW[k].w);let r=Math.random()*tot;for(const k of ks){if(r<POW[k].w)return k;r-=POW[k].w}return'shots'};

  let nodes,foes,shots,pops,lasers,parts,floats,chain,closed,ptr,hearts,score,time,spawnT,extra,dmgLv,pierce,freezeT,chargeT,started,over,deadT,shake,lastTxt,flash;

  function reset(){
    nodes=[];
    for(let r=0;r<3;r++)for(let k=0;k<3;k++)nodes.push({x:70+k*110+R(-20,20),y:290+r*72+R(-12,12),cd:0});
    foes=[];shots=[];pops=[];lasers=[];parts=[];floats=[];chain=[];closed=false;ptr=null;hearts=5;score=0;time=0;spawnT=1;
    extra=0;dmgLv=0;pierce=0;freezeT=0;chargeT=0;started=false;over=false;deadT=0;shake=0;lastTxt='';flash=0;
    hud();
  }
  const wave=()=>1+Math.floor(time/20);
  function hud(){
    const s=over?`Base destroyed! ${score} kills, wave ${wave()}. Best ${best('linkblast',score)}. Tap or press Enter.`
      :started?`${score} kills   Wave ${wave()}   ${1+extra} shot${extra?'s':''} per node`
      :'Drag from dot to dot to link them. Drag back to the first dot to close a loop.';
    if(s!==lastTxt){lastTxt=s;st(s)}
  }
  const say=(t,px,py,col)=>floats.push({t,x:px,y:py,col,life:1.1});
  function burst(px,py,col,n){for(let i=0;i<n;i++)parts.push({x:px,y:py,vx:R(-110,110),vy:R(-110,110),life:R(.3,.7),col})}

  /* ---------- enemies, shots, power-ups ---------- */
  function spawnFoe(){
    const w=wave(),r=Math.random();let f;
    if(w>=3&&r<.18)f={r:20,hp:8+w*4,sp:.6,col:'#7c3aed',tank:1};
    else if(w>=2&&r<.4)f={r:10,hp:2+w*.6,sp:1.9,col:'#facc15'};
    else f={r:14,hp:3+w*1.7,sp:1,col:'#ef4444'};
    f.hp=Math.round(f.hp);f.max=f.hp;f.x=R(24,W-24);f.y=-24;f.base=24+w*2.5;
    foes.push(f);
  }
  function damage(f,d){
    f.hp-=d;f.hit=.1;
    if(f.hp<=0&&!f.dead){
      f.dead=1;score+=f.tank?3:1;burst(f.x,f.y,f.col,8);sfx('splat');
      if(Math.random()<(f.tank?.4:.09))pops.push({x:f.x,y:f.y,k:pickPow()});
    }
  }
  function fire(ch,isLoop){
    const cool=COOL*(chargeT>0?.3:1);
    ch.forEach(n=>n.cd=cool);
    const pts=ch.map(n=>[n.x,n.y]);if(isLoop)pts.push([ch[0].x,ch[0].y]);
    lasers.push({pts,t:.9,loop:isLoop});
    const live=foes.filter(f=>!f.dead).sort((a,b)=>b.y-a.y),per=1+extra;
    ch.forEach((n,i)=>{
      for(let j=0;j<per;j++){
        const tg=live.length?live[(i+j)%Math.min(live.length,4)]:null;
        let a=tg?Math.atan2(tg.y-n.y,tg.x-n.x):-Math.PI/2+(j-(per-1)/2)*.18;
        if(tg&&per>1)a+=(j-(per-1)/2)*.07;
        shots.push({x:n.x,y:n.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,d:2+dmgLv,p:pierce,hit:new Set()});
      }
    });
    sfx('hop');
    if(isLoop){
      // the circle: blast everything inside and drop a power-up in the middle
      let cx=0,cy=0;ch.forEach(n=>{cx+=n.x;cy+=n.y});cx/=ch.length;cy/=ch.length;
      foes.forEach(f=>{if(!f.dead&&inside(f.x,f.y,ch))damage(f,10+dmgLv*2)});
      pops.push({x:cx,y:cy,k:pickPow()});
      lasers.push({pts:pts,t:.5,loop:true,fill:1});
      say('LOOP!',cx,cy-18,'#fff');shake=.2;sfx('win');
    }
  }
  function inside(px,py,ch){let ins=false;for(let i=0,j=ch.length-1;i<ch.length;j=i++){const a=ch[i],b=ch[j];if((a.y>py)!=(b.y>py)&&px<(b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x)ins=!ins}return ins}
  function segDist(px,py,a,b){
    const dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy||1,t=clamp(((px-a[0])*dx+(py-a[1])*dy)/l2,0,1);
    return Math.hypot(px-(a[0]+dx*t),py-(a[1]+dy*t));
  }
  function grab(p){
    const i=pops.indexOf(p);if(i<0)return;pops.splice(i,1);
    const d=POW[p.k];say(d.t,p.x,p.y,d.col);sfx('coin');burst(p.x,p.y,d.col,10);
    if(p.k=='shots')extra=Math.min(5,extra+1);
    else if(p.k=='dmg')dmgLv=Math.min(6,dmgLv+1);
    else if(p.k=='pierce')pierce=Math.min(4,pierce+1);
    else if(p.k=='freeze')freezeT=4;
    else if(p.k=='charge'){chargeT=10;nodes.forEach(n=>n.cd=Math.min(n.cd,.2))}
    else if(p.k=='heal'){if(hearts<5)hearts++;else score+=2}
    else if(p.k=='bomb'){foes.forEach(f=>{if(!f.dead)damage(f,8+dmgLv*2)});shake=.3;flash=.5;sfx('crash')}
    hud();
  }

  /* ---------- update ---------- */
  function update(dt){
    time+=started&&!over?dt:0;
    parts=parts.filter(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;return q.life>0});
    floats=floats.filter(f=>{f.y-=26*dt;f.life-=dt;return f.life>0});
    if(shake>0)shake-=dt;if(flash>0)flash-=dt;
    if(over){deadT+=dt;return}
    if(!started){hud();return}
    if(freezeT>0)freezeT-=dt;if(chargeT>0)chargeT-=dt;
    nodes.forEach(n=>{if(n.cd>0)n.cd=Math.max(0,n.cd-dt)});
    spawnT-=dt;if(spawnT<=0){spawnFoe();if(wave()>=4&&Math.random()<.3)spawnFoe();spawnT=Math.max(.45,1.5-.07*wave())}
    for(const f of foes){
      f.y+=f.base*f.sp*(freezeT>0?.12:1)*dt;if(f.hit>0)f.hit-=dt;
      if(f.y>=BASE&&!f.dead){f.dead=1;hearts--;shake=.3;sfx('crash');burst(f.x,BASE,'#fff',10);if(hearts<=0){over=true;deadT=0;sfx('lose');best('linkblast',score)}}
    }
    for(const s of shots){
      s.x+=s.vx*dt;s.y+=s.vy*dt;
      for(const f of foes){
        if(f.dead||s.dead||s.hit.has(f))continue;
        if(Math.hypot(f.x-s.x,f.y-s.y)<f.r+4){damage(f,s.d);s.hit.add(f);if(s.p>0)s.p--;else s.dead=1}
      }
      for(const p of pops.slice())if(Math.hypot(p.x-s.x,p.y-s.y)<18)grab(p);
      if(s.x<-20||s.x>W+20||s.y<-30||s.y>H+20)s.dead=1;
    }
    // the lines are lasers while they glow
    for(const l of lasers){
      l.t-=dt;
      for(let i=0;i<l.pts.length-1;i++){
        const a=l.pts[i],b=l.pts[i+1];
        for(const f of foes)if(!f.dead&&segDist(f.x,f.y,a,b)<f.r+3){f.laser=(f.laser||0)+dt;if(f.laser>=.15){f.laser=0;damage(f,1+Math.floor(dmgLv/2))}}
        for(const p of pops.slice())if(segDist(p.x,p.y,a,b)<14)grab(p);
      }
    }
    for(const p of pops){p.y+=26*dt;if(p.y>BASE)p.gone=1}
    foes=foes.filter(f=>!f.dead);shots=shots.filter(s=>!s.dead);lasers=lasers.filter(l=>l.t>0);pops=pops.filter(p=>!p.gone);
    hud();
  }

  /* ---------- drawing ---------- */
  function text(s,px,py,size,col,al){
    x.font=`${size}px Impact,"Arial Black",sans-serif`;x.textAlign=al||'center';x.lineWidth=Math.max(3,size/7);x.strokeStyle='#000a';x.strokeText(s,px,py);x.fillStyle=col;x.fillText(s,px,py);
  }
  function glow(col,w,pts,closeIt){
    x.lineJoin='round';x.lineCap='round';
    x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)x.lineTo(pts[i][0],pts[i][1]);if(closeIt)x.closePath();
    x.strokeStyle=col+'44';x.lineWidth=w*3;x.stroke();x.strokeStyle=col;x.lineWidth=w;x.stroke();
  }
  function draw(){
    x.save();if(shake>0)x.translate(R(-3,3),R(-3,3));
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0b0b24');g.addColorStop(1,'#1d1245');x.fillStyle=g;x.fillRect(-5,-5,W+10,H+10);
    x.strokeStyle='#ffffff0d';x.lineWidth=1;for(let i=0;i<W;i+=30){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke()}for(let i=0;i<H;i+=30){x.beginPath();x.moveTo(0,i);x.lineTo(W,i);x.stroke()}
    // base line
    x.fillStyle=freezeT>0?'#93c5fd':'#22d3ee';x.fillRect(0,BASE+8,W,3);x.fillStyle='#22d3ee18';x.fillRect(0,BASE+8,W,H-BASE);
    // lasers
    for(const l of lasers){x.globalAlpha=clamp(l.t*1.6,0,1);
      if(l.fill){x.fillStyle='#22d3ee';x.globalAlpha=clamp(l.t,0,.5)*.6;x.beginPath();x.moveTo(l.pts[0][0],l.pts[0][1]);l.pts.forEach(p=>x.lineTo(p[0],p[1]));x.fill();x.globalAlpha=clamp(l.t*1.6,0,1)}
      glow(l.loop?'#fff':'#22d3ee',3,l.pts)}x.globalAlpha=1;
    // chain being drawn
    if(chain.length){const pts=chain.map(n=>[n.x,n.y]);if(ptr&&!closed)pts.push([ptr.x,ptr.y]);if(closed)pts.push([chain[0].x,chain[0].y]);glow('#e879f9',3,pts)}
    // nodes
    nodes.forEach((n,i)=>{
      const on=chain.includes(n),rdy=n.cd<=0;
      x.fillStyle=on?'#e879f9':rdy?'#22d3ee':'#334155';x.shadowColor=x.fillStyle;x.shadowBlur=rdy?14:0;
      x.beginPath();x.arc(n.x,n.y,9,0,7);x.fill();x.shadowBlur=0;
      x.strokeStyle='#fff8';x.lineWidth=2;x.beginPath();x.arc(n.x,n.y,15,0,7);x.stroke();
      if(!rdy){x.strokeStyle='#22d3ee';x.lineWidth=3;x.beginPath();x.arc(n.x,n.y,15,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-n.cd/(COOL*(chargeT>0?.3:1))));x.stroke()}
    });
    // power-ups
    pops.forEach(p=>{const d=POW[p.k];x.shadowColor=d.col;x.shadowBlur=12;x.fillStyle=d.col;x.beginPath();x.arc(p.x,p.y,11+Math.sin(time*6)*1.5,0,7);x.fill();x.shadowBlur=0;
      x.fillStyle='#111';x.font='bold 9px system-ui';x.textAlign='center';x.fillText(d.t.replace('+','').slice(0,3),p.x,p.y+3)});
    // enemies
    foes.forEach(f=>{
      x.fillStyle=f.hit>0?'#fff':f.col;x.beginPath();x.arc(f.x,f.y,f.r,0,7);x.fill();
      if(freezeT>0){x.strokeStyle='#bfdbfe';x.lineWidth=3;x.stroke()}
      x.fillStyle='#000a';x.font=`bold ${f.r>16?13:11}px system-ui`;x.textAlign='center';x.fillText(f.hp,f.x,f.y+4);
    });
    // bullets
    x.fillStyle='#fff';shots.forEach(s=>{x.beginPath();x.arc(s.x,s.y,3.5,0,7);x.fill()});
    parts.forEach(q=>{x.globalAlpha=clamp(q.life*2,0,1);x.fillStyle=q.col;x.fillRect(q.x-2,q.y-2,4,4)});x.globalAlpha=1;
    floats.forEach(f=>{x.globalAlpha=clamp(f.life*2,0,1);text(f.t,clamp(f.x,40,W-40),f.y,18,f.col);x.globalAlpha=1});
    if(flash>0){x.fillStyle=`rgba(255,255,255,${flash})`;x.fillRect(0,0,W,H)}
    x.restore();
    // hud
    text(String(score),14,40,34,'#fff','left');
    x.font='22px system-ui';x.textAlign='right';x.fillStyle='#f43f5e';x.fillText('♥'.repeat(Math.max(0,hearts)),W-12,36);
    x.font='bold 12px system-ui';x.textAlign='left';x.fillStyle='#cbd5e1';
    x.fillText(`WAVE ${wave()}   SHOTS ${1+extra}   DMG ${2+dmgLv}   PIERCE ${pierce}${chargeT>0?'   CHARGE':''}`,14,H-14);
    if(!started){x.fillStyle='#000a';x.fillRect(0,H/2-120,W,200);text('LINK BLAST',W/2,H/2-60,44,'#22d3ee');
      x.font='15px system-ui';x.textAlign='center';x.fillStyle='#fff';
      ['Drag from dot to dot to link them.','Linked dots fire and the lines are lasers.','Drag back to your first dot to close a loop:','it blasts everything inside and drops a power-up.','Tap to start'].forEach((s,i)=>x.fillText(s,W/2,H/2-26+i*24))}
    if(over&&deadT>.4){x.fillStyle='#000b';x.fillRect(0,H/2-90,W,180);text('OVERRUN',W/2,H/2-28,50,'#f43f5e');text(score+' kills',W/2,H/2+16,32,'#fff');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Best '+best('linkblast',score)+'   Tap or press Enter to retry',W/2,H/2+52)}
  }

  /* ---------- input ---------- */
  const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
  const nodeAt=(p,rad)=>nodes.find(n=>n.cd<=0&&Math.hypot(n.x-p.x,n.y-p.y)<rad);
  function sweepPops(p){for(const q of pops.slice())if(Math.hypot(q.x-p.x,q.y-p.y)<24)grab(q)}
  function finish(){
    if(chain.length>=2&&!closed)fire(chain,false);
    chain=[];closed=false;ptr=null;
  }
  on(c,'pointerdown',e=>{
    e.preventDefault();const p=pos(e);
    if(over){if(deadT>.4)reset();return}
    if(!started){started=true;hud()}
    ptr=p;sweepPops(p);
    const n=nodeAt(p,28);if(n){chain=[n];closed=false;sfx('click')}
    try{c.setPointerCapture(e.pointerId)}catch(_){}
  });
  on(c,'pointermove',e=>{
    const p=pos(e);ptr=p;if(!started||over)return;sweepPops(p);
    if(!chain.length||closed)return;
    const n=nodeAt(p,24);
    if(n&&!chain.includes(n)){chain.push(n);sfx('swipe')}
    else if(n&&n==chain[0]&&chain.length>=3){closed=true;fire(chain,true)}
  });
  const up=()=>{if(chain.length&&!closed)finish();else{chain=[];closed=false}ptr=null};
  on(c,'pointerup',up);on(c,'pointercancel',up);
  on(document,'keydown',e=>{if(over&&(e.key=='Enter'||e.key==' ')){e.preventDefault();if(deadT>.4)reset()}});
  reset();
  let last=performance.now(),raf;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
