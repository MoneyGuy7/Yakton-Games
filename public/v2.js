// Subway Rush (rebuilt), Road Hop 3D (isometric voxel, Crossy Road style) and Connect Four (solo, local or online).
const poly=(x,pts,col)=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fillStyle=col;x.fill()};
function netRoom(room,h){
  let ws;try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws/'+room)}catch{return}
  ws.onmessage=e=>{const m=JSON.parse(e.data);h[m.t]&&h[m.t](m)};ws.onclose=()=>h.close&&h.close();
  return{send:o=>ws.readyState==1&&ws.send(JSON.stringify(o)),close:()=>ws.close()};
}

function lanes(el){
  const W=360,H=560,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d');el.append(c);
  const S=z=>.15+.85*z,X=(l,z)=>W/2+(l-1)*115*S(z),Y=z=>160+z*330,PZ=.85;
  const BL=[...Array(14)].map((_,i)=>({x:i*28-10,h:34+(i*53)%56,w:26,l:[...Array(6)].map(()=>Math.random()<.4)}));
  let ln,px,jy,vy,sl,obs,coins,sp,d,n,gap,over,off,ph;
  function reset(){ln=px=1;jy=vy=sl=0;obs=[];coins=[];sp=.009;d=0;n=0;gap=0;over=0;off=0;ph=0;st('Swipe or use arrows: left/right, Up to jump, Down to slide.')}
  const score=()=>Math.floor(d)+n*5;
  function spawn(){const l=rnd(3),r=Math.random();
    if(r<.3){obs.push({l,z:0,ty:0});obs.push({l:(l+1+rnd(2))%3,z:0,ty:0})}else obs.push({l,z:0,ty:r<.6?1:2});
    const cl=rnd(3);for(let i=0;i<4;i++)coins.push({l:cl,z:-.18-i*.05})}
  function tick(){
    if(!over){
      sp=Math.min(.02,sp+.000004);d+=sp*100;off=(off+sp)%.1;gap-=sp;ph+=sp*60;
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
  function train(l,z){const s=S(z),cx=X(l,z),y=Y(z),w=104*s,h=134*s;
    poly(x,[[cx-w/2,y-h],[cx+w/2,y-h],[cx+w*.4,y-h-30*s],[cx-w*.4,y-h-30*s]],'#cbd5e1');
    poly(x,[[cx-w*.4,y-h-30*s],[cx+w*.4,y-h-30*s],[cx+w*.4,y-h-34*s],[cx-w*.4,y-h-34*s]],'#94a3b8');
    const g=x.createLinearGradient(0,y-h,0,y);g.addColorStop(0,'#3b82f6');g.addColorStop(1,'#1e3a8a');x.fillStyle=g;x.fillRect(cx-w/2,y-h,w,h);
    x.fillStyle='#facc15';x.fillRect(cx-w/2,y-h*.3,w,h*.1);
    x.fillStyle='#0f172a';x.fillRect(cx-w*.4,y-h*.92,w*.8,h*.4);x.fillStyle='#7dd3fc55';x.fillRect(cx-w*.4,y-h*.92,w*.3,h*.4);
    x.fillStyle='#fff';x.fillRect(cx-w*.06,y-h*.92,w*.12,h*.4);
    x.shadowColor='#fef08a';x.shadowBlur=14*s;x.fillStyle='#fef9c3';[-1,1].forEach(q=>{x.beginPath();x.arc(cx+q*w*.3,y-h*.15,6*s,0,7);x.fill()});x.shadowBlur=0}
  function barrier(l,z){const s=S(z),cx=X(l,z),y=Y(z),w=92*s,h=36*s;
    x.fillStyle='#64748b';x.fillRect(cx-w*.42,y-h-10*s,6*s,h+10*s);x.fillRect(cx+w*.42-6*s,y-h-10*s,6*s,h+10*s);
    for(let i=0;i<6;i++){x.fillStyle=i%2?'#fff':'#dc2626';x.fillRect(cx-w/2+i*w/6,y-h,w/6+.5,h*.7)}x.fillStyle='#0004';x.fillRect(cx-w/2,y-h*.3,w,h*.3)}
  function gantry(l,z){const s=S(z),cx=X(l,z),y=Y(z);
    x.fillStyle='#64748b';x.fillRect(cx-50*s,y-120*s,7*s,120*s);x.fillRect(cx+43*s,y-120*s,7*s,120*s);
    for(let i=0;i<8;i++){x.fillStyle=i%2?'#fff':'#f97316';x.fillRect(cx-50*s+i*12.5*s,y-92*s,12.5*s+.5,26*s)}}
  function runner(){const s=S(PZ)*1.25,cx=X(px,PZ),by=Y(PZ),y=by-jy*150,r=Math.sin(ph*.5),sq=sl>0;
    x.fillStyle='#0006';x.beginPath();x.ellipse(cx,by,24*s*(1-jy*.8),6*s,0,0,7);x.fill();
    const lh=sq?10:24;x.fillStyle='#1e3a8a';
    if(jy>0||sq){x.fillRect(cx-9*s,y-lh*s,8*s,lh*s);x.fillRect(cx+1*s,y-lh*s,8*s,lh*s)}
    else{x.fillRect(cx-9*s,y-24*s+Math.max(0,r)*-6*s,8*s,24*s);x.fillRect(cx+1*s,y-24*s+Math.max(0,-r)*-6*s,8*s,24*s)}
    x.fillStyle='#fff';x.fillRect(cx-10*s,y-3*s,10*s,4*s);x.fillRect(cx+1*s,y-3*s,10*s,4*s);
    const th=sq?24:36,ty=y-lh*s-th*s;x.fillStyle='#e63027';x.fillRect(cx-13*s,ty,26*s,th*s);
    x.fillStyle='#b91c1c';x.fillRect(cx-13*s,ty+th*s*.6,26*s,4*s);
    x.fillStyle='#f2c9a0';[-1,1].forEach(q=>x.fillRect(cx+q*14*s-3*s,ty+4*s+(sq?0:r*q*5*s),6*s,18*s));
    x.beginPath();x.arc(cx,ty-9*s,10*s,0,7);x.fill();
    x.fillStyle='#2563eb';x.beginPath();x.arc(cx,ty-11*s,10.5*s,Math.PI,0);x.fill();x.fillRect(cx-3*s,ty-12*s,14*s,4*s)}
  function draw(){
    const g=x.createLinearGradient(0,0,0,170);g.addColorStop(0,'#1d1147');g.addColorStop(.6,'#c2410c');g.addColorStop(1,'#fbbf24');x.fillStyle=g;x.fillRect(0,0,W,170);
    x.fillStyle='#fde68a';x.beginPath();x.arc(250,118,24,0,7);x.fill();
    BL.forEach(b=>{x.fillStyle='#24173a';x.fillRect(b.x,160-b.h,b.w,b.h);x.fillStyle='#fde68a99';b.l.forEach((o,i)=>{if(o)x.fillRect(b.x+4+(i%2)*10,160-b.h+6+(i>>1)*12,6,6)})});
    x.fillStyle='#2a2630';x.fillRect(0,160,W,H-160);
    poly(x,[[0,160],[X(-.6,0),160],[X(-.6,1.1),Y(1.1)],[0,Y(1.1)]],'#5b3a2e');poly(x,[[W,160],[X(2.6,0),160],[X(2.6,1.1),Y(1.1)],[W,Y(1.1)]],'#5b3a2e');
    poly(x,[[X(-.6,0),160],[X(2.6,0),160],[X(2.6,1.1),Y(1.1)],[X(-.6,1.1),Y(1.1)]],'#4b4a52');
    for(let i=0;i<11;i++){const z=i*.1+off,s=S(z);x.fillStyle='#2b2118';for(let l=0;l<3;l++)x.fillRect(X(l,z)-46*s,Y(z),92*s,5*s)}
    x.strokeStyle='#cbd5e1';for(let l=0;l<3;l++)for(const q of[-.3,.3]){x.lineWidth=3;x.beginPath();x.moveTo(X(l+q,0),Y(0));x.lineTo(X(l+q,1.1),Y(1.1));x.stroke()}
    const items=[...obs.map(o=>({o,k:0})),...coins.map(o=>({o,k:1}))].filter(i=>i.o.z>0).sort((a,b)=>a.o.z-b.o.z);let drew=0;
    for(const{o,k}of items){if(!drew&&o.z>PZ){runner();drew=1}
      if(k){const s=S(o.z),w=Math.abs(Math.cos(ph*.3+o.z*20))*9*s+1.5;x.shadowColor='#facc15';x.shadowBlur=8;x.fillStyle='#fbbf24';x.beginPath();x.ellipse(X(o.l,o.z),Y(o.z)-30*s,w,9*s,0,0,7);x.fill();x.shadowBlur=0;x.fillStyle='#fffbeb';x.fillRect(X(o.l,o.z)-1,Y(o.z)-36*s,2,5*s)}
      else if(o.ty==0)train(o.l,o.z);else if(o.ty==1)barrier(o.l,o.z);else gantry(o.l,o.z)}
    if(!drew)runner();
    if(sp>.014){x.strokeStyle='#fff2';x.lineWidth=1;for(let i=0;i<8;i++){const a=(i*47+ph*9)%W;x.beginPath();x.moveTo(a,170);x.lineTo(a+(a-W/2)*.4,H);x.stroke()}}
    const v=x.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.75);v.addColorStop(0,'#0000');v.addColorStop(1,'#0007');x.fillStyle=v;x.fillRect(0,0,W,H);
    if(over){x.fillStyle='#000b';x.fillRect(0,H/2-50,W,100);x.fillStyle='#fff';x.textAlign='center';x.font='38px Impact,"Arial Black",sans-serif';x.fillText('BUSTED',W/2,H/2+13)}
  }
  const act=a=>{if(over)return;if(a=='l')ln=Math.max(0,ln-1);if(a=='r')ln=Math.min(2,ln+1);if(a=='u'&&jy==0){vy=.1;jy=.001;sl=0}if(a=='d'){sl=30;if(jy>0)vy=-.1}};
  dirs(c,act);
  on(document,'keydown',e=>{if(e.key==' '){e.preventDefault();act('u')}if(over&&e.key=='Enter')reset()});
  on(c,'click',()=>{if(over)reset()});
  reset();const t=setInterval(tick,1000/60);return()=>clearInterval(t);
}

function crossy(el){
  const W=480,H=540,S=30,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d');el.append(c);
  const P=(a,y,z)=>[(a+z)*S,(a-z)*S/2-y*S*.85],sh=(C,d)=>`hsl(${C[0]} ${C[1]}% ${C[2]+d}%)`;
  function box(a,y,z,w,h,d,C){
    const q=(p,r,s)=>P(a+p,y+r,z+s);
    poly(x,[q(w,0,0),q(w,0,d),q(w,h,d),q(w,h,0)],sh(C,-10));poly(x,[q(0,0,0),q(w,0,0),q(w,h,0),q(0,h,0)],sh(C,-22));poly(x,[q(0,h,0),q(w,h,0),q(w,h,d),q(0,h,d)],sh(C,0));
  }
  let R,pos,hop,qd,maxZ,over,cam;
  function row(z){if(R[z])return R[z];
    const r=Math.random(),t=z<3?'g':r<.3?'g':r<.72?'r':'w',o={t,items:[],bl:new Set(),deco:[]};
    if(t=='g'){for(let i=-9;i<10;i++)if(Math.random()<(Math.abs(i)>4?.5:z<3?0:.16)&&!(z<3&&i==0)){o.deco.push({x:i,k:Math.random()<.8?0:1});if(Math.abs(i)<=4)o.bl.add(i)}}
    else{const dir=Math.random()<.5?1:-1,w=t=='w',v=dir*(w?.012+Math.random()*.025:.035+Math.random()*.06+Math.min(maxZ,60)*.0006);
      let a=-12+Math.random()*4;while(a<9){const L=w?2+rnd(2):Math.random()<.25?2.2:1.4;o.items.push({x:a,L,v,hue:rnd(360),tk:L>2&&!w});a+=L+(w?1.5+Math.random()*2:3+Math.random()*4)}}
    return R[z]=o}
  function reset(){R={};pos={x:0,z:0};hop=null;qd=null;maxZ=0;over=0;cam=[0,0];st('Arrow keys, WASD or swipe. Hop forward and do not get squashed or wet.')}
  function mv(d){if(over)return;if(hop){qd=d;return}
    const dx=(d=='r')-(d=='l'),dz=(d=='u')-(d=='d'),tx=Math.round(pos.x)+dx,tz=Math.round(pos.z)+dz;
    if(Math.abs(tx)>4||tz<0||tz<maxZ-4||row(tz).bl.has(tx))return;
    hop={fx:pos.x,fz:pos.z,tx,tz,t:0}}
  function die(m){over=1;st(`${m} Score ${maxZ}. Best ${best('crossy',maxZ)}. Tap or press Enter.`)}
  function tick(){
    if(!over){
      for(let z=Math.round(pos.z)-6;z<Math.round(pos.z)+14;z++){const r=row(z);r.items.forEach(i=>{i.x+=i.v;if(i.v>0&&i.x>12)i.x-=24;if(i.v<0&&i.x<-12)i.x+=24})}
      if(hop){hop.t+=.14;if(hop.t>=1){pos.x=hop.tx;pos.z=hop.tz;hop=null;if(pos.z>maxZ){maxZ=pos.z;st('Score '+maxZ)}if(qd){const q=qd;qd=null;mv(q)}}
        else{pos.x=hop.fx+(hop.tx-hop.fx)*hop.t;pos.z=hop.fz+(hop.tz-hop.fz)*hop.t}}
      const rz=Math.round(hop?hop.tz:pos.z),r=row(rz);
      if(!hop){if(r.t=='w'){const lg=r.items.find(l=>pos.x+.5>l.x&&pos.x+.5<l.x+l.L);if(lg)pos.x+=lg.v;else die('Splash!')}if(Math.abs(pos.x)>4.9)die('Swept away!')}
      if(r.t=='r'&&r.items.some(i=>Math.abs(pos.x+.5-i.x-i.L/2)<i.L/2+.3))die('Squashed!');
      if(maxZ-pos.z>5.5)die('Too slow!');
    }
    const p=P(pos.x+.5,0,pos.z+.5);cam[0]+=(p[0]-cam[0])*.12;cam[1]+=(p[1]-cam[1])*.12;draw();
  }
  function draw(){
    x.fillStyle='#8ed36a';x.fillRect(0,0,W,H);x.save();x.translate(W/2-cam[0],H*.6-cam[1]);
    const rz=Math.round(pos.z);
    for(let z=rz+13;z>=rz-6;z--){const r=row(z),ev=z%2;
      if(r.t=='g')box(-10,-.4,z,20,.4,1,[112,48,ev?50:45]);
      else if(r.t=='r'){box(-10,-.4,z,20,.3,1,[220,8,25]);for(let i=-9;i<9;i+=2)box(i,-.1,z+.46,1,.01,.08,[0,0,85])}
      else box(-10,-.5,z,20,.3,1,[200,75,55]);
      const it=[];
      r.deco.forEach(d=>it.push({x:d.x,f:()=>d.k?box(d.x+.2,0,z+.2,.6,.5,.6,[0,0,55]):(box(d.x+.35,0,z+.35,.3,.5,.3,[25,50,28]),box(d.x+.1,.5,z+.1,.8,1,.8,[128,45,32]))}));
      r.items.forEach(i=>{if(i.x>-8&&i.x<8)it.push({x:i.x,f:()=>{
        if(r.t=='w')box(i.x,-.25,z+.1,i.L,.3,.8,[28,50,34]);
        else if(i.tk){box(i.x,-.1,z+.1,i.L*.65,.9,.8,[0,0,90]);box(i.x+i.L*.65,-.1,z+.1,i.L*.35,.6,.8,[i.hue,70,48])}
        else{box(i.x,-.1,z+.1,i.L,.5,.8,[i.hue,70,50]);box(i.x+i.L*.2,.4,z+.2,i.L*.5,.4,.6,[200,35,82])}}})});
      if(rz==z||(hop&&Math.round(hop.tz)==z))it.push({x:pos.x,f:()=>{
        const gy=r.t=='r'?-.1:r.t=='w'?-.2:0,fy=gy+(hop?Math.sin(hop.t*Math.PI)*.7:0),a=pos.x,b=pos.z-z;
        const sq=over?.6:1;box(a+.15,fy,z+b+.15,.7,.6*sq,.7,[0,0,98]);box(a+.4,fy+.6*sq,z+b+.35,.2,.16,.3,[0,85,50]);
        box(a+.3,fy+.2,z+b+.85,.4,.14,.2,[35,95,55]);box(a+.7,fy+.35,z+b+.5,.04,.1,.08,[0,0,5]);box(a+.18,fy+.35,z+b+.5,.04,.1,.08,[0,0,5])}});
      it.sort((p,q)=>p.x-q.x).forEach(i=>i.f())}
    x.restore();
    x.fillStyle='#fff';x.strokeStyle='#0008';x.lineWidth=5;x.font='44px Impact,"Arial Black",sans-serif';x.textAlign='center';x.strokeText(maxZ,W/2,56);x.fillText(maxZ,W/2,56);
    if(over){x.fillStyle='#000a';x.fillRect(0,H/2-46,W,92);x.fillStyle='#fff';x.font='38px Impact,"Arial Black",sans-serif';x.fillText('GAME OVER',W/2,H/2+13)}
  }
  dirs(c,mv);on(document,'keydown',e=>{if(over&&e.key=='Enter')reset()});on(c,'click',()=>{if(over)reset()});
  let ts;on(c,'touchstart',e=>{ts=[e.touches[0].clientX,e.touches[0].clientY]},{passive:true});on(c,'touchend',e=>{const q=e.changedTouches[0];if(ts&&Math.abs(q.clientX-ts[0])<12&&Math.abs(q.clientY-ts[1])<12)mv('u')},{passive:true});
  reset();const t=setInterval(tick,1000/60);return()=>clearInterval(t);
}

function connect4(el){
  const W=7,H=6,S=64,c=mk('canvas',{width:W*S,height:(H+1)*S}),x=c.getContext('2d'),LN=[];
  for(let r=0;r<H;r++)for(let q=0;q<W;q++)for(const[a,b]of[[0,1],[1,0],[1,1],[1,-1]]){const l=[];for(let i=0;i<4;i++){const y=r+a*i,z=q+b*i;if(y<0||y>=H||z<0||z>=W)break;l.push(y*W+z)}if(l.length==4)LN.push(l)}
  const menu=mk('div',{class:'cm'}),row2=(...a)=>{const d=mk('div',{class:'row'});d.append(...a);return d};
  const code=mk('input',{placeholder:'Room code',maxlength:8,'aria-label':'Room code'}),b1=mk('button',{type:'button'},'Play the computer'),b2=mk('button',{type:'button'},'Two players, one screen'),b3=mk('button',{type:'button'},'Join online'),b4=mk('button',{type:'button'},'New code');
  menu.append(row2(b1),row2(b2),row2(code,b4,b3),mk('p',{class:'sm'},'Online: you and a friend type the same code on different devices. Click or tap a column to drop a disc.'));
  c.hidden=true;el.append(menu,c);
  let b,t,mode,me,net,over,wait,room,fall,hover=3,win,dead=0;
  const col=m=>m==1?['#fecaca','#ef4444','#991b1b']:['#fef9c3','#facc15','#a16207'];
  const slot=(p,cl)=>{for(let r=H-1;r>=0;r--)if(!p[r*W+cl])return r*W+cl;return-1};
  const four=(p,m)=>LN.find(l=>l.every(i=>p[i]==m));
  function ev(p,m){let s=0;for(const l of LN){let a=0,o=0;for(const i of l){if(p[i]==m)a++;else if(p[i])o++}if(!o)s+=[0,1,5,40,0][a];else if(!a){const k=l.filter(i=>p[i]).length;s-=[0,1,5,40,0][k]}}for(let r=0;r<H;r++)s+=p[r*W+3]==m?3:p[r*W+3]?-3:0;return s}
  function nega(p,m,d,a,bt){if(four(p,-m))return-1e5-d;if(!d||p.every(Boolean))return ev(p,m);let best=-1e9;
    for(const q of[3,2,4,1,5,0,6]){const i=slot(p,q);if(i<0)continue;p[i]=m;const v=-nega(p,-m,d-1,-bt,-a);p[i]=0;if(v>best)best=v;if(v>a)a=v;if(a>=bt)break}return best}
  function ai(){let bi=-1,bv=-1e9;for(const q of[3,2,4,1,5,0,6]){const i=slot(b,q);if(i<0)continue;b[i]=t;const v=-nega(b,-t,5,-1e9,1e9)+Math.random();b[i]=0;if(v>bv){bv=v;bi=q}}return bi}
  function begin(m){mode=m;menu.hidden=true;c.hidden=false;b=Array(W*H).fill(0);t=1;over=0;win=null;fall=null;wait=0;me=1}
  b1.onclick=()=>{begin('cpu');me=Math.random()<.5?1:-1;stat();if(t!=me)setTimeout(cpu,500)};
  b2.onclick=()=>{begin('local');stat()};
  b4.onclick=()=>{code.value=Math.random().toString(36).slice(2,6).toUpperCase()};
  b3.onclick=()=>{room=code.value.trim().toUpperCase().replace(/\W/g,'');if(!room){st('Type a room code, or press New code.');return}
    begin('online');wait=1;st('Connecting...');
    net=netRoom(room,{hello:m=>{me=m.c;wait=m.n<2;stat()},join:()=>{wait=0;stat()},mv:m=>drop(m.col,1),left:()=>{wait=1;st('Your friend left. Room code: '+room)},full:()=>st('That room already has two players.'),close:()=>{if(!dead&&!over)st('Disconnected. Press Restart to reconnect.')}});
    if(!net)st('Online play only works on the website.')};
  function stat(){if(over)return;const n=t==1?'Red':'Yellow';
    if(mode=='online')return st(wait?'Waiting for a friend. Room code: '+room:`${t==me?'Your turn':'Their turn'} (you are ${me==1?'Red':'Yellow'}).`);
    if(mode=='cpu')return st(t==me?'Your turn.':'Computer is thinking...');st(n+' to move.')}
  function cpu(){if(!dead&&!over&&mode=='cpu'&&t!=me)drop(ai(),1)}
  function drop(cl,remote){const i=slot(b,cl);if(over||i<0||fall)return;
    if(mode=='online'&&!remote)net.send({t:'mv',col:cl});
    b[i]=t;fall={i,y:0,m:t};}
  function landed(){const i=fall.i,m=fall.m;fall=null;const w=four(b,m);
    if(w){over=1;win=w;st(mode=='cpu'?(m==me?'You win!':'Computer wins.'):mode=='online'?(m==me?'You win!':'They win.'):(m==1?'Red':'Yellow')+' wins!')}
    else if(b.every(Boolean)){over=1;st('Draw.')}
    else{t=-m;stat();if(mode=='cpu'&&t!=me)setTimeout(cpu,400)}}
  function mine(){return!over&&!fall&&!wait&&(mode=='local'||(mode=='cpu'&&t==me)||(mode=='online'&&t==me))}
  const colAt=e=>{const r=c.getBoundingClientRect();return Math.max(0,Math.min(W-1,Math.floor((e.clientX-r.left)/r.width*W)))};
  on(c,'pointermove',e=>{hover=colAt(e)});on(c,'pointerdown',e=>{hover=colAt(e);if(mine())drop(hover)});
  function tick(){
    if(fall){const ty=(Math.floor(fall.i/W)+1)*S+S/2,sx=fall.y;fall.y=Math.min(ty,(fall.y||S/2)+ (fall.v=(fall.v||2)+1.2));if(fall.y>=ty)landed()}
    x.clearRect(0,0,W*S,(H+1)*S);if(!mode)return;
    if(mine()){const k=col(t);x.globalAlpha=.65;disc(hover*S+S/2,S/2,k);x.globalAlpha=1}
    const g=x.createLinearGradient(0,S,0,(H+1)*S);g.addColorStop(0,'#2563eb');g.addColorStop(1,'#1e3a8a');x.fillStyle=g;x.beginPath();x.roundRect(0,S,W*S,H*S,14);x.fill();
    for(let i=0;i<W*H;i++){const cx=(i%W)*S+S/2,cy=(Math.floor(i/W)+1)*S+S/2;
      x.fillStyle='#0b1226';x.beginPath();x.arc(cx,cy,S*.4,0,7);x.fill();
      if(b[i]&&!(fall&&fall.i==i))disc(cx,cy,col(b[i]));
      if(win&&win.includes(i)){x.strokeStyle='#fff';x.lineWidth=4;x.beginPath();x.arc(cx,cy,S*.4,0,7);x.stroke()}}
    if(fall)disc((fall.i%W)*S+S/2,fall.y,col(fall.m));
  }
  function disc(cx,cy,k){const r=S*.4,g=x.createRadialGradient(cx-r*.3,cy-r*.35,r*.1,cx,cy,r);g.addColorStop(0,k[0]);g.addColorStop(.45,k[1]);g.addColorStop(1,k[2]);
    x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.strokeStyle='#0003';x.lineWidth=2;x.beginPath();x.arc(cx,cy,r*.62,0,7);x.stroke()}
  st('Pick a mode. Connect four of your colour in a row.');const i=setInterval(tick,1000/60);return()=>{dead=1;clearInterval(i);if(net)net.close()};
}
