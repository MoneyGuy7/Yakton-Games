// Jungle Dash: a side-scrolling temple escape. A giant boulder is rolling after you.
// Left side of the screen / Space / Up: jump (press again in the air to double jump). Right side / Down: slide.
// Hazards: logs, spike rows, stone totems, tall pillars (double jump), hanging vines (slide), bats (slide or jump), pits,
// plus moving ones: rolling logs and snakes charge at you, darts fly in (slide or jump), rocks drop from above (shadow warns you).
// Every hit lets the boulder gain on you; it slowly falls back while you run clean. Speed keeps climbing.
// Gems are saved in the browser. Power-ups: magnet, shield, golden idol (smash through everything).
function jungle(el){
  const W=640,H=360,GY=284,PX=150,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),PI=Math.PI;
  const hs=(i,s)=>{const v=Math.sin(i*127.1+(s||0)*311.7)*43758.5453;return v-Math.floor(v)};
  const G=2300,JV=830,JV2=720,BG0=100,BL=9000;
  // ---- palettes: jungle by day, ruins at sunset, glowing night ----
  const hx=h=>{const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]};
  const PAL=[
    {s0:'#4ec3e8',s1:'#d8f6c8',far:'#6bb08c',mid:'#2f7d4f',mid2:'#43a066',gt:'#4caf50',dirt:'#7a5230',dirt2:'#5f3f24',sun:'#fff3a0',st:0},
    {s0:'#4a2a6a',s1:'#ff9a59',far:'#9a5a78',mid:'#523456',mid2:'#7a4a60',gt:'#9aa83a',dirt:'#6b4230',dirt2:'#4c2d22',sun:'#ffd9a0',st:.1},
    {s0:'#05061a',s1:'#1d2d66',far:'#1e3052',mid:'#12263a',mid2:'#1a3a4f',gt:'#2aa07a',dirt:'#2e2840',dirt2:'#201b30',sun:'#e8f0ff',st:1}
  ].map(p=>{const o={};for(const k in p)o[k]=typeof p[k]=='string'?hx(p[k]):p[k];return o});
  const mixc=(a,b,f)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*f)).join(',')})`;
  function biome(cam){const p=(cam/BL)%3,i=Math.floor(p),f=clamp((p-i-.7)/.3,0,1),a=PAL[i],b=PAL[(i+1)%3],o={st:a.st+(b.st-a.st)*f,i};
    for(const k of['s0','s1','far','mid','mid2','gt','dirt','dirt2','sun'])o[k]=mixc(a[k],b[k],f);return o}

  let obs,pits,items,nextX,lastPat,pn,cam,t,time=0,s,h,vy,jumps,sl,pendSlide,coy,buf,inv,bg,shield,magnet,dash,stumble,over,started,gems,total=0,shake,parts,deadT,lastTxt,dustT,leaves,manual=false,lastHit='';
  try{total=+localStorage.getItem('jungle-gems')||0}catch(e){}
  const clouds=[...Array(6)].map((_,i)=>({x:i*130+R(0,60),y:R(20,110),w:R(60,120)}));

  function reset(){
    obs=[];pits=[];items=[];cam=0;t=0;s=300;h=0;vy=0;jumps=0;sl=0;pendSlide=false;coy=0;buf=0;inv=0;bg=BG0;shield=0;magnet=0;dash=0;stumble=0;
    over=false;started=false;gems=0;shake=0;parts=[];deadT=0;lastTxt='';dustT=0;pn=0;lastPat='';nextX=620;leaves=[];
    hud();
  }
  const score=()=>Math.floor(cam/10)+gems*5;
  function hud(){
    const sp=Math.round(s*.0072*10)/10;
    const m=over?`Crushed! ${score()} points, ${gems} gems. Best ${best('jungle',score())}. Tap or press Enter.`
      :started?`${score()} pts   ${gems} gems   ${Math.round(s/6)} km/h   Total gems ${total}`
      :'Tap or press any key to start. Space or Up jumps (again in the air to double jump), Down slides.';
    void sp;if(m!==lastTxt){lastTxt=m;st(m)}
  }

  /* ---------- level generation ---------- */
  const spd=()=>300+Math.min(330,t*4.4);
  function O(k,px,w,y0,y1,ex){const o=Object.assign({k,x:px,w,y0,y1,hi:0,hit:0},ex||{});
    o.hx0=px+(k=='log'?3:k=='vine'?2:4);o.hx1=px+w-(k=='log'?3:k=='vine'?2:4);obs.push(o);return o}
  function gemArc(cx,n,top){for(let i=0;i<n;i++){const u=n==1?0:(i/(n-1))*2-1;items.push({k:'gem',x:cx+u*(n-1)*18,y:64+(1-u*u)*(top||70),sp:R(0,6)})}}
  function gemLine(px,n,yy){for(let i=0;i<n;i++)items.push({k:'gem',x:px+i*34,y:yy||26,sp:R(0,6)})}
  const pit=(px,w)=>pits.push({x:px,w});
  const pitW=()=>spd()*.38+30;
  // single obstacles, returns width used
  const SINGLE={
    log(px){O('log',px,46,0,30);gemArc(px+23,5,64);return 46},
    cluster(px){O('log',px,46,0,30);O('log',px+60,46,0,30);gemArc(px+53,7,78);return 106},
    totem(px){O('totem',px,36,0,92);gemArc(px+18,5,80);return 36},
    spikes(px){const w=64+rnd(44);O('spikes',px,w,0,22);gemArc(px+w/2,5,70);return w},
    vine(px){O('vine',px,26,46,600);gemLine(px-34,4,24);return 26},
    pit(px){const w=pitW();pit(px,w);gemArc(px+w/2,Math.min(7,Math.floor(w/40)+2),76);return w},
    bat(px){O('bat',px,34,0,0,{by:60,ph:R(0,6)});gemLine(px-30,4,24);return 34},
    roller(px){if(Math.random()<.5){O('roller',px,36,0,36,{vx:-210,rl:1});return 36}O('roller',px,40,0,22,{vx:-120,snake:1});return 40},
    rock(px){O('rock',px,40,430,470,{state:0,vy:0});return 40},
    dart(px){const hi=Math.random()<.6;O('dart',px,44,hi?32:6,hi?44:18,{vx:-330,hi});return 44},
    tower(px){O('tower',px,38,0,172);for(let i=0;i<3;i++)items.push({k:'gem',x:px+19,y:200+i*34,sp:R(0,6)});return 38}
  };
  function spawn(){
    const lv=clamp(t/80,0,1),px=nextX;let w=0,pat,pre=0,post=0;
    const pool=pn<2?[['gems',3],['log',3],['vine',2]]
      :[['gems',lv<.4?2:1],['log',3],['cluster',lv<.1?0:2],['totem',3],['spikes',3],['vine',3],['pit',lv<.05?0:3],
        ['bat',lv<.12?0:3],['tower',lv<.25?0:2.5],['seq',lv<.15?0:3+3*lv],['roller',lv<.08?0:3],['rock',lv<.18?0:2.5],['dart',lv<.12?0:2.5]];
    const tot=pool.reduce((a,b)=>a+b[1],0);let r=Math.random()*tot;pat=pool[0][0];
    for(const[k,v]of pool){if(r<v){pat=k;break}r-=v}
    if(pat==lastPat&&pat!='gems')pat='gems';
    lastPat=pat;pn++;
    if(pat=='gems'){
      const n=5+rnd(4);gemLine(px,n,26);w=n*34;
      if(Math.random()<.35)items.push({k:pick(['magnet','shield','shield','idol']),x:px+w/2,y:50,sp:0});
    }else if(pat=='seq'){
      // 2 or 3 hazards with a landing gap between, so you always have time to land and react
      const n=lv>.6&&Math.random()<.5?3:2;let cx=px;
      const kinds=['log','totem','spikes','vine','pit','cluster'];
      let prev='';
      for(let i=0;i<n;i++){
        let k=pick(kinds);if(k==prev)k=pick(kinds);prev=k;
        const used=SINGLE[k](cx);cx+=used;if(i<n-1)cx+=spd()*.62+50;
      }
      w=cx-px;
    }else{
      if(pat=='bat'){pre=140;post=150}
      if(pat=='roller'||pat=='rock'){pre=80;post=120}
      if(pat=='dart'){post=100}
      if(pat=='tower'){pre=spd()*.4+50;post=spd()*.45}
      w=SINGLE[pat](px+pre);w+=pre;
    }
    nextX=px+w+post+spd()*(.6-.2*lv)+60+R(0,50);
  }
  const pick=a=>a[rnd(a.length)];

  /* ---------- gameplay ---------- */
  const onGround=px=>dash>0||!pits.some(p=>px>p.x+12&&px<p.x+p.w-12);
  function jump(){
    if(over)return;
    if(!started){started=true;hud()}
    const grounded=h<=0&&vy==0&&onGround(cam);
    if(grounded||(coy>0&&jumps==0)){vy=JV;h=Math.max(h,.01);jumps=1;sl=0;pendSlide=false;coy=0;sfx('hop');puff(6)}
    else if(jumps<2){vy=JV2;if(h<0)h=0;jumps=2;pendSlide=false;sfx('swipe');puff(4)}
    else buf=.12;
  }
  function slide(){
    if(over)return;
    if(!started){started=true;hud()}
    if(h>0||vy!=0){vy=Math.min(vy,-1100);pendSlide=true}
    else if(sl<=0){sl=.62;sfx('slide')}
  }
  function puff(n){for(let i=0;i<n;i++)parts.push({x:cam-8+R(-8,8),y:GY-h-2,vx:R(-90,-20)-s*.2,vy:R(-60,-5),life:R(.25,.5),col:'#d9c7a0',r:R(2,4),w:1})}
  function burst(px,py,cols,n){for(let i=0;i<n;i++)parts.push({x:px,y:py,vx:R(-180,180),vy:R(-260,60),life:R(.4,.9),col:cols[rnd(cols.length)],r:R(2,4),g:1})}
  function hurt(why){
    if(inv>0||dash>0)return;lastHit=why;
    if(shield>0){shield=0;inv=1;sfx('bump');burst(PX,GY-h-30,['#7dd3fc','#fff'],14);return}
    bg-=why=='pit'?65:55;inv=1.15;stumble=.3;shake=.32;sfx('crash');
    burst(PX,GY-h-30,['#ffd21f','#e63027','#fff'],12);
    if(bg<=0){over=true;deadT=0;bg=0;sfx('lose')}
  }
  function update(dt){
    time+=dt;
    parts=parts.filter(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.g)q.vy+=700*dt;q.life-=dt;return q.life>0});
    if(shake>0)shake-=dt;
    if(over){deadT+=dt;hud();return}
    if(!started){hud();return}
    t+=dt;
    const base=spd();s=base*(dash>0?1.35:1)*(stumble>0?.8:1);
    cam+=s*dt;
    if(inv>0)inv-=dt;if(stumble>0)stumble-=dt;if(shield>0&&false)shield=0;
    if(magnet>0)magnet-=dt;if(dash>0){dash-=dt;if(dash<=0)inv=Math.max(inv,1)}
    if(buf>0)buf-=dt;
    bg=Math.min(BG0,bg+1.5*dt);
    while(nextX<cam+W+420)spawn();
    // physics
    const ground=onGround(cam);
    if(h>0||vy!=0||!ground){
      if(h<=0&&!ground&&vy==0){coy=.1}
      h+=vy*dt;vy-=G*dt;
      if(h<=0&&ground){
        h=0;vy=0;jumps=0;coy=0;puff(5);
        if(pendSlide){sl=.62;pendSlide=false}
        if(buf>0){buf=0;jump()}
      }
      if(!ground&&h<=0&&coy>0)coy-=dt;
      if(h<-70){hurt('pit');if(!over){h=4;vy=960;jumps=1;sl=0;sfx('hop')}}
    }
    if(sl>0)sl-=dt;
    if(h==0&&vy==0&&ground){dustT-=dt;if(dustT<=0){dustT=.09;puff(1)}}
    // moving hazards: rolling logs, snakes and darts come at you, rocks drop from above
    for(const o of obs){
      if(o.vx){o.x+=o.vx*dt;o.hx0=o.x+4;o.hx1=o.x+o.w-4}
      if(o.k=='rock'){
        if(o.state==0&&o.x-cam<s*1.05+60){o.state=1;o.vy=0}
        if(o.state==1){o.vy+=2300*dt;o.y0-=o.vy*dt;o.y1=o.y0+40;
          if(o.y0<=0){o.y0=0;o.y1=40;o.state=2;shake=Math.max(shake,.15);sfx('bump');burst(o.x-cam+PX+20,GY-4,['#c9b99a','#8f8a7e'],10)}}
      }
    }
    // collisions with hazards
    const feet=h,ph=(sl>0&&h<=0)?26:52,p0=cam-10,p1=cam+10;
    for(const o of obs){
      if(o.dead)continue;
      let y0=o.y0,y1=o.y1;
      if(o.k=='rock'&&o.state==0)continue;
      if(o.k=='bat'){const b=Math.sin(time*3+o.ph)*8;y0=o.by+b-4;y1=o.by+b+16}
      if(p1>o.hx0&&p0<o.hx1&&feet<y1&&feet+ph>y0){
        if(dash>0){o.dead=1;burst(o.x-cam+PX,GY-30,['#9aa0ad','#6b7180','#c8a45a'],14);sfx('bump');gems++;total++}
        else if(inv<=0&&!o.hit){hurt(o.k);o.hit=1}
      }
    }
    // items
    for(const it of items){
      if(it.gone)continue;
      const dx=it.x-cam,dy=it.y-(h+27);
      if(magnet>0&&it.k=='gem'&&Math.abs(dx)<190&&Math.abs(dy)<190){const d=Math.hypot(dx,dy)||1,sp=900*dt;it.x-=dx/d*Math.min(sp,d);it.y-=dy/d*Math.min(sp,d)}
      if(Math.abs(dx)<26&&Math.abs(dy)<46){
        it.gone=1;
        if(it.k=='gem'){gems++;total++;sfx('coin');try{localStorage.setItem('jungle-gems',total)}catch(e){}burst(it.x-cam+PX,GY-it.y,['#34d399','#a7f3d0'],4)}
        else{sfx('win');burst(PX,GY-h-30,['#ffd21f','#fff'],14);
          if(it.k=='magnet')magnet=8;else if(it.k=='shield')shield=1;else{dash=3.4;inv=Math.max(inv,.2)}}
      }
    }
    obs=obs.filter(o=>!o.dead&&o.x+o.w>cam-200);pits=pits.filter(p=>p.x+p.w>cam-200);items=items.filter(i=>!i.gone&&i.x>cam-200);
    if(bg<45&&Math.random()<dt*6)shake=Math.max(shake,.08);
    hud();
  }

  /* ---------- drawing ---------- */
  function text(str,px,py,size,col,al){
    x.font=`${size}px Impact,"Arial Black",sans-serif`;x.textAlign=al||'center';x.lineWidth=Math.max(3,size/7);x.strokeStyle='#000b';x.strokeText(str,px,py);x.fillStyle=col;x.fillText(str,px,py);
  }
  function sky(B){
    const g=x.createLinearGradient(0,0,0,GY);g.addColorStop(0,B.s0);g.addColorStop(1,B.s1);x.fillStyle=g;x.fillRect(0,0,W,H);
    if(B.st>.05){x.fillStyle=`rgba(255,255,255,${Math.min(1,B.st)*.85})`;for(let i=0;i<46;i++){const px=(hs(i,1)*W*1.3-cam*.02)%W,py=hs(i,2)*150;x.fillRect((px+W)%W,py,1.6,1.6)}}
    // sun or moon drifting slowly
    const sx=470-((cam*.01)%40),sy=B.i==1?170:80;x.fillStyle=B.sun;x.globalAlpha=.9;x.beginPath();x.arc(sx,sy,B.i==2?24:30,0,7);x.fill();x.globalAlpha=.18;x.beginPath();x.arc(sx,sy,50,0,7);x.fill();x.globalAlpha=1;
    if(B.st<.6){x.fillStyle=`rgba(255,255,255,${.55*(1-B.st)})`;for(const k of clouds){const cx=((k.x-cam*.05)%(W+200)+W+200)%(W+200)-100;x.beginPath();x.ellipse(cx,k.y,k.w/2,10,0,0,7);x.ellipse(cx+k.w*.2,k.y-8,k.w/3,11,0,0,7);x.fill()}}
  }
  function far(B){
    x.fillStyle=B.far;x.beginPath();x.moveTo(0,GY);const off=cam*.12;
    for(let px=0;px<=W;px+=8){const q=px+off;x.lineTo(px,GY-48-Math.sin(q*.006)*34-Math.sin(q*.017)*14-Math.sin(q*.0021)*26)}
    x.lineTo(W,GY);x.closePath();x.fill();
  }
  function mid(B){
    const TW=90,off=cam*.5;
    for(let i=Math.floor(off/TW)-1;i<=Math.ceil((off+W)/TW)+1;i++){
      const cx=i*TW-off+hs(i,3)*40,bi=Math.floor((i*TW*2/BL))%3,st=((bi%3)+3)%3,r1=hs(i,4),r2=hs(i,5);
      if(r2<.18)continue;
      if(st==0){ // jungle trees
        const th=70+r1*70;x.fillStyle=B.mid;x.fillRect(cx-4,GY-th,8,th);
        x.fillStyle=B.mid2;x.beginPath();x.ellipse(cx,GY-th,26+r1*14,15+r1*6,0,0,7);x.ellipse(cx-18,GY-th+9,18,11,0,0,7);x.ellipse(cx+18,GY-th+9,18,11,0,0,7);x.fill();
        x.strokeStyle=B.mid;x.lineWidth=2;if(r2>.5){x.beginPath();x.moveTo(cx+10,GY-th+8);x.lineTo(cx+10,GY-th+40+r1*30);x.stroke()}
      }else if(st==1){ // ruins
        const ph=50+r1*80,pw=16+r2*10;x.fillStyle=B.mid;
        if(r2>.7){x.fillRect(cx-30,GY-24,60,24);x.fillRect(cx-22,GY-46,44,22);x.fillRect(cx-14,GY-66,28,20)}
        else{x.fillRect(cx-pw/2,GY-ph,pw,ph);x.fillStyle=B.mid2;x.fillRect(cx-pw/2-3,GY-ph-5,pw+6,6);x.beginPath();x.moveTo(cx-pw/2,GY-ph);x.lineTo(cx-pw/2+pw*.3,GY-ph-14*r1);x.lineTo(cx+pw/2,GY-ph);x.fill()}
      }else{ // glowing mushrooms
        const th=40+r1*60;x.fillStyle=B.mid;x.fillRect(cx-3,GY-th,6,th);
        x.fillStyle=B.mid2;x.beginPath();x.ellipse(cx,GY-th,22+r1*12,12+r1*6,0,PI,0);x.fill();
        x.fillStyle='rgba(120,255,220,.16)';x.beginPath();x.arc(cx,GY-th,34+r1*14,0,7);x.fill();
        x.fillStyle='rgba(180,255,230,.9)';x.fillRect(cx-8+r2*10,GY-th-4,3,3);
      }
    }
  }
  function ground(B){
    x.fillStyle=B.dirt;x.fillRect(0,GY,W,H-GY);
    // stone bricks scroll with the world
    x.strokeStyle=B.dirt2;x.lineWidth=2;const bw=64;
    for(let row=0;row<3;row++){const y=GY+16+row*22,o=(row%2)*32-((cam%bw+bw)%bw);
      x.beginPath();x.moveTo(0,y);x.lineTo(W,y);for(let px=o;px<W;px+=bw){x.moveTo(px,y);x.lineTo(px,y+22)}x.stroke()}
    x.fillStyle=B.gt;x.fillRect(0,GY-2,W,12);
    x.fillStyle=B.dirt2;for(let px=-((cam%22)+22)%22;px<W;px+=22){x.beginPath();x.moveTo(px,GY+10);x.lineTo(px+11,GY+10);x.lineTo(px+5,GY+16);x.fill()}
    // grass tufts
    x.strokeStyle=B.gt;x.lineWidth=2;for(let i=Math.floor(cam/26);i<Math.floor(cam/26)+W/26+2;i++){const px=i*26-cam+hs(i)*20;x.beginPath();x.moveTo(px,GY-1);x.lineTo(px-3,GY-8-hs(i,2)*6);x.moveTo(px,GY-1);x.lineTo(px+3,GY-7-hs(i,3)*6);x.stroke()}
    // pits
    for(const p of pits){
      const x0=p.x-cam+PX,x1=x0+p.w;if(x1<-20||x0>W+20)continue;
      const g=x.createLinearGradient(0,GY,0,H);g.addColorStop(0,'#1a0f0a');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(x0,GY-2,p.w,H-GY+2);
      x.fillStyle=B.gt;x.fillRect(x0-5,GY-2,5,12);x.fillRect(x1,GY-2,5,12);
      x.fillStyle=B.dirt;x.beginPath();x.moveTo(x0,GY+10);x.lineTo(x0+10,GY+26);x.lineTo(x0,GY+34);x.fill();x.beginPath();x.moveTo(x1,GY+10);x.lineTo(x1-10,GY+26);x.lineTo(x1,GY+34);x.fill();
      x.fillStyle='#fff';x.globalAlpha=.5;for(let k=0;k<4;k++){x.fillRect(x0+p.w*(.15+.23*k),GY+40+((time*40+k*30)%70),2,6)}x.globalAlpha=1;
    }
  }
  function drawObs(B){
    for(const o of obs){
      const px=o.x-cam+PX;if(px>W+60||px<-120)continue;
      if(o.k=='log'){
        x.fillStyle='#6b4423';x.fillRect(px,GY-30,o.w,30);x.fillStyle='#8a5a30';x.fillRect(px,GY-30,o.w,8);
        x.strokeStyle='#4b2e15';x.lineWidth=1.5;for(let i=1;i<5;i++){x.beginPath();x.moveTo(px+i*9,GY-28);x.lineTo(px+i*9+2,GY-3);x.stroke()}
        x.fillStyle='#d6a96b';x.beginPath();x.ellipse(px+4,GY-15,7,15,0,0,7);x.fill();x.strokeStyle='#a1743d';x.beginPath();x.ellipse(px+4,GY-15,3.5,8,0,0,7);x.stroke();
        x.fillStyle='#e63027';x.fillRect(px+14,GY-32,5,3);x.fillRect(px+30,GY-32,5,3);
      }else if(o.k=='totem'||o.k=='tower'){
        const th=o.y1,w=o.w;
        x.fillStyle='#8f8a7e';x.fillRect(px,GY-th,w,th);x.fillStyle='#b5b0a2';x.fillRect(px,GY-th,6,th);x.fillStyle='#6d695f';x.fillRect(px+w-6,GY-th,6,th);
        x.strokeStyle='#5b574f';x.lineWidth=2;for(let y=GY-th+30;y<GY;y+=30){x.beginPath();x.moveTo(px,y);x.lineTo(px+w,y);x.stroke()}
        x.fillStyle='#4a463f';x.fillRect(px-3,GY-th-6,w+6,8);
        if(o.k=='totem'){x.fillStyle='#e63027';x.fillRect(px+8,GY-th+16,6,6);x.fillRect(px+w-14,GY-th+16,6,6);x.fillStyle='#17171a';x.fillRect(px+9,GY-th+34,w-18,6)}
        else{x.fillStyle='#ffd21f';for(let k=0;k<3;k++){x.beginPath();x.moveTo(px+w/2,GY-th+18+k*50);x.lineTo(px+w/2+8,GY-th+30+k*50);x.lineTo(px+w/2-8,GY-th+30+k*50);x.fill()}
          x.strokeStyle='#2f7d4f';x.lineWidth=3;x.beginPath();x.moveTo(px+6,GY-th+4);x.bezierCurveTo(px-8,GY-th+50,px+14,GY-th+90,px+4,GY-30);x.stroke()}
      }else if(o.k=='spikes'){
        const n=Math.round(o.w/16);x.fillStyle='#d8d2bd';x.strokeStyle='#8a836d';x.lineWidth=1.5;
        for(let i=0;i<n;i++){const sx=px+i*(o.w/n),sw=o.w/n;x.beginPath();x.moveTo(sx,GY);x.lineTo(sx+sw/2,GY-24);x.lineTo(sx+sw,GY);x.closePath();x.fill();x.stroke()}
        x.fillStyle='#e63027';x.globalAlpha=.55;for(let i=0;i<n;i++){const sx=px+i*(o.w/n);x.fillRect(sx+o.w/n/2-1,GY-8,2,5)}x.globalAlpha=1;
      }else if(o.k=='vine'){
        const sw=Math.sin(time*2.2+o.x)*5,ey=GY-46;
        x.strokeStyle='#2e7a3a';x.lineWidth=5;x.beginPath();x.moveTo(px+13,0);x.bezierCurveTo(px+13+sw,ey*.3,px+13-sw,ey*.7,px+13+sw*.6,ey);x.stroke();
        x.strokeStyle='#58b868';x.lineWidth=2;x.beginPath();x.moveTo(px+14,0);x.bezierCurveTo(px+14+sw,ey*.3,px+14-sw,ey*.7,px+14+sw*.6,ey);x.stroke();
        const ex=px+13+sw*.6;x.fillStyle='#7c3aed';x.beginPath();x.ellipse(ex,ey+6,11,15,0,0,7);x.fill();x.fillStyle='#c4b5fd';x.beginPath();x.ellipse(ex-3,ey+2,3,5,0,0,7);x.fill();
        x.fillStyle='#e63027';for(let i=-1;i<=1;i++){x.beginPath();x.moveTo(ex+i*7-3,ey+16);x.lineTo(ex+i*7,ey+24);x.lineTo(ex+i*7+3,ey+16);x.fill()}
        // warning leaves on the way down
        x.fillStyle='#3f9a52';for(let k=0;k<5;k++){const ly=40+k*(ey-60)/5;x.beginPath();x.ellipse(px+13+(k%2?9:-9),ly,9,4,k%2?.5:-.5,0,7);x.fill()}
      }else if(o.k=='roller'){
        if(o.snake){
          const by=GY-4;x.strokeStyle='#2f9e44';x.lineWidth=9;x.lineCap='round';x.beginPath();
          for(let i=0;i<=10;i++){const sx=px+i*4,sy=by-6-Math.sin(time*9+i*.9)*5;i?x.lineTo(sx,sy):x.moveTo(sx,sy)}x.stroke();
          x.strokeStyle='#f1c40f';x.lineWidth=3;x.setLineDash([4,8]);x.stroke();x.setLineDash([]);
          x.fillStyle='#2f9e44';x.beginPath();x.ellipse(px-2,by-10,8,6,0,0,7);x.fill();x.fillStyle='#fff';x.fillRect(px-5,by-13,3,3);x.fillStyle='#e63027';x.fillRect(px-12,by-9,6,2);
        }else{
          x.save();x.translate(px+18,GY-18);x.rotate(-time*(8));x.fillStyle='#6b4423';x.beginPath();x.arc(0,0,18,0,7);x.fill();
          x.strokeStyle='#d6a96b';x.lineWidth=2;for(let r=4;r<18;r+=5){x.beginPath();x.arc(0,0,r,0,7);x.stroke()}
          x.fillStyle='#e63027';x.fillRect(-2,-18,4,6);x.restore();
        }
      }else if(o.k=='rock'){
        if(o.state==1){const f=clamp(1-o.y0/430,0,1);x.fillStyle=`rgba(0,0,0,${.15+f*.35})`;x.beginPath();x.ellipse(px+20,GY+1,8+f*20,3+f*3,0,0,7);x.fill();
          x.fillStyle='#e63027';x.font='bold 18px system-ui';x.textAlign='center';x.fillText('!',px+20,GY-60)}
        if(o.state>0){const cy=GY-o.y0-20;x.fillStyle='#8f8a7e';x.beginPath();x.moveTo(px,cy+20);x.lineTo(px+4,cy-10);x.lineTo(px+18,cy-22);x.lineTo(px+34,cy-12);x.lineTo(px+40,cy+20);x.closePath();x.fill();
          x.fillStyle='#b5b0a2';x.beginPath();x.moveTo(px+4,cy-10);x.lineTo(px+18,cy-22);x.lineTo(px+22,cy);x.lineTo(px+8,cy+6);x.fill();
          x.strokeStyle='#5b574f';x.lineWidth=2;x.beginPath();x.moveTo(px+22,cy-18);x.lineTo(px+18,cy+2);x.lineTo(px+28,cy+14);x.stroke()}
      }else if(o.k=='dart'){
        const cy=GY-(o.y0+o.y1)/2;x.strokeStyle='#ffb347';x.globalAlpha=.4;x.lineWidth=3;x.beginPath();x.moveTo(px+o.w,cy);x.lineTo(px+o.w+50,cy);x.stroke();x.globalAlpha=1;
        x.strokeStyle='#6b4423';x.lineWidth=3;x.beginPath();x.moveTo(px+6,cy);x.lineTo(px+o.w,cy);x.stroke();
        x.fillStyle='#d8d2bd';x.beginPath();x.moveTo(px-2,cy);x.lineTo(px+10,cy-6);x.lineTo(px+10,cy+6);x.fill();
        x.fillStyle='#e63027';x.fillRect(px+o.w-8,cy-5,8,3);x.fillRect(px+o.w-8,cy+2,8,3);
      }else if(o.k=='bat'){
        const b=Math.sin(time*3+o.ph)*8,by=GY-(o.by+b),fl=Math.sin(time*18+o.ph)*9;
        x.fillStyle='#1f1630';x.beginPath();x.ellipse(px+17,by,9,8,0,0,7);x.fill();
        for(const sd of[-1,1]){x.beginPath();x.moveTo(px+17,by-2);x.quadraticCurveTo(px+17+sd*20,by-16-fl,px+17+sd*30,by-2+fl*.4);x.quadraticCurveTo(px+17+sd*20,by+2,px+17+sd*14,by+4);x.closePath();x.fill()}
        x.fillStyle='#ff4d4d';x.fillRect(px+13,by-3,3,3);x.fillRect(px+19,by-3,3,3);
        x.fillStyle='#fff';x.fillRect(px+14,by+3,2,3);x.fillRect(px+19,by+3,2,3);
      }
    }
  }
  function warnings(){
    for(const o of obs){
      if(o.k=='dart'||(o.k=='roller'&&o.x-cam+PX>W-4)){const px=o.x-cam+PX;if(px<W-4)continue;
        if(Math.floor(time*8)%2)continue;const cy=GY-(o.y0+o.y1)/2;x.fillStyle='#e63027';x.beginPath();x.moveTo(W-8,cy-12);x.lineTo(W-26,cy);x.lineTo(W-8,cy+12);x.fill();x.fillStyle='#fff';x.font='bold 14px system-ui';x.textAlign='center';x.fillText('!',W-12,cy+5)}
    }
  }
  function drawItems(){
    for(const it of items){
      const px=it.x-cam+PX,py=GY-it.y;if(px<-30||px>W+30)continue;
      if(it.k=='gem'){
        const w=Math.abs(Math.cos(time*4+it.sp))*8+3;
        x.fillStyle='#10b981';x.strokeStyle='#d1fae5';x.lineWidth=1.5;x.beginPath();x.moveTo(px,py-10);x.lineTo(px+w,py-2);x.lineTo(px,py+10);x.lineTo(px-w,py-2);x.closePath();x.fill();x.stroke();
        x.fillStyle='#a7f3d0';x.beginPath();x.moveTo(px,py-10);x.lineTo(px+w*.4,py-3);x.lineTo(px-w*.5,py-3);x.fill();
      }else{
        const bob=Math.sin(time*4)*3;x.fillStyle='rgba(255,255,255,.2)';x.beginPath();x.arc(px,py+bob,19,0,7);x.fill();
        x.lineWidth=3;
        if(it.k=='magnet'){x.strokeStyle='#e63027';x.beginPath();x.arc(px,py+bob,8,PI,0);x.lineTo(px+8,py+bob+8);x.moveTo(px-8,py+bob);x.lineTo(px-8,py+bob+8);x.stroke();x.fillStyle='#e5e7eb';x.fillRect(px-11,py+bob+6,6,5);x.fillRect(px+5,py+bob+6,6,5)}
        else if(it.k=='shield'){x.fillStyle='#38bdf8';x.beginPath();x.moveTo(px-10,py+bob-8);x.lineTo(px+10,py+bob-8);x.lineTo(px+9,py+bob+3);x.lineTo(px,py+bob+12);x.lineTo(px-9,py+bob+3);x.closePath();x.fill();x.strokeStyle='#e0f2fe';x.stroke()}
        else{x.fillStyle='#ffd21f';x.strokeStyle='#b45309';x.lineWidth=2;x.beginPath();x.ellipse(px,py+bob,8,11,0,0,7);x.fill();x.stroke();x.fillStyle='#b45309';x.fillRect(px-3,py+bob-4,2,3);x.fillRect(px+1,py+bob-4,2,3);x.fillRect(px-3,py+bob+3,6,2)}
      }
    }
  }
  function boulder(){
    const r=80,cxp=PX-14-bg-r,cy=GY-r+6,a=cam/r;
    if(cxp+r<-4)return;
    x.save();x.translate(cxp,cy);
    const g=x.createRadialGradient(-r*.3,-r*.35,r*.1,0,0,r);g.addColorStop(0,'#b6aea0');g.addColorStop(1,'#5d564b');
    x.fillStyle=g;x.beginPath();x.arc(0,0,r,0,7);x.fill();
    x.rotate(a);x.strokeStyle='#463f36';x.lineWidth=3;
    x.beginPath();x.moveTo(-r*.7,-r*.1);x.lineTo(-r*.2,-r*.3);x.lineTo(r*.1,-r*.1);x.lineTo(r*.5,-r*.5);x.moveTo(r*.1,-r*.1);x.lineTo(r*.2,r*.4);x.lineTo(r*.6,r*.5);x.moveTo(-r*.3,r*.4);x.lineTo(-r*.1,r*.7);x.stroke();
    x.fillStyle='#4b453c';for(let i=0;i<6;i++){x.beginPath();x.arc(Math.cos(i*1.9)*r*.6,Math.sin(i*1.9)*r*.55,6+i%3*3,0,7);x.fill()}
    x.restore();
    if(bg<60){x.fillStyle='#fff';x.globalAlpha=.35;for(let i=0;i<4;i++)x.fillRect(cxp+r*.6+R(0,30),GY-R(2,26),R(10,24),3);x.globalAlpha=1}
  }
  function figure(ph,air,slid,fl){
    // drawn with feet at (0,0), facing right, y up is negative
    const hipY=-28;x.lineCap='round';
    if(fl){x.translate(0,-28);x.rotate(fl);x.translate(0,28)}
    const lean=slid?0:.14;
    for(const sd of[-1,1]){
      const a=air?(sd<0?.95:-.45):slid?(sd<0?-.2:.1):Math.sin(ph+(sd>0?PI:0))*1.0;
      const fx=Math.sin(a)*(slid?22:17),fy=hipY+Math.cos(a)*(slid?8:26)-(!air&&!slid&&Math.sin(ph+(sd>0?PI:0)+1.2)>.4?6:0);
      x.strokeStyle='#6b4a2b';x.lineWidth=7;x.beginPath();x.moveTo(0,hipY);x.lineTo(fx,Math.min(-2,fy));x.stroke();
      x.fillStyle='#3a2616';x.fillRect(fx-4,Math.min(-2,fy)-2,10,5);
    }
    x.save();x.translate(0,hipY);x.rotate(lean);
    x.fillStyle='#2e6b3a';x.fillRect(-14,-30,8,16);                       // backpack
    x.fillStyle='#d9b26a';x.fillRect(-8,-30,17,32);                       // shirt
    x.fillStyle='#8a5a2b';x.fillRect(-8,-30,4,32);x.fillRect(-8,-6,17,4);// strap and belt
    for(const sd of[-1,1]){
      const a=air?(sd<0?-2.2:-1.6):Math.sin(ph+(sd>0?0:PI))*1.0,ax=Math.sin(a)*14,ay=-26+Math.cos(a)*14;
      x.strokeStyle='#d9b26a';x.lineWidth=5.5;x.beginPath();x.moveTo(0,-26);x.lineTo(ax,ay);x.stroke();
      x.fillStyle='#f1c27d';x.beginPath();x.arc(ax,ay,3.2,0,7);x.fill();
    }
    x.fillStyle='#f1c27d';x.beginPath();x.arc(3,-40,8.5,0,7);x.fill();
    x.fillStyle='#17171a';x.fillRect(8,-42,2.5,3);
    x.fillStyle='#7a4a1f';x.beginPath();x.ellipse(3,-46,14,3.6,0,0,7);x.fill();x.beginPath();x.moveTo(-6,-46);x.quadraticCurveTo(-5,-58,3,-58);x.quadraticCurveTo(11,-58,12,-46);x.closePath();x.fill();
    x.fillStyle='#e63027';x.fillRect(-5,-47,16,3);
    // scarf
    if(!slid){x.strokeStyle='#e63027';x.lineWidth=4.5;x.beginPath();x.moveTo(-3,-31);
    x.quadraticCurveTo(-18,-31+Math.sin(time*14)*3,-30-s*.03,-33+Math.sin(time*14+1)*5);x.stroke()}
    x.restore();
  }
  function player(){
    const slid=sl>0&&h<=0;
    if(inv>0&&dash<=0&&Math.floor(time*16)%2==0&&!over)return;
    const gb=GY-Math.max(h,-80);
    x.fillStyle='rgba(0,0,0,.3)';if(h>-10){x.beginPath();x.ellipse(PX,GY+1,16-Math.min(10,h*.05),4,0,0,7);x.fill()}
    x.save();x.translate(PX+(slid?10:0),gb+(slid?7:0));
    if(slid){x.rotate(-1.25);x.translate(0,0)}
    if(shield>0){x.fillStyle='rgba(125,211,252,.22)';x.strokeStyle='#7dd3fc';x.lineWidth=2;x.beginPath();x.arc(0,-30,40,0,7);x.fill();x.stroke()}
    if(dash>0){x.fillStyle='rgba(255,210,31,.28)';x.beginPath();x.arc(0,-30,44+Math.sin(time*20)*3,0,7);x.fill()}
    figure(cam/26,h>0||vy!=0||!onGround(cam),slid,jumps==2&&h>0?-((time*14)%(2*PI)):0);
    x.restore();
  }
  function fg(B){
    x.fillStyle=B.i==2?'#0b1a1a':'#0b2414';const off=cam*1.5,TW=140;
    for(let i=Math.floor(off/TW)-1;i<=Math.ceil((off+W)/TW)+1;i++){
      const cx=i*TW-off+hs(i,9)*50,r=hs(i,8);if(r<.35)continue;
      for(let k=0;k<5;k++){const ang=-PI/2+(k-2)*.5,len=26+r*26;x.beginPath();x.moveTo(cx,H+2);x.quadraticCurveTo(cx+Math.cos(ang)*len*.6,H-len*.8,cx+Math.cos(ang)*len,H-len*Math.abs(Math.sin(ang))-4);x.quadraticCurveTo(cx+Math.cos(ang)*len*.5+6,H-len*.4,cx+8,H+2);x.fill()}
    }
    // falling leaves
    x.fillStyle=B.gt;for(let i=0;i<8;i++){const lx=((hs(i,5)*W-cam*.6+time*20*(i%3+1))%W+W)%W,ly=(hs(i,6)*GY+time*(14+i*3))%GY;x.globalAlpha=.55;x.beginPath();x.ellipse(lx,ly,4,2,time+i,0,7);x.fill()}x.globalAlpha=1;
  }
  function hudDraw(){
    text(String(score()),14,42,36,'#fff','left');
    x.fillStyle='#10b981';x.beginPath();x.moveTo(W-96,26);x.lineTo(W-88,34);x.lineTo(W-96,46);x.lineTo(W-104,34);x.fill();text(String(gems),W-12,46,26,'#fff','right');
    // boulder danger bar
    const f=bg/BG0;x.fillStyle='#0008';x.fillRect(14,H-26,120,12);x.fillStyle=f<.45?'#e63027':f<.75?'#f59e0b':'#4ade80';x.fillRect(15,H-25,118*f,10);
    x.font='11px system-ui';x.textAlign='left';x.fillStyle='#fff';x.fillText('BOULDER',16,H-30);
    let px=W/2-60;
    const pill=(col,lab,v)=>{x.fillStyle='#0009';x.fillRect(px,10,52,20);x.fillStyle=col;x.fillRect(px,10,52*v,20);x.fillStyle='#fff';x.font='bold 12px system-ui';x.textAlign='center';x.fillText(lab,px+26,25);px+=58};
    if(magnet>0)pill('#ef4444','MAGNET',magnet/8);if(shield>0)pill('#38bdf8','SHIELD',1);if(dash>0)pill('#ffd21f','IDOL',dash/3.4);
  }
  function draw(){
    const B=biome(cam);
    x.save();
    if(shake>0)x.translate(R(-3,3),R(-3,3));
    sky(B);far(B);mid(B);ground(B);drawObs(B);drawItems();warnings();boulder();player();
    parts.forEach(q=>{x.globalAlpha=clamp(q.life*2.2,0,1);x.fillStyle=q.col;const px=q.w?q.x-cam+PX:q.x;x.fillRect(px-q.r/2,q.y-q.r/2,q.r,q.r)});x.globalAlpha=1;
    if(dash>0){x.strokeStyle='rgba(255,230,120,.5)';x.lineWidth=2;for(let i=0;i<9;i++){const ly=40+hs(i,Math.floor(time*10))*230,lx=hs(i,2)*W;x.beginPath();x.moveTo(lx,ly);x.lineTo(lx+60,ly);x.stroke()}}
    fg(B);
    x.restore();
    hudDraw();
    if(!started){x.fillStyle='#000a';x.fillRect(0,H/2-90,W,170);text('JUNGLE DASH',W/2,H/2-30,52,'#ffd21f');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Outrun the boulder! Tap or press any key to start',W/2,H/2+4);
      x.fillText('Left side / Space: jump (twice for a double jump)   Right side / Down: slide',W/2,H/2+30);x.fillStyle='#b9f6ca';x.fillText('Watch for rolling logs, snakes, darts and falling rocks. Two hits close together and the boulder gets you.',W/2,H/2+56)}
    if(over&&deadT>.5){x.fillStyle='#000b';x.fillRect(0,H/2-90,W,180);text('CRUSHED!',W/2,H/2-30,54,'#ffd21f');text(score()+' pts',W/2,H/2+14,32,'#fff');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText('Best '+best('jungle',score())+'   '+gems+' gems   Tap or press Enter to retry',W/2,H/2+50)}
  }

  /* ---------- input and loop ---------- */
  on(document,'keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const k=e.key;
    if(over){if(k=='Enter'||k==' '){e.preventDefault();if(deadT>.4)reset()}return}
    if(k==' '||k=='ArrowUp'||k=='w'||k=='W'){e.preventDefault();if(!e.repeat)jump()}
    else if(k=='ArrowDown'||k=='s'||k=='S'){e.preventDefault();slide()}
    else if(k=='Enter'&&!started){started=true;hud()}
  });
  on(c,'pointerdown',e=>{
    e.preventDefault();
    if(over){if(deadT>.4)reset();return}
    const r=c.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width;
    if(fx<.6)jump();else slide();
  });
  reset();
  // small hook so automated tests can drive the game
  c.__jd={warp(v){cam=v;obs=[];pits=[];items=[];nextX=cam+700},hitWhy(){return lastHit},step(dt){update(dt)},act(a){a=='j'?jump():slide()},st(){return{cam,s,h,vy,jumps,sl,bg,over,started,gems,t,inv,shield,dash,obs,pits,items}},manual(v){manual=v},reset,score,start(){started=true}};
  let last=performance.now(),raf;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!manual)update(dt);draw();raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
