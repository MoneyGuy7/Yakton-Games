function lanes(el){
  const W=360,H=560,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d');el.append(c);
  const X=(l,z)=>W/2+(l-1)*115*(.15+.85*z),Y=z=>160+z*330,S=z=>.15+.85*z,PZ=.85;
  let ln,px,jy,vy,sl,obs,coins,sp,d,n,gap,over,off;
  function reset(){ln=px=1;jy=vy=sl=0;obs=[];coins=[];sp=.009;d=0;n=0;gap=0;over=0;off=0;st('Swipe or use arrows: left/right, Up to jump, Down to slide.')}
  const score=()=>Math.floor(d)+n*5;
  function spawn(){const l=rnd(3),r=Math.random();
    if(r<.3){obs.push({l,z:0,ty:0});obs.push({l:(l+1+rnd(2))%3,z:0,ty:0})}
    else obs.push({l,z:0,ty:r<.6?1:2});
    const cl=rnd(3);for(let i=0;i<4;i++)coins.push({l:cl,z:-.18-i*.05})}
  function tick(){
    if(!over){
      sp=Math.min(.02,sp+.000004);d+=sp*100;off=(off+sp)%.1;gap-=sp;
      if(gap<=0){spawn();gap=.42+Math.random()*.25}
      px+=(ln-px)*.25;
      if(jy>0||vy>0){jy+=vy;vy-=.007;if(jy<=0){jy=0;vy=0}}
      if(sl>0)sl--;
      obs.forEach(o=>o.z+=sp);coins.forEach(o=>o.z+=sp);
      obs=obs.filter(o=>o.z<1.1);coins=coins.filter(o=>o.z<1.1);
      for(const o of obs)if(o.z>PZ-.05&&o.z<PZ+.05&&Math.abs(px-o.l)<.55&&(o.ty==0||(o.ty==1&&jy<.3)||(o.ty==2&&!sl))){
        over=1;st(`Busted! ${score()} points. Best ${best('lanes',score())}. Tap or press Enter.`);break}
      coins=coins.filter(o=>{if(Math.abs(o.z-PZ)<.05&&Math.abs(px-o.l)<.55&&jy<.6){n++;return false}return true});
      if(!over)st(score()+' pts   '+n+' coins');
    }
    draw();
  }
  function box(l,z,w,h,col,lift=0){const s=S(z),cx=X(l,z),y=Y(z)-lift*s;x.fillStyle=col;x.fillRect(cx-w*s/2,y-h*s,w*s,h*s);x.fillStyle='#0004';x.fillRect(cx-w*s/2,y-h*s,w*s,h*s*.18)}
  function draw(){
    const g=x.createLinearGradient(0,0,0,160);g.addColorStop(0,'#2b1b4a');g.addColorStop(1,'#f2784b');x.fillStyle=g;x.fillRect(0,0,W,160);
    x.fillStyle='#1a1530';for(let i=0;i<8;i++){const h=40+(i*37%60);x.fillRect(i*48,160-h,40,h)}
    x.fillStyle='#2a2a2e';x.fillRect(0,160,W,H-160);
    x.fillStyle='#3a3a40';x.beginPath();x.moveTo(X(-.5,0),Y(0));x.lineTo(X(2.5,0),Y(0));x.lineTo(X(2.5,1.1),Y(1.1));x.lineTo(X(-.5,1.1),Y(1.1));x.fill();
    x.strokeStyle='#ffd21f';x.lineWidth=3;for(const l of[.5,1.5]){x.beginPath();x.moveTo(X(l,0),Y(0));x.lineTo(X(l,1.1),Y(1.1));x.stroke()}
    x.strokeStyle='#ffffff30';x.lineWidth=2;for(let i=0;i<11;i++){const z=i*.1+off;for(let l=0;l<3;l++){x.beginPath();x.moveTo(X(l-.4,z),Y(z));x.lineTo(X(l+.4,z),Y(z));x.stroke()}}
    const items=[...obs.map(o=>({o,k:0})),...coins.map(o=>({o,k:1}))].filter(i=>i.o.z>0).sort((a,b)=>a.o.z-b.o.z);
    let drew=0;
    const player=()=>{drew=1;const s=S(PZ),cx=X(px,PZ),y=Y(PZ)-jy*150,h=(sl?34:64)*s*1.3;
      x.fillStyle='#0005';x.beginPath();x.ellipse(cx,Y(PZ),22*s*1.3,6,0,0,7);x.fill();
      x.fillStyle='#e63027';x.fillRect(cx-16*s*1.3,y-h,32*s*1.3,h);x.fillStyle='#ffd21f';x.beginPath();x.arc(cx,y-h-8*s,10*s*1.3,0,7);x.fill()};
    for(const{o,k}of items){if(!drew&&o.z>PZ)player();
      if(k){const s=S(o.z);x.fillStyle='#ffd21f';x.beginPath();x.arc(X(o.l,o.z),Y(o.z)-30*s,9*s,0,7);x.fill()}
      else if(o.ty==0){box(o.l,o.z,95,120,'#4a7bd0');box(o.l,o.z,70,30,'#0b1220',60)}
      else if(o.ty==1){box(o.l,o.z,90,34,'#e63027')}
      else{const s=S(o.z),cx=X(o.l,o.z),y=Y(o.z);x.fillStyle='#888';x.fillRect(cx-48*s,y-110*s,6*s,110*s);x.fillRect(cx+42*s,y-110*s,6*s,110*s);x.fillStyle='#f97316';x.fillRect(cx-48*s,y-85*s,96*s,22*s)}}
    if(!drew)player();
    if(over){x.fillStyle='#000b';x.fillRect(0,H/2-50,W,100);x.fillStyle='#fff';x.textAlign='center';x.font='38px Impact,"Arial Black",sans-serif';x.fillText('BUSTED',W/2,H/2+13)}
  }
  const act=a=>{if(over)return;if(a=='l')ln=Math.max(0,ln-1);if(a=='r')ln=Math.min(2,ln+1);if(a=='u'&&jy==0){vy=.1;jy=.001;sl=0}if(a=='d'){sl=30;if(jy>0)vy=-.1}};
  dirs(c,act);
  on(document,'keydown',e=>{if(e.key==' '){e.preventDefault();act('u')}if(over&&e.key=='Enter')reset()});
  on(c,'click',()=>{if(over)reset()});
  reset();const t=setInterval(tick,1000/60);return()=>clearInterval(t);
}

function heli(el){
  const W=640,H=400,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d'),k={};
  const menu=mk('div',{class:'cm'}),row=(...a)=>{const d=mk('div',{class:'row'});d.append(...a);return d};
  const code=mk('input',{placeholder:'Room code',maxlength:8,'aria-label':'Room code'}),b1=mk('button',{type:'button'},'Play a bot'),b2=mk('button',{type:'button'},'Join online'),b3=mk('button',{type:'button'},'New code');
  menu.append(row(b1),row(code,b3,b2),mk('p',{class:'sm'},'Online: you and a friend type the same code. Arrows or WASD move, hold Space to shoot. On a phone, drag to fly, it fires for you.'));
  c.hidden=true;el.append(menu,c);
  let mode,ws,side=1,wait=0,over=0,me,op,mb,eb,cd,t=0,tx=null,dead=0,room='';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function reset(){me={x:side==1?80:W-80,y:H/2,vx:0,vy:0,hp:10};op={x:W-me.x,y:H/2,hp:10};mb=[];eb=[];cd=0;over=0}
  function begin(m){mode=m;menu.hidden=true;c.hidden=false;reset()}
  const send=o=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))};
  b1.onclick=()=>{side=1;begin('bot');st('Shoot the bot. 10 hits wins.')};
  b3.onclick=()=>{code.value=Math.random().toString(36).slice(2,6).toUpperCase()};
  b2.onclick=()=>{room=code.value.trim().toUpperCase().replace(/\W/g,'');if(!room){st('Type a room code, or press New code.');return}
    try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws/'+room)}catch{st('Online play only works on the website.');return}
    begin('online');wait=1;st('Connecting...');
    ws.onmessage=e=>{const m=JSON.parse(e.data);
      if(m.t=='hello'){side=m.c;wait=m.n<2;reset();st(wait?'Waiting for a friend. Room code: '+room:'Fight!')}
      else if(m.t=='join'){wait=0;reset();st('Fight!')}
      else if(m.t=='st'){op.x=m.x;op.y=m.y;op.hp=m.hp}
      else if(m.t=='sh')eb.push({x:m.x,y:m.y,vx:m.vx})
      else if(m.t=='left'){wait=1;reset();st('Your friend left. Room code: '+room)}
      else if(m.t=='full')st('That room already has two players.')};
    ws.onclose=()=>{if(!dead)st('Disconnected. Press Restart.')}};
  function finish(win){over=1;send({t:'st',x:me.x,y:me.y,hp:me.hp});st(win?'You win! Press Enter or Restart for a rematch.':'You got shot down. Press Enter for a rematch.')}
  function tick(){
    t++;
    if(mode&&!wait&&!over){
      let ax=(k.arrowright||k.d?1:0)-(k.arrowleft||k.a?1:0),ay=(k.arrowdown||k.s?1:0)-(k.arrowup||k.w?1:0);
      if(tx){ax=clamp((tx.x-me.x)/30,-1,1);ay=clamp((tx.y-me.y)/30,-1,1)}
      me.vx=(me.vx+ax*.6)*.88;me.vy=(me.vy+ay*.6)*.88;me.x=clamp(me.x+me.vx,20,W-20);me.y=clamp(me.y+me.vy,20,H-40);
      if(cd>0)cd--;
      if((k[' ']||tx)&&!cd){cd=12;const b={x:me.x+side*26,y:me.y+4,vx:side*8};mb.push(b);send({t:'sh',x:b.x,y:b.y,vx:b.vx})}
      mb.forEach(b=>b.x+=b.vx);eb.forEach(b=>b.x+=b.vx);
      mb=mb.filter(b=>{if(mode=='bot'&&Math.abs(b.x-op.x)<24&&Math.abs(b.y-op.y)<14){op.hp--;return false}return b.x>-10&&b.x<W+10});
      eb=eb.filter(b=>{if(Math.abs(b.x-me.x)<24&&Math.abs(b.y-me.y)<14){me.hp--;return false}return b.x>-10&&b.x<W+10});
      if(mode=='bot'){op.y=clamp(op.y+clamp(me.y-op.y+Math.sin(t/40)*60,-2.2,2.2),20,H-40);if(rnd(45)==0)eb.push({x:op.x-side*26,y:op.y+4,vx:-side*7})}
      if(mode=='online'&&t%3==0)send({t:'st',x:me.x,y:me.y,hp:me.hp});
      if(me.hp<=0)finish(0);else if(op.hp<=0)finish(1);
    }
    draw();
  }
  function heliAt(h,dir,col){x.save();x.translate(h.x,h.y);x.scale(dir,1);
    x.fillStyle=col;x.fillRect(-26,-6,48,18);x.fillRect(-42,-2,20,5);x.fillStyle='#bfe9ff';x.fillRect(4,-3,14,9);
    x.fillStyle='#111';x.fillRect(-26,14,52,3);x.fillRect(-2,-12,4,6);
    x.fillRect(-34*Math.cos(t*.9),-12,68*Math.abs(Math.cos(t*.9))+4,2);x.restore()}
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#4aa8ff');g.addColorStop(1,'#bfe9ff');x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='#ffffffaa';for(let i=0;i<5;i++){const cx=((i*170-t*(.3+i*.1))%(W+120)+W+120)%(W+120)-60;x.beginPath();x.ellipse(cx,60+i*50%200,50,16,0,0,7);x.fill()}
    x.fillStyle='#2f9e44';x.fillRect(0,H-24,W,24);
    if(!mode)return;
    const mc=side==1?'#e63027':'#3b82f6',oc=side==1?'#3b82f6':'#e63027';
    heliAt(op,-side,oc);heliAt(me,side,mc);
    x.fillStyle='#ffd21f';mb.forEach(b=>x.fillRect(b.x-5,b.y-2,10,4));x.fillStyle='#fff';eb.forEach(b=>x.fillRect(b.x-5,b.y-2,10,4));
    x.font='bold 16px system-ui';x.textAlign='left';x.fillStyle='#000';x.fillText('You '+'♥'.repeat(Math.max(0,me.hp)),10,22);x.textAlign='right';x.fillText('♥'.repeat(Math.max(0,op.hp))+' Them',W-10,22);
    if(wait){x.fillStyle='#000a';x.fillRect(0,H/2-30,W,60);x.fillStyle='#fff';x.textAlign='center';x.font='22px system-ui';x.fillText('Waiting for a friend... code '+room,W/2,H/2+8)}
  }
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow')||n==' ')e.preventDefault();if(over&&n=='enter'){reset();send({t:'st',x:me.x,y:me.y,hp:10})}});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});
  const pt=e=>{const r=c.getBoundingClientRect();tx={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
  on(c,'pointerdown',pt);on(c,'pointermove',e=>{if(tx)pt(e)});on(c,'pointerup',()=>{tx=null});on(c,'pointerleave',()=>{tx=null});
  st('Pick a mode.');const i=setInterval(tick,1000/60);return()=>{dead=1;clearInterval(i);if(ws)ws.close()};
}
