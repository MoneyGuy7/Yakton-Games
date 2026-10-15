// Road Hop: an endless Crossy Road style hopper.
// Grass with trees, roads with cars and trucks, rivers with logs, and train tracks with a warning light.
// If you stand still too long (or fall behind the screen) an eagle takes you.
function cross(el){
  const COLS=9,VR=14,S=40,W=COLS*S,H=VR*S,HOPT=.12,LOOP=COLS+10,MARG=5,TL=14;
  const DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  // Keep the real aspect ratio on short screens (the global canvas rule would squash it).
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a);
  const CARC=['#ef4444','#3b82f6','#f59e0b','#a855f7','#14b8a6','#f472b6','#e5e7eb'];
  function shade(h,a){const n=parseInt(h.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v+a*(a<0?v:255-v))));return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`}

  let rows,gen,genTop,cam,creep,p,hop,queue,dead,deadT,started,maxRow,coins,idle,eagleT,time,parts,bump,total=0;
  try{total=+localStorage.getItem('rh-coins')||0}catch(e){}

  /* ---------- world generation ---------- */
  function fill(mkItem,gMin,gMax){
    const out=[],first=R(0,2);let q=first;
    for(;;){const it=mkItem();if(q+it.len>LOOP-gMin+first)break;it.p=q;out.push(it);q+=it.len+R(gMin,gMax)}
    return out;
  }
  function pickType(i){
    const w=[['grass',30],['road',i>3?42:0],['river',i>8?22:0],['rail',i>14?10:0]];
    let t=Math.random()*w.reduce((a,b)=>a+b[1],0);
    for(const[k,v]of w){if(t<v)return k;t-=v}
    return 'grass';
  }
  function makeRow(i){
    if(i<=2)return{i,type:'grass',trees:[],coins:[],deco:[]};
    if(gen.left<=0){gen.type=pickType(i);gen.left={grass:1+rnd(2),road:1+rnd(3),river:1+rnd(3),rail:1+rnd(2)}[gen.type]}
    gen.left--;
    const t=gen.type;
    if(t=='grass'){
      const trees=[],n=rnd(4);
      for(let k=0;k<14&&trees.length<n;k++){const col=rnd(COLS);if(trees.every(q=>Math.abs(q-col)>=3))trees.push(col)}
      const cn=[];if(Math.random()<.16){const col=rnd(COLS);if(!trees.includes(col))cn.push(col)}
      const deco=[];for(let k=0;k<4;k++)deco.push({c:R(0,COLS),o:R(.15,.85),f:Math.random()<.3});
      return{i,type:'grass',trees,coins:cn,deco};
    }
    if(t=='road'){
      gen.cdir=Math.random()<.75?-gen.cdir:gen.cdir;
      const early=i<12;
      return{i,type:'road',dir:gen.cdir,speed:R(1.5,2.9)+Math.min(i*.03,2.2),
        cars:fill(()=>{const truck=Math.random()<.22;return{len:truck?2.2:1.15,truck,col:CARC[rnd(CARC.length)]}},early?3.4:2.7,early?6:5.5)};
    }
    if(t=='river'){
      gen.rdir=-gen.rdir;
      return{i,type:'river',dir:gen.rdir,speed:R(.8,1.5)+Math.min(i*.008,.5),
        logs:fill(()=>({len:2+rnd(3)}),1,1.5+Math.min(i*.01,.7)),
        wv:[...Array(6)].map(()=>({o:R(0,W),y:R(.15,.85)}))};
    }
    return{i,type:'rail',tr:{phase:'idle',t:R(1,3),dir:1,x:0}};
  }
  function ensure(top){while(genTop<=top){rows.set(genTop,makeRow(genTop));genTop++}}

  function reset(){
    rows=new Map();gen={type:'grass',left:0,rdir:1,cdir:1};genTop=-6;cam=-2.5;creep=cam;
    p={x:4.5,row:0,vx:4.5,vr:0,face:'u',riding:null};hop=null;queue=null;dead=null;deadT=0;started=false;maxRow=0;coins=0;idle=0;eagleT=0;time=0;parts=[];bump=0;
    ensure(cam+VR+4);hud();
  }
  const hud=()=>st(dead?`${dead=='eagle'?'Snatched':dead=='water'?'Splash':'Splat'}! ${maxRow} rows. Best ${best('cross',maxRow)}. Tap or press Enter.`:`Rows ${maxRow}   Coins ${coins}   Total coins ${total}`);

  /* ---------- gameplay ---------- */
  const onScreen=r=>r.i>=cam-1&&r.i<=cam+VR+1;
  function trainUpdate(r,dt){
    const t=r.tr;t.t-=dt;
    if(t.phase=='idle'&&t.t<=0){t.phase='warn';t.t=1.6;t.dir=Math.random()<.5?1:-1;if(onScreen(r))sfx('warn')}
    else if(t.phase=='warn'&&t.t<=0){t.phase='go';t.x=t.dir>0?-TL:COLS;if(onScreen(r))sfx('train')}
    else if(t.phase=='go'){t.x+=t.dir*18*dt;if(t.dir>0?t.x>COLS+1:t.x<-TL-1){t.phase='idle';t.t=R(2.5,6)}}
  }
  const over=(cx,a0,len,m)=>cx>a0-m&&cx<a0+len+m;
  function hazard(row){
    const r=rows.get(row);if(!r)return null;
    if(r.type=='road'){for(const o of r.cars)if(over(p.vx,o.p-MARG,o.len,.3))return'car'}
    else if(r.type=='rail'&&r.tr.phase=='go'&&over(p.vx,r.tr.x,TL,.3))return'train';
    return null;
  }
  function burst(tx,tr,n,cols,up,spread){
    for(let i=0;i<n;i++)parts.push({tx,tr,z:R(0,8),vx:R(-spread,spread),vr:R(-spread*.4,spread*.4),vz:R(20,up),life:R(.4,.9),col:cols[rnd(cols.length)],s:R(2,4)});
  }
  function die(type){
    if(dead)return;dead=type;deadT=0;hop=null;queue=null;
    if(type=='car'||type=='train'){sfx('splat');burst(p.vx,p.vr+.3,14,['#fff','#e5e7eb','#f59e0b'],120,3)}
    else if(type=='water'){sfx('splash');burst(p.vx,p.vr+.3,18,['#bfe3ff','#fff','#4aa8e8'],160,2.5)}
    else sfx('eagle');
    hud();
  }
  function land(){
    p.x=hop.tx;p.row=hop.tr;p.vx=p.x;p.vr=p.row;hop=null;
    const r=rows.get(p.row);
    if(p.row>maxRow){maxRow=p.row;idle=0}
    if(r.type=='river'){
      p.riding=null;
      for(const l of r.logs)if(over(p.x,l.p-MARG,l.len,.12)){p.riding={dir:r.dir,speed:r.speed};break}
      if(!p.riding){die('water');return}
      burst(p.x,p.row+.3,5,['#bfe3ff','#fff'],70,1.2);
    }else{
      p.riding=null;burst(p.x,p.row+.2,4,['#d9f99d','#86efac'],40,1);
      if(r.type=='grass'){const k=r.coins.indexOf(Math.floor(p.x));if(k>=0){r.coins.splice(k,1);coins++;total++;try{localStorage.setItem('rh-coins',total)}catch(e){}sfx('coin')}}
    }
    hud();
  }
  function go(d){
    const cr=rows.get(p.row);let tr=p.row,tx=p.x;
    if(d=='u')tr++;else if(d=='d')tr--;else tx+=d=='l'?-1:1;
    if(d=='d'&&tr<Math.ceil(cam))return;
    if(tx<.5||tx>COLS-.5)return;
    ensure(tr+VR);
    const trow=rows.get(tr);
    if((d=='u'||d=='d')&&!(cr.type=='river'&&trow.type=='river'))tx=Math.floor(tx)+.5;
    p.face=d;
    if(trow.type=='grass'&&trow.trees.includes(Math.floor(tx))){bump=1;sfx('bump');return}
    hop={fx:p.x,fr:p.row,tx,tr,t:0};p.riding=null;sfx('hop');
  }
  function act(d){
    if(dead)return;
    started=true;
    if(hop)queue=d;else go(d);
  }
  function update(dt){
    time+=dt;deadT+=dead?dt:0;
    rows.forEach((r,k)=>{
      if(k<cam-8){rows.delete(k);return}
      if(r.type=='road')r.cars.forEach(o=>{o.p=(o.p+r.dir*r.speed*dt+LOOP)%LOOP});
      else if(r.type=='river')r.logs.forEach(o=>{o.p=(o.p+r.dir*r.speed*dt+LOOP)%LOOP});
      else if(r.type=='rail')trainUpdate(r,dt);
    });
    if(!dead){
      if(bump>0)bump-=dt*6;
      if(hop){
        hop.t+=dt/HOPT;const k=Math.min(1,hop.t);
        p.vx=hop.fx+(hop.tx-hop.fx)*k;p.vr=hop.fr+(hop.tr-hop.fr)*k;
        if(hop.t>=1)land();
      }else{
        p.vx=p.x;p.vr=p.row;
        if(rows.get(p.row).type=='river'){
          if(p.riding){p.x+=p.riding.dir*p.riding.speed*dt;p.vx=p.x;if(p.x<0||p.x>COLS)die('water')}
          else die('water');
        }
        if(!dead&&queue){const d=queue;queue=null;go(d)}
      }
      if(!dead){const h=hazard(hop?(hop.t<.5?hop.fr:hop.tr):p.row);if(h)die(h)}
      if(!dead&&p.vr+.3<cam)die('eagle');
      if(!dead&&started){
        idle+=dt;
        if(idle>5.5)eagleT=Math.min(1,(idle-5.5)/2.2);else eagleT=Math.max(0,eagleT-dt*1.5);
        if(eagleT>=1)die('eagle');
        creep+=(.25+Math.min(maxRow*.003,.5))*dt;
      }
      const tgt=Math.max(creep,p.vr-3.4);
      cam+=Math.max(0,tgt-cam)*Math.min(1,dt*4);
    }
    ensure(cam+VR+4);
    parts=parts.filter(q=>{q.tx+=q.vx*dt;q.tr+=q.vr*dt;q.z+=q.vz*dt;q.vz-=320*dt;if(q.z<0){q.z=0;q.vz=0;q.vx*=.8}q.life-=dt;return q.life>0});
  }

  /* ---------- drawing ---------- */
  const sy=r=>H-(r-cam)*S;
  function box(x0,r,w,dep,h,col,z=0,inset=0,sh=1){
    const yb=sy(r)-6-z-inset;
    if(sh){x.fillStyle='rgba(0,0,0,.2)';x.fillRect(x0+2,sy(r)-6-inset-dep+3,w,dep)}
    x.fillStyle=shade(col,-.28);x.fillRect(x0,yb-h,w,h);
    x.fillStyle=col;x.fillRect(x0,yb-h-dep,w,dep);
    x.fillStyle=shade(col,.2);x.fillRect(x0,yb-h-dep,w,2);
  }
  function floor(row,r){
    const yb=sy(r),yt=yb-S,up=rows.get(r+1),dn=rows.get(r-1);
    if(row.type=='grass'){
      x.fillStyle=r%2?'#86d964':'#78cc58';x.fillRect(0,yt,W,S);
      row.deco.forEach(d=>{x.fillStyle=d.f?'#fff':'#5fb344';x.fillRect(d.c*S,yt+d.o*S,d.f?4:7,d.f?4:3)});
    }else if(row.type=='road'){
      x.fillStyle='#464a55';x.fillRect(0,yt,W,S);x.fillStyle='#e8e6d9';
      if(!up||up.type!='road')x.fillRect(0,yt,W,3);else for(let j=0;j<W;j+=32)x.fillRect(j+4,yt-1,16,3);
      if(!dn||dn.type!='road')x.fillRect(0,yb-3,W,3);
    }else if(row.type=='river'){
      x.fillStyle='#3e9be0';x.fillRect(0,yt,W,S);x.fillStyle='#74bff2';
      row.wv.forEach(w=>{const wx=((w.o+row.dir*row.speed*S*time*.6)%(W+40)+W+40)%(W+40)-20;x.fillRect(wx,yt+w.y*S,16,2)});
      x.fillStyle='#2a78b8';
      if(!up||up.type!='river')x.fillRect(0,yt,W,3);
      if(!dn||dn.type!='river')x.fillRect(0,yb-3,W,3);
    }else{
      x.fillStyle='#7d746a';x.fillRect(0,yt,W,S);x.fillStyle='#5a4632';
      for(let j=0;j<W;j+=16)x.fillRect(j+3,yt+5,6,S-10);
      x.fillStyle='#c4c7d0';x.fillRect(0,yt+11,W,4);x.fillRect(0,yt+S-15,W,4);
    }
  }
  function tree(col,r){
    const x0=col*S;
    box(x0+15,r,10,10,12,'#8a5a2b');
    box(x0+3,r,34,30,20,'#2f9e44',12);
    box(x0+10,r,20,20,12,'#3dbb55',32,5,0);
  }
  function coin(col,r,i){
    const w=Math.abs(Math.cos(time*4+i))*8+2,cx=col*S+S/2,cy=sy(r)-S/2-3+Math.sin(time*3)*2;
    x.fillStyle='rgba(0,0,0,.18)';x.beginPath();x.ellipse(cx,sy(r)-8,7,3,0,0,7);x.fill();
    x.fillStyle='#fbbf24';x.strokeStyle='#b45309';x.lineWidth=2;x.beginPath();x.ellipse(cx,cy,w,9,0,0,7);x.fill();x.stroke();
  }
  function car(o,r,dir){
    const x0=(o.p-MARG)*S,w=o.len*S-4;if(x0>W||x0+w<0)return;
    const yb=sy(r)-6;
    if(o.truck){
      const cw=w*.3,fr=dir>0,cx0=fr?x0+w-cw:x0,bx0=fr?x0:x0+cw;
      box(bx0,r,w-cw,22,18,'#f3f4f6');
      x.fillStyle='#d1d5db';for(let k=6;k<w-cw-6;k+=14)x.fillRect(bx0+k,yb-15,2,12);
      box(cx0,r,cw,22,14,o.col);
      x.fillStyle='#cdeaff';x.fillRect(fr?cx0+cw-11:cx0+3,yb-11,8,6);
    }else{
      box(x0,r,w,22,10,o.col);
      box(x0+w*.2,r,w*.55,16,9,shade(o.col,.28),10,3);
      x.fillStyle='#cdeaff';x.fillRect(x0+w*.2+3,yb-21,w*.55-6,5);
    }
    x.fillStyle='#16181d';x.fillRect(x0+5,yb-4,8,5);x.fillRect(x0+w-13,yb-4,8,5);
    x.fillStyle='#fde68a';x.fillRect(dir>0?x0+w-3:x0,yb-9,3,3);
    x.fillStyle='#ef4444';x.fillRect(dir>0?x0:x0+w-3,yb-9,3,3);
  }
  function log(l,r,i){
    const x0=(l.p-MARG)*S,w=l.len*S-3;if(x0>W||x0+w<0)return;
    const bob=2+Math.sin(time*2+i*1.7)*1.2,yb=sy(r)-6-bob;
    box(x0,r,w,22,9,'#9a6a3a',bob);
    x.fillStyle='#7d5229';x.fillRect(x0+8,yb-5,w-16,2);x.fillRect(x0+14,yb-9-14,w-28,2);
    x.fillStyle='#d1a05f';x.fillRect(x0,yb-9,3,9);x.fillRect(x0+w-3,yb-9,3,9);
  }
  function train(row,r){
    const t=row.tr,yb=sy(r)-6;
    // signal post
    box(5,r,6,6,30,'#555',0,2);
    const flash=t.phase=='warn'&&Math.floor(time*6)%2==0;
    x.fillStyle=flash?'#ff3b30':'#4a1f1f';x.fillRect(1,yb-36,7,7);x.fillRect(9,yb-36,7,7);
    if(flash){x.fillStyle='rgba(255,59,48,.25)';x.beginPath();x.arc(8,yb-32,16,0,7);x.fill()}
    if(t.phase!='go')return;
    const n=5,sw=TL/n*S;
    for(let k=0;k<n;k++){
      const front=t.dir>0?k==n-1:k==0,x0=(t.x+k*TL/n)*S;
      if(x0>W||x0+sw<0)continue;
      box(x0,r,sw-3,26,26,front?'#d33a2f':'#8a93a6');
      x.fillStyle='#bfe3ff';for(let j=0;j<3;j++)x.fillRect(x0+6+j*((sw-12)/3),yb-21,(sw-12)/3-5,8);
    }
  }
  function objects(row,r){
    if(row.type=='grass'){row.trees.forEach(c=>tree(c,r));row.coins.forEach((c,i)=>coin(c,r,i))}
    else if(row.type=='road')row.cars.forEach(o=>car(o,r,row.dir));
    else if(row.type=='river')row.logs.forEach((l,i)=>log(l,r,i));
    else train(row,r);
  }
  function player(){
    const px=p.vx*S+(bump>0?Math.sin(bump*20)*3:0),k=hop?Math.min(1,hop.t):0;
    let z=hop?Math.sin(Math.PI*k)*16:0,h=18,w=22;
    const gy=sy(p.vr)-6;
    if(dead=='car'||dead=='train'){h=3;w=30}
    else if(dead=='water'){h=Math.max(2,18-deadT*34);z=-Math.min(deadT*20,12)}
    else if(dead=='eagle')z=deadT*300;
    if(dead!='eagle'){x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(px,gy-8,12-z*.15,5,0,0,7);x.fill()}
    if(dead=='water'&&deadT>.05){x.strokeStyle='rgba(255,255,255,.6)';x.lineWidth=2;x.beginPath();x.ellipse(px,gy-8,10+deadT*30,4+deadT*10,0,0,7);x.stroke()}
    if(dead!='eagle'&&dead!='water'&&dead!='car'&&dead!='train'){x.fillStyle='#f59e0b';x.fillRect(px-7,gy-z-1,4,3);x.fillRect(px+3,gy-z-1,4,3)}
    box(px-w/2,p.vr,w,20,h,'#ffffff',z,0,0);
    if(h>8){
      const yb=gy-z,fo=p.face=='l'?-3:p.face=='r'?3:0;
      box(px-3,p.vr,6,8,5,'#ef4444',z+h,6,0);
      x.fillStyle='#111';x.fillRect(px-6+fo,yb-h+4,3,4);x.fillRect(px+3+fo,yb-h+4,3,4);
      x.fillStyle='#f59e0b';x.fillRect(px-3+fo,yb-h+9,6,4);
    }
  }
  function eagle(){
    if(eagleT<=0&&dead!='eagle')return;
    const px=p.vx*S,gy=sy(p.vr)-6;
    let ey;
    if(dead=='eagle')ey=gy-20-deadT*300;
    else{ey=-70+(gy-20+70)*eagleT;x.fillStyle=`rgba(0,0,0,${.12+eagleT*.25})`;x.beginPath();x.ellipse(px,gy-8,8+eagleT*16,4+eagleT*6,0,0,7);x.fill()}
    const f=Math.sin(time*18)*10;
    x.save();x.translate(px,ey);
    x.fillStyle='#4a3426';
    x.beginPath();x.moveTo(-6,0);x.lineTo(-36,-12+f);x.lineTo(-30,6+f*.5);x.lineTo(-6,8);x.fill();
    x.beginPath();x.moveTo(6,0);x.lineTo(36,-12+f);x.lineTo(30,6+f*.5);x.lineTo(6,8);x.fill();
    x.beginPath();x.ellipse(0,2,9,12,0,0,7);x.fill();
    x.fillStyle='#fff';x.beginPath();x.arc(0,-9,6,0,7);x.fill();
    x.fillStyle='#fbbf24';x.beginPath();x.moveTo(-3,-8);x.lineTo(3,-8);x.lineTo(0,-2);x.fill();
    x.restore();
  }
  function text(t,px,py,size,col,align){
    x.font=`${size}px Impact,"Arial Black",sans-serif`;x.textAlign=align||'center';
    x.lineWidth=Math.max(3,size/7);x.strokeStyle='#000a';x.strokeText(t,px,py);x.fillStyle=col;x.fillText(t,px,py);
  }
  function draw(){
    x.clearRect(0,0,W,H);
    const r0=Math.floor(cam)-1,r1=Math.ceil(cam+VR)+1,pr=Math.round(p.vr);
    for(let r=r1;r>=r0;r--){const row=rows.get(r);if(row)floor(row,r)}
    for(let r=r1;r>=r0;r--){const row=rows.get(r);if(row)objects(row,r);if(r==pr)player()}
    parts.forEach(q=>{x.globalAlpha=Math.min(1,q.life*2);x.fillStyle=q.col;x.fillRect(q.tx*S-q.s/2,sy(q.tr)-q.z-q.s,q.s,q.s)});x.globalAlpha=1;
    eagle();
    text(String(maxRow),14,46,40,'#fff','left');
    x.fillStyle='#fbbf24';x.strokeStyle='#b45309';x.lineWidth=2;x.beginPath();x.arc(W-62,32,9,0,7);x.fill();x.stroke();
    text(String(coins),W-14,42,28,'#fff','right');
    if(!started&&!dead){
      x.fillStyle='#0008';x.fillRect(0,H/2-70,W,140);
      text('ROAD HOP',W/2,H/2-8,46,'#ffd21f');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Tap, click or press an arrow key to hop',W/2,H/2+28);
      x.fillText('Best: '+(best('cross',0)),W/2,H/2+52);
    }
    if(dead&&deadT>.7){
      x.fillStyle='#000b';x.fillRect(0,H/2-90,W,180);
      text({car:'SPLAT!',train:'FLATTENED!',water:'SPLASH!',eagle:'SNATCHED!'}[dead],W/2,H/2-30,48,'#ffd21f');
      text(maxRow+' rows',W/2,H/2+14,32,'#fff');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';
      x.fillText('Best '+best('cross',maxRow)+'   Tap or press Enter to retry',W/2,H/2+50);
    }
  }

  /* ---------- input and loop ---------- */
  dirs(c,act);
  on(document,'keydown',e=>{if(e.key==' '||e.key=='Enter'){e.preventDefault();if(dead){if(deadT>.4)reset()}else act('u')}});
  let pd=null;
  on(c,'pointerdown',e=>{pd={x:e.clientX,y:e.clientY}});
  on(c,'pointerup',e=>{if(!pd)return;const m=Math.hypot(e.clientX-pd.x,e.clientY-pd.y);pd=null;if(m<14){if(dead){if(deadT>.4)reset()}else act('u')}});
  reset();
  let last=performance.now(),raf;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
