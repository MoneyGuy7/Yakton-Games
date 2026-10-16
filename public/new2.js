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
