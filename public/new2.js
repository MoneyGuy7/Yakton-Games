function stack(el){
  const W=320,H=480,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d');el.append(c);
  let bl,cur,dir,sp,sc,over;
  function reset(){bl=[{x:80,w:160}];cur={x:0,w:160};dir=1;sp=2.5;sc=0;over=0;st('Click, tap or press Space to drop the block.')}
  function drop(){if(over)return reset();const p=bl[bl.length-1],l=Math.max(cur.x,p.x),r=Math.min(cur.x+cur.w,p.x+p.w);
    if(r-l<=0){over=1;st(`Tower fell at ${sc}. Best ${best('stack',sc)}. Tap to retry.`);return}
    bl.push({x:l,w:r-l});sc++;sp=Math.min(7,2.5+sc*.1);cur={x:dir>0?0:W-(r-l),w:r-l};st('Height '+sc)}
  function tick(){
    if(!over){cur.x+=dir*sp;if(cur.x+cur.w>W)dir=-1;if(cur.x<0)dir=1}
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1b1b4a');g.addColorStop(1,'#7c3aed');x.fillStyle=g;x.fillRect(0,0,W,H);
    const off=Math.max(0,bl.length-12)*24;
    bl.forEach((b,i)=>{x.fillStyle=`hsl(${i*22} 70% 55%)`;x.fillRect(b.x,H-40-i*24+off,b.w,22)});
    if(!over){x.fillStyle=`hsl(${bl.length*22} 70% 55%)`;x.fillRect(cur.x,H-40-bl.length*24+off,cur.w,22)}
    x.fillStyle='#fff';x.font='34px Impact,"Arial Black",sans-serif';x.textAlign='center';x.fillText(sc,W/2,50);
  }
  on(document,'keydown',e=>{if(e.key==' '){e.preventDefault();drop()}});on(c,'pointerdown',drop);
  reset();const t=setInterval(tick,1000/60);return()=>clearInterval(t);
}

function hop(el){
  const W=320,H=480,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d'),k={};el.append(c);
  let p,pl,sc,over,tx=null;
  function reset(){p={x:150,y:400,vy:-10};pl=[];for(let i=0;i<8;i++)pl.push({x:rnd(260),y:H-20-i*62});pl[0].x=130;sc=0;over=0;st('Arrow keys, A/D, or drag to steer.')}
  function tick(){
    if(!over){
      const a=(k.arrowright||k.d?1:0)-(k.arrowleft||k.a?1:0);p.x+=tx!=null?Math.max(-6,Math.min(6,(tx-p.x)/6)):a*5;p.x=(p.x+W)%W;
      p.vy+=.35;p.y+=p.vy;
      if(p.vy>0)for(const q of pl)if(p.y+14>q.y&&p.y+14<q.y+p.vy+10&&p.x>q.x-8&&p.x<q.x+68){p.vy=-10.5;break}
      if(p.y<H/2){const d=H/2-p.y;p.y=H/2;sc+=d;pl.forEach(q=>q.y+=d);pl=pl.filter(q=>q.y<H);
        while(pl.length<8)pl.push({x:rnd(260),y:Math.min(...pl.map(q=>q.y))-(45+rnd(30))})}
      if(p.y>H+20){over=1;st(`Fell at ${Math.floor(sc/10)}. Best ${best('hop',Math.floor(sc/10))}. Tap to retry.`)}else st('Height '+Math.floor(sc/10));
    }
    x.fillStyle='#bfe9ff';x.fillRect(0,0,W,H);
    pl.forEach(q=>{x.fillStyle='#2f9e44';x.fillRect(q.x,q.y,60,10);x.fillStyle='#237a35';x.fillRect(q.x,q.y+6,60,4)});
    x.fillStyle='#ffd21f';x.fillRect(p.x-12,p.y-12,24,26);x.fillStyle='#111';x.fillRect(p.x-6,p.y-5,4,6);x.fillRect(p.x+3,p.y-5,4,6);
    if(over){x.fillStyle='#000b';x.fillRect(0,H/2-40,W,80);x.fillStyle='#fff';x.textAlign='center';x.font='34px Impact,"Arial Black",sans-serif';x.fillText('YOU FELL',W/2,H/2+12)}
  }
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow'))e.preventDefault();if(over&&n=='enter')reset()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});
  const pt=e=>{tx=e.offsetX*W/c.clientWidth};on(c,'pointerdown',e=>{if(over)reset();else pt(e)});on(c,'pointermove',e=>{if(tx!=null)pt(e)});on(c,'pointerup',()=>{tx=null});
  reset();const t=setInterval(tick,1000/60);return()=>clearInterval(t);
}

function pong(el){
  const W=480,H=320,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d'),k={};
  const menu=mk('div',{class:'cm'}),row=(...a)=>{const d=mk('div',{class:'row'});d.append(...a);return d};
  const code=mk('input',{placeholder:'Room code',maxlength:8,'aria-label':'Room code'}),b1=mk('button',{type:'button'},'Play a bot'),b2=mk('button',{type:'button'},'Join online'),b3=mk('button',{type:'button'},'New code');
  menu.append(row(b1),row(code,b3,b2),mk('p',{class:'sm'},'Online: same code as a friend. Move with Up/Down, W/S, or drag. First to 7 wins.'));
  c.hidden=true;el.append(menu,c);
  let mode,ws,side=1,wait=0,over=0,py=130,oy=130,bx,by,vx,vy,s1=0,s2=0,dead=0,room='',my=null;
  const send=o=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))},cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  function serve(d){bx=W/2;by=H/2;vx=4*d;vy=(Math.random()-.5)*5}
  function reset(){s1=s2=0;over=0;py=oy=130;serve(Math.random()<.5?1:-1)}
  function begin(m){mode=m;menu.hidden=true;c.hidden=false;reset()}
  b1.onclick=()=>{side=1;begin('bot');st('First to 7 wins.')};
  b3.onclick=()=>{code.value=Math.random().toString(36).slice(2,6).toUpperCase()};
  b2.onclick=()=>{room=code.value.trim().toUpperCase().replace(/\W/g,'');if(!room){st('Type a room code, or press New code.');return}
    try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws/'+room)}catch{st('Online play only works on the website.');return}
    begin('online');wait=1;st('Connecting...');
    ws.onmessage=e=>{const m=JSON.parse(e.data);
      if(m.t=='hello'){side=m.c;wait=m.n<2;reset();st(wait?'Waiting for a friend. Room code: '+room:'Go!')}
      else if(m.t=='join'){wait=0;reset();st('Go!')}
      else if(m.t=='p')oy=m.y;
      else if(m.t=='b'){bx=m.x;by=m.y;vx=m.vx;vy=m.vy;s1=m.a;s2=m.b;if(s1>=7||s2>=7)fin()}
      else if(m.t=='left'){wait=1;reset();st('Your friend left. Room code: '+room)}
      else if(m.t=='full')st('That room already has two players.')};
    ws.onclose=()=>{if(!dead)st('Disconnected. Press Restart.')}};
  const mine=()=>side==1?s1:s2,theirs=()=>side==1?s2:s1;
  function fin(){over=1;st(mine()>=7?'You win! Press Restart for a rematch.':'You lose. Press Restart for a rematch.')}
  function tick(){
    if(mode&&!wait&&!over){
      const a=(k.arrowdown||k.s?1:0)-(k.arrowup||k.w?1:0);py=cl(my!=null?my-30:py+a*6,0,H-60);
      if(mode=='online')send({t:'p',y:py});
      if(mode=='bot'||side==1){
        const L=mode=='bot'?py:py,R=mode=='bot'?oy:oy;
        if(mode=='bot')oy=cl(oy+cl(by-30-oy,-3.2,3.2),0,H-60);
        bx+=vx;by+=vy;if(by<6||by>H-6)vy=-vy;
        if(vx<0&&bx<30&&bx>18&&by>L-4&&by<L+64){vx=Math.abs(vx)*1.06;vy=(by-L-30)/6}
        if(vx>0&&bx>W-30&&bx<W-18&&by>R-4&&by<R+64){vx=-Math.abs(vx)*1.06;vy=(by-R-30)/6}
        if(bx<0){s2++;serve(1)}if(bx>W){s1++;serve(-1)}
        if(mode=='online')send({t:'b',x:bx,y:by,vx,vy,a:s1,b:s2});
        if(s1>=7||s2>=7){over=1;st(s1>=7?'You win! Press Restart for a rematch.':'You lose. Press Restart for a rematch.')}
      }
      if(mode=='bot')st(`${s1} - ${s2}`);else if(mode=='online'&&!over)st(`${mine()} - ${theirs()}`);
    }
    x.fillStyle='#0d0b1f';x.fillRect(0,0,W,H);x.fillStyle='#ffffff30';for(let y=0;y<H;y+=20)x.fillRect(W/2-2,y,4,10);
    if(!mode)return;
    const L=side==1?py:oy,R=side==1?oy:py;
    x.fillStyle=side==1?'#ffd21f':'#fff';x.fillRect(18,L,10,60);x.fillStyle=side==1?'#fff':'#ffd21f';x.fillRect(W-28,R,10,60);
    x.fillStyle='#fff';x.beginPath();x.arc(bx,by,7,0,7);x.fill();
    x.font='34px Impact,"Arial Black",sans-serif';x.textAlign='center';x.fillText(s1,W/2-40,40);x.fillText(s2,W/2+40,40);
    if(wait){x.fillStyle='#000a';x.fillRect(0,H/2-30,W,60);x.fillStyle='#fff';x.font='20px system-ui';x.fillText('Waiting for a friend... code '+room,W/2,H/2+7)}
  }
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow'))e.preventDefault()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});
  const pt=e=>{my=e.offsetY*H/c.clientHeight};on(c,'pointerdown',pt);on(c,'pointermove',e=>{if(my!=null)pt(e)});on(c,'pointerup',()=>{my=null});
  st('Pick a mode.');const i=setInterval(tick,1000/60);return()=>{dead=1;clearInterval(i);if(ws)ws.close()};
}
