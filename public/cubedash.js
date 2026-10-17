// Cube Dash: a Geometry Dash style rhythm platformer.
// 3 levels (Neon Start, Gravity Rush, Void Core), cube / ship / gravity flip, jump pads, jump orbs,
// saw blades, speed portals, 3 secret coins per level, practice mode with checkpoints, unlockable cube colors.
// The physics core (DashCore) is separate from the drawing code so it can be tested headless.
const DashCore=(()=>{
  const H8=8,V0=7.6,G=51,JV=14.3,PV=19.5,SA=38,SM=7.2,E=1e-4,FG=.2;
  function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

  /* ---------- level builder ---------- */
  function build(def,only){
    const R=rng(def.seed),objs=[],por=[];let X=14,fl=false,mode=0,sp=1,id=0,patIdx=0,coinAt=[];
    const add=o=>{o.id=id++;objs.push(o);return o};
    const Y=(y,h)=>fl?H8-y-h:y;
    const spike=(x,y=0)=>{const ty=Y(y,1);add({k:'s',x,y:ty,dn:fl,x0:x+.32,x1:x+.68,y0:fl?ty+.55:ty,y1:fl?ty+1:ty+.45})};
    const block=(x,y,w,h)=>{const ty=Y(y,h);add({k:'b',x0:x,x1:x+w,y0:ty,y1:ty+h})};
    const saw=(x,y=0)=>{const cx=x+.5,cy=Y(y,1)+.5;add({k:'w',cx,cy,r:.55,x0:cx-.55,x1:cx+.55,y0:cy-.55,y1:cy+.55})};
    const pad=(x,y=0)=>{const ty=Y(y,1);add({k:'p',x,y:ty,dn:fl,x0:x+.1,x1:x+.9,y0:fl?ty+.75:ty,y1:fl?ty+1:ty+.25})};
    const orb=(x,y)=>{const cx=x+.5,cy=Y(y,1)+.5;add({k:'o',cx,cy,x0:cx-.8,x1:cx+.8,y0:cy-.8,y1:cy+.8})};
    const coin=(x,y)=>{const cx=x+.5,cy=Y(y,1)+.5;add({k:'c',cx,cy,x0:cx-.6,x1:cx+.6,y0:cy-.6,y1:cy+.6,n:coinAt.length})};
    const portal=(x,kind)=>{por.push({k:'P',kind,x,x0:x,x1:x+1,y0:0,y1:H8});};

    // cube patterns: f(x) places things starting at x, w is the width used (including a safe landing gap)
    const CUBE=[
      /*0*/{w:4,h:0,f:x=>spike(x)},
      /*1*/{w:5,h:0,f:x=>{spike(x);spike(x+1)}},
      /*2*/{w:5,h:0,f:x=>block(x,0,2,1)},
      /*3*/{w:6,h:0,f:x=>{spike(x);spike(x+1);spike(x+2)}},
      /*4*/{w:5,h:0,f:x=>saw(x+1)},
      /*5*/{w:8,h:0,f:x=>{block(x,0,2,1);block(x+2,0,2,2);block(x+4,0,2,1)}},
      /*6*/{w:10,h:1,f:x=>{spike(x);block(x+6,0,2,1)}},
      /*7*/{w:11,h:1,f:x=>{block(x,0,3,1);spike(x+3);spike(x+4);spike(x+5);block(x+6,0,3,1)}},
      /*8*/{w:10,h:1,f:x=>{pad(x);spike(x+2);spike(x+3);spike(x+4)}},
      /*9*/{w:13,h:2,f:x=>{for(let i=1;i<=6;i++)spike(x+i);orb(x+3,2)}},
      /*10*/{w:10,h:1,f:x=>{spike(x);saw(x+5)}},
      /*11*/{w:8,h:1,f:x=>{block(x,0,1,1);block(x+4,0,1,1)}},
      /*12*/{w:12,h:2,f:x=>{spike(x);spike(x+4);spike(x+8)}},
      /*13*/{w:11,h:2,f:x=>{saw(x);saw(x+6)}},
      /*14*/{w:12,h:2,f:x=>{spike(x);spike(x+1);block(x+7,0,2,1);spike(x+10)}},
      /*15*/{w:15,h:3,f:x=>{for(let i=1;i<=10;i++)spike(x+i);orb(x+3,2);orb(x+8,2)}}
    ];
    function cubeSec(s){
      for(let i=0;i<s.n;i++){
        const pool=CUBE.map((p,j)=>j).filter(j=>CUBE[j].h<=s.h&&CUBE[j].h>=s.h-1);
        let j=only!=null?only:pool[Math.floor(R()*pool.length)];
        if(only==null&&i>0&&j==s._last)j=pool[Math.floor(R()*pool.length)];
        s._last=j;const p=CUBE[j];
        X+=3+R()*2+(sp-1)*3;
        p.f(X);
        patIdx++;
        if(only==null&&!s.noCoin&&coinAt.length<3&&((coinAt.length==0&&patIdx==def.c[0])||(coinAt.length==1&&patIdx==def.c[1])||(coinAt.length==2&&patIdx==def.c[2]))){coin(X+2,2);coinAt.push(1)}
        X+=p.w+(sp-1)*(p.w*.5);
      }
    }
    function shipSec(s){
      portal(X,'ship');X+=7;
      let c=4;const sp4=4.6*sp,g=s.g||3.4;
      for(let i=0;i<s.n;i++){
        c+=(R()*2-1)*Math.min(1.7,2.2);c=Math.max(g/2+.3,Math.min(H8-g/2-.3,c));
        const fh=c-g/2,ch=H8-(c+g/2);
        if(fh>.05)block(X,0,1.2,fh);if(ch>.05)block(X,c+g/2,1.2,ch);
        X+=sp4;
      }
      X+=4;
    }
    for(const s of def.secs){
      if(s.m=='ship'){
        if((s.sp||1)!=sp){portal(X,(s.sp||1)>1?'fast':'slow');sp=s.sp||1;X+=5}
        if(fl){portal(X,'unflip');fl=false;X+=5}
        shipSec(s);mode=1;
      } else {
        const wantFl=!!s.fl;
        if(mode==1){portal(X,'cube');mode=0;X+=6}
        if((s.sp||1)!=sp){portal(X,(s.sp||1)>1?'fast':'slow');sp=s.sp||1;X+=5}
        if(wantFl&&!fl){portal(X,'flip');X+=8;fl=true}else if(!wantFl&&fl){portal(X,'unflip');X+=8;fl=false}
        else X+=3;
        cubeSec(s);
      }
    }
    X+=12;
    const len=X;
    const bk=[];for(let c=0;c<=Math.ceil(len)+2;c++)bk.push([]);
    for(const o of objs){for(let c=Math.max(0,Math.floor(o.x0));c<=Math.floor(o.x1);c++)if(bk[c])bk[c].push(o)}
    // coin fallback: make sure there are 3 coins
    return{def,objs,por,len,bk,coins:objs.filter(o=>o.k=='c').length}
  }

  /* ---------- simulation ---------- */
  function init(){return{x:0,y:0,vy:0,s:1,m:0,sp:1,gr:true,held:0,buf:0,used:[],cs:[],pi:0,t:0,coy:0}}
  function clone(S){return{x:S.x,y:S.y,vy:S.vy,s:S.s,m:S.m,sp:S.sp,gr:S.gr,held:S.held,buf:S.buf,used:S.used.slice(),cs:S.cs.slice(),pi:S.pi,t:S.t,coy:S.coy||0}}
  // returns 0 alive, 1 dead, 2 level complete
  function step(S,L,held,dt){
    const edge=held&&!S.held;S.held=held;S.buf=edge?.16:Math.max(0,S.buf-dt);S.t+=dt;
    const can=S.gr||S.coy>0;S.coy=S.gr?.1:Math.max(0,(S.coy||0)-dt);S.gr=false;
    if(S.m==0){if(can&&held){S.vy=S.s*JV;S.coy=0}S.vy-=S.s*G*dt;if(S.vy>22)S.vy=22;if(S.vy<-22)S.vy=-22}
    else{S.vy+=(held?SA:-SA)*dt;if(S.vy>SM)S.vy=SM;if(S.vy<-SM)S.vy=-SM}
    const py=S.y;
    S.x+=V0*S.sp*dt;S.y+=S.vy*dt;
    while(S.pi<L.por.length&&S.x+.4>=L.por[S.pi].x+.5){
      const k=L.por[S.pi].kind;S.pi++;
      if(k=='ship'){S.m=1;S.s=1;S.vy*=.5}else if(k=='cube'){S.m=0}else if(k=='flip'){if(S.m==0)S.s=-1}else if(k=='unflip'){S.s=1}else if(k=='fast')S.sp=1.15;else if(k=='slow')S.sp=1;
    }
    if(S.m==1){if(S.y<0){S.y=0;S.vy=Math.max(0,S.vy)}if(S.y+.8>H8){S.y=H8-.8;S.vy=Math.min(0,S.vy)}}
    else if(S.s==1){if(S.y<0){S.y=0;S.vy=0;S.gr=true}if(S.y+.8>H8){S.y=H8-.8;S.vy=Math.min(0,S.vy)}}
    else{if(S.y+.8>=H8){S.y=H8-.8;S.vy=0;S.gr=true}if(S.y<0){S.y=0;S.vy=Math.max(0,S.vy)}}
    const c0=Math.max(0,Math.floor(S.x)),c1=Math.floor(S.x+.8);
    for(let c=c0;c<=c1;c++){const b=L.bk[c];if(!b)continue;
      for(let i=0;i<b.length;i++){const o=b[i];
        if(o.k=='b'){
          if(S.x<o.x1-E&&S.x+.8>o.x0+E&&S.y<o.y1-E&&S.y+.8>o.y0+E){
            if(S.m==0){
              if(S.s==1){if(S.vy<=0&&py>=o.y1-FG){S.y=o.y1;S.vy=0;S.gr=true}else return 1}
              else{if(S.vy>=0&&py+.8<=o.y0+FG){S.y=o.y0-.8;S.vy=0;S.gr=true}else return 1}
            } else {
              if(py>=o.y1-E){S.y=o.y1;S.vy=Math.max(0,S.vy)}
              else if(py+.8<=o.y0+E){S.y=o.y0-.8;S.vy=Math.min(0,S.vy)}
              else return 1;
            }
          }
        }
      }
    }
    const a0=S.x+.08,a1=S.x+.72,b0=S.y+.08,b1=S.y+.72;
    for(let c=c0;c<=c1;c++){const b=L.bk[c];if(!b)continue;
      for(let i=0;i<b.length;i++){const o=b[i];
        if(o.k=='s'){if(a1>o.x0&&a0<o.x1&&b1>o.y0&&b0<o.y1)return 1}
        else if(o.k=='w'){const nx=Math.max(a0,Math.min(o.cx,a1)),ny=Math.max(b0,Math.min(o.cy,b1));if((nx-o.cx)**2+(ny-o.cy)**2<o.r*o.r)return 1}
        else if(o.k=='p'){if(a1>o.x0&&a0<o.x1&&b1>o.y0&&b0<o.y1){S.vy=(o.dn?-1:1)*PV;S.gr=false;S.coy=0;S.padT=S.t}}
        else if(o.k=='o'){if(S.buf>0&&S.m==0&&S.used.indexOf(o.id)<0){const cx=S.x+.4,cy=S.y+.4;if((cx-o.cx)**2+(cy-o.cy)**2<.64){S.used.push(o.id);S.vy=S.s*JV*.97;S.buf=0;S.gr=false;S.coy=0;S.orbT=S.t}}}
        else if(o.k=='c'){if(S.cs.indexOf(o.n)<0){const cx=S.x+.4,cy=S.y+.4;if((cx-o.cx)**2+(cy-o.cy)**2<.5)S.cs.push(o.n)}}
      }
    }
    if(S.x>=L.len)return 2;
    return 0;
  }

  /* ---------- solver: can this level be beaten with inputs at 15 per second? ---------- */
  function solve(L,hz=15,cap=1500){
    const sub=Math.round(120/hz),dt=1/120;
    let layer=new Map();const s0=init();layer.set('s',s0);let tick=0,maxX=0;
    while(layer.size){
      const nxt=new Map();
      for(const S of layer.values())for(let h=0;h<2;h++){
        const T=clone(S);let r=0;
        for(let i=0;i<sub&&!r;i++)r=step(T,L,h,dt);
        if(r==2)return{ok:true,ticks:tick};
        if(r==1)continue;
        if(T.x>maxX)maxX=T.x;
        const k=Math.round(T.y*8)+'|'+Math.round(T.vy*1.5)+'|'+T.m+'|'+T.s+'|'+(T.gr?1:0)+'|'+h+'|'+(T.buf>0?1:0)+'|'+T.used.length;
        if(!nxt.has(k))nxt.set(k,T);
      }
      if(nxt.size>cap){const a=[...nxt.entries()];for(let i=a.length-1;i>cap;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}layer=new Map(a.slice(0,cap))}else layer=nxt;
      tick++;
    }
    return{ok:false,maxX,len:L.len};
  }

  const LEVELS=[
    {id:'neon',name:'Warm Up',diff:1,hue:200,bpm:120,seed:7,c:[4,9,15],sc:1,secs:[{m:'cube',n:8,h:0},{m:'ship',n:6,g:4.9},{m:'cube',n:9,h:1}]},
    {id:'grav',name:'Flip Side',diff:2,hue:285,bpm:124,seed:21,c:[5,13,21],sc:1,secs:[{m:'cube',n:7,h:1},{m:'cube',n:8,h:1,fl:true},{m:'ship',n:6,g:4.6},{m:'cube',n:7,h:1,fl:true},{m:'cube',n:5,h:1}]},
    {id:'void',name:'Deep Core',diff:3,hue:340,bpm:130,seed:33,c:[5,10,17],sc:1,secs:[{m:'cube',n:7,h:1},{m:'ship',n:7,g:4.3},{m:'cube',n:5,h:2},{m:'cube',n:5,h:1,fl:true}]}
  ];
  return{build,init,clone,step,solve,LEVELS,H8,V0};
})();
if(typeof module!='undefined')module.exports=DashCore;

/* ====================== the game: menu, drawing, input ====================== */
function dash(el){
  const D=DashCore,W=640,H=360,U=36,GY=330,PXS=4.2,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none;touch-action:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const SK=[{n:'Classic',a:'#ffd21f',b:'#b8860b',need:0},{n:'Sky',a:'#38bdf8',b:'#0369a1',need:1},{n:'Lime',a:'#a3e635',b:'#4d7c0f',need:3},{n:'Rose',a:'#fb7185',b:'#9f1239',need:5},
    {n:'Fire',a:'#fb923c',b:'#b91c1c',need:8},{n:'Ice',a:'#e0f2fe',b:'#7dd3fc',need:11},{n:'Violet',a:'#c084fc',b:'#6b21a8',need:14},{n:'Rainbow',a:'#fff',b:'#333',need:18,rb:1}];
  SK.forEach((k,i)=>k.p=i%4);
  let sv={best:{},done:{},coins:{},att:{},skin:0};
  try{Object.assign(sv,JSON.parse(localStorage.getItem('dash-save')))}catch(e){}
  const save=()=>{try{localStorage.setItem('dash-save',JSON.stringify(sv))}catch(e){}};
  const stars=()=>LV.reduce((n,l)=>n+(sv.done[l.def.id]?3:0)+((sv.coins[l.def.id]||[]).filter(Boolean).length),0);
  const LV=D.LEVELS.map(d=>({def:d,L:D.build(d)}));
  const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
  let scr='menu',sel=0,practice=false,L,S,cps,att,dead,deadT,endT,parts=[],time=0,shake=0,btns=[],held=0,raf,last=0,acc=0,trail=[],flash=0,newBest=false,skinI=sv.skin||0;
  if(SK[skinI].need>stars())skinI=0;
  const skinOf=()=>{const k=SK[skinI];if(!k.rb)return k;const h=(time*120)%360;return{a:`hsl(${h},90%,60%)`,b:`hsl(${h},90%,30%)`,p:k.p}};

  function start(i){
    sel=i;L=LV[i].L;S=D.init();cps=[];att=(sv.att[L.def.id]||0)+1;if(!practice){sv.att[L.def.id]=att;save()}
    dead=false;deadT=0;parts=[];trail=[];scr='play';flash=0;newBest=false;held=0;lastCp=0;update.cc=0;
    st(practice?'Practice mode: checkpoints are saved automatically.':'');
  }
  let lastCp=0;
  const pct=()=>Math.min(100,Math.floor(S.x/L.len*100));
  function die(){
    if(dead)return;dead=true;deadT=0;shake=.25;flash=.12;sfx('crash');
    const k=skinOf(),cx=S.x+.4,cy=S.y+.4;
    for(let i=0;i<26;i++){const a=Math.random()*6.283,sp=3+Math.random()*9;parts.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp+2,l:.8+Math.random()*.5,t:0,s:.12+Math.random()*.16,c:i%3?k.a:k.b,g:1})}
    if(!practice){const p=pct();if(p>(sv.best[L.def.id]||0)){sv.best[L.def.id]=p;save()}}
  }
  function win(){
    scr='end';endT=0;sfx('win');
    const id=L.def.id;
    if(!practice){
      if(!sv.done[id])newBest=true;sv.done[id]=1;sv.best[id]=100;
      const cc=sv.coins[id]||[0,0,0];S.cs.forEach(n=>cc[n]=1);sv.coins[id]=cc;save();
    }
    for(let i=0;i<60;i++)parts.push({x:S.x+.4,y:S.y+.4,vx:(Math.random()-.3)*10,vy:Math.random()*10,l:1.2,t:0,s:.14,c:`hsl(${Math.random()*360},90%,60%)`,g:1});
  }
  function respawn(){
    dead=false;parts=[];trail=[];update.cc=0;
    if(practice&&cps.length){const cp=cps[cps.length-1];S=D.clone(cp);S.held=0;held=held?1:0}
    else{S=D.init();att++;if(!practice){sv.att[L.def.id]=att;save()}}
  }

  /* ---------- fixed-timestep update ---------- */
  function update(dt){
    time+=dt;
    if(shake>0)shake-=dt;if(flash>0)flash-=dt;
    for(const p of parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.g)p.vy-=22*dt}
    parts=parts.filter(p=>p.t<p.l);
    if(scr=='end'){endT+=dt;return}
    if(scr!='play')return;
    if(dead){deadT+=dt;if(deadT>.75)respawn();return}
    const r=D.step(S,L,held,dt);
    if(r==1){die();return}
    if(r==2){win();return}
    if(S.padT===S.t){sfx('hop');for(let i=0;i<6;i++)parts.push({x:S.x+.4,y:S.y,vx:(Math.random()-.5)*4,vy:Math.random()*3,l:.4,t:0,s:.1,c:'#ffe066',g:1})}
    if(S.orbT===S.t){sfx('hop');for(let i=0;i<8;i++){const a=Math.random()*6.283;parts.push({x:S.x+.4,y:S.y+.4,vx:Math.cos(a)*4,vy:Math.sin(a)*4,l:.4,t:0,s:.09,c:'#ffe066'})}}
    if(S.cs.length!=(update.cc||0)){if(S.cs.length>(update.cc||0))sfx('coin');update.cc=S.cs.length}
    // trail
    if((S.gr||S.m==1)&&Math.random()<.9)trail.push({x:S.x,y:S.y+(S.m?.1:.05),t:0});
    for(const t of trail)t.t+=dt;trail=trail.filter(t=>t.t<.35);
    // practice checkpoints every ~2s of play on solid ground (or in ship)
    if(practice&&S.t-lastCp>2&&(S.gr||S.m==1)){lastCp=S.t;const q=D.clone(S);q.t=S.t;cps.push(q);if(cps.length>40)cps.shift()}
    if((update.u=(update.u||0)+1)%6==0)st(practice?`Practice ${pct()}%  checkpoints ${cps.length}`:`${pct()}%   Attempt ${att}`);
  }

  /* ---------- drawing helpers ---------- */
  const sx=wx=>(wx-camX)*U,sy=wy=>GY-wy*U;let camX=0;
  const FONT='"Arial Black",Impact,"Trebuchet MS",sans-serif',OUT='#0e0c1f';
  const hs=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
  const TH={
    neon:{sky:['#1b46c9','#2f86ff'],gnd:'#081542',top:'#59d4ff',blk:'#081542',blk2:'#59d4ff',spk:'#05060f',acc:'#e8f6ff'},
    grav:{sky:['#4a168f','#a83bd0'],gnd:'#1c0840',top:'#ff6fd8',blk:'#1c0840',blk2:'#ff6fd8',spk:'#05030f',acc:'#ffe3f7'},
    void:{sky:['#6b0f12','#d2402a'],gnd:'#2a0507',top:'#ffb347',blk:'#2a0507',blk2:'#ffb347',spk:'#060203',acc:'#fff0cf'}};
  function bg(t,beat){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,t.sky[0]);g.addColorStop(1,t.sky[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
    const cx=camX*U;
    // big drifting outlined squares, two depths, like a stage backdrop
    for(let d=0;d<2;d++){
      const par=d?.28:.12,sz=d?70:120,n=d?9:6;x.lineWidth=d?3:4;x.strokeStyle=`rgba(255,255,255,${d?.13:.08})`;x.fillStyle=`rgba(255,255,255,${d?.05:.03})`;
      const i0=Math.floor(cx*par/(sz*1.6))-1;
      for(let i=i0;i<i0+n+2;i++){const bx=i*sz*1.6-cx*par,by=40+hs(i*7+d*31)*(H-170),s=sz*(.7+hs(i+d*5)*.6);x.fillRect(bx,by,s,s);x.strokeRect(bx,by,s,s)}
    }
    // soft light rising from the floor
    const f=x.createLinearGradient(0,GY-120,0,GY);f.addColorStop(0,'rgba(255,255,255,0)');f.addColorStop(1,`rgba(255,255,255,${.12+beat*.1})`);x.fillStyle=f;x.fillRect(0,GY-120,W,120);
    if(beat>0){x.fillStyle=`rgba(255,255,255,${beat*.04})`;x.fillRect(0,0,W,H)}
  }
  function slab(y0,h,t,flip){x.fillStyle=t.gnd;x.fillRect(0,y0,W,h);const ty=flip?y0+h-4:y0;x.fillStyle=t.top;x.fillRect(0,ty,W,4);
    x.fillStyle=t.top+'22';for(let i=-1;i<20;i++){const gx=i*U-(camX*U)%U;x.fillRect(gx,y0,2,h)}
    for(let r=1;r*U<h;r++)x.fillRect(0,flip?y0+h-r*U:y0+r*U,W,2)}
  function tile(px,py,t){
    x.fillStyle=t.blk;x.fillRect(px,py,U,U);x.strokeStyle=t.blk2;x.lineWidth=3;x.strokeRect(px+1.5,py+1.5,U-3,U-3);
    x.globalAlpha=.45;x.lineWidth=2;x.strokeRect(px+10,py+10,U-20,U-20);x.globalAlpha=1}
  function drawSpike(o,t){
    const px=sx(o.x),py=sy(o.y+1);x.save();x.translate(px,py);if(o.dn){x.translate(0,U);x.scale(1,-1)}
    x.beginPath();x.moveTo(2,U);x.lineTo(U/2,3);x.lineTo(U-2,U);x.closePath();x.fillStyle=t.spk;x.fill();x.lineJoin='round';x.lineWidth=2.5;x.strokeStyle=t.acc;x.stroke();
    x.beginPath();x.moveTo(U/2,13);x.lineTo(U/2+6,U-6);x.lineTo(U/2-6,U-6);x.closePath();x.fillStyle=t.acc+'33';x.fill();x.restore()}
  function drawSaw(o,t){
    const px=sx(o.cx),py=sy(o.cy),r=o.r*U+4;x.save();x.translate(px,py);x.rotate(time*8);
    x.beginPath();for(let i=0;i<20;i++){const a=i/20*6.283,q=i%2?r*.76:r;x.lineTo(Math.cos(a)*q,Math.sin(a)*q)}x.closePath();x.fillStyle='#d5d9e2';x.fill();x.lineJoin='round';x.lineWidth=2.5;x.strokeStyle=OUT;x.stroke();
    x.fillStyle='#8b91a3';x.beginPath();x.arc(0,0,r*.62,0,7);x.fill();x.stroke();x.fillStyle=OUT;for(let i=0;i<4;i++){const a=i*1.5708+.78;x.beginPath();x.arc(Math.cos(a)*r*.36,Math.sin(a)*r*.36,3,0,7);x.fill()}x.fillStyle='#e63027';x.beginPath();x.arc(0,0,r*.16,0,7);x.fill();x.restore()}
  const PCOL={ship:'#ff5db1',cube:'#2ee6ff',flip:'#ffd21f',unflip:'#9be564',fast:'#ff8a3d',slow:'#6aa8ff'};
  function drawPortal(p){
    const px=sx(p.x+.5),py=sy(4),col=PCOL[p.kind];x.save();x.translate(px,py);
    x.beginPath();x.ellipse(0,0,13,U*2.2,0,0,7);x.fillStyle=col+'3a';x.fill();x.lineWidth=10;x.strokeStyle=OUT;x.stroke();x.lineWidth=5;x.strokeStyle=col;x.stroke();
    x.fillStyle=OUT;x.beginPath();x.arc(0,0,11,0,7);x.fill();x.fillStyle=col;x.font=`bold 15px ${FONT}`;x.textAlign='center';
    x.fillText({ship:'S',cube:'C',flip:'\u21C5',unflip:'\u21C5',fast:'\u00BB',slow:'\u00AB'}[p.kind],0,5);x.restore()}
  function face(s,k){const p=k.p||0;x.fillStyle=OUT;x.strokeStyle=OUT;x.lineWidth=Math.max(2,s*.12);
    if(p==0){x.fillRect(-s*.24,-s*.24,s*.48,s*.48);x.fillStyle=k.a;x.fillRect(-s*.1,-s*.1,s*.2,s*.2)}
    else if(p==1){x.beginPath();x.moveTo(-s*.26,-s*.26);x.lineTo(s*.26,s*.26);x.moveTo(s*.26,-s*.26);x.lineTo(-s*.26,s*.26);x.stroke()}
    else if(p==2){x.fillRect(-s*.3,-s*.22,s*.6,s*.14);x.fillRect(-s*.3,s*.08,s*.6,s*.14)}
    else{x.beginPath();x.moveTo(0,-s*.3);x.lineTo(s*.3,0);x.lineTo(0,s*.3);x.lineTo(-s*.3,0);x.closePath();x.fill();x.fillStyle=k.a;x.fillRect(-s*.07,-s*.07,s*.14,s*.14)}}
  function drawPlayer(){
    const k=skinOf(),px=sx(S.x)+.4*U,py=sy(S.y)-.4*U;x.save();x.translate(px,py);
    if(S.m==1){
      x.rotate(-clampN(S.vy/SM(),-1,1)*.45);
      const body=()=>{x.beginPath();x.moveTo(-22,4);x.lineTo(-16,15);x.lineTo(18,15);x.lineTo(26,3);x.lineTo(18,-3);x.lineTo(-20,-3);x.closePath()};
      x.fillStyle='#ff9a3c';x.beginPath();x.moveTo(-24,6);x.lineTo(-36-Math.random()*6,9);x.lineTo(-24,12);x.fill();
      body();x.lineJoin='round';x.lineWidth=5;x.strokeStyle=OUT;x.stroke();x.fillStyle=k.b;x.fill();x.fillStyle='#ffffff40';x.fillRect(-14,0,30,3);
      x.beginPath();x.moveTo(-18,-3);x.lineTo(-26,-12);x.lineTo(-10,-3);x.closePath();x.lineWidth=4;x.stroke();x.fillStyle=k.a;x.fill();
      x.beginPath();x.arc(2,-3,12,Math.PI,0);x.closePath();x.lineWidth=4;x.strokeStyle=OUT;x.stroke();x.fillStyle='#cfefff';x.fill();
      x.save();x.translate(2,-8);x.fillStyle=OUT;x.fillRect(-8,-7,16,15);x.fillStyle=k.a;x.fillRect(-6,-5,12,11);x.scale(.46,.46);face(28,k);x.restore();
    } else {
      const a=S.gr?snapRot:airRot,s=28.8;x.rotate(a);
      x.fillStyle=OUT;x.fillRect(-s/2-3,-s/2-3,s+6,s+6);x.fillStyle=k.a;x.fillRect(-s/2,-s/2,s,s);x.fillStyle=k.b;x.fillRect(-s/2,-s/2,s,4);x.fillRect(-s/2,-s/2,4,s);x.fillRect(s/2-4,-s/2,4,s);x.fillRect(-s/2,s/2-4,s,4);
      x.fillStyle='#ffffff55';x.fillRect(-s/2+4,-s/2+4,s-8,3);face(s,k);
    }
    x.restore()}
  const SM=()=>7.2;
  let airRot=0,snapRot=0;
  function rotUpdate(dt){
    if(!S||S.m==1)return;
    if(S.gr){const t=Math.round(airRot/1.5708)*1.5708;snapRot=snapRot+(t-snapRot)*Math.min(1,dt*30);airRot=snapRot}
    else{airRot+=S.s*dt*5.6;snapRot=airRot}
  }
  const outText=(t,px,py,sz,fill,al='center')=>{x.textAlign=al;x.font=`${sz}px ${FONT}`;x.lineJoin='round';x.lineWidth=Math.max(3,sz/6);x.strokeStyle=OUT;x.strokeText(t,px,py);x.fillStyle=fill;x.fillText(t,px,py)};

  function drawWorld(){
    const lv=L.def,prog=S.x/L.len,t=TH[lv.id],beat=Math.pow(1-((time*lv.bpm/60)%1),3);
    bg(t,beat);
    x.save();
    if(shake>0)x.translate((Math.random()-.5)*8*shake*4,(Math.random()-.5)*8*shake*4);
    slab(GY,H-GY,t,false);slab(0,GY-8*U,t,true);
    const x0=camX-2,x1=camX+W/U+2;
    for(const o of L.objs){if(o.x1<x0||o.x0>x1)continue;
      if(o.k=='b'){for(let i=0;i<Math.round(o.x1-o.x0);i++)for(let j=0;j<Math.round(o.y1-o.y0);j++)tile(sx(o.x0+i),sy(o.y0+j+1),t)}
      else if(o.k=='s')drawSpike(o,t);
      else if(o.k=='w')drawSaw(o,t);
      else if(o.k=='p'){const px=sx(o.x)+3,py=sy(o.y+(o.dn?1:0)),d=o.dn?1:-1;x.beginPath();x.moveTo(px,py);x.lineTo(px+U-6,py);x.lineTo(px+U-12,py+10*d);x.lineTo(px+6,py+10*d);x.closePath();x.fillStyle='#ffd83a';x.fill();x.lineJoin='round';x.lineWidth=3;x.strokeStyle=OUT;x.stroke();x.fillStyle='#fff6';x.fillRect(px+10,py+(d>0?2:-5),U-26,3)}
      else if(o.k=='o'){const px=sx(o.cx),py=sy(o.cy),r=11+Math.sin(time*7+o.id)*1.2,used=S.used.indexOf(o.id)>=0;
        x.beginPath();x.arc(px,py,r+2,0,7);x.fillStyle=OUT;x.fill();x.beginPath();x.arc(px,py,r,0,7);x.fillStyle=used?'#8a7a30':'#ffd83a';x.fill();x.beginPath();x.arc(px,py,r-5,0,7);x.fillStyle=used?'#5d5320':'#fff3a8';x.fill()}
      else if(o.k=='c'){const got=S.cs.indexOf(o.n)>=0||(sv.coins[L.def.id]||[])[o.n];const px=sx(o.cx),py=sy(o.cy),sc=Math.max(.25,Math.abs(Math.cos(time*3+o.n)));
        x.globalAlpha=got?.35:1;x.beginPath();x.ellipse(px,py,13*sc,13,0,0,7);x.fillStyle=OUT;x.fill();x.beginPath();x.ellipse(px,py,10.5*sc,10.5,0,0,7);x.fillStyle='#ffc933';x.fill();x.beginPath();x.ellipse(px,py,6.5*sc,6.5,0,0,7);x.fillStyle='#ffe58a';x.fill();x.globalAlpha=1}
    }
    for(const p of L.por)if(p.x>x0&&p.x<x1)drawPortal(p);
    const fx=sx(L.len-8);if(fx<W+40){x.fillStyle=t.top;x.fillRect(fx,0,W,H);for(let yy=0;yy<H;yy+=24)for(let q=0;q<W;q+=24)if(((yy+q)/24)%2==0){x.fillStyle='#0003';x.fillRect(fx+q,yy,24,24)}outText('FINISH',fx+120,GY-130,34,'#fff')}
    if(practice)for(const cp of cps){const px=sx(cp.x+.4);if(px>-20&&px<W+20){x.beginPath();x.moveTo(px,GY-14);x.lineTo(px+8,GY-24);x.lineTo(px,GY-34);x.lineTo(px-8,GY-24);x.closePath();x.fillStyle='#4ade80';x.fill();x.lineWidth=2;x.strokeStyle=OUT;x.stroke()}}
    const k=skinOf();
    for(const q of trail){const f=1-q.t/.35,s=U*.34*f;x.fillStyle=k.a;x.globalAlpha=.7*f;x.fillRect(sx(q.x)+6,sy(q.y)-s-4,s,s)}x.globalAlpha=1;
    if(!dead)drawPlayer();
    for(const p of parts){x.globalAlpha=clampN(1-p.t/p.l,0,1);x.fillStyle=p.c;const s=p.s*U;x.fillRect(sx(p.x)-s/2,sy(p.y)-s/2,s,s)}x.globalAlpha=1;
    x.restore();
    // HUD
    x.fillStyle=OUT;x.fillRect(W/2-153,8,306,16);x.fillStyle='#ffffff30';x.fillRect(W/2-150,11,300,10);x.fillStyle=t.top;x.fillRect(W/2-150,11,300*prog,10);
    outText(pct()+'%',W/2+160,22,15,'#fff','left');outText(practice?'PRACTICE':'Attempt '+att,W-10,22,13,'#fff','right');outText(lv.name,10,22,13,'#fff','left');
    for(let i=0;i<3;i++){const got=S.cs.indexOf(i)>=0;x.beginPath();x.arc(W-20-i*20,38,8,0,7);x.fillStyle=OUT;x.fill();x.beginPath();x.arc(W-20-i*20,38,6,0,7);x.fillStyle=got?'#ffc933':'#ffffff33';x.fill()}
    if(flash>0){x.fillStyle=`rgba(255,255,255,${flash*5})`;x.fillRect(0,0,W,H)}
    if(dead&&!practice&&deadT>.15)outText(pct()+'%',W/2,150,28,'#fff');
    if(scr=='end')drawEnd();
  }
  function drawEnd(){
    const a=clampN(endT*2,0,1);x.fillStyle=`rgba(10,8,25,${.62*a})`;x.fillRect(0,0,W,H);
    x.globalAlpha=a;outText('LEVEL COMPLETE!',W/2,124,38,'#ffd83a');
    outText(practice?'Practice run. Play for real to save progress.':`Attempts ${att}     Coins ${S.cs.length}/3`,W/2,168,17,'#fff');
    if(newBest&&!practice)outText(`Stars: ${stars()}  (more cube colors unlock with stars)`,W/2,198,14,'#fff');
    outText('Press Enter, Space or tap for the menu',W/2,252,15,'#2ee6ff');x.globalAlpha=1;
  }

  /* ---------- menu ---------- */
  function btn(rx,ry,rw,rh,fn){btns.push({x:rx,y:ry,w:rw,h:rh,fn})}
  function cubeIcon(cx,cy,s,k,locked){x.fillStyle=OUT;x.fillRect(cx-s/2-2,cy-s/2-2,s+4,s+4);x.fillStyle=locked?'#3a3a48':k.a;x.fillRect(cx-s/2,cy-s/2,s,s);
    if(!locked){x.fillStyle=k.b;x.fillRect(cx-s/2,cy-s/2,s,3);x.fillRect(cx-s/2,cy-s/2,3,s);x.save();x.translate(cx,cy);face(s,k);x.restore()}}
  function drawMenu(){
    btns=[];const d=LV[sel].def,t=TH[d.id];camX=time*6;
    bg(t,Math.pow(1-((time*2)%1),3));slab(GY,H-GY,t,false);
    outText('CUBE DASH',W/2,56,44,'#fff');
    // one level at a time, big, with arrows either side
    const pw=300,ph=120,px=(W-pw)/2,py=80;
    x.fillStyle=OUT;x.fillRect(px-3,py-3,pw+6,ph+6);x.fillStyle=t.gnd;x.fillRect(px,py,pw,ph);x.strokeStyle=t.top;x.lineWidth=3;x.strokeRect(px+1.5,py+1.5,pw-3,ph-3);
    outText(d.name,W/2,py+36,26,'#fff');
    outText(['','Easy','Normal','Hard'][d.diff]||'Hard',W/2,py+60,14,t.top);
    const b=sv.best[d.id]||0;x.fillStyle=OUT;x.fillRect(px+20,py+74,pw-40,14);x.fillStyle='#ffffff30';x.fillRect(px+22,py+76,pw-44,10);x.fillStyle=t.top;x.fillRect(px+22,py+76,(pw-44)*b/100,10);
    outText(sv.done[d.id]?'Complete!':'Best '+b+'%',W/2-60,py+108,12,'#fff');
    const cc=sv.coins[d.id]||[];for(let q=0;q<3;q++){const cx=W/2+34+q*20,cy=py+104;x.beginPath();x.arc(cx,cy,7,0,7);x.fillStyle=OUT;x.fill();x.beginPath();x.arc(cx,cy,5,0,7);x.fillStyle=cc[q]?'#ffc933':'#ffffff44';x.fill()}
    const arrow=(ax,dir,fn)=>{x.fillStyle=OUT;x.beginPath();x.moveTo(ax+dir*-16,py+ph/2-24);x.lineTo(ax+dir*16,py+ph/2);x.lineTo(ax+dir*-16,py+ph/2+24);x.closePath();x.fill();x.fillStyle=t.top;x.beginPath();x.moveTo(ax+dir*-11,py+ph/2-17);x.lineTo(ax+dir*10,py+ph/2);x.lineTo(ax+dir*-11,py+ph/2+17);x.closePath();x.fill();btn(ax-30,py,60,ph,fn)};
    arrow(px-50,-1,()=>{sel=(sel+2)%3;sfx('click')});arrow(px+pw+50,1,()=>{sel=(sel+1)%3;sfx('click')});
    btn(px,py,pw,ph,()=>start(sel));
    outText(`Cube color: ${SK[skinI].n}   Stars: ${stars()}`,W/2,254,13,'#fff');
    SK.forEach((k,i)=>{const cx=W/2-(SK.length-1)*22+i*44,cy=282,lock=k.need>stars();
      if(i==skinI){x.strokeStyle='#fff';x.lineWidth=3;x.strokeRect(cx-19,cy-19,38,38)}
      cubeIcon(cx,cy,26,k.rb?skinOf():k,lock);
      if(lock)outText('\u2605'+k.need,cx,cy+5,11,'#fff');
      btn(cx-20,cy-20,40,40,()=>{if(!lock){skinI=i;sv.skin=i;save();sfx('click')}});
    });
    const bx=(qx,qy,w,h,col)=>{x.fillStyle=OUT;x.fillRect(qx-3,qy-3,w+6,h+6);x.fillStyle=col;x.fillRect(qx,qy,w,h);x.fillStyle='#ffffff40';x.fillRect(qx,qy,w,4)};
    bx(W/2-160,314,150,30,practice?'#4ade80':'#6b7280');outText('Practice: '+(practice?'ON':'OFF')+' (P)',W/2-85,334,12,'#fff');btn(W/2-160,314,150,30,()=>{practice=!practice;sfx('click')});
    bx(W/2+10,314,150,30,'#2ee6ff');outText('PLAY (Space)',W/2+85,334,13,'#fff');btn(W/2+10,314,150,30,()=>start(sel));
  }
  /* ---------- input ---------- */
  const pos=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]};
  on(c,'pointerdown',e=>{
    e.preventDefault();try{c.setPointerCapture(e.pointerId)}catch(_){}
    if(scr=='menu'){const[px,py]=pos(e);const b=btns.find(b=>px>=b.x&&px<=b.x+b.w&&py>=b.y&&py<=b.y+b.h);if(b)b.fn();return}
    if(scr=='end'&&endT>.5){scr='menu';st('');return}
    held=1;
  });
  const rel=()=>{held=0};
  on(c,'pointerup',rel);on(c,'pointercancel',rel);on(window,'blur',rel);
  on(document,'keydown',e=>{
    const k=e.key;
    const jump=k==' '||k=='ArrowUp'||k=='w'||k=='W';
    if(jump||k=='Enter'||k=='Escape'||k=='ArrowLeft'||k=='ArrowRight'||k=='p'||k=='P'||k=='r'||k=='R')e.preventDefault();
    if(e.repeat)return;
    if(scr=='menu'){
      if(k=='ArrowLeft'||k=='a'){sel=(sel+2)%3;sfx('click')}else if(k=='ArrowRight'||k=='d'){sel=(sel+1)%3;sfx('click')}
      else if(k=='p'||k=='P'){practice=!practice;sfx('click')}
      else if(k=='Enter'||k==' '||k=='ArrowUp')start(sel);
      else if(k=='c'||k=='C'){do{skinI=(skinI+1)%SK.length}while(SK[skinI].need>stars());sv.skin=skinI;save()}
    } else if(scr=='end'){if(endT>.4&&(k=='Enter'||k==' '))scr='menu'}
    else{
      if(jump)held=1;
      else if(k=='Escape'){scr='menu';st('')}
      else if(k=='r'||k=='R'){cps=[];S=D.init();dead=false;parts=[];trail=[];att++;if(!practice){sv.att[L.def.id]=att;save()}}
    }
  });
  on(document,'keyup',e=>{if(e.key==' '||e.key=='ArrowUp'||e.key=='w'||e.key=='W')held=0});

  /* ---------- main loop ---------- */
  function frame(ts){
    raf=requestAnimationFrame(frame);
    const dt=Math.min(.05,(ts-last)/1000||0);last=ts;acc+=dt;
    while(acc>=1/120){update(1/120);rotUpdate(1/120);acc-=1/120}
    if(scr=='menu'){time+=0;drawMenu();x.textAlign='left'}
    else{
      camX=S.x-PXS;
      drawWorld();
    }
  }
  st('Pick a level. Left and Right choose, Space plays, P turns on practice.');
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
