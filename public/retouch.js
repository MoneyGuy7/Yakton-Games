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
// snake now lives in polish.js

/* ------------------------------ Minesweeper ------------------------------ */
function mines(el){
  const LV={Easy:[9,10],Medium:[12,22],Hard:[16,40]};let N=9,M=10,mine,rev,flg,over,first,fm=0,t0,tmr,nbh;
  const gr=mk('div',{class:'ms'}),tb=mk('div',{class:'msmode'}),bd=mk('button',{type:'button',class:'on'},'⛏ Dig'),bf=mk('button',{type:'button'},'🚩 Flag');tb.append(bd,bf);
  const bar=zbar(el,Object.keys(LV).map(k=>[k,()=>{[N,M]=LV[k];newGame()}]));
  const setFm=v=>{fm=v;bd.classList.toggle('on',!v);bf.classList.toggle('on',v)};bd.onclick=()=>setFm(0);bf.onclick=()=>setFm(1);el.append(tb,gr);
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
    let lp=0,fired=0;c.onpointerdown=e=>{fired=0;if(e.pointerType!='mouse'){lp=setTimeout(()=>{fired=1;try{navigator.vibrate&&navigator.vibrate(25)}catch{}act(i,1)},300)}};
    c.onpointerup=()=>clearTimeout(lp);c.onpointercancel=()=>clearTimeout(lp);c.onpointerleave=()=>clearTimeout(lp);
    c.onclick=()=>{if(fired){fired=0;return}act(i)};c.oncontextmenu=e=>{e.preventDefault();act(i,1)};gr.append(c)}}
  newGame();st(M+' mines. On a phone, tap the 🚩 Flag button above the board, then tap squares to flag them (or long-press any square). On a computer, right-click. Click a number to clear around it.');
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
  let mode=null,p,pl,sc,over,tx=null,parts=[],t=0,face=1,clouds=[],birds=[],combo=0;
  const hard=()=>mode=='hard',bkey=()=>hard()?'hop-hard':'hop',m=()=>Math.floor(sc/10);
  // Easy keeps the original feel. Hard adds narrow, fast, crumbling platforms and birds you have to stomp or dodge.
  const mkp=(y,n)=>{
    if(!hard())return{x:rnd(W-70),y,w:60,kind:n>25&&Math.random()<.18?'move':'norm',dx:(Math.random()<.5?-1:1)*(40+rnd(40)),sp:Math.random()<.07&&n>5};
    const r=Math.random(),w=Math.max(40,50-Math.min(10,n/60)),kind=n<6?'norm':r<.28?'crumble':r<.58?'move':'norm';
    return{x:rnd(W-w-10)+5,y,w,kind,dx:(Math.random()<.5?-1:1)*(70+rnd(60)+Math.min(50,n/8)),sp:Math.random()<.05&&n>5&&kind=='norm'}};
  function reset(){p={x:150,y:400,vy:-640};pl=[];const nm=hard()?9:8,gap=hard()?66:62;for(let i=0;i<nm;i++)pl.push(mkp(H-20-i*gap,0));pl[0].x=130;pl[0].kind='norm';pl[0].sp=0;pl[0].w=60;
    sc=0;over=0;parts=[];birds=[];combo=0;clouds=[...Array(5)].map((_,i)=>({x:rnd(W),y:i*100,s:.6+Math.random()*.8}));
    st(hard()?'Hard: platforms crumble, birds fly. Stomp birds from above.':'Arrow keys, A/D, or drag to steer.')}
  function start(md){mode=md;tx=null;reset()}
  function toMenu(){mode=null;tx=null;st('Pick a mode.')}
  const upd=dt=>{t+=dt;bangUpd(parts,dt);if(!mode||over)return;
    const a=(k.arrowright||k.d?1:0)-(k.arrowleft||k.a?1:0);if(a)face=a;
    p.x+=tx!=null?Math.max(-380,Math.min(380,(tx-p.x)*8))*dt:a*300*dt;if(p.x<-12)p.x=W+12;if(p.x>W+12)p.x=-12;
    pl.forEach(q=>{if(q.kind=='move'&&!q.fall){q.x+=q.dx*dt;if(q.x<0||q.x>W-q.w){q.dx=-q.dx;q.x=Math.max(0,Math.min(W-q.w,q.x))}}
      if(q.ct!=null){q.ct-=dt;if(q.ct<=0){q.fall=1;q.ct=null;q.fv=0}}if(q.fall){q.fv+=900*dt;q.y+=q.fv*dt}});
    birds.forEach(b=>{b.x+=b.dx*dt;if(b.x<14||b.x>W-14)b.dx=-b.dx});
    const py0=p.y;p.vy+=1260*dt;p.y+=p.vy*dt;
    if(p.vy>0){
      for(const q of pl){if(q.fall)continue;const fy0=py0+14,fy1=p.y+14;if(fy0<=q.y+4&&fy1>=q.y&&p.x>q.x-8&&p.x<q.x+q.w+8){
        p.vy=q.sp?-1100:-640;fx(q.sp?'coin':'hop');bang(parts,p.x,q.y,q.sp?'#ffd21f':q.kind=='crumble'?'#c8955a':'#8fe388',6,90);combo=0;
        if(q.kind=='crumble'&&q.ct==null)q.ct=.3;break}}}
    for(const b of birds){if(b.dead)continue;const dx=Math.abs(b.x-p.x),dy=b.y-(p.y-1);
      if(dx<22&&Math.abs(dy)<22){
        if(p.vy>0&&p.y+14<b.y+8){b.dead=1;p.vy=-720;sc+=250;combo++;fx('splat');bang(parts,b.x,b.y,'#ff5d73',16,160)}
        else{over=1;fx('crash');bang(parts,p.x,p.y,'#ffd21f',22,200);st(`Hit a bird at ${m()}. Best ${best(bkey(),m())}. Tap to retry.`);return}}}
    birds=birds.filter(b=>!b.dead&&b.y<H+30);
    if(p.y<H/2){const d=H/2-p.y;p.y=H/2;sc+=d;pl.forEach(q=>q.y+=d);birds.forEach(b=>b.y+=d);clouds.forEach(q=>{q.y+=d*.2;if(q.y>H+30){q.y=-30;q.x=rnd(W)}});pl=pl.filter(q=>q.y<H);
      const need=hard()?9:8;
      while(pl.filter(q=>!q.fall).length<need){const top=Math.min(...pl.filter(q=>!q.fall).map(q=>q.y));
        const gap=hard()?55+rnd(30+Math.min(24,sc/150)):45+rnd(28+Math.min(20,sc/150)),ny=top-gap;pl.push(mkp(ny,sc/10));
        if(hard()&&sc>3000&&Math.random()<.16&&birds.length<3)birds.push({x:rnd(W-60)+30,y:ny-40-rnd(20),dx:(Math.random()<.5?-1:1)*(55+rnd(40)),ph:Math.random()*6})}}
    if(p.y>H+20){over=1;fx('lose');st(`Fell at ${m()}. Best ${best(bkey(),m())}. Tap to retry.`)}else st((hard()?'Hard · ':'Easy · ')+'Height '+m())};
  function btn(y,col,title,sub){x.fillStyle=col;rr(x,40,y,W-80,64,14);x.fill();x.fillStyle='#ffffff33';rr(x,44,y+4,W-88,24,10);x.fill();
    x.textAlign='center';x.fillStyle='#fff';x.font='bold 24px system-ui';x.fillText(title,W/2,y+32);x.font='13px system-ui';x.fillText(sub,W/2,y+52)}
  function bird(b){x.save();x.translate(b.x,b.y);const f=Math.sin(t*16+b.ph)*9,d=b.dx>0?1:-1;x.scale(d,1);
    x.fillStyle='#7c3aed';x.beginPath();x.ellipse(0,0,14,10,0,0,7);x.fill();
    x.fillStyle='#a78bfa';x.beginPath();x.moveTo(-4,-2);x.lineTo(-14,-14+f);x.lineTo(6,-3);x.fill();
    x.fillStyle='#ffb020';x.beginPath();x.moveTo(13,-2);x.lineTo(22,2);x.lineTo(13,5);x.fill();
    x.fillStyle='#fff';x.beginPath();x.arc(7,-3,3.5,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(8,-3,1.6,0,7);x.fill();
    x.fillStyle='#5b21b6';x.beginPath();x.moveTo(-12,0);x.lineTo(-22,-5);x.lineTo(-20,4);x.fill();x.restore()}
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);const hgt=Math.min(1,(sc||0)/6000);g.addColorStop(0,`hsl(${205-hgt*60} 80% ${78-hgt*50}%)`);g.addColorStop(1,`hsl(${195-hgt*40} 85% ${90-hgt*45}%)`);x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='#ffffffcc';(clouds||[]).forEach(q=>{x.beginPath();x.ellipse(q.x,q.y,34*q.s,12*q.s,0,0,7);x.ellipse(q.x+16*q.s,q.y-6*q.s,20*q.s,11*q.s,0,0,7);x.fill()});
    if(!mode){x.textAlign='center';x.fillStyle='#0b2a4a';x.font='bold 40px system-ui';x.fillText('SKY HOP',W/2,110);x.font='15px system-ui';x.fillText('Pick a mode',W/2,140);
      btn(180,'#35b04c','Easy','Best '+best('hop',0)+' m · chill climb (press 1)');btn(266,'#e0482f','Hard','Best '+best('hop-hard',0)+' m · crumbling, fast, birds (press 2)');
      x.fillStyle='#0b2a4acc';x.font='13px system-ui';x.fillText('Arrow keys, A/D, or drag to steer',W/2,380);return}
    pl.forEach(q=>{const cr=q.kind=='crumble';x.save();if(q.ct!=null)x.translate((Math.random()-.5)*3,0);
      x.fillStyle=q.kind=='move'?'#4c8bf5':cr?'#b07a43':'#35b04c';rr(x,q.x,q.y,q.w,11,5);x.fill();x.fillStyle='#ffffff55';x.fillRect(q.x+5,q.y+2,q.w-10,2);
      if(cr){x.strokeStyle='#5a3a1a';x.lineWidth=1.5;x.beginPath();x.moveTo(q.x+q.w*.3,q.y);x.lineTo(q.x+q.w*.4,q.y+11);x.moveTo(q.x+q.w*.68,q.y);x.lineTo(q.x+q.w*.58,q.y+11);x.stroke()}
      if(q.sp){x.fillStyle='#e63946';x.fillRect(q.x+q.w/2-8,q.y-7,16,7);x.fillStyle='#ddd';x.fillRect(q.x+q.w/2-5,q.y-10,10,3)}x.restore()});
    birds.forEach(bird);bangDrw(x,parts);
    const sq=Math.max(-.2,Math.min(.2,p.vy/4000));x.save();x.translate(p.x,p.y+14);x.scale(1-sq,1+sq*1.6);
    x.fillStyle='#ffd21f';rr(x,-13,-28,26,26,8);x.fill();x.strokeStyle='#b8860b';x.lineWidth=2;x.stroke();
    x.fillStyle='#fff';x.fillRect(face>0?-1:-9,-21,9,9);x.fillStyle='#111';x.fillRect(face>0?4:-7,-19,3,6);
    x.fillStyle='#b8860b';const lg=p.vy<0?-3:3;x.fillRect(-9,-2,6,5+lg/2);x.fillRect(3,-2,6,5+lg/2);x.restore();
    x.textAlign='left';x.fillStyle='#0b2a4a';x.font='bold 18px system-ui';x.fillText(m()+' m'+(hard()?'  HARD':''),10,26);
    if(over){bannerT(x,W,H,hard()?'GAME OVER':'YOU FELL',m()+' m   Tap to retry');x.textAlign='center';x.fillStyle='#fff';rr(x,W/2-50,H/2+50,100,30,8);x.fillStyle='#0008';x.fill();x.fillStyle='#fff';x.font='bold 14px system-ui';x.fillText('Mode menu',W/2,H/2+70)}
  }
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow'))e.preventDefault();
    if(!mode){if(n=='1'||n=='e')start('easy');if(n=='2'||n=='h')start('hard');return}
    if(over){if(n=='enter'||n==' '){e.preventDefault();reset()}if(n=='m'||n=='escape')toMenu()}});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});
  const pos=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]};
  on(c,'pointerdown',e=>{const[px,py]=pos(e);
    if(!mode){if(py>=180&&py<=244)start('easy');else if(py>=266&&py<=330)start('hard');return}
    if(over){if(Math.abs(px-W/2)<50&&py>H/2+45&&py<H/2+85)toMenu();else reset();return}tx=px});
  on(c,'pointermove',e=>{if(tx!=null)tx=pos(e)[0]});on(c,'pointerup',()=>{tx=null});on(c,'pointercancel',()=>{tx=null});
  st('Pick a mode.');return gloop(upd,draw);
}

/* ------------------------------ Traffic Racer ------------------------------ */

/* ------------------------------ Flappy Pizza ------------------------------ */
// flappy now lives in polish.js

/* ------------------------------ Brick Breaker ------------------------------ */
// breakout now lives in polish.js

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
