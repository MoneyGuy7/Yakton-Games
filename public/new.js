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
