// Step 12: rebuilt versions of the older games (Snake, Minesweeper, Memory Match, Tic-Tac-Toe, Stack, Sky Hop, Traffic Racer,
// Flappy Pizza, Brick Breaker, Block Drop). They share a fixed-timestep loop so speed no longer depends on the screen's refresh rate
// or on a busy tab, and sharp canvases that scale up on big screens.
const hd=(el,W,H,sc=1.4)=>{const D=Math.min(2,window.devicePixelRatio||1),c=mk('canvas',{width:W*D,height:H*D}),x=c.getContext('2d');x.scale(D,D);
  c.style.cssText=`width:min(${Math.round(W*sc)}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none;touch-action:none`;el.append(c);return[c,x]};
const gloop=(upd,drw,hz=60)=>{let last=performance.now(),acc=0,raf;const ms=1000/hz;const f=t=>{raf=requestAnimationFrame(f);acc=Math.min(acc+(t-last),100);last=t;while(acc>=ms){upd(ms/1000);acc-=ms}drw()};raf=requestAnimationFrame(f);return()=>cancelAnimationFrame(raf)};
const fx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
const bang=(a,x,y,col,n=10,sp=140)=>{for(let i=0;i<n;i++){const r=Math.random()*6.283,s=sp*(.3+Math.random());a.push({x,y,vx:Math.cos(r)*s,vy:Math.sin(r)*s,t:0,l:.4+Math.random()*.4,c:col})}};
const bangUpd=(a,dt,g=300)=>{a.forEach(p=>{p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=g*dt});for(let i=a.length-1;i>=0;i--)if(a[i].t>a[i].l)a.splice(i,1)};
const bangDrw=(x,a)=>{a.forEach(p=>{x.globalAlpha=Math.max(0,1-p.t/p.l);x.fillStyle=p.c;x.fillRect(p.x-2,p.y-2,4,4)});x.globalAlpha=1};
const rr=(x,a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
const bannerT=(x,W,H,t1,t2)=>{x.fillStyle='#000b';x.fillRect(0,H/2-52,W,104);x.textAlign='center';x.fillStyle='#fff';x.font='34px Impact,"Arial Black",sans-serif';x.fillText(t1,W/2,H/2+4);x.font='15px system-ui';x.fillStyle='#ffd21f';x.fillText(t2,W/2,H/2+34)};

/* ------------------------------ Snake ------------------------------ */
function snake(el){
  const N=16,S=30,W=N*S,[c,x]=hd(el,W,W,1.2);
  const V={l:[-1,0],r:[1,0],u:[0,-1],d:[0,1]},hit=(p,q)=>p[0]==q[0]&&p[1]==q[1];
  let s,d,q,f,sc,over,wait,acc,pr,bst=0,parts=[],t=0;
  function food(){do f=[rnd(N),rnd(N)];while(s.some(p=>hit(p,f)))}
  function reset(){s=[[8,8],[7,8],[6,8]];d=V.r;q=[];sc=0;over=0;wait=1;acc=0;pr=s.map(p=>p.slice());food();st('Press an arrow key, WASD, or swipe to start.')}
  const step=()=>Math.max(62,125-sc*2.2);
  function tick(){
    if(q.length)d=q.shift();const h=[s[0][0]+d[0],s[0][1]+d[1]];
    if(h[0]<0||h[1]<0||h[0]>=N||h[1]>=N||s.slice(0,-1).some(p=>hit(p,h))){over=1;fx('crash');bang(parts,s[0][0]*S+15,s[0][1]*S+15,'#4FD1C5',24);bst=best('snake',sc);st(`Game over: ${sc}. Best ${bst}. Press Enter or tap to restart.`);return}
    s.unshift(h);if(hit(h,f)){sc++;fx('coin');bang(parts,f[0]*S+15,f[1]*S+15,'#FF5D8F',12);food();st('Score '+sc)}else s.pop()}
  function turn(k){if(over){return}const v=V[k];const last=q.length?q[q.length-1]:d;if(v[0]+last[0]==0&&v[1]+last[1]==0)return;if(v[0]==last[0]&&v[1]==last[1])return;if(q.length<2)q.push(v);if(wait){wait=0;st('Score '+sc)}}
  dirs(c,turn);
  on(document,'keydown',e=>{if((e.key=='Enter'||e.key==' ')&&over){e.preventDefault();reset()}});
  on(c,'click',()=>{if(over)reset()});
  const upd=dt=>{bangUpd(parts,dt,0);t+=dt;if(over||wait)return;acc+=dt*1000;while(acc>=step()&&!over){acc-=step();tick()}};
  function draw(){
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){x.fillStyle=(i+j)%2?'#141233':'#100e2b';x.fillRect(i*S,j*S,S,S)}
    const pulse=1+Math.sin(t*6)*.08;x.fillStyle='#ff5d8f';x.shadowColor='#ff5d8f';x.shadowBlur=14;x.beginPath();x.arc(f[0]*S+15,f[1]*S+16,10*pulse,0,7);x.fill();x.shadowBlur=0;
    x.fillStyle='#4ade80';x.beginPath();x.ellipse(f[0]*S+19,f[1]*S+6,5,3,-.6,0,7);x.fill();
    for(let i=s.length-1;i>=0;i--){const p=s[i],k=1-i/(s.length+8),g=x.createLinearGradient(0,p[1]*S,0,p[1]*S+S);g.addColorStop(0,`hsl(${170-i*2} 70% ${62*k+20}%)`);g.addColorStop(1,`hsl(${170-i*2} 70% ${42*k+14}%)`);
      x.fillStyle=g;rr(x,p[0]*S+2,p[1]*S+2,S-4,S-4,i?8:11);x.fill()}
    const h=s[0],ex=d[0],ey=d[1],cx=h[0]*S+15,cy=h[1]*S+15;
    for(const sd of[-1,1]){const ox=ex?ex*5:sd*6,oy=ey?ey*5:-4+ (ex?sd*6:0);const px=cx+(ex?ex*5:sd*6),py=cy+(ey?ey*5:sd*0)+(ex?sd*6:0);x.fillStyle='#fff';x.beginPath();x.arc(ex?cx+ex*5:cx+sd*6,ey?cy+ey*5:cy+sd*6*(ex?1:0)+(ex?0:-3),4,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc((ex?cx+ex*6:cx+sd*6),(ey?cy+ey*6:cy+sd*6*(ex?1:0)-3),2,0,7);x.fill()}
    bangDrw(x,parts);
    x.textAlign='left';x.font='bold 15px system-ui';x.fillStyle='#fff9';x.fillText('Score '+sc,8,20);
    if(over)bannerT(x,W,W,'GAME OVER','Score '+sc+'   Press Enter or tap to retry');
    else if(wait)bannerT(x,W,W,'READY','Press an arrow key or swipe');
  }
  reset();return gloop(upd,draw);
}

/* ------------------------------ Minesweeper ------------------------------ */
function mines(el){
  const LV={Easy:[9,10],Medium:[12,22],Hard:[16,40]};let N=9,M=10,mine,rev,flg,over,first,fm=0,t0,tmr,nbh;
  const gr=mk('div',{class:'ms'}),tb=mk('button',{class:'ghost',type:'button'},'Flag mode: off');
  const bar=zbar(el,Object.keys(LV).map(k=>[k,()=>{[N,M]=LV[k];newGame()}]));
  tb.onclick=()=>{fm=!fm;tb.textContent='Flag mode: '+(fm?'on':'off')};el.append(tb,gr);
  const nb=i=>{const r=i/N|0,c=i%N,o=[];for(let a=-1;a<2;a++)for(let b=-1;b<2;b++){const y=r+a,x=c+b;if((a||b)&&y>=0&&y<N&&x>=0&&x<N)o.push(y*N+x)}return o};
  const cnt=i=>nbh[i];
  function newGame(){mine=Array(N*N).fill(0);rev=Array(N*N).fill(0);flg=Array(N*N).fill(0);over=0;first=1;t0=0;nbh=Array(N*N).fill(0);
    gr.style.gridTemplateColumns=`repeat(${N},1fr)`;gr.style.width=`min(100%,${N*40}px)`;bar.forEach(b=>b.classList.toggle('on',LV[b.textContent][0]==N&&LV[b.textContent][1]==M));head();draw()}
  const head=()=>{if(over)return;st(`${M-flg.reduce((a,b)=>a+b,0)} mines left   ${t0?Math.floor((Date.now()-t0)/1000):0}s`)};
  function open(i){const stack=[i];while(stack.length){const j=stack.pop();if(rev[j]||flg[j])continue;rev[j]=1;if(!mine[j]&&!cnt(j))nb(j).forEach(k=>{if(!rev[k])stack.push(k)})}}
  function lose(i){over=1;rev[i]=2;fx('crash');clearInterval(tmr);st('Boom. Press Restart, or pick a size above.')}
  function win(){over=1;clearInterval(tmr);for(let i=0;i<N*N;i++)if(mine[i])flg[i]=1;fx('win');const s=Math.round((Date.now()-t0)/1000);st(`Cleared in ${s}s! Best ${best('mines-'+N,s,1)}s on ${N} by ${N}.`)}
  function act(i,flag){if(over)return;
    if(rev[i]==1&&!flag){const f=nb(i).filter(j=>flg[j]).length;if(cnt(i)&&f==cnt(i)){let bad=-1;nb(i).forEach(j=>{if(!flg[j]&&!rev[j]){if(mine[j])bad=j;open(j)}});if(bad>=0){lose(bad);draw();return}check();draw()}return}
    if(rev[i])return;
    if(flag||fm){flg[i]=!flg[i];fx('click')}
    else{if(flg[i])return;
      if(first){first=0;t0=Date.now();let k=0;const ban=new Set([i,...nb(i)]);while(k<M){const j=rnd(N*N);if(!mine[j]&&!ban.has(j)){mine[j]=1;k++}}for(let a=0;a<N*N;a++)nbh[a]=nb(a).filter(j=>mine[j]).length;
        clearInterval(tmr);tmr=setInterval(head,500)}
      if(mine[i]){lose(i);draw();return}open(i);fx('hop');check()}
    head();draw()}
  const check=()=>{if(!over&&rev.filter(Boolean).length==N*N-M)win()};
  function draw(){gr.innerHTML='';for(let i=0;i<N*N;i++){const shown=rev[i]||(over&&mine[i]&&!flg[i]),
    c=mk('button',{type:'button','aria-label':'Cell'},shown?(mine[i]?'💣':cnt(i)||''):flg[i]?'🚩':'');
    if(shown)c.className='o'+(rev[i]==2?' x':'');if(over&&flg[i]&&!mine[i]){c.textContent='❌'}
    c.style.setProperty('--n',cnt(i));c.style.fontSize=`clamp(11px,${N>12?3.2:4.4}vw,${N>12?18:24}px)`;
    let lp=0,fired=0;c.onpointerdown=e=>{fired=0;if(e.pointerType!='mouse'){lp=setTimeout(()=>{fired=1;act(i,1)},380)}};
    c.onpointerup=()=>clearTimeout(lp);c.onpointerleave=()=>clearTimeout(lp);
    c.onclick=()=>{if(fired){fired=0;return}act(i)};c.oncontextmenu=e=>{e.preventDefault();act(i,1)};gr.append(c)}}
  newGame();st(M+' mines. Right-click, long-press, or use Flag mode to flag. Click a number to clear around it.');
  return()=>clearInterval(tmr);
}

/* ------------------------------ Memory Match ------------------------------ */
function memory(el){
  const e=['🐙','🍕','🚀','🎸','🌵','🦊','🍩','⚡'],gr=mk('div',{class:'g4'});let o=[],lock=0,mv=0,ok=0,t0=0;
  [...e,...e].sort(()=>Math.random()-.5).forEach(v=>{
    const b=mk('button',{class:'card','aria-label':'Hidden card',type:'button'},'?');
    b.onclick=()=>{if(lock||b.classList.contains('up')||b.classList.contains('ok'))return;if(!t0)t0=Date.now();fx('click');b.textContent=v;b.classList.add('up');b.setAttribute('aria-label',v);o.push(b);
      if(o.length<2)return;mv++;
      if(o[0].textContent==v){ok++;o.forEach(x=>x.classList.add('ok'));o=[];fx('coin');st(ok==8?(fx('win'),`Cleared in ${mv} moves and ${Math.round((Date.now()-t0)/1000)}s. Best ${best('memory',mv,1)} moves.`):mv+' moves')}
      else{lock=1;setTimeout(()=>{o.forEach(x=>{x.textContent='?';x.classList.remove('up');x.setAttribute('aria-label','Hidden card')});o=[];lock=0;st(mv+' moves')},800)}};
    gr.append(b)});
  el.append(gr);st('Find all 8 pairs.');
}

/* ------------------------------ Tic-Tac-Toe ------------------------------ */
function ttt(el){
  const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]],gr=mk('div',{class:'g3'});let b=Array(9).fill(''),end=0,line=null,sc=[0,0,0];el.append(gr);
  const wl=(p,m)=>L.find(l=>l.every(i=>p[i]==m)),w=(p,m)=>!!wl(p,m),free=p=>p.map((v,i)=>v?-1:i).filter(i=>i>=0);
  function mm(p,t,d){if(w(p,'O'))return 10-d;if(w(p,'X'))return d-10;const f=free(p);if(!f.length)return 0;
    let r=t=='O'?-99:99;for(const i of f){p[i]=t;const s=mm(p,t=='O'?'X':'O',d+1);p[i]='';r=t=='O'?Math.max(r,s):Math.min(r,s)}return r}
  function ai(){const f=free(b);if(Math.random()<.15)return f[rnd(f.length)];let bi=f[0],bs=-99;
    for(const i of f){b[i]='O';const s=mm(b,'X',1);b[i]='';if(s>bs){bs=s;bi=i}}return bi}
  const tally=()=>`You ${sc[0]}  Draws ${sc[2]}  Computer ${sc[1]}`;
  function check(){let l;if(l=wl(b,'X')){line=l;sc[0]++;fx('win');st('You win! '+tally()+'. Tap a square to play again.');end=1}else if(l=wl(b,'O')){line=l;sc[1]++;fx('lose');st('Computer wins. '+tally()+'. Tap a square to play again.');end=1}else if(!free(b).length){sc[2]++;st('Draw. '+tally()+'. Tap a square to play again.');end=1}}
  function draw(){gr.innerHTML='';b.forEach((v,i)=>{const c=mk('button',{class:(v=='O'?'o':'')+(line&&line.includes(i)?' w':''),'aria-label':'Square '+(i+1),type:'button'},v);
    c.onclick=()=>{if(end){b=Array(9).fill('');end=0;line=null;st('You are X. The computer sometimes slips.   '+tally());draw();return}if(b[i])return;b[i]='X';fx('hop');check();if(!end){b[ai()]='O';check()}draw()};gr.append(c)})}
  st('You are X. The computer sometimes slips.');draw();
}

/* ------------------------------ Stack ------------------------------ */
function stack(el){
  const W=320,H=480,BH=24,[c,x]=hd(el,W,H,1.25);
  let bl,cur,dir,sp,sc,over,cut,parts,combo,flash,shake;
  function reset(){bl=[{x:80,w:160}];cur={x:0,w:160};dir=1;sp=140;sc=0;over=0;cut=[];parts=[];combo=0;flash=0;shake=0;st('Click, tap or press Space to drop the block.')}
  function drop(){if(over)return reset();const p=bl[bl.length-1];let l=Math.max(cur.x,p.x),r=Math.min(cur.x+cur.w,p.x+p.w);
    if(r-l<=0){over=1;fx('crash');cut.push({x:cur.x,y:(bl.length)*BH,w:cur.w,vy:0,rot:0});shake=.3;st(`Tower fell at ${sc}. Best ${best('stack',sc)}. Tap to retry.`);return}
    let w=r-l;
    if(Math.abs(cur.x-p.x)<5){l=p.x;w=p.w;combo++;fx('coin');flash=.25;bang(parts,l+w/2,H-40-bl.length*BH,'#fff',10);if(combo>=4&&w<160){const g=Math.min(8,combo);l=Math.max(0,l-g/2);w=Math.min(W-l,w+g)}}
    else{combo=0;fx('hop');
      if(cur.x<p.x)cut.push({x:cur.x,y:bl.length*BH,w:p.x-cur.x,vy:0,rot:0});else if(cur.x+cur.w>p.x+p.w)cut.push({x:p.x+p.w,y:bl.length*BH,w:cur.x+cur.w-(p.x+p.w),vy:0,rot:0})}
    bl.push({x:l,w});sc++;sp=Math.min(300,140+sc*5);cur={x:dir>0?0:W-w,w};st('Height '+sc+(combo>1?'   Perfect x'+combo:''))}
  const upd=dt=>{bangUpd(parts,dt);flash=Math.max(0,flash-dt);shake=Math.max(0,shake-dt);
    cut.forEach(q=>{q.vy+=900*dt;q.y-=0;q.dy=(q.dy||0)+q.vy*dt;q.rot+=dt*2});cut=cut.filter(q=>(q.dy||0)<700);
    if(!over){cur.x+=dir*sp*dt;if(cur.x+cur.w>W){cur.x=W-cur.w;dir=-1}if(cur.x<0){cur.x=0;dir=1}}};
  const colr=i=>`hsl(${(i*18+200)%360} 75% 58%)`;
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1b1b4a');g.addColorStop(1,'#7c3aed');x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='#ffffff22';for(let i=0;i<30;i++)x.fillRect((i*97)%W,(i*53+bl.length*2)%H,2,2);
    x.save();if(shake>0)x.translate((Math.random()-.5)*8,(Math.random()-.5)*8);
    const off=Math.max(0,bl.length-11)*BH,top=(i)=>H-40-i*BH+off;
    bl.forEach((b,i)=>{x.fillStyle=colr(i);rr(x,b.x,top(i),b.w,BH-2,4);x.fill();x.fillStyle='#ffffff33';x.fillRect(b.x+2,top(i)+1,b.w-4,4)});
    if(!over){x.fillStyle=colr(bl.length);rr(x,cur.x,top(bl.length),cur.w,BH-2,4);x.fill();x.fillStyle='#ffffff44';x.fillRect(cur.x+2,top(bl.length)+1,cur.w-4,4)}
    cut.forEach(q=>{x.save();x.translate(q.x+q.w/2,top(q.y/BH)+(q.dy||0)+10);x.rotate(q.rot*(q.x<160?-1:1)*.4);x.fillStyle=colr(bl.length);x.globalAlpha=.8;x.fillRect(-q.w/2,-10,q.w,BH-2);x.restore()});
    bangDrw(x,parts);x.restore();
    if(flash>0){x.fillStyle=`rgba(255,255,255,${flash})`;x.fillRect(0,0,W,H)}
    x.textAlign='center';x.fillStyle='#fff';x.font='40px Impact,"Arial Black",sans-serif';x.fillText(sc,W/2,56);
    if(combo>1){x.font='16px system-ui';x.fillStyle='#ffd21f';x.fillText('PERFECT x'+combo,W/2,80)}
    if(over)bannerT(x,W,H,'TOWER FELL','Height '+sc+'   Tap to try again');
    else if(sc==0)bannerT(x,W,H,'STACK','Tap or press Space to drop')
  }
  on(document,'keydown',e=>{if(e.key==' '){e.preventDefault();if(!e.repeat)drop()}});on(c,'pointerdown',drop);
  reset();return gloop(upd,draw);
}

/* ------------------------------ Sky Hop ------------------------------ */
function hop(el){
  const W=320,H=480,[c,x]=hd(el,W,H,1.25),k={};
  let p,pl,sc,over,tx=null,parts=[],t=0,face=1,clouds=[];
  const mkp=(y,n)=>({x:rnd(W-70),y,kind:n>25&&Math.random()<.18?'move':'norm',dx:(Math.random()<.5?-1:1)*(40+rnd(40)),sp:Math.random()<.07&&n>5});
  function reset(){p={x:150,y:400,vy:-640};pl=[];for(let i=0;i<8;i++)pl.push(mkp(H-20-i*62,0));pl[0].x=130;pl[0].kind='norm';pl[0].sp=0;sc=0;over=0;parts=[];clouds=[...Array(5)].map((_,i)=>({x:rnd(W),y:i*100,s:.6+Math.random()*.8}));st('Arrow keys, A/D, or drag to steer.')}
  const upd=dt=>{t+=dt;bangUpd(parts,dt);if(over)return;
    const a=(k.arrowright||k.d?1:0)-(k.arrowleft||k.a?1:0);if(a)face=a;
    p.x+=tx!=null?Math.max(-380,Math.min(380,(tx-p.x)*8))*dt:a*300*dt;if(p.x<-12)p.x=W+12;if(p.x>W+12)p.x=-12;
    pl.forEach(q=>{if(q.kind=='move'){q.x+=q.dx*dt;if(q.x<0||q.x>W-60)q.dx=-q.dx}});
    const py0=p.y;p.vy+=1260*dt;p.y+=p.vy*dt;
    if(p.vy>0)for(const q of pl){const fy0=py0+14,fy1=p.y+14;if(fy0<=q.y+4&&fy1>=q.y&&p.x>q.x-8&&p.x<q.x+68){p.vy=q.sp?-1100:-640;fx(q.sp?'coin':'hop');bang(parts,p.x,q.y,q.sp?'#ffd21f':'#8fe388',6,90);break}}
    if(p.y<H/2){const d=H/2-p.y;p.y=H/2;sc+=d;pl.forEach(q=>q.y+=d);clouds.forEach(q=>{q.y+=d*.2;if(q.y>H+30){q.y=-30;q.x=rnd(W)}});pl=pl.filter(q=>q.y<H);
      while(pl.length<8)pl.push(mkp(Math.min(...pl.map(q=>q.y))-(45+rnd(28+Math.min(20,sc/150))),sc/10))}
    if(p.y>H+20){over=1;fx('lose');st(`Fell at ${Math.floor(sc/10)}. Best ${best('hop',Math.floor(sc/10))}. Tap to retry.`)}else st('Height '+Math.floor(sc/10))};
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);const hgt=Math.min(1,sc/6000);g.addColorStop(0,`hsl(${205-hgt*60} 80% ${78-hgt*50}%)`);g.addColorStop(1,`hsl(${195-hgt*40} 85% ${90-hgt*45}%)`);x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='#ffffffcc';clouds.forEach(q=>{x.beginPath();x.ellipse(q.x,q.y,34*q.s,12*q.s,0,0,7);x.ellipse(q.x+16*q.s,q.y-6*q.s,20*q.s,11*q.s,0,0,7);x.fill()});
    pl.forEach(q=>{x.fillStyle=q.kind=='move'?'#4c8bf5':'#35b04c';rr(x,q.x,q.y,60,11,5);x.fill();x.fillStyle='#ffffff55';x.fillRect(q.x+5,q.y+2,50,2);
      if(q.sp){x.fillStyle='#e63946';x.fillRect(q.x+22,q.y-7,16,7);x.fillStyle='#ddd';x.fillRect(q.x+25,q.y-10,10,3)}});
    bangDrw(x,parts);
    const sq=Math.max(-.2,Math.min(.2,p.vy/4000));x.save();x.translate(p.x,p.y+14);x.scale(1-sq,1+sq*1.6);
    x.fillStyle='#ffd21f';rr(x,-13,-28,26,26,8);x.fill();x.strokeStyle='#b8860b';x.lineWidth=2;x.stroke();
    x.fillStyle='#fff';x.fillRect(face>0?-1:-9,-21,9,9);x.fillStyle='#111';x.fillRect(face>0?4:-7,-19,3,6);
    x.fillStyle='#b8860b';const lg=p.vy<0?-3:3;x.fillRect(-9,-2,6,5+lg/2);x.fillRect(3,-2,6,5+lg/2);x.restore();
    x.textAlign='left';x.fillStyle='#0b2a4a';x.font='bold 18px system-ui';x.fillText(Math.floor(sc/10)+' m',10,26);
    if(over)bannerT(x,W,H,'YOU FELL',Math.floor(sc/10)+' m   Tap to retry')
  }
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow'))e.preventDefault();if(over&&(n=='enter'||n==' '))reset()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});
  const pt=e=>{const r=c.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*W};on(c,'pointerdown',e=>{if(over)reset();else pt(e)});on(c,'pointermove',e=>{if(tx!=null)pt(e)});on(c,'pointerup',()=>{tx=null});on(c,'pointercancel',()=>{tx=null});
  reset();return gloop(upd,draw);
}

/* ------------------------------ Traffic Racer ------------------------------ */
function racer(el){
  const W=360,H=560,[c,x]=hd(el,W,H,1.2),LC=[67,142,217,292],cols=['#3b82f6','#22c55e','#f97316','#a855f7','#eab308','#e5e7eb'],k={};
  let px,cars,sp,dist,over,nit,off,bonus,tdir,gap,msg,msgT,parts,shake,lean;
  const score=()=>Math.floor(dist/10)+bonus;
  function reset(){px=LC[1];cars=[];sp=6;dist=0;over=0;nit=100;off=0;bonus=0;tdir=0;gap=100;msgT=0;parts=[];shake=0;lean=0;st('Dodge traffic. Hold Space or Up for nitro.')}
  function car(cx,cy,col,me,tilt){
    x.save();x.translate(cx,cy);x.rotate(tilt||0);
    x.fillStyle='#0007';rr(x,-18,-28,40,66,7);x.fill();
    x.fillStyle='#111';[[-20,-20],[14,-20],[-20,12],[14,12]].forEach(w=>x.fillRect(w[0],w[1],6,16));
    const g=x.createLinearGradient(-16,0,16,0);g.addColorStop(0,col);g.addColorStop(.5,'#ffffff55');g.addColorStop(.55,col);g.addColorStop(1,col);
    x.fillStyle=col;rr(x,-16,-31,32,62,7);x.fill();x.fillStyle=g;x.globalAlpha=.35;rr(x,-16,-31,32,62,7);x.fill();x.globalAlpha=1;
    x.fillStyle='#0b1220';rr(x,-12,-14,24,14,3);x.fill();rr(x,-11,10,22,8,2);x.fill();x.fillStyle='#ffffff30';x.fillRect(-10,-12,8,3);
    x.fillStyle=me?'#fff':'#fde68a';x.fillRect(-14,-31,6,4);x.fillRect(8,-31,6,4);
    x.fillStyle='#ef4444';x.fillRect(-14,27,7,4);x.fillRect(7,27,7,4);x.restore()}
  const upd=dt=>{bangUpd(parts,dt,0);shake=Math.max(0,shake-dt);if(over)return;const f=dt*60;
    const nb=(k.shift||k[' ']||k.arrowup||k.w)&&nit>0;nit=nb?nit-.7*f:Math.min(100,nit+.12*f);
    sp=Math.min(13,sp+.0025*f);const v=sp+(nb?4:0);
    const d=(k.arrowright||k.d||tdir>0?1:0)-(k.arrowleft||k.a||tdir<0?1:0);lean+=(d*.12-lean)*.25;
    px=Math.max(48,Math.min(312,px+d*5.5*f));off+=v*f;dist+=v*f;gap-=v*f;
    if(nb)bang(parts,px+(Math.random()-.5)*10,498,'#ffb020',1,60);
    if(gap<0){gap=rnd(120)+260-sp*8;const l=rnd(4);if(!cars.some(e=>e.l==l&&e.y<150))cars.push({l,x:LC[l],y:-70,ev:2+Math.random()*2,col:cols[rnd(6)]})}
    cars.forEach(e=>e.y+=(v-e.ev)*f);cars=cars.filter(e=>e.y<H+80);
    for(const e of cars){const dx=Math.abs(e.x-px),dy=Math.abs(e.y-470);
      if(dx<30&&dy<58){over=1;shake=.4;fx('crash');bang(parts,px,470,'#ffb020',30,220);st(`Crashed! ${score()} points. Best ${best('racer',score())}. Click or press Enter.`);break}
      if(!e.pass&&e.y>530){e.pass=1;if(dx<52){bonus+=25;msg='Close call +25';msgT=.8;fx('coin')}}}};
  function draw(){
    x.save();if(shake>0)x.translate((Math.random()-.5)*8,(Math.random()-.5)*8);
    x.fillStyle='#1c3b2b';x.fillRect(-10,-10,W+20,H+20);x.fillStyle='#16301f';for(let y=-60+off%60;y<H;y+=60){x.fillRect(0,y,28,30);x.fillRect(332,y,28,30)}
    x.fillStyle='#2a2a2e';x.fillRect(30,0,300,H);x.fillStyle='#f4f4f0';x.fillRect(28,0,4,H);x.fillRect(328,0,4,H);
    for(let l=1;l<4;l++)for(let y=-80+off%80;y<H;y+=80)x.fillRect(30+75*l-2,y,4,40);
    cars.forEach(e=>car(e.x,e.y,e.col));car(px,470,'#e63027',1,lean);
    if((k.shift||k[' ']||k.arrowup||k.w)&&nit>0&&!over){x.fillStyle='#ffb020aa';x.beginPath();x.moveTo(px-8,502);x.lineTo(px,530+Math.random()*14);x.lineTo(px+8,502);x.fill()}
    bangDrw(x,parts);x.restore();
    x.fillStyle='#000a';rr(x,6,6,108,50,8);x.fill();x.textAlign='left';x.font='bold 17px system-ui';x.fillStyle='#fff';x.fillText(score()+' pts',14,28);x.font='13px system-ui';x.fillStyle='#ccc';x.fillText(Math.round(sp*12)+' km/h',14,47);
    x.fillStyle='#000a';rr(x,W-122,10,112,18,6);x.fill();x.fillStyle='#333';x.fillRect(W-116,15,100,8);x.fillStyle=nit>25?'#ffd21f':'#ff6b4a';x.fillRect(W-116,15,Math.max(0,nit),8);
    if(msgT>0){msgT-=1/60;x.textAlign='center';x.font='bold 18px system-ui';x.fillStyle='#ffd21f';x.fillText(msg,W/2,110)}
    if(over)bannerT(x,W,H,'CRASHED',score()+' pts   Click or press Enter')}
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow')||n==' ')e.preventDefault();if(over&&n=='enter')reset()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});on(window,'blur',()=>{for(const q in k)k[q]=0});
  on(c,'pointerdown',e=>{const r=c.getBoundingClientRect();tdir=(e.clientX-r.left)<r.width/2?-1:1;try{c.setPointerCapture(e.pointerId)}catch(_){}});
  on(c,'pointerup',()=>{tdir=0});on(c,'pointercancel',()=>{tdir=0});
  on(c,'click',()=>{if(over)reset()});
  reset();return gloop(upd,draw);
}

/* ------------------------------ Flappy Pizza ------------------------------ */
function flappy(el){
  const W=320,H=480,GY=H-40,[c,x]=hd(el,W,H,1.25);let y,v,ps,sc,over,t,go,parts=[],cl=[],gx=0,flash=0,rot=0;
  function reset(){y=200;v=0;ps=[];sc=0;over=0;t=0;go=0;parts=[];cl=[...Array(4)].map((_,i)=>({x:i*110,y:40+rnd(160),s:.7+Math.random()*.7}));st('Space, click or tap to flap.')}
  function end(){if(!over){over=1;flash=.25;fx('crash');bang(parts,80,y,'#f2c14e',20,200);st(`Game over: ${sc}. Best ${best('flappy',sc)}. Tap to retry.`)}}
  function flap(){if(over){if(t>25||y>=GY-14)reset()}else{go=1;v=-370;fx('hop')}}
  const upd=dt=>{bangUpd(parts,dt);flash=Math.max(0,flash-dt);cl.forEach(q=>{q.x-=12*q.s*dt;if(q.x<-60){q.x=W+40;q.y=40+rnd(160)}});
    if(!go&&!over){y=200+Math.sin(performance.now()/250)*6;return}
    if(over){v+=1400*dt;y=Math.min(GY-13,y+v*dt);t++;rot=Math.min(1.5,rot+dt*4);return}
    v+=1350*dt;y+=v*dt;t++;gx=(gx+144*dt)%24;rot=Math.max(-.5,Math.min(1.2,v/500));
    if(t%85==1)ps.push({x:W,g:130+rnd(220),s:0});
    ps.forEach(p=>p.x-=144*dt);ps=ps.filter(p=>p.x>-70);if(y<13||y>GY-13)end();
    for(const p of ps){if(93>p.x&&67<p.x+52&&(y-12<p.g-65||y+12>p.g+65))end();if(!p.s&&p.x+52<80){p.s=1;sc++;fx('coin');st('Score '+sc)}}};
  function pipe(px,top,h,flip){const g=x.createLinearGradient(px,0,px+52,0);g.addColorStop(0,'#2f9e44');g.addColorStop(.35,'#5ed36f');g.addColorStop(1,'#237a35');x.fillStyle=g;
    x.fillRect(px,top,52,h);const cy=flip?top+h-20:top;x.fillRect(px-4,cy,60,20);x.strokeStyle='#17592a';x.lineWidth=2;x.strokeRect(px,top,52,h);x.strokeRect(px-4,cy,60,20)}
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#59b9ff');g.addColorStop(1,'#bfe8ff');x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='#ffffffdd';cl.forEach(q=>{x.beginPath();x.ellipse(q.x,q.y,30*q.s,11*q.s,0,0,7);x.ellipse(q.x+14*q.s,q.y-6*q.s,18*q.s,10*q.s,0,0,7);x.fill()});
    ps.forEach(p=>{pipe(p.x,0,p.g-65,1);pipe(p.x,p.g+65,GY-(p.g+65),0)});
    x.fillStyle='#d8c27a';x.fillRect(0,GY,W,40);x.fillStyle='#7ec850';x.fillRect(0,GY,W,8);x.fillStyle='#6bb040';for(let i=-1;i<W/24+1;i++)x.fillRect(i*24-gx,GY,12,8);
    bangDrw(x,parts);
    x.save();x.translate(80,y);x.rotate(rot);x.fillStyle='#f2c14e';x.beginPath();x.arc(0,0,13,0,7);x.fill();x.strokeStyle='#b8860b';x.lineWidth=2;x.stroke();
    x.fillStyle='#e63027';[[-5,-4],[4,-2],[-1,5]].forEach(d=>{x.beginPath();x.arc(d[0],d[1],3,0,7);x.fill()});
    x.fillStyle='#fff';x.beginPath();x.arc(6,-6,4,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(7,-6,2,0,7);x.fill();
    x.fillStyle='#ffffffcc';x.beginPath();x.ellipse(-7,4+(go&&v<0?-4:3),7,4,-.5,0,7);x.fill();x.restore();
    x.textAlign='center';x.strokeStyle='#000';x.lineWidth=5;x.fillStyle='#fff';x.font='40px Impact,"Arial Black",sans-serif';x.strokeText(sc,W/2,56);x.fillText(sc,W/2,56);
    if(!go&&!over)bannerT(x,W,H,'FLAPPY PIZZA','Tap or press Space to flap');
    if(flash>0){x.fillStyle=`rgba(255,255,255,${flash*3})`;x.fillRect(0,0,W,H)}
    if(over&&t>25)bannerT(x,W,H,'GAME OVER','Score '+sc+'   Tap to retry')}
  on(document,'keydown',e=>{if(e.key==' '||e.key=='ArrowUp'||e.key=='w'){e.preventDefault();if(!e.repeat)flap()}});on(c,'pointerdown',flap);
  reset();return gloop(upd,draw);
}

/* ------------------------------ Brick Breaker ------------------------------ */
function breakout(el){
  const W=480,H=400,[c,x]=hd(el,W,H,1.3),k={};let px,br,bx,by,vx,vy,sc,lives,lv,run,over,parts=[],trail=[],pw=80,flash=0;
  function bricks(){br=[];const rows=5+Math.min(lv,3);for(let r=0;r<rows;r++)for(let i=0;i<10;i++)br.push({x:i*48+4,y:44+r*22,h:r*45,on:1,hp:(lv>1&&r<2)?2:1})}
  const spd=()=>330+lv*35;
  function serve(){bx=px;by=H-40;vx=vy=0;run=0;trail=[]}
  function reset(){px=W/2;sc=0;lives=3;lv=0;over=0;bricks();serve()}
  function launch(){if(over)reset();else if(!run){run=1;const s=spd(),a=(Math.random()-.5)*.8;vx=Math.sin(a)*s;vy=-Math.cos(a)*s;fx('hop')}}
  const upd=dt=>{bangUpd(parts,dt);flash=Math.max(0,flash-dt);if(over)return;
    px=Math.max(pw/2,Math.min(W-pw/2,px+((k.arrowright||k.d?1:0)-(k.arrowleft||k.a?1:0))*420*dt));
    if(!run){bx=px;by=H-40;return}
    const s=spd(),steps=3;for(let n=0;n<steps;n++){const d=dt/steps;bx+=vx*d;by+=vy*d;
      if(bx<6){bx=6;vx=Math.abs(vx)}if(bx>W-6){bx=W-6;vx=-Math.abs(vx)}if(by<6){by=6;vy=Math.abs(vy)}
      if(vy>0&&by>H-34&&by<H-16&&Math.abs(bx-px)<pw/2+6){const f=Math.max(-1,Math.min(1,(bx-px)/(pw/2)));const a=f*1.0;const sp=Math.min(560,Math.hypot(vx,vy)*1.01);vx=Math.sin(a)*sp;vy=-Math.cos(a)*sp;by=H-34;fx('bump')}
      for(const b of br){if(!b.on)continue;if(bx>b.x-6&&bx<b.x+50&&by>b.y-6&&by<b.y+24){
        const ox=Math.min(bx-(b.x-6),b.x+50-bx),oy=Math.min(by-(b.y-6),b.y+24-by);if(ox<oy)vx=-vx;else vy=-vy;
        b.hp--;if(b.hp<=0){b.on=0;sc+=10;bang(parts,b.x+22,b.y+9,`hsl(${b.h} 80% 60%)`,8,150);fx('coin')}else fx('click');break}}}
    trail.push([bx,by]);if(trail.length>8)trail.shift();
    if(Math.abs(vy)<80)vy=vy<0?-80:80;
    if(!br.some(b=>b.on)){lv++;bricks();serve();fx('win')}
    if(by>H){lives--;fx('lose');flash=.2;serve();if(lives<0){over=1;st(`Game over: ${sc}. Best ${best('breakout',sc)}. Click to retry.`)}}
    if(!over)st(`Score ${sc}   Lives ${lives}   Level ${lv+1}`)};
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#14103a');g.addColorStop(1,'#0d0b1f');x.fillStyle=g;x.fillRect(0,0,W,H);
    br.forEach(b=>{if(!b.on)return;const col=`hsl(${b.h} 80% ${b.hp>1?42:56}%)`;x.fillStyle=col;rr(x,b.x,b.y,44,18,4);x.fill();x.fillStyle='#ffffff44';x.fillRect(b.x+3,b.y+2,38,4);if(b.hp>1){x.strokeStyle='#fff9';x.lineWidth=2;rr(x,b.x,b.y,44,18,4);x.stroke()}});
    bangDrw(x,parts);
    x.fillStyle='#e8e8f0';rr(x,px-pw/2,H-28,pw,10,5);x.fill();x.fillStyle='#38e8ff';x.fillRect(px-pw/2+6,H-26,pw-12,2);
    trail.forEach((q,i)=>{x.globalAlpha=i/trail.length*.4;x.fillStyle='#ffd21f';x.beginPath();x.arc(q[0],q[1],6*i/trail.length,0,7);x.fill()});x.globalAlpha=1;
    x.fillStyle='#ffd21f';x.shadowColor='#ffd21f';x.shadowBlur=10;x.beginPath();x.arc(bx,by,6,0,7);x.fill();x.shadowBlur=0;
    x.textAlign='left';x.font='bold 14px system-ui';x.fillStyle='#fff9';x.fillText('Lives '+'\u2665'.repeat(Math.max(0,lives)),8,18);x.textAlign='right';x.fillText('Level '+(lv+1),W-8,18);
    if(!run&&!over){x.textAlign='center';x.fillStyle='#fff';x.font='16px system-ui';x.fillText('Click or press Space to launch',W/2,H/2+40)}
    if(over)bannerT(x,W,H,'GAME OVER','Score '+sc+'   Click to retry');
    if(flash>0){x.fillStyle=`rgba(255,80,80,${flash})`;x.fillRect(0,0,W,H)}}
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow')||n==' ')e.preventDefault();if(n==' '&&!e.repeat)launch()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});on(window,'blur',()=>{for(const q in k)k[q]=0});
  on(c,'pointermove',e=>{const r=c.getBoundingClientRect();px=Math.max(pw/2,Math.min(W-pw/2,(e.clientX-r.left)/r.width*W))});on(c,'pointerdown',launch);
  reset();return gloop(upd,draw);
}

/* ------------------------------ Block Drop ------------------------------ */
function tetris(el){
  const W=10,H=20,S=26,PW=W*S,[c,x]=hd(el,PW+110,H*S,1.15);
  const SH=[[[0,0],[-1,0],[1,0],[2,0]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[-1,0],[1,0],[0,1]],[[0,0],[-1,0],[1,0],[1,1]],[[0,0],[-1,0],[1,0],[-1,1]],[[0,0],[1,0],[0,1],[-1,1]],[[0,0],[-1,0],[0,1],[1,1]]],
    COL=['#4FD1C5','#ffd21f','#a855f7','#f97316','#3b82f6','#22c55e','#e63027'];
  let g,p,px,py,t,sc,ln,over,bag=[],nx,flashRows=[],ft=0,parts=[],held=0;
  const next=()=>{if(!bag.length)bag=[0,1,2,3,4,5,6].sort(()=>Math.random()-.5);return bag.pop()};
  const fits=(cs,ox,oy)=>cs.every(([a,b])=>{const X=ox+a,Y=oy+b;return X>=0&&X<W&&Y<H&&(Y<0||!g[Y][X])});
  function spawn(){const i=nx;nx=next();p={c:SH[i],i};px=4;py=0;if(!fits(p.c,px,py)){over=1;fx('lose');st(`Game over: ${sc} points, ${ln} lines. Best ${best('tetris',sc)}. Press Enter.`)}}
  function reset(){g=[...Array(H)].map(()=>Array(W).fill(0));sc=ln=t=0;over=0;bag=[];nx=next();flashRows=[];spawn();info()}
  const info=()=>{if(!over)st(`Score ${sc}   Lines ${ln}   Level ${Math.floor(ln/10)+1}`)};
  function lock(){p.c.forEach(([a,b])=>{if(py+b>=0)g[py+b][px+a]=p.i+1});
    const full=[];g.forEach((r,j)=>{if(r.every(v=>v))full.push(j)});
    if(full.length){flashRows=full;ft=.18;full.forEach(j=>{for(let i=0;i<W;i++)bang(parts,i*S+S/2,j*S+S/2,COL[g[j][i]-1],1,160)});fx(full.length>=4?'win':'coin');
      const keep=g.filter((r,j)=>!full.includes(j)),n=full.length;g=[...Array(n)].map(()=>Array(W).fill(0)).concat(keep);sc+=[0,100,300,500,800][n]*(Math.floor(ln/10)+1);ln+=n}
    else fx('bump');spawn();info()}
  const down=()=>{if(fits(p.c,px,py+1)){py++;return 1}lock();return 0};
  const mv=d=>{if(fits(p.c,px+d,py)){px+=d;fx('click')}};
  function rot(){if(p.i==1)return;const n=p.c.map(([a,b])=>[-b,a]);for(const k of[0,-1,1,-2,2])if(fits(n,px+k,py)){p.c=n;px+=k;fx('click');return}}
  const ghostY=()=>{let y=py;while(fits(p.c,px,y+1))y++;return y};
  const speed=()=>Math.max(.05,.55-Math.floor(ln/10)*.05-ln*.002);
  const upd=dt=>{bangUpd(parts,dt,500);ft=Math.max(0,ft-dt);if(over)return;t+=dt;if(t>=speed()){t=0;down()}};
  const cell=(i,j,col,a=1,ox=0)=>{x.globalAlpha=a;x.fillStyle=col;rr(x,ox+i*S+1,j*S+1,S-2,S-2,4);x.fill();x.fillStyle='#ffffff40';x.fillRect(ox+i*S+4,j*S+3,S-8,4);x.globalAlpha=1};
  function draw(){
    x.fillStyle='#0d0b1f';x.fillRect(0,0,PW+110,H*S);x.fillStyle='#15123a';x.fillRect(0,0,PW,H*S);
    x.strokeStyle='#ffffff0c';x.lineWidth=1;for(let i=1;i<W;i++){x.beginPath();x.moveTo(i*S,0);x.lineTo(i*S,H*S);x.stroke()}for(let j=1;j<H;j++){x.beginPath();x.moveTo(0,j*S);x.lineTo(PW,j*S);x.stroke()}
    g.forEach((r,j)=>r.forEach((v,i)=>{if(v)cell(i,j,COL[v-1])}));
    if(!over){const gy=ghostY();p.c.forEach(([a,b])=>{x.strokeStyle=COL[p.i];x.globalAlpha=.5;x.lineWidth=2;rr(x,(px+a)*S+2,(gy+b)*S+2,S-4,S-4,4);x.stroke();x.globalAlpha=1});p.c.forEach(([a,b])=>cell(px+a,py+b,COL[p.i]))}
    bangDrw(x,parts);
    x.fillStyle='#a8a8c8';x.font='bold 13px system-ui';x.textAlign='left';x.fillText('NEXT',PW+14,24);SH[nx].forEach(([a,b])=>{x.fillStyle=COL[nx];rr(x,PW+40+a*20,50+b*20,18,18,3);x.fill()});
    x.fillStyle='#a8a8c8';x.fillText('SCORE',PW+14,130);x.fillStyle='#fff';x.font='bold 18px system-ui';x.fillText(sc,PW+14,152);
    x.fillStyle='#a8a8c8';x.font='bold 13px system-ui';x.fillText('LINES',PW+14,186);x.fillStyle='#fff';x.font='bold 18px system-ui';x.fillText(ln,PW+14,208);
    x.fillStyle='#a8a8c8';x.font='bold 13px system-ui';x.fillText('LEVEL',PW+14,242);x.fillStyle='#fff';x.font='bold 18px system-ui';x.fillText(Math.floor(ln/10)+1,PW+14,264);
    if(over)bannerT(x,PW,H*S,'GAME OVER','Press Enter or tap to retry')}
  on(document,'keydown',e=>{const n=e.key.toLowerCase();if(over){if(n=='enter')reset();return}
    if(n=='arrowleft'||n=='a')mv(-1);else if(n=='arrowright'||n=='d')mv(1);else if(n=='arrowup'||n=='w')rot();else if(n=='arrowdown'||n=='s'){down();t=0}
    else if(n==' '){while(fits(p.c,px,py+1))py++;lock()}else return;e.preventDefault()});
  zbar(el,[['\u25C0',()=>!over&&mv(-1)],['\u21BB',()=>!over&&rot()],['\u25B6',()=>!over&&mv(1)],['\u25BC',()=>!over&&down()],['Drop',()=>{if(over)return;while(fits(p.c,px,py+1))py++;lock()}]]);
  on(c,'click',()=>{if(over)reset()});
  reset();return gloop(upd,draw);
}
