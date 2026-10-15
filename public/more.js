function clicker(el){
  const U=[['Oven',15,1],['Pizza cook',100,5],['Delivery car',600,25],['Food truck',3000,120],['Pizza factory',15000,600],['Pizza planet',100000,3500]];
  let s={n:0,c:1,own:U.map(()=>0)},note='';try{Object.assign(s,JSON.parse(localStorage.getItem('pc')))}catch{}
  const fmt=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':String(Math.floor(n));
  const rate=()=>U.reduce((t,u,i)=>t+u[2]*s.own[i],0),save=()=>{try{localStorage.setItem('pc',JSON.stringify(s))}catch{}};
  const big=mk('div',{class:'big'}),pz=mk('button',{class:'pz','aria-label':'Make pizza'}),shop=mk('div',{class:'shop'}),gp=mk('button',{class:'goldpz','aria-label':'Golden pizza'},'★');
  gp.hidden=true;el.append(big,pz,shop,gp);
  const items=[['Thicker crust',()=>Math.ceil(50*1.7**(s.c-1)),()=>s.c++,()=>s.c],...U.map((u,i)=>[u[0],()=>Math.ceil(u[1]*1.15**s.own[i]),()=>s.own[i]++,()=>s.own[i]])];
  const bs=items.map(it=>{const b=mk('button');b.onclick=()=>{const p=it[1]();if(s.n>=p){s.n-=p;it[2]();upd()}};shop.append(b);return b});
  function upd(){big.textContent=fmt(s.n)+' pizzas';st(note||`${fmt(rate())} per second, ${s.c} per click`);
    bs.forEach((b,i)=>{const p=items[i][1]();b.disabled=s.n<p;b.textContent=`${items[i][0]} (${items[i][3]()}) - ${fmt(p)}`})}
  pz.onclick=()=>{s.n+=s.c;upd()};
  gp.onclick=()=>{const b=Math.max(50,Math.round(rate()*60));s.n+=b;gp.hidden=true;note='Golden pizza! +'+fmt(b);setTimeout(()=>{note=''},3000)};
  const t=setInterval(()=>{s.n+=rate()/10;upd();if(gp.hidden&&Math.random()<.004){gp.style.left=rnd(80)+'%';gp.style.top=rnd(80)+'%';gp.hidden=false;setTimeout(()=>{gp.hidden=true},8000)}},100),sv=setInterval(save,3000);
  upd();return()=>{clearInterval(t);clearInterval(sv);save()};
}

function flappy(el){
  const W=320,H=480,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d');el.append(c);let y,v,ps,sc,over,t,go;
  function reset(){y=200;v=0;ps=[];sc=0;over=0;t=0;go=0;st('Space, click or tap to flap.')}
  function end(){if(!over){over=1;st(`Game over: ${sc}. Best ${best('flappy',sc)}. Tap to retry.`)}}
  function flap(){if(over)reset();else{go=1;v=-6.2}}
  function tick(){
    if(go&&!over){v+=.38;y+=v;t++;if(t%85==1)ps.push({x:W,g:120+rnd(240),s:0});
      ps.forEach(p=>p.x-=2.4);ps=ps.filter(p=>p.x>-60);if(y<13||y>H-13)end();
      for(const p of ps){if(93>p.x&&67<p.x+52&&(y-13<p.g-65||y+13>p.g+65))end();if(!p.s&&p.x+52<80){p.s=1;sc++;st('Score '+sc)}}}
    x.fillStyle='#7ec8ff';x.fillRect(0,0,W,H);
    ps.forEach(p=>{x.fillStyle='#2f9e44';x.fillRect(p.x,0,52,p.g-65);x.fillRect(p.x,p.g+65,52,H);x.fillStyle='#237a35';x.fillRect(p.x-4,p.g-85,60,20);x.fillRect(p.x-4,p.g+65,60,20)});
    x.beginPath();x.arc(80,y,13,0,7);x.fillStyle='#f2c14e';x.fill();x.fillStyle='#e63027';
    [[-5,-4],[4,-2],[-1,5]].forEach(d=>{x.beginPath();x.arc(80+d[0],y+d[1],3,0,7);x.fill()});
    x.fillStyle='#fff';x.strokeStyle='#000';x.font='34px Impact,"Arial Black",sans-serif';x.textAlign='center';x.fillText(sc,W/2,50);if(!go&&!over)x.fillText('Tap to start',W/2,320);
  }
  on(document,'keydown',e=>{if(e.key==' '||e.key=='ArrowUp'||e.key=='w'){e.preventDefault();flap()}});on(c,'pointerdown',flap);
  reset();const i=setInterval(tick,1000/60);return()=>clearInterval(i);
}

function dash(el){
  const W=640,H=360,G0=300,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d');el.append(c);let y,vy,ob,sp,d,over,gap,rot;
  function reset(){y=G0-30;vy=0;ob=[];sp=5;d=0;over=0;gap=300;rot=0;st('Space, Up or click to jump.')}
  function jump(){if(over)reset();else if(y>=G0-30)vy=-11.5}
  function tick(){
    if(!over){sp=Math.min(10,sp+.0015);d+=sp;gap-=sp;
      if(gap<0){const t=rnd(3);ob.push({x:W+20,t,w:t==2?(2+rnd(2))*28:t?32:28,h:t==1?32:28});gap=rnd(200)+300+sp*10}
      ob.forEach(o=>o.x-=sp);ob=ob.filter(o=>o.x>-120);vy+=.62;y+=vy;
      if(y>=G0-30){y=G0-30;vy=0;rot=Math.round(rot/1.5708)*1.5708}else rot+=.11;
      for(const o of ob){const i=o.t==1?0:4;if(106>o.x+i&&84<o.x+o.w-i&&y+26>G0-o.h+(o.t==1?0:8)){over=1;st(`Crashed at ${Math.floor(d/10)}. Best ${best('dash',Math.floor(d/10))}. Click to retry.`)}}
      if(!over)st('Distance '+Math.floor(d/10))}
    x.fillStyle='#2b1b4a';x.fillRect(0,0,W,H);x.fillStyle='#ffffff14';for(let i=0;i<9;i++)x.fillRect(i*80-(d*.3)%80,0,3,G0);
    x.fillStyle='#0d0b1f';x.fillRect(0,G0,W,H);x.fillStyle='#ffd21f';x.fillRect(0,G0,W,3);
    ob.forEach(o=>{if(o.t==1){x.fillStyle='#e63027';x.fillRect(o.x,G0-32,32,32)}else{x.fillStyle='#fff';for(let i=0;i<o.w/28;i++){x.beginPath();x.moveTo(o.x+i*28,G0);x.lineTo(o.x+i*28+14,G0-28);x.lineTo(o.x+i*28+28,G0);x.fill()}}});
    x.save();x.translate(95,y+15);x.rotate(rot);x.fillStyle='#ffd21f';x.fillRect(-15,-15,30,30);x.fillStyle='#111';x.fillRect(-8,-6,5,8);x.fillRect(3,-6,5,8);x.restore();
  }
  on(document,'keydown',e=>{if(e.key==' '||e.key=='ArrowUp'||e.key=='w'){e.preventDefault();jump()}});on(c,'pointerdown',jump);
  reset();const i=setInterval(tick,1000/60);return()=>clearInterval(i);
}

function breakout(el){
  const W=480,H=400,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d'),k={};el.append(c);let px,br,bx,by,vx,vy,sc,lives,lv,run,over;
  function bricks(){br=[];for(let r=0;r<5+Math.min(lv,3);r++)for(let i=0;i<10;i++)br.push({x:i*48+4,y:40+r*22,h:r*45,on:1})}
  function serve(){bx=px;by=H-40;vx=vy=0;run=0}
  function reset(){px=W/2;sc=0;lives=3;lv=0;over=0;bricks();serve()}
  function launch(){if(over)reset();else if(!run){run=1;vx=2;vy=-5}}
  function tick(){
    if(!over){px=Math.max(40,Math.min(W-40,px+((k.arrowright||k.d?1:0)-(k.arrowleft||k.a?1:0))*7));
      if(!run){bx=px;by=H-40}else{const s=5.5+lv*.5;bx+=vx;by+=vy;
        if(bx<6||bx>W-6)vx=-vx;if(by<6)vy=Math.abs(vy);
        if(vy>0&&by>H-34&&by<H-18&&Math.abs(bx-px)<46){const f=(bx-px)/46;vx=f*s*.8;vy=-Math.sqrt(s*s-vx*vx)}
        for(const b of br)if(b.on&&bx>b.x-5&&bx<b.x+49&&by>b.y-5&&by<b.y+23){b.on=0;vy=-vy;sc+=10;break}
        if(!br.some(b=>b.on)){lv++;bricks();serve()}
        if(by>H){lives--;serve();if(lives<0){over=1;st(`Game over: ${sc}. Best ${best('breakout',sc)}. Click to retry.`)}}}
      if(!over)st(`Score ${sc}   Lives ${lives}   Level ${lv+1}`)}
    x.fillStyle='#0d0b1f';x.fillRect(0,0,W,H);br.forEach(b=>{if(b.on){x.fillStyle=`hsl(${b.h} 80% 55%)`;x.fillRect(b.x,b.y,44,18)}});
    x.fillStyle='#fff';x.fillRect(px-40,H-28,80,10);x.beginPath();x.arc(bx,by,6,0,7);x.fillStyle='#ffd21f';x.fill();
  }
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow')||n==' ')e.preventDefault();if(n==' ')launch()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});on(c,'pointermove',e=>{px=Math.max(40,Math.min(W-40,e.offsetX*W/c.clientWidth))});on(c,'click',launch);
  reset();const i=setInterval(tick,1000/60);return()=>clearInterval(i);
}

function tetris(el){
  const W=10,H=20,S=24,c=mk('canvas',{width:W*S,height:H*S}),x=c.getContext('2d');el.append(c);
  const SH=[[[0,0],[-1,0],[1,0],[2,0]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[-1,0],[1,0],[0,1]],[[0,0],[-1,0],[1,0],[1,1]],[[0,0],[-1,0],[1,0],[-1,1]],[[0,0],[1,0],[0,1],[-1,1]],[[0,0],[-1,0],[0,1],[1,1]]],
    COL=['#4FD1C5','#ffd21f','#a855f7','#f97316','#3b82f6','#22c55e','#e63027'];
  let g,p,px,py,t,sc,ln,over;
  const fits=(cs,ox,oy)=>cs.every(([a,b])=>{const X=ox+a,Y=oy+b;return X>=0&&X<W&&Y<H&&(Y<0||!g[Y][X])});
  function spawn(){const i=rnd(7);p={c:SH[i],i};px=4;py=0;if(!fits(p.c,px,py)){over=1;st(`Game over: ${sc} points, ${ln} lines. Best ${best('tetris',sc)}. Press Enter.`)}}
  function reset(){g=[...Array(H)].map(()=>Array(W).fill(0));sc=ln=t=0;over=0;spawn();info()}
  const info=()=>{if(!over)st(`Score ${sc}   Lines ${ln}`)};
  function lock(){p.c.forEach(([a,b])=>{if(py+b>=0)g[py+b][px+a]=p.i+1});
    const keep=g.filter(r=>r.some(v=>!v)),n=H-keep.length;g=[...Array(n)].map(()=>Array(W).fill(0)).concat(keep);sc+=[0,100,300,500,800][n];ln+=n;spawn();info()}
  const down=()=>{if(fits(p.c,px,py+1))py++;else lock()};
  function mv(d){if(fits(p.c,px+d,py))px+=d}
  function rot(){if(p.i==1)return;const n=p.c.map(([a,b])=>[-b,a]);for(const k of [0,-1,1,-2,2])if(fits(n,px+k,py)){p.c=n;px+=k;return}}
  function tick(){
    if(!over&&++t>=Math.max(4,32-ln)){t=0;down()}
    x.fillStyle='#0d0b1f';x.fillRect(0,0,W*S,H*S);
    g.forEach((r,j)=>r.forEach((v,i)=>{if(v){x.fillStyle=COL[v-1];x.fillRect(i*S+1,j*S+1,S-2,S-2)}}));
    if(!over){x.fillStyle=COL[p.i];p.c.forEach(([a,b])=>x.fillRect((px+a)*S+1,(py+b)*S+1,S-2,S-2))}
  }
  on(document,'keydown',e=>{const n=e.key.toLowerCase();if(over){if(n=='enter')reset();return}
    if(n=='arrowleft'||n=='a')mv(-1);else if(n=='arrowright'||n=='d')mv(1);else if(n=='arrowup'||n=='w')rot();else if(n=='arrowdown'||n=='s')down();
    else if(n==' '){while(fits(p.c,px,py+1))py++;lock()}else return;e.preventDefault()});
  on(c,'click',()=>{if(over)reset();else rot()});
  reset();const i=setInterval(tick,1000/60);return()=>clearInterval(i);
}
