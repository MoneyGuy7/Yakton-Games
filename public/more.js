/* Pizza Clicker: a living pizzeria. Everything you buy shows up in the scene. Save key 'pc' keeps {n,c,own,t}. */
function clicker(el){
  const W=760,H=400,PX=150,PY=200,PR=104;
  const U=[['Oven',15,1,'Bakes a pizza every second'],['Pizza cook',100,5,'Tosses dough all day'],['Delivery car',600,25,'Speedy deliveries'],['Food truck',3000,120,'Pizza on the street'],['Pizza factory',15000,600,'Mass produced slices'],['Pizza planet',100000,3500,'An entire cheesy world']];
  let s={n:0,c:1,own:U.map(()=>0),t:0};
  try{const o=JSON.parse(localStorage.getItem('pc'));if(o)Object.assign(s,o)}catch{}
  if(!Array.isArray(s.own)||s.own.length<U.length)s.own=U.map((_,i)=>(s.own&&s.own[i])|0);
  s.n=+s.n||0;s.c=Math.max(1,s.c|0);
  const SHOW=[8,10,6,4,3,3];
  const fmt=n=>{n=Math.floor(n);if(n<10000)return n.toLocaleString();const u=['','K','M','B','T','Qa','Qi'];let i=0,v=n;while(v>=1000&&i<u.length-1){v/=1000;i++}return v.toFixed(v>=100?0:v>=10?1:2)+u[i]};
  const rate=()=>U.reduce((t,u,i)=>t+u[2]*s.own[i],0);
  const save=()=>{try{s.t=Date.now();localStorage.setItem('pc',JSON.stringify({n:s.n,c:s.c,own:s.own,t:s.t}))}catch{}};
  const cost=(i,q)=>{let t=0;for(let k=0;k<q;k++)t+=i==0?Math.ceil(50*1.7**(s.c-1+k)):Math.ceil(U[i-1][1]*1.15**(s.own[i-1]+k));return t};
  const owned=i=>i==0?s.c:s.own[i-1];
  let qty=1,muted=false,fz=0,pop=0,hover=0,banner=null,lastBuy={i:-1,t:-9},T=0,note='';
  const parts=[],floats=[];

  // ---------- styles ----------
  if(!document.getElementById('pcstyle')){const c=document.createElement('style');c.id='pcstyle';c.textContent=`
  .pcw{width:min(100%,780px);margin:0 auto;text-align:left;color:#fff3e0}
  .pctop{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:4px 2px 10px}
  .pcn{font:400 clamp(1.9rem,6vw,2.8rem)/1 Impact,"Arial Black",sans-serif;background:linear-gradient(#fff2b0,#f5a623);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.5px}
  .pcn small{font:600 .9rem system-ui,sans-serif;color:#d9b48a;-webkit-text-fill-color:#d9b48a;margin-left:8px;letter-spacing:0}
  .pcr{font:600 .9rem system-ui,sans-serif;color:#e9c9a0;margin-top:3px}
  .pcctl{display:flex;gap:6px;align-items:center}
  .pcctl button{border:1px solid #5a3b27;background:#2a1d16;color:#f3d9b5;border-radius:999px;padding:6px 12px;font:700 .8rem system-ui,sans-serif;cursor:pointer}
  .pcctl button[aria-pressed=true]{background:linear-gradient(#ffcf5a,#f2a33a);color:#2b1608;border-color:#ffcf5a}
  .pcv{position:relative;border-radius:16px;overflow:hidden;box-shadow:0 12px 34px rgba(0,0,0,.45),0 0 0 2px #5a3b27;line-height:0}
  .pcv canvas{width:100%;display:block;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
  .pcg{position:absolute;width:15%;aspect-ratio:1;border-radius:50%;border:0;cursor:pointer;background:radial-gradient(circle at 35% 30%,#fffbd0,#ffd21f 55%,#e69500);color:#8a4b00;font-size:clamp(1.2rem,4.5vw,2rem);box-shadow:0 0 0 4px rgba(255,214,60,.35),0 0 28px 8px rgba(255,200,40,.7);animation:pcg 1.1s ease-in-out infinite;line-height:1}
  @keyframes pcg{50%{transform:scale(1.14) rotate(8deg)}}
  .pcshop{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:14px}
  .pcc{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;border:1px solid #5a3b27;background:linear-gradient(#32231a,#241812);color:#fff3e0;text-align:left;cursor:pointer;transition:transform .12s,border-color .12s,box-shadow .12s;font-family:system-ui,sans-serif}
  .pcc canvas{width:64px;height:56px;flex:none;border-radius:8px;background:linear-gradient(#ffcf8f,#f3b56a)}
  .pcc div{flex:1;min-width:0}
  .pcc b{display:block;font-size:.95rem}
  .pcc small{display:block;color:#d9b48a;font-size:.72rem;margin-top:1px}
  .pcc em{display:block;font-style:normal;font-weight:800;color:#ffcf5a;font-size:.88rem;margin-top:3px}
  .pcc i{font-style:normal;font-weight:800;font-size:1.1rem;color:#ffe9b8;background:#4a3022;border-radius:8px;padding:2px 8px;flex:none}
  .pcc.can{border-color:#ffcf5a;box-shadow:0 0 0 1px #ffcf5a55,0 4px 14px rgba(255,170,40,.18)}
  .pcc.can:hover{transform:translateY(-2px)}
  .pcc.can:active{transform:scale(.98)}
  .pcc:not(.can){opacity:.62;cursor:default}
  .pcc:not(.can) em{color:#c98a6b}
  `;document.head.append(c)}

  // ---------- DOM ----------
  const wrap=mk('div',{class:'pcw'});
  const top=mk('div',{class:'pctop'}),left=mk('div'),cnt=mk('div',{class:'pcn'}),rt=mk('div',{class:'pcr'});left.append(cnt,rt);
  const ctl=mk('div',{class:'pcctl'}),qb=[['x1',1],['x10',10],['Max','m']].map(([t,v])=>{const b=mk('button',{type:'button','aria-pressed':v==qty},t);b.onclick=()=>{qty=v;qb.forEach(x=>x[0].setAttribute('aria-pressed',x[1]==qty));upd()};return[b,v]});
  const mb=mk('button',{type:'button','aria-label':'Sound','aria-pressed':'true'},'Sound on');mb.onclick=()=>{muted=!muted;mb.textContent=muted?'Sound off':'Sound on';mb.setAttribute('aria-pressed',!muted)};
  qb.forEach(x=>ctl.append(x[0]));ctl.append(mb);top.append(left,ctl);
  const view=mk('div',{class:'pcv'}),cv=mk('canvas',{tabindex:'0','aria-label':'Click the pizza'}),gp=mk('button',{class:'pcg','aria-label':'Golden pizza',type:'button'},'★');gp.hidden=true;
  view.append(cv,gp);
  const shop=mk('div',{class:'pcshop'});
  const cards=[['Thicker crust','More pizza per click','crust'],...U.map(u=>[u[0],u[3]])].map((d,i)=>{
    const b=mk('button',{type:'button',class:'pcc'}),ic=mk('canvas'),info=mk('div'),nm=mk('b',{},d[0]),sub=mk('small'),pr=mk('em'),ct=mk('i');
    ic.width=128;ic.height=112;info.append(nm,sub,pr);b.append(ic,info,ct);b.onclick=()=>buy(i);shop.append(b);return{b,ic,sub,pr,ct,g:ic.getContext('2d')}});
  wrap.append(top,view,shop);el.append(wrap);
  let g=cv.getContext('2d');const mainCtx=g;

  // ---------- audio ----------
  let ac;const tone=(f,d,ty='sine',v=.12,sl)=>{if(muted)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),a=ac.createGain(),n=ac.currentTime;o.type=ty;o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(sl,n+d);a.gain.setValueAtTime(v,n);a.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(a);a.connect(ac.destination);o.start(n);o.stop(n+d)}catch{}};
  const sPop=()=>tone(260+Math.random()*60,.09,'triangle',.14,110),sBuy=()=>{tone(660,.1,'triangle',.12);setTimeout(()=>tone(990,.16,'triangle',.12),70)},sGold=()=>[523,659,784,1047].forEach((f,k)=>setTimeout(()=>tone(f,.2,'triangle',.12),k*70));

  // ---------- drawing helpers ----------
  const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
  const ci=(x,y,r)=>{g.beginPath();g.arc(x,y,r,0,7)};
  let sd=7;const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const CH=[...Array(16)].map(()=>({a:R()*6.28,d:.15+R()*.62,r:.1+R()*.12,k:R()})),PP=[...Array(24)].map(()=>({a:R()*6.28,d:.2+R()*.6})),BS=[...Array(7)].map(()=>({a:R()*6.28,d:.25+R()*.5,r:R()*6.28}));
  PP.sort((p,q)=>p.d-q.d);
  function pizza(cx,cy,r,lv,t,sc){g.save();g.translate(cx,cy);g.scale(sc,sc);
    g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(6,r*.12+8,r*1.18,r*1.08,0,0,7);g.fill();
    let gr=g.createRadialGradient(-r*.2,-r*.3,r*.1,0,0,r*1.2);gr.addColorStop(0,'#a8683a');gr.addColorStop(1,'#6b3f20');g.fillStyle=gr;ci(0,0,r*1.16);g.fill();
    g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1;for(let k=0;k<9;k++){g.beginPath();g.arc(0,0,r*(1.02+k*.015),k,k+.9);g.stroke()}
    gr=g.createRadialGradient(-r*.3,-r*.35,r*.1,0,0,r);gr.addColorStop(0,'#f4c06a');gr.addColorStop(.7,'#dd9a45');gr.addColorStop(1,'#b8722c');g.fillStyle=gr;ci(0,0,r);g.fill();
    g.fillStyle='rgba(255,230,160,.5)';g.beginPath();g.arc(0,0,r*.97,3.6,4.9);g.arc(0,0,r*.9,4.9,3.6,true);g.fill();
    g.fillStyle='#c4301d';ci(0,0,r*.86);g.fill();
    g.fillStyle='#e04a2c';ci(-r*.05,-r*.05,r*.8);g.fill();
    g.fillStyle='#f8d56e';ci(0,0,r*.78);g.fill();
    CH.forEach(c=>{g.fillStyle=c.k>.5?'#fde68a':'#f0c24c';ci(Math.cos(c.a)*r*c.d,Math.sin(c.a)*r*c.d,r*c.r);g.fill()});
    g.fillStyle='rgba(255,255,255,.25)';g.beginPath();g.ellipse(-r*.28,-r*.3,r*.3,r*.14,-.7,0,7);g.fill();
    const np=Math.min(PP.length,6+Math.floor(lv*1.6));
    for(let k=0;k<np;k++){const p=PP[k],x=Math.cos(p.a)*r*p.d,y=Math.sin(p.a)*r*p.d,pr=r*.1;g.fillStyle='rgba(0,0,0,.25)';ci(x+1.5,y+2,pr);g.fill();g.fillStyle='#b3261e';ci(x,y,pr);g.fill();g.fillStyle='#d4382c';ci(x-pr*.15,y-pr*.15,pr*.75);g.fill();g.fillStyle='rgba(255,170,120,.55)';ci(x+pr*.2,y-pr*.1,pr*.18);g.fill()}
    if(lv>1)BS.slice(0,Math.min(7,lv)).forEach(b=>{g.save();g.translate(Math.cos(b.a)*r*b.d,Math.sin(b.a)*r*b.d);g.rotate(b.r);g.fillStyle='#2f8f3a';g.beginPath();g.ellipse(0,0,r*.09,r*.05,0,0,7);g.fill();g.fillStyle='#4cc15a';g.beginPath();g.ellipse(-r*.01,-r*.01,r*.06,r*.03,0,0,7);g.fill();g.restore()});
    if(lv>=8){g.fillStyle='rgba(255,230,120,.9)';for(let k=0;k<5;k++){const a=t*1.2+k*1.26;ci(Math.cos(a)*r*1.05,Math.sin(a)*r*1.05,2.5);g.fill()}}
    g.restore()}

  // sprites: (x,y) is bottom centre
  const SP=[null,
  (x,y,t,i)=>{g.save();g.translate(x,y);g.fillStyle='#6b2d18';rr(7,-60,8,18,2);g.fill();g.fillStyle='#8c3d22';rr(-19,-30,38,30,4);g.fill();g.fillStyle='#b5532f';g.beginPath();g.arc(0,-30,19,Math.PI,0);g.fill();g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1;for(let k=-24;k<0;k+=8){g.beginPath();g.moveTo(-19,k);g.lineTo(19,k);g.stroke()}g.beginPath();g.moveTo(0,-49);g.lineTo(0,-30);g.stroke();
    g.fillStyle='#1b0d08';g.beginPath();g.arc(0,-8,10,Math.PI,0);g.lineTo(10,0);g.lineTo(-10,0);g.fill();const f=.8+.2*Math.sin(t*10+i*2);g.fillStyle='#ff8a1f';g.beginPath();g.ellipse(0,-4,7*f,6*f,0,0,7);g.fill();g.fillStyle='#ffd23f';g.beginPath();g.ellipse(0,-3,3.5*f,3.5*f,0,0,7);g.fill();
    g.fillStyle='rgba(255,140,30,.18)';ci(0,-8,20+3*f);g.fill();g.restore()},
  (x,y,t,i,dir)=>{g.save();g.translate(x,y);g.scale(dir||1,1);const w=Math.sin(t*9+i),b=Math.abs(w)*2;g.fillStyle='#2b3a55';rr(-5,-12-b*.3,4,12,1);g.fill();rr(1+w*2,-12,4,12,1);g.fill();
    g.fillStyle='#fff';rr(-7,-26-b,14,17,4);g.fill();g.fillStyle='#e63027';rr(-7,-15-b,14,4,1);g.fill();g.fillStyle='#f1c8a0';ci(0,-31-b,6);g.fill();g.fillStyle='#222';ci(2.5,-31-b,1);g.fill();
    g.fillStyle='#fff';rr(-6,-42-b,12,6,2);g.fill();ci(-3,-43-b,4);g.fill();ci(3,-43-b,4);g.fill();g.fillStyle='#e9a84c';ci(9,-20-b+w,5);g.fill();g.fillStyle='#c4301d';ci(9,-20-b+w,3.6);g.fill();g.restore()},
  (x,y,t,i,dir)=>{g.save();g.translate(x,y);const C=['#e63027','#2f6df6','#22c55e','#f59e0b','#a855f7','#ec4899'][i%6];g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,0,24,3,0,0,7);g.fill();
    g.fillStyle=C;rr(-23,-15,46,10,4);g.fill();rr(-12,-23,24,10,4);g.fill();g.fillStyle='#bfe6ff';rr(-9,-21,8,7,2);g.fill();rr(1,-21,8,7,2);g.fill();g.fillStyle='#ffd21f';rr(-6,-28,12,5,2);g.fill();g.fillStyle='#222';g.font='bold 5px sans-serif';g.textAlign='center';g.fillText('PIZZA',0,-24);
    g.fillStyle='#fff6a8';rr(20,-13,4,3,1);g.fill();[-13,13].forEach(wx=>{g.fillStyle='#16161a';ci(wx,-4,5);g.fill();g.fillStyle='#aaa';ci(wx,-4,2);g.fill()});g.restore()},
  (x,y,t,i,dir)=>{g.save();g.translate(x,y);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,0,30,3,0,0,7);g.fill();g.fillStyle='#f7f2e8';rr(-28,-34,36,28,3);g.fill();g.fillStyle='#e63027';g.fillRect(-28,-14,36,5);
    g.fillStyle='#2b1b14';rr(-22,-28,24,12,2);g.fill();for(let k=0;k<6;k++){g.fillStyle=k%2?'#fff':'#e63027';g.beginPath();g.moveTo(-24+k*4.4,-30);g.lineTo(-19.6+k*4.4,-30);g.lineTo(-19.6+k*4.4,-24);g.lineTo(-24+k*4.4,-24);g.fill()}
    g.fillStyle='#e63027';rr(8,-24,18,18,3);g.fill();g.fillStyle='#bfe6ff';rr(14,-22,10,8,2);g.fill();g.fillStyle='#f2a33a';ci(-10,-38,5);g.fill();g.fillStyle='#c4301d';ci(-10,-38,3.4);g.fill();
    [-18,16].forEach(wx=>{g.fillStyle='#16161a';ci(wx,-4,6);g.fill();g.fillStyle='#aaa';ci(wx,-4,2.4);g.fill()});g.restore()},
  (x,y,t,i)=>{g.save();g.translate(x,y);g.fillStyle='#5b5e6e';[-24,10].forEach(cx=>{g.fillRect(cx,-66,9,30);g.fillStyle='#e63027';g.fillRect(cx,-66,9,4);g.fillStyle='#5b5e6e'});
    g.fillStyle='#7a7d8c';g.fillRect(-36,-40,72,40);g.fillStyle='#8f93a3';for(let k=0;k<3;k++){g.beginPath();g.moveTo(-36+k*24,-40);g.lineTo(-36+k*24,-52);g.lineTo(-12+k*24,-40);g.fill()}
    for(let r=0;r<2;r++)for(let c=0;c<5;c++){g.fillStyle=(c+r+i)%3?'#ffe08a':'#4a4d5c';g.fillRect(-30+c*13,-34+r*13,8,8)}g.fillStyle='#3a3d4a';g.fillRect(-7,-14,14,14);
    for(let k=0;k<3;k++){const p=(t*.45+k/3+i*.27)%1;g.fillStyle=`rgba(255,255,255,${.55*(1-p)})`;ci(-20+p*18+(k%2)*28,-70-p*44,5+p*10);g.fill()}g.restore()},
  (x,y,t,i)=>{g.save();g.translate(x,y-24+Math.sin(t*1.5+i)*3);g.strokeStyle='#ffe3a0';g.lineWidth=4;g.beginPath();g.ellipse(0,0,34,9,-.3,Math.PI,0);g.stroke();
    let gr=g.createRadialGradient(-8,-8,3,0,0,26);gr.addColorStop(0,'#ffd980');gr.addColorStop(.6,'#f2a33a');gr.addColorStop(1,'#b8561c');g.fillStyle=gr;ci(0,0,24);g.fill();g.fillStyle='#d4382c';[[-9,-6,4.5],[7,-9,4],[8,7,5],[-6,9,4],[0,0,3.5]].forEach(p=>{ci(p[0],p[1],p[2]);g.fill()});
    g.beginPath();g.ellipse(0,0,34,9,-.3,0,Math.PI);g.stroke();const a=t*1.1+i;g.fillStyle='#fff';ci(Math.cos(a)*40,Math.sin(a)*14-2,3);g.fill();g.restore()}];

  const E=k=>1+2.7*Math.pow(k-1,3)+1.7*Math.pow(k-1,2);
  function spr(type,k,x,y,t,dir){const age=T-lastBuy.t,ex=lastBuy.i==type&&age<.5&&k==Math.min(s.own[type-1],SHOW[type-1])-1?Math.max(.01,E(Math.min(1,age/.45))):1;
    if(ex!=1){g.save();g.translate(x,y);g.scale(ex,ex);SP[type](0,0,t,k,dir);g.restore()}else SP[type](x,y,t,k,dir)}
  const pill=(txt,x,y)=>{g.font='bold 12px system-ui,sans-serif';const w=g.measureText(txt).width+14;g.fillStyle='rgba(30,16,10,.8)';rr(x-w,y-10,w,20,10);g.fill();g.fillStyle='#ffe9b8';g.textAlign='right';g.textBaseline='middle';g.fillText(txt,x-7,y+1)};

  function scene(t){
    let gr=g.createLinearGradient(0,0,0,215);gr.addColorStop(0,'#ff9356');gr.addColorStop(1,'#ffe6b4');g.fillStyle=gr;g.fillRect(0,0,W,215);
    g.fillStyle='rgba(255,246,200,.35)';ci(70,44,40);g.fill();g.fillStyle='#fff3c4';ci(70,44,22);g.fill();
    for(let k=0;k<3;k++){const x=((t*7+k*270)%(W+200))-100,y=26+k*20;g.fillStyle='rgba(255,255,255,.7)';rr(x,y,90,16,8);g.fill();ci(x+30,y+2,13);g.fill();ci(x+56,y+4,10);g.fill()}
    g.fillStyle='rgba(140,70,50,.22)';[[300,40],[345,62],[392,34],[430,52],[478,70],[524,38],[566,58],[610,44],[655,66],[700,36]].forEach(b=>g.fillRect(b[0],215-b[1],40,b[1]));
    g.fillStyle='#dcc6a2';g.fillRect(0,215,W,118);g.strokeStyle='rgba(120,90,50,.15)';g.lineWidth=1;for(let x=0;x<W;x+=40){g.beginPath();g.moveTo(x,215);g.lineTo(x-30,333);g.stroke()}for(let y=240;y<333;y+=26){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
    g.fillStyle='#b9a283';g.fillRect(0,330,W,5);g.fillStyle='#34343c';g.fillRect(0,335,W,65);g.fillStyle='#ffd21f';for(let x=-((t*30)%50);x<W;x+=50)g.fillRect(x,366,26,3);
    // building order: far to near
    for(let k=0;k<Math.min(s.own[4],SHOW[4]);k++)spr(5,k,350+k*140,168,t);
    for(let k=0;k<Math.min(s.own[5],SHOW[5]);k++)spr(6,k,430+k*115,72,t);
    for(let k=0;k<Math.min(s.own[0],SHOW[0]);k++)spr(1,k,322+k*46,222,t);
    for(let k=0;k<Math.min(s.own[1],SHOW[1]);k++){const sp=.35+(k%4)*.08,q=Math.sin(t*sp+k*1.7),dir=Math.cos(t*sp+k*1.7)>=0?1:-1;spr(2,k,300+(.5+.5*q)*420,262+(k%3)*13,t,dir)}
    for(let k=0;k<Math.min(s.own[2],SHOW[2]);k++){const x=((t*(70+k*9)+k*150)%(W+120))-60;spr(3,k,x,356,t,1)}
    for(let k=0;k<Math.min(s.own[3],SHOW[3]);k++){const x=W+60-((t*(42+k*6)+k*210)%(W+160));g.save();g.translate(x,392);g.scale(-1,1);spr(4,k,0,0,t,1);g.restore()}
    const e=s.own.every(v=>!v);if(e){g.font='bold 16px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='rgba(60,25,10,.75)';g.fillText('Your street is empty. Buy an oven to start your pizzeria!',535,150)}
    [[0,'Ovens',188],[1,'Cooks',246],[2,'Cars',322],[3,'Trucks',350],[4,'Factories',98],[5,'Planets',28]].forEach(([i,n,y])=>{if(s.own[i]>SHOW[i])pill(`${n} x${fmt(s.own[i])}`,W-8,y)});
    // pizza
    const bx=PX,by=PY;g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(bx+4,by+14,PR+26,PR+22,0,0,7);g.fill();gr=g.createRadialGradient(bx-30,by-40,10,bx,by,PR+30);gr.addColorStop(0,'#b57a45');gr.addColorStop(1,'#7a4a24');g.fillStyle=gr;ci(bx,by,PR+20);g.fill();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;ci(bx,by,PR+12);g.stroke();
    pizza(bx,by,PR-4,s.c,t,(1-.07*pop)+.025*hover);
    // particles
    for(let k=parts.length-1;k>=0;k--){const p=parts[k];p.l-=1/60;if(p.l<=0){parts.splice(k,1);continue}p.x+=p.vx;p.y+=p.vy;p.vy+=.35;g.globalAlpha=Math.min(1,p.l*3);g.fillStyle=p.c;ci(p.x,p.y,p.r);g.fill()}g.globalAlpha=1;
    g.font='400 26px Impact,"Arial Black",sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
    for(let k=floats.length-1;k>=0;k--){const f=floats[k];f.l-=1/60;if(f.l<=0){floats.splice(k,1);continue}f.y-=1.1;g.globalAlpha=Math.min(1,f.l*2.5);g.lineWidth=5;g.strokeStyle='#4a1d08';g.strokeText(f.t,f.x,f.y);g.fillStyle=f.c;g.fillText(f.t,f.x,f.y)}g.globalAlpha=1;
    if(fz>0||banner){const txt=fz>0?`FRENZY x7 clicks  ${Math.ceil(fz)}s`:banner.t;g.font='bold 15px system-ui,sans-serif';const w=g.measureText(txt).width+30;g.fillStyle=fz>0?'rgba(230,50,30,.92)':'rgba(30,16,10,.85)';rr(W/2-w/2,10,w,30,15);g.fill();g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,W/2,26)}
  }

  // ---------- gameplay ----------
  const burst=(x,y,n,cols,f=1)=>{for(let k=0;k<n;k++){const a=Math.random()*6.28,v=(2+Math.random()*4)*f;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3,l:.5+Math.random()*.4,c:cols[k%cols.length],r:2+Math.random()*3})}};
  function tap(x,y){const v=s.c*(fz>0?7:1);s.n+=v;pop=1;sPop();burst(x,y,9,['#fde68a','#f0c24c','#d4382c','#e9a84c']);floats.push({x:x+(Math.random()*40-20),y:y-24,t:'+'+fmt(v),c:fz>0?'#ff8a6b':'#ffe08a',l:.9})}
  function buy(i){let q=qty=='m'?0:qty;if(qty=='m'){while(q<500&&cost(i,q+1)<=s.n)q++;q=Math.max(1,q)}const p=cost(i,q);if(s.n<p)return;s.n-=p;
    if(i==0)s.c+=q;else s.own[i-1]+=q;lastBuy={i,t:T};sBuy();
    if(i==0)burst(PX,PY,26,['#ffe08a','#fff','#f4c06a'],1.5);else{const sx=[0,330,520,400,500,520,520][i];burst(sx,i==6?70:i==5?150:230,22,['#ffe08a','#fff','#ffb347'],1.3)}
    note='';upd()}
  function upd(){cnt.innerHTML='';cnt.append(fmt(s.n));cnt.append(mk('small',{},'pizzas'));rt.textContent=`${fmt(rate())} per second  |  ${fmt(s.c*(fz>0?7:1))} per click`+(fz>0?'  (frenzy!)':'');
    cards.forEach((c,i)=>{let q=qty=='m'?0:qty;if(qty=='m'){while(q<500&&cost(i,q+1)<=s.n)q++;q=Math.max(1,q)}const p=cost(i,q),ok=s.n>=p;
      c.b.className='pcc'+(ok?' can':'');c.b.setAttribute('aria-disabled',!ok);c.ct.textContent=owned(i);
      c.pr.textContent=(q>1?`Buy ${q}: `:'')+fmt(p)+' pizzas';
      c.sub.textContent=i==0?`Level ${s.c}: ${s.c} pizza${s.c>1?'s':''} per click`:`${U[i-1][3]}  (+${fmt(U[i-1][2])}/s each)`})}
  // golden pizza
  let gTimer=0;function popGold(){gp.style.left=(36+Math.random()*50)+'%';gp.style.top=(8+Math.random()*50)+'%';gp.hidden=false;gTimer=9}
  gp.onclick=()=>{gp.hidden=true;gTimer=0;sGold();const r=gp.getBoundingClientRect(),vr=cv.getBoundingClientRect();burst((r.left-vr.left+r.width/2)*W/vr.width,(r.top-vr.top+r.height/2)*W/vr.width,34,['#ffd21f','#fff3a0','#ffb347'],1.6);
    if(Math.random()<.5){const b=Math.max(50,Math.round(rate()*60));s.n+=b;banner={t:'Golden pizza! +'+fmt(b),l:3}}else{fz=15;banner=null}upd()};

  // pointer
  const lp=e=>{const r=cv.getBoundingClientRect(),k=W/r.width;return[(e.clientX-r.left)*k,(e.clientY-r.top)*k]};
  cv.onpointerdown=e=>{const[x,y]=lp(e);if(Math.hypot(x-PX,y-PY)<=PR+20){tap(x,y);e.preventDefault()}};
  cv.onpointermove=e=>{const[x,y]=lp(e),h=Math.hypot(x-PX,y-PY)<=PR+20;cv.style.cursor=h?'pointer':'default';hover=h?1:0};
  cv.onpointerleave=()=>{hover=0};
  on(document,'keydown',e=>{if((e.code=='Space'||e.key=='Enter')&&!(e.target&&e.target.tagName=='BUTTON')){e.preventDefault();tap(PX+Math.random()*30-15,PY+Math.random()*30-15)}});

  // offline progress
  if(s.t&&rate()>0){const dt=Math.min((Date.now()-s.t)/1000,28800);if(dt>60){const gain=rate()*dt*.5;s.n+=gain;banner={t:`Welcome back! Your team baked ${fmt(gain)} pizzas`,l:5}}}

  // ---------- loop ----------
  let raf,last=performance.now(),lastMs=Date.now(),uT=0,run=true;
  function fit(){const w=Math.max(280,Math.round(cv.clientWidth)),d=Math.min(2,devicePixelRatio||1);if(cv.width!=Math.round(w*d)){cv.width=Math.round(w*d);cv.height=Math.round(w*d*H/W)}g.setTransform(cv.width/W,0,0,cv.width/W,0,0)}
  function frame(now){if(!run)return;raf=requestAnimationFrame(frame);const dt=Math.min(.1,(now-last)/1000);last=now;T+=dt;
    const ms=Date.now(),pd=Math.min(3600,(ms-lastMs)/1000);lastMs=ms;s.n+=rate()*pd;
    pop=Math.max(0,pop-dt*6);if(fz>0){fz-=dt;if(fz<=0){fz=0;upd()}}if(banner){banner.l-=dt;if(banner.l<=0)banner=null}
    if(gTimer>0){gTimer-=dt;if(gTimer<=0)gp.hidden=true}else if(gp.hidden&&Math.random()<dt*.035)popGold();
    fit();g.save();scene(T);g.restore();
    icons2(T);uT+=dt;if(uT>.1){uT=0;upd()}}
  function icons2(t){cards.forEach((c,i)=>{const sg=c.g;sg.setTransform(2,0,0,2,0,0);sg.clearRect(0,0,64,56);g=sg;g.save();
      if(i==0){g.translate(32,28);pizza(0,0,20,Math.min(9,s.c),t,1)}else{const sc=[0,.82,1.25,1.15,.95,.6,.85][i];g.translate(32,i==6?32:50);g.scale(sc,sc);SP[i](0,i==6?8:0,t,0,1)}
      g.restore();g=mainCtx})}
  raf=requestAnimationFrame(frame);upd();
  const sv=setInterval(save,3000);
  return()=>{run=false;cancelAnimationFrame(raf);clearInterval(sv);save()};
}
