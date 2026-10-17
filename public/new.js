// Heli Duel: 1v1 helicopter dogfight. Mouse aims, click fires the gun, right click or R fires a rocket, WASD flies.
// Phone: left thumb flies, right thumb aims and fires, ROCKET button. Bot (3 levels) or a friend online with a room code.
function heli(el){
  const W=800,H=480,GY=H-46,MAXHP=100;
  const c=mk('canvas',{width:W,height:H}),x=c.getContext('2d'),k={};
  c.style.cursor='none';
  const menu=mk('div',{class:'cm'}),row=(...a)=>{const d=mk('div',{class:'row'});d.append(...a);return d};
  const code=mk('input',{placeholder:'Room code',maxlength:8,'aria-label':'Room code'}),
    b1=mk('button',{type:'button'},'Play a bot'),b2=mk('button',{type:'button'},'Join online'),b3=mk('button',{type:'button'},'New code'),
    lv=mk('select',{'aria-label':'Bot level'});
  ['Easy','Normal','Hard'].forEach((n,i)=>{const o=mk('option',{value:i},n);if(i==1)o.selected=true;lv.append(o)});
  menu.append(row(lv,b1),row(code,b3,b2),
    mk('p',{class:'sm'},'WASD flies. Mouse aims, hold click to fire the gun, right click or R launches a rocket (slow reload, big blast). On a phone: left thumb flies, right thumb aims and fires, tap ROCKET.'));
  c.hidden=true;el.append(menu,c);
  c.addEventListener('contextmenu',e=>e.preventDefault());
  let mode,ws,side=1,wait=0,over=0,me,op,bl=[],rk=[],fx=[],tx=[],t=0,dead=0,room='',lvl=1,
    shake=0,slow=0,flash=0,hm=0,wins=[0,0],oppHp=MAXHP,rocketCd=0,cd=0,rnum=0;
  const ms={x:W/2,y:H/2,down:0,at:0},tp={mv:null,aim:null,rb:0};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sfx=n=>{try{SFX.play(n)}catch(e){}};
  // Pre-built scenery: stars-free dusk sky, far and near mountains, trees.
  const hills=[0,1].map(l=>Array.from({length:14},(_,i)=>({x:i*70-30,h:(l?50:90)+((i*37+l*19)%60)})));
  const trees=Array.from({length:26},(_,i)=>({x:i*34+((i*13)%20),s:.7+((i*7)%5)/10}));
  function reset(){
    const sx=side==1?120:W-120;
    me={x:sx,y:GY-150,vx:0,vy:0,hp:MAXHP,a:side==1?0:Math.PI,face:side,tilt:0,hit:0};
    op={x:W-sx,y:GY-150,vx:0,vy:0,hp:MAXHP,a:side==1?Math.PI:0,face:-side,tilt:0,hit:0,burst:0,think:0,ty:GY-150,rk:200};
    bl=[];rk=[];fx=[];tx=[];over=0;cd=0;rocketCd=120;oppHp=MAXHP;slow=0;shake=0;
  }
  function begin(m){mode=m;menu.hidden=true;c.hidden=false;reset()}
  const send=o=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))};
  const sync=()=>send({t:'st',x:me.x,y:me.y,vx:me.vx,vy:me.vy,a:me.a,hp:me.hp});
  b1.onclick=()=>{side=1;lvl=+lv.value;wins=[0,0];begin('bot');st('Shoot the bot down. Click to fire, right click for a rocket.')};
  b3.onclick=()=>{code.value=Math.random().toString(36).slice(2,6).toUpperCase()};
  b2.onclick=()=>{room=code.value.trim().toUpperCase().replace(/\W/g,'');if(!room){st('Type a room code, or press New code.');return}
    try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws/'+room)}catch{st('Online play only works on the website.');return}
    wins=[0,0];begin('online');wait=1;st('Connecting...');
    ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}
      if(m.t=='hello'){side=m.c;wait=m.n<2;reset();st(wait?'Waiting for a friend. Room code: '+room:'Fight!')}
      else if(m.t=='join'){wait=0;reset();st('Fight!')}
      else if(m.t=='st'){op.x=m.x;op.y=m.y;op.vx=m.vx||0;op.vy=m.vy||0;if(m.a!=null)op.a=m.a;
        op.hp=m.hp}
      else if(m.t=='sh')bl.push({x:m.x,y:m.y,vx:m.vx,vy:m.vy||0,own:0,life:70})
      else if(m.t=='rk')rk.push({x:m.x,y:m.y,vx:m.vx,vy:m.vy,own:0,life:140})
      else if(m.t=='hit'){hm=14;flash=0;sfx('hitm');tx.push({x:m.x,y:m.y,v:m.d,l:40});spark(m.x,m.y,6,'#fff')}
      else if(m.t=='new'){reset();st('Rematch! Fight!')}
      else if(m.t=='left'){wait=1;reset();st('Your friend left. Room code: '+room)}
      else if(m.t=='full')st('That room already has two players.')};
    ws.onclose=()=>{if(!dead)st('Disconnected. Press Restart.')}};
  function spark(px,py,n,col,sp=3){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=Math.random()*sp+.5;fx.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:14+rnd(12),m:26,col,r:1+Math.random()*2,k:0})}}
  function boom(px,py,big){
    sfx('boom');shake=Math.max(shake,big?16:8);
    fx.push({x:px,y:py,vx:0,vy:0,l:22,m:22,col:'#ffd27a',r:big?70:36,k:1});
    for(let i=0;i<(big?30:16);i++){const a=Math.random()*6.28,s=Math.random()*(big?6:4)+1;
      fx.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,l:30+rnd(26),m:56,col:['#ff9a2e','#ffd54a','#ff5a2e','#444'][rnd(4)],r:2+Math.random()*4,k:2})}
  }
  function dmgMe(d,px,py){
    me.hp=Math.max(0,me.hp-d);me.hit=10;flash=Math.min(.45,flash+.18);shake=Math.max(shake,d>10?10:3);sfx('bump');
    spark(px,py,5,'#ff7a3a');send({t:'hit',x:me.x,y:me.y-18,d});
  }
  function muzzle(h){return{x:h.x+Math.cos(h.a)*30,y:h.y+4+Math.sin(h.a)*30}}
  function fireGun(){
    const m=muzzle(me),a=me.a+(Math.random()-.5)*.05,vx=Math.cos(a)*15,vy=Math.sin(a)*15;
    bl.push({x:m.x,y:m.y,vx,vy,own:1,life:60});send({t:'sh',x:m.x,y:m.y,vx,vy});
    me.vx-=Math.cos(a)*.35;me.vy-=Math.sin(a)*.35;sfx('gun');fx.push({x:m.x,y:m.y,vx:Math.cos(a)*2,vy:Math.sin(a)*2,l:4,m:4,col:'#ffe9a0',r:4,k:0});
  }
  function fireRocket(){
    const m=muzzle(me),vx=Math.cos(me.a)*8+me.vx*.4,vy=Math.sin(me.a)*8+me.vy*.4;
    rk.push({x:m.x,y:m.y,vx,vy,own:1,life:140});send({t:'rk',x:m.x,y:m.y,vx,vy});rocketCd=170;sfx('rocket');shake=Math.max(shake,3)
  }
  function finish(win){over=1;slow=60;wins[win?0:1]++;sync();boom(win?op.x:me.x,win?op.y:me.y,1);sfx(win?'win':'lose');
    best('heli',wins[0]);
    st(`${win?'You win!':'You got shot down.'} Rounds ${wins[0]} to ${wins[1]}. Press Enter or tap for a rematch.`)}
  function rematch(){reset();if(mode=='online')send({t:'new'});if(mode=='online')sync()}
  function hitHeli(h,px,py,r){return Math.hypot(px-h.x,(py-h.y)*1.25)<r}
  function steer(h,ax,ay){h.vx=(h.vx+ax*.55)*.9;h.vy=(h.vy+ay*.55)*.9;h.x=clamp(h.x+h.vx,24,W-24);h.y=clamp(h.y+h.vy,34,GY-22);h.tilt+=((clamp(h.vx/5,-.35,.35))-h.tilt)*.15}
  function update(){
    t++;if(hm>0)hm--;if(flash>0)flash-=.02;if(shake>0)shake*=.9;if(me){me.hit>0&&me.hit--;op.hit>0&&op.hit--}
    if(!mode)return;
    fx=fx.filter(f=>{f.l--;f.x+=f.vx;f.y+=f.vy;if(f.k==2){f.vy+=.05;f.vx*=.97}return f.l>0});
    tx=tx.filter(f=>{f.l--;f.y-=.8;return f.l>0});
    if(wait)return;
    // aim and input
    let ax=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),ay=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0),fire=k[' ']||ms.down,rkt=k.r||k.e||tp.rb;
    if(tp.mv){const dx=tp.mv.x-tp.mv.ox,dy=tp.mv.y-tp.mv.oy,m=Math.hypot(dx,dy);if(m>8){ax=clamp(dx/40,-1,1);ay=clamp(dy/40,-1,1)}}
    if(tp.aim){const dx=tp.aim.x-tp.aim.ox,dy=tp.aim.y-tp.aim.oy;if(Math.hypot(dx,dy)>10){me.a=Math.atan2(dy,dx);fire=1}}
    else if(performance.now()-ms.at<4000||ms.down)me.a=Math.atan2(ms.y-me.y,ms.x-me.x);
    else if(!tp.mv)me.a=Math.atan2(ms.y-me.y,ms.x-me.x);
    if(!over){
      steer(me,ax,ay);
      if(Math.cos(me.a)>.15)me.face=1;else if(Math.cos(me.a)<-.15)me.face=-1;
      if(cd>0)cd--;if(rocketCd>0)rocketCd--;
      if(fire&&cd<=0){cd=6;fireGun()}
      if(rkt&&rocketCd<=0){fireRocket()}
    }else steer(me,0,.3);
    // opponent
    if(over&&op.hp<=0)steer(op,0,.3);
    if(mode=='bot'&&!over)bot();
    else if(mode=='online'){op.x+=op.vx*.5;op.y+=op.vy*.5;op.tilt+=((clamp(op.vx/5,-.35,.35))-op.tilt)*.15}
    if(Math.cos(op.a)>.15)op.face=1;else if(Math.cos(op.a)<-.15)op.face=-1;
    // bullets
    bl=bl.filter(b=>{b.x+=b.vx;b.y+=b.vy;b.life--;
      if(b.own){
        if(hitHeli(op,b.x,b.y,22)){
          if(mode=='bot'){const d=6;op.hp=Math.max(0,op.hp-d);op.hit=10;hm=14;sfx('hitm');tx.push({x:op.x,y:op.y-18,v:d,l:40});spark(b.x,b.y,6,'#fff')}
          else spark(b.x,b.y,3,'#fff');
          return false}
      }else if(!over&&hitHeli(me,b.x,b.y,22)){dmgMe(mode=='bot'?[3,5,7][lvl]:6,b.x,b.y);return false}
      if(b.y>=GY){spark(b.x,GY,3,'#c9a36a',2);return false}
      return b.life>0&&b.x>-20&&b.x<W+20&&b.y>-20});
    rk=rk.filter(r=>{r.vx*=1.012;r.vy*=1.012;r.x+=r.vx;r.y+=r.vy;r.life--;
      if(t%2==0)fx.push({x:r.x,y:r.y,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,l:20,m:20,col:'#bbb',r:3,k:3});
      let ex=0;
      if(r.y>=GY||r.life<=0)ex=1;
      else if(r.own&&hitHeli(op,r.x,r.y,26))ex=1;
      else if(!r.own&&!over&&hitHeli(me,r.x,r.y,26))ex=1;
      if(ex){boom(r.x,r.y,1);
        const dm=h=>{const d=Math.hypot(h.x-r.x,h.y-r.y);return d<75?Math.round(34*(1-d/110)):0};
        if(r.own&&mode=='bot'){const d=dm(op);if(d){op.hp=Math.max(0,op.hp-d);op.hit=10;hm=18;tx.push({x:op.x,y:op.y-18,v:d,l:50})}}
        if(!r.own&&!over){const d=dm(me);if(d)dmgMe(d,me.x,me.y)}
        return false}
      return true});
    if(mode=='online'&&t%2==0)sync();
    if(!over){if(me.hp<=0)finish(0);else if(op.hp<=0)finish(1)}
    if(me.hp<45&&t%4==0)fx.push({x:me.x-me.face*18,y:me.y-4,vx:-me.face*.4,vy:-.6,l:26,m:26,col:me.hp<22?'#222':'#777',r:3,k:3});
    if(op.hp<45&&t%4==0)fx.push({x:op.x-op.face*18,y:op.y-4,vx:-op.face*.4,vy:-.6,l:26,m:26,col:op.hp<22?'#222':'#777',r:3,k:3});
  }
  function bot(){
    const L=[{sp:.32,acc:.25,fr:26,rr:520,hs:2.4},{sp:.45,acc:.12,fr:15,rr:380,hs:3.2},{sp:.6,acc:.04,fr:9,rr:260,hs:4.2}][lvl];
    op.think--;
    if(op.think<=0){op.think=40+rnd(50);op.ty=clamp(me.y+(Math.random()-.5)*160,60,GY-40);op.tx=clamp(me.x+(side==1?1:-1)*(240+rnd(160))*(Math.random()<.2?-1:1),60,W-60)}
    const ax=clamp((op.tx-op.x)/120,-1,1)*L.sp*1.2,ay=clamp((op.ty-op.y)/60,-1,1)*L.sp;
    steer(op,ax,ay);
    // lead the target
    const d=Math.hypot(me.x-op.x,me.y-op.y),tt=d/15;
    const want=Math.atan2(me.y+me.vy*tt*.8-op.y,me.x+me.vx*tt*.8-op.x);
    let da=want-op.a;da=Math.atan2(Math.sin(da),Math.cos(da));op.a+=clamp(da,-L.hs*.02,L.hs*.02);
    if(op.burst>0){op.burst--;if(op.burst%L.fr==0||(op.burst%5==0&&L.fr<12)){
      const a=op.a+(Math.random()-.5)*L.acc,m=muzzle(op);bl.push({x:m.x,y:m.y,vx:Math.cos(a)*14,vy:Math.sin(a)*14,own:0,life:60});sfx('gun')}}
    else if(Math.abs(da)<.35&&rnd(L.fr*2)==0)op.burst=12+rnd(14);
    op.rk--;if(op.rk<=0&&d<L.rr&&Math.abs(da)<.25){op.rk=lvl==0?420:lvl==1?280:200;const m=muzzle(op);rk.push({x:m.x,y:m.y,vx:Math.cos(op.a)*8,vy:Math.sin(op.a)*8,own:0,life:140})}
  }
  // ---------- drawing ----------
  function sky(){
    const g=x.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#1d2b6b');g.addColorStop(.45,'#7b4fa0');g.addColorStop(.8,'#ff8a5c');g.addColorStop(1,'#ffd08a');
    x.fillStyle=g;x.fillRect(0,0,W,H);
    // sun
    const sg=x.createRadialGradient(W*.5,GY-20,10,W*.5,GY-20,200);sg.addColorStop(0,'#fff3c4');sg.addColorStop(.25,'#ffd27a88');sg.addColorStop(1,'#ffd27a00');x.fillStyle=sg;x.fillRect(0,0,W,H);
    x.fillStyle='#fff3c4';x.beginPath();x.arc(W*.5,GY-20,26,0,7);x.fill();
    // clouds
    for(let i=0;i<6;i++){const cx=((i*190-t*(.15+i*.05))%(W+240)+W+240)%(W+240)-120,cy=50+(i*53)%160;
      x.fillStyle=i%2?'#ffffff22':'#ffd9c633';x.beginPath();x.ellipse(cx,cy,70,14,0,0,7);x.ellipse(cx+34,cy-8,40,12,0,0,7);x.fill()}
    // mountains (parallax)
    hills.forEach((hl,l)=>{x.fillStyle=l?'#3a2a5c':'#5a4380';x.beginPath();x.moveTo(0,GY);
      hl.forEach(p=>{x.lineTo(p.x,GY-p.h);x.lineTo(p.x+35,GY-p.h*.55)});x.lineTo(W+60,GY);x.fill()});
    // ground
    const gg=x.createLinearGradient(0,GY,0,H);gg.addColorStop(0,'#2d3b2a');gg.addColorStop(1,'#141d16');x.fillStyle=gg;x.fillRect(0,GY,W,H-GY);
    x.fillStyle='#1a2a1c';trees.forEach(tr=>{x.beginPath();x.moveTo(tr.x,GY+8);x.lineTo(tr.x+10*tr.s,GY-26*tr.s);x.lineTo(tr.x+20*tr.s,GY+8);x.fill()});
    x.fillStyle='#ffffff10';for(let i=0;i<10;i++)x.fillRect(((i*90-t*3)%W+W)%W,GY+14+(i%3)*10,40,2);
  }
  function drawHeli(h,col,dark){
    // ground shadow
    const sc=clamp(1-(GY-h.y)/420,.25,1);x.fillStyle='#00000040';x.beginPath();x.ellipse(h.x,GY+8,34*sc,5*sc,0,0,7);x.fill();
    x.save();x.translate(h.x,h.y);x.rotate(h.tilt*.8);x.scale(h.face,1);
    if(h.hit>0){x.shadowColor='#fff';x.shadowBlur=18}
    // tail boom
    x.fillStyle=dark;x.beginPath();x.moveTo(-14,-6);x.lineTo(-52,-8);x.lineTo(-54,-2);x.lineTo(-14,6);x.fill();
    x.fillStyle=col;x.beginPath();x.moveTo(-50,-8);x.lineTo(-58,-20);x.lineTo(-52,-20);x.lineTo(-44,-8);x.fill();
    // tail rotor
    x.save();x.translate(-55,-14);x.rotate(t*.9);x.fillStyle='#111c';x.fillRect(-1,-10,2,20);x.restore();
    // skids
    x.strokeStyle='#222';x.lineWidth=3;x.lineCap='round';x.beginPath();x.moveTo(-20,19);x.lineTo(24,19);x.moveTo(-12,12);x.lineTo(-14,19);x.moveTo(14,12);x.lineTo(16,19);x.stroke();
    // body
    const bg=x.createLinearGradient(0,-16,0,16);bg.addColorStop(0,col);bg.addColorStop(1,dark);
    x.fillStyle=bg;x.beginPath();x.moveTo(-18,-12);x.quadraticCurveTo(0,-20,16,-10);x.quadraticCurveTo(32,-2,28,8);x.quadraticCurveTo(10,16,-18,12);x.quadraticCurveTo(-24,0,-18,-12);x.fill();
    // stripe
    x.fillStyle='#ffffff55';x.beginPath();x.moveTo(-16,2);x.lineTo(24,4);x.lineTo(22,7);x.lineTo(-17,6);x.fill();
    // cockpit glass
    const cg=x.createLinearGradient(8,-12,24,6);cg.addColorStop(0,'#e8fbff');cg.addColorStop(1,'#4c8fb5');
    x.fillStyle=cg;x.beginPath();x.moveTo(6,-11);x.quadraticCurveTo(22,-9,28,4);x.lineTo(10,3);x.closePath();x.fill();
    x.fillStyle='#ffffff99';x.fillRect(10,-8,6,2);
    // engine & mast
    x.fillStyle='#222';x.fillRect(-10,-18,14,7);x.fillRect(-2,-24,4,8);
    x.restore();
    // rotor (screen space so blades stay flat)
    x.save();x.translate(h.x,h.y-24);x.rotate(h.tilt*.5);
    x.fillStyle='#ffffff30';x.beginPath();x.ellipse(0,0,54,3.5,0,0,7);x.fill();
    const ph=t*.7;x.fillStyle='#111';x.fillRect(-48*Math.cos(ph),-1.2,96*Math.abs(Math.cos(ph))+2,2.4);
    x.restore();
    // gun barrel (rotates with aim)
    x.save();x.translate(h.x,h.y+4);x.rotate(h.a);x.fillStyle='#2b2b30';x.fillRect(4,-2.5,28,5);x.fillStyle='#555';x.fillRect(28,-3,5,6);x.restore();
  }
  function bar(px,py,w,v,col,lab,right){
    x.fillStyle='#000a';x.fillRect(px-2,py-2,w+4,16);x.fillStyle='#ffffff18';x.fillRect(px,py,w,12);
    const f=clamp(v/MAXHP,0,1),g=x.createLinearGradient(0,py,0,py+12);g.addColorStop(0,v<30?'#ff7a6a':col);g.addColorStop(1,v<30?'#c0281a':col+'aa');
    x.fillStyle=g;right?x.fillRect(px+w*(1-f),py,w*f,12):x.fillRect(px,py,w*f,12);
    x.fillStyle='#fff';x.font='bold 11px system-ui';x.textAlign=right?'right':'left';x.fillText(lab,right?px+w:px,py+25);
  }
  function draw(){
    x.save();
    if(shake>.5)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    sky();
    if(mode){
      const mc=side==1?'#e8452c':'#3b82f6',md=side==1?'#8f1f12':'#1c3f91',oc=side==1?'#3b82f6':'#e8452c',od=side==1?'#1c3f91':'#8f1f12';
      drawHeli(op,oc,od);drawHeli(me,mc,md);
      // bullet tracers
      x.lineCap='round';bl.forEach(b=>{const l=Math.hypot(b.vx,b.vy),ux=b.vx/l,uy=b.vy/l;x.strokeStyle=b.own?'#ffe27a':'#ff8a8a';x.lineWidth=3;x.shadowColor=x.strokeStyle;x.shadowBlur=8;
        x.beginPath();x.moveTo(b.x,b.y);x.lineTo(b.x-ux*16,b.y-uy*16);x.stroke();x.shadowBlur=0});
      // rockets
      rk.forEach(r=>{x.save();x.translate(r.x,r.y);x.rotate(Math.atan2(r.vy,r.vx));x.fillStyle='#ddd';x.fillRect(-9,-2.5,16,5);x.fillStyle='#e33';x.beginPath();x.moveTo(7,-2.5);x.lineTo(13,0);x.lineTo(7,2.5);x.fill();
        x.fillStyle='#ffb347';x.beginPath();x.ellipse(-12,0,6+Math.random()*3,2.5,0,0,7);x.fill();x.restore()});
      // particles
      fx.forEach(f=>{const a=clamp(f.l/f.m,0,1);
        if(f.k==1){x.globalAlpha=a;const g=x.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r*(1.3-a*.5));g.addColorStop(0,'#fff');g.addColorStop(.4,f.col);g.addColorStop(1,'#ff5a2e00');x.fillStyle=g;x.beginPath();x.arc(f.x,f.y,f.r*(1.3-a*.5),0,7);x.fill()}
        else{x.globalAlpha=a;x.fillStyle=f.col;x.beginPath();x.arc(f.x,f.y,f.r*(f.k==3?(2-a):1),0,7);x.fill()}x.globalAlpha=1});
      // damage numbers
      x.font='bold 15px system-ui';x.textAlign='center';tx.forEach(f=>{x.globalAlpha=clamp(f.l/20,0,1);x.fillStyle='#000';x.fillText('-'+f.v,f.x+1,f.y+1);x.fillStyle='#fff';x.fillText('-'+f.v,f.x,f.y);x.globalAlpha=1});
      // HUD
      bar(14,12,260,me.hp,'#5bd98a','YOU  '+wins[0],0);bar(W-274,12,260,op.hp,'#ff9a5a',(mode=='bot'?['EASY','BOT','ACE'][lvl]:'FRIEND')+'  '+wins[1],1);
      // rocket reload
      x.fillStyle='#000a';x.fillRect(14,46,90,8);x.fillStyle=rocketCd<=0?'#ffd21f':'#888';x.fillRect(14,46,90*(1-clamp(rocketCd/170,0,1)),8);
      x.fillStyle='#fff';x.font='bold 10px system-ui';x.textAlign='left';x.fillText(rocketCd<=0?'ROCKET READY (R)':'ROCKET...',110,54);
      // crosshair + hit marker (desktop)
      if(!tp.aim&&performance.now()-ms.at<8000){x.save();x.translate(ms.x,ms.y);x.strokeStyle=hm>0?'#fff':'#ffffffcc';x.lineWidth=2;
        if(hm>0){const s=6+hm*.5;x.strokeStyle='#ff4a4a';x.lineWidth=3;x.beginPath();x.moveTo(-s,-s);x.lineTo(-s/2,-s/2);x.moveTo(s,-s);x.lineTo(s/2,-s/2);x.moveTo(-s,s);x.lineTo(-s/2,s/2);x.moveTo(s,s);x.lineTo(s/2,s/2);x.stroke();x.strokeStyle='#fff'}
        x.beginPath();x.arc(0,0,9,0,7);x.moveTo(-15,0);x.lineTo(-5,0);x.moveTo(15,0);x.lineTo(5,0);x.moveTo(0,-15);x.lineTo(0,-5);x.moveTo(0,15);x.lineTo(0,5);x.stroke();x.restore()}
      else if(hm>0){x.strokeStyle='#ff4a4a';x.lineWidth=3;const s=10+hm*.4;x.beginPath();x.moveTo(op.x-s,op.y-s);x.lineTo(op.x+s,op.y+s);x.moveTo(op.x+s,op.y-s);x.lineTo(op.x-s,op.y+s);x.stroke()}
      // touch controls
      [tp.mv,tp.aim].forEach((p,i)=>{if(!p)return;x.strokeStyle='#ffffff55';x.lineWidth=2;x.beginPath();x.arc(p.ox,p.oy,34,0,7);x.stroke();x.fillStyle=i?'#ff8a5a88':'#ffffff55';x.beginPath();x.arc(clamp(p.x,p.ox-40,p.ox+40),clamp(p.y,p.oy-40,p.oy+40),16,0,7);x.fill()});
      if(tp.touch){x.fillStyle=tp.rb?'#ffd21fcc':'#00000066';x.beginPath();x.arc(W-52,H-92,30,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=2;x.stroke();x.fillStyle=tp.rb?'#111':'#fff';x.font='bold 10px system-ui';x.textAlign='center';x.fillText('ROCKET',W-52,H-89)}
      if(flash>0){const g=x.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.9);g.addColorStop(0,'#ff000000');g.addColorStop(1,`rgba(255,40,20,${flash})`);x.fillStyle=g;x.fillRect(0,0,W,H)}
      if(wait){x.fillStyle='#000b';x.fillRect(0,H/2-34,W,68);x.fillStyle='#fff';x.textAlign='center';x.font='22px system-ui';x.fillText('Waiting for a friend... room code '+room,W/2,H/2+8)}
      if(over&&slow<=0){x.fillStyle='#000a';x.fillRect(0,H/2-50,W,100);x.textAlign='center';x.fillStyle=me.hp>0?'#7dffa8':'#ff8a7a';x.font='bold 40px system-ui';x.fillText(me.hp>0?'VICTORY':'SHOT DOWN',W/2,H/2+6);x.fillStyle='#fff';x.font='16px system-ui';x.fillText('Press Enter or tap to play again',W/2,H/2+34)}
    }
    x.restore();
  }
  // ---------- input ----------
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow')||n==' ')e.preventDefault();
    if(over&&slow<=0&&n=='enter')rematch()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});
  on(window,'blur',()=>{for(const q in k)k[q]=0;ms.down=0});
  const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
  on(c,'pointerdown',e=>{const p=pos(e);
    if(e.pointerType=='mouse'){ms.x=p.x;ms.y=p.y;ms.at=performance.now();if(e.button==2)k.r=1;else ms.down=1;
      if(over&&slow<=0)rematch();return}
    tp.touch=1;try{c.setPointerCapture(e.pointerId)}catch{}
    if(over&&slow<=0){rematch();return}
    if(Math.hypot(p.x-(W-52),p.y-(H-92))<40){tp.rb=e.pointerId;return}
    const o={x:p.x,y:p.y,ox:p.x,oy:p.y,id:e.pointerId};
    if(p.x<W/2)tp.mv=o;else tp.aim=o});
  on(c,'pointermove',e=>{const p=pos(e);
    if(e.pointerType=='mouse'){ms.x=p.x;ms.y=p.y;ms.at=performance.now();return}
    [tp.mv,tp.aim].forEach(o=>{if(o&&o.id==e.pointerId){o.x=p.x;o.y=p.y}})});
  const up=e=>{if(e.pointerType=='mouse'){if(e.button==2)k.r=0;else ms.down=0;return}
    if(tp.mv&&tp.mv.id==e.pointerId)tp.mv=null;if(tp.aim&&tp.aim.id==e.pointerId)tp.aim=null;if(tp.rb==e.pointerId)tp.rb=0};
  on(c,'pointerup',up);on(c,'pointercancel',up);on(document,'pointerup',e=>{if(e.pointerType=='mouse')ms.down=0});
  // fixed-step loop with a short slow-motion beat on the final hit
  let raf,last=performance.now(),acc=0;
  function frame(n){raf=requestAnimationFrame(frame);acc+=Math.min(100,n-last);last=n;const step=1000/60;
    while(acc>=step){acc-=step;if(slow>0){slow--;if(slow%3)continue}update()}
    draw()}
  st('Pick a mode.');raf=requestAnimationFrame(frame);
  return()=>{dead=1;cancelAnimationFrame(raf);if(ws)ws.close()};
}
