// Cube Dash: a Geometry Dash style rhythm platformer.
// 3 levels (Neon Start, Gravity Rush, Void Core), cube / ship / gravity flip, jump pads, jump orbs,
// saw blades, speed portals, 3 secret coins per level, practice mode with checkpoints, unlockable cube colors.
// The physics core (DashCore) is separate from the drawing code so it can be tested headless.
const DashCore=(()=>{
  const H8=8,V0=8.4,G=51,JV=14.3,PV=19.5,SA=38,SM=7.2,E=1e-4,FG=.2;
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
      /*9*/{w:13,h:1,f:x=>{for(let i=1;i<=6;i++)spike(x+i);orb(x+3,2)}},
      /*10*/{w:10,h:1,f:x=>{spike(x);saw(x+5)}},
      /*11*/{w:8,h:1,f:x=>{block(x,0,1,1);block(x+4,0,1,1)}},
      /*12*/{w:12,h:2,f:x=>{spike(x);spike(x+4);spike(x+8)}},
      /*13*/{w:11,h:2,f:x=>{saw(x);saw(x+6)}},
      /*14*/{w:12,h:2,f:x=>{spike(x);spike(x+1);block(x+7,0,2,1);spike(x+10)}},
      /*15*/{w:15,h:2,f:x=>{for(let i=1;i<=10;i++)spike(x+i);orb(x+3,2);orb(x+8,2)}}
    ];
    function cubeSec(s){
      for(let i=0;i<s.n;i++){
        const pool=CUBE.map((p,j)=>j).filter(j=>CUBE[j].h<=s.h&&CUBE[j].h>=s.h-1);
        let j=only!=null?only:pool[Math.floor(R()*pool.length)];
        if(only==null&&i>0&&j==s._last)j=pool[Math.floor(R()*pool.length)];
        s._last=j;const p=CUBE[j];
        X+=2+R()*1.5+(sp-1)*3;
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
  function init(){return{x:0,y:0,vy:0,s:1,m:0,sp:1,gr:true,held:0,buf:0,used:[],cs:[],pi:0,t:0}}
  function clone(S){return{x:S.x,y:S.y,vy:S.vy,s:S.s,m:S.m,sp:S.sp,gr:S.gr,held:S.held,buf:S.buf,used:S.used.slice(),cs:S.cs.slice(),pi:S.pi,t:S.t}}
  // returns 0 alive, 1 dead, 2 level complete
  function step(S,L,held,dt){
    const edge=held&&!S.held;S.held=held;S.buf=edge?.12:Math.max(0,S.buf-dt);S.t+=dt;
    const can=S.gr;S.gr=false;
    if(S.m==0){if(can&&held)S.vy=S.s*JV;S.vy-=S.s*G*dt;if(S.vy>22)S.vy=22;if(S.vy<-22)S.vy=-22}
    else{S.vy+=(held?SA:-SA)*dt;if(S.vy>SM)S.vy=SM;if(S.vy<-SM)S.vy=-SM}
    const py=S.y;
    S.x+=V0*S.sp*dt;S.y+=S.vy*dt;
    while(S.pi<L.por.length&&S.x+.4>=L.por[S.pi].x+.5){
      const k=L.por[S.pi].kind;S.pi++;
      if(k=='ship'){S.m=1;S.s=1;S.vy*=.5}else if(k=='cube'){S.m=0}else if(k=='flip'){if(S.m==0)S.s=-1}else if(k=='unflip'){S.s=1}else if(k=='fast')S.sp=1.3;else if(k=='slow')S.sp=1;
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
        else if(o.k=='p'){if(a1>o.x0&&a0<o.x1&&b1>o.y0&&b0<o.y1){S.vy=(o.dn?-1:1)*PV;S.gr=false;S.padT=S.t}}
        else if(o.k=='o'){if(S.buf>0&&S.m==0&&S.used.indexOf(o.id)<0){const cx=S.x+.4,cy=S.y+.4;if((cx-o.cx)**2+(cy-o.cy)**2<.64){S.used.push(o.id);S.vy=S.s*JV*.97;S.buf=0;S.gr=false;S.orbT=S.t}}}
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
    {id:'neon',name:'Neon Start',diff:1,hue:200,bpm:120,seed:7,c:[5,12,22],sc:1,secs:[{m:'cube',n:12,h:0},{m:'ship',n:8,g:3.8},{m:'cube',n:16,h:1}]},
    {id:'grav',name:'Gravity Rush',diff:3,hue:285,bpm:132,seed:21,c:[8,16,25],sc:1,secs:[{m:'cube',n:8,h:1},{m:'cube',n:12,h:1,fl:true},{m:'ship',n:8,g:3.4},{m:'cube',n:10,h:2,fl:true},{m:'cube',n:8,h:2}]},
    {id:'void',name:'Void Core',diff:5,hue:340,bpm:144,seed:33,c:[7,14,22],sc:1,secs:[{m:'cube',n:12,h:2,sp:1.3},{m:'ship',n:10,g:3.2,sp:1.3},{m:'cube',n:12,h:2,fl:true,sp:1.3},{m:'cube',n:8,h:2,sp:1}]}
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
  let sv={best:{},done:{},coins:{},att:{},skin:0};
  try{Object.assign(sv,JSON.parse(localStorage.getItem('dash-save')))}catch(e){}
  const save=()=>{try{localStorage.setItem('dash-save',JSON.stringify(sv))}catch(e){}};
  const stars=()=>LV.reduce((n,l)=>n+(sv.done[l.def.id]?3:0)+((sv.coins[l.def.id]||[]).filter(Boolean).length),0);
  const LV=D.LEVELS.map(d=>({def:d,L:D.build(d)}));
  const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
  let scr='menu',sel=0,practice=false,L,S,cps,att,dead,deadT,endT,parts=[],time=0,shake=0,btns=[],held=0,raf,last=0,acc=0,trail=[],flash=0,newBest=false,skinI=sv.skin||0;
  if(SK[skinI].need>stars())skinI=0;
  const skinOf=()=>{const k=SK[skinI];if(!k.rb)return k;const h=(time*120)%360;return{a:`hsl(${h},90%,60%)`,b:`hsl(${h},90%,30%)`}};

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
  function bg(hue,beat){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,`hsl(${hue},60%,${16+beat*4}%)`);g.addColorStop(1,`hsl(${hue+30},70%,${7+beat*3}%)`);
    x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle=`hsla(${hue},80%,70%,.07)`;
    for(let i=0;i<9;i++){const w=60+((i*53)%50),px=((i*160-camX*U*.18)%(W+200)+W+200)%(W+200)-100;x.fillRect(px,40+(i*37)%200,w,w)}
    x.fillStyle=`hsla(${hue},70%,60%,.09)`;
    for(let i=0;i<7;i++){const w=110+((i*71)%60),px=((i*210-camX*U*.35)%(W+300)+W+300)%(W+300)-150;x.fillRect(px,GY-w*1.4+((i*29)%40),w,w*1.4)}
  }
  function tile(px,py,hue,k){
    x.fillStyle=`hsl(${hue},45%,${14+k}%)`;x.fillRect(px,py,U,U);
    x.strokeStyle=`hsl(${hue},90%,65%)`;x.lineWidth=2;x.strokeRect(px+1,py+1,U-2,U-2);
    x.fillStyle=`hsla(${hue},90%,70%,.18)`;x.fillRect(px+7,py+7,U-14,U-14);
  }
  function drawSpike(o,hue){
    const px=sx(o.x),py=sy(o.y+1);x.save();x.translate(px,py);if(o.dn){x.translate(0,U);x.scale(1,-1)}
    x.beginPath();x.moveTo(2,U);x.lineTo(U/2,3);x.lineTo(U-2,U);x.closePath();
    x.fillStyle='#0b0b14';x.fill();x.lineWidth=2.5;x.strokeStyle=`hsl(${hue+20},95%,70%)`;x.shadowColor=`hsl(${hue+20},95%,60%)`;x.shadowBlur=8;x.stroke();x.restore();
  }
  function drawSaw(o){
    const px=sx(o.cx),py=sy(o.cy),r=o.r*U+4;x.save();x.translate(px,py);x.rotate(time*9);
    x.fillStyle='#cfd3dc';x.beginPath();for(let i=0;i<16;i++){const a=i/16*6.283,rr=i%2?r*.78:r;x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}x.closePath();x.fill();
    x.fillStyle='#4b5060';x.beginPath();x.arc(0,0,r*.5,0,7);x.fill();x.fillStyle='#e63027';x.beginPath();x.arc(0,0,r*.2,0,7);x.fill();x.restore();
  }
  const PCOL={ship:'#ff5db1',cube:'#38e8ff',flip:'#ffd21f',unflip:'#9be564',fast:'#ff8a3d',slow:'#6aa8ff'};
  function drawPortal(p){
    const px=sx(p.x+.5),py=sy(4),col=PCOL[p.kind];
    x.save();x.translate(px,py);x.strokeStyle=col;x.shadowColor=col;x.shadowBlur=14;x.lineWidth=5;
    x.beginPath();x.ellipse(0,0,13,U*2.2,0,0,7);x.stroke();x.fillStyle=col+'33';x.fill();x.shadowBlur=0;
    x.fillStyle='#fff';x.font='bold 15px Arial';x.textAlign='center';
    x.fillText({ship:'S',cube:'C',flip:'\u21C5',unflip:'\u21C5',fast:'\u00BB',slow:'\u00AB'}[p.kind],0,5);x.restore();
  }
  function drawPlayer(){
    const k=skinOf(),px=sx(S.x)+.4*U,py=sy(S.y)-.4*U;
    x.save();x.translate(px,py);
    if(S.m==1){
      x.rotate(-clampN(S.vy/SM(),-1,1)*.45);
      x.fillStyle=k.b;x.beginPath();x.moveTo(-18,8);x.lineTo(20,-2);x.lineTo(24,8);x.lineTo(14,14);x.lineTo(-18,14);x.closePath();x.fill();
      x.fillStyle='#fff6';x.fillRect(-18,12,36,2);
      x.fillStyle=k.a;x.fillRect(-9,-14,20,20);x.strokeStyle=k.b;x.lineWidth=2;x.strokeRect(-9,-14,20,20);x.fillStyle='#111';x.fillRect(-1,-9,4,6);x.fillRect(5,-9,4,6);
    } else {
      const rot=S.gr?Math.round(S.rot0||0):0;
      const a=S.gr?snapRot:airRot;x.rotate(a);
      x.fillStyle=k.a;x.fillRect(-14.4,-14.4,28.8,28.8);x.strokeStyle=k.b;x.lineWidth=3;x.strokeRect(-14.4,-14.4,28.8,28.8);
      x.fillStyle='#111';x.fillRect(-8,-7,6,8);x.fillRect(3,-7,6,8);x.fillRect(-8,6,17,3);void rot;
    }
    x.restore();
  }
  const SM=()=>7.2;
  let airRot=0,snapRot=0;
  function rotUpdate(dt){
    if(!S||S.m==1)return;
    if(S.gr){const t=Math.round(airRot/1.5708)*1.5708;snapRot=snapRot+(t-snapRot)*Math.min(1,dt*30);airRot=snapRot}
    else{airRot+=S.s*dt*5.6;snapRot=airRot}
  }

  function drawWorld(){
    const lv=L.def,prog=S.x/L.len,hue=lv.hue+prog*50,beat=Math.pow(1-((time*lv.bpm/60)%1),3);
    bg(hue,beat);
    x.save();
    if(shake>0)x.translate((Math.random()-.5)*8*shake*4,(Math.random()-.5)*8*shake*4);
    // ceiling and ground
    x.fillStyle=`hsl(${hue},50%,6%)`;x.fillRect(0,GY,W,H-GY);x.fillRect(0,0,W,GY-8*U);
    x.fillStyle=`hsla(${hue},90%,65%,.15)`;for(let i=-1;i<20;i++){const gx=i*U-(camX*U)%U;x.fillRect(gx,GY,2,H-GY);x.fillRect(gx,0,2,GY-8*U)}
    x.shadowColor=`hsl(${hue},95%,65%)`;x.shadowBlur=10+beat*12;x.fillStyle=`hsl(${hue},95%,${70}%)`;x.fillRect(0,GY-1,W,3);x.fillRect(0,GY-8*U-2,W,3);x.shadowBlur=0;
    // objects
    const x0=camX-2,x1=camX+W/U+2;
    for(const o of L.objs){if(o.x1<x0||o.x0>x1)continue;
      if(o.k=='b'){for(let i=0;i<Math.round(o.x1-o.x0);i++)for(let j=0;j<Math.round(o.y1-o.y0);j++)tile(sx(o.x0+i),sy(o.y0+j+1),hue,j%2?1:0)}
      else if(o.k=='s')drawSpike(o,hue);
      else if(o.k=='w')drawSaw(o);
      else if(o.k=='p'){const px=sx(o.x)+3,py=sy(o.y+(o.dn?1:0));x.fillStyle='#ffe066';x.shadowColor='#ffd21f';x.shadowBlur=12;x.beginPath();
        if(o.dn){x.moveTo(px,py);x.lineTo(px+U-6,py);x.lineTo(px+U-12,py+10);x.lineTo(px+6,py+10)}else{x.moveTo(px,py);x.lineTo(px+U-6,py);x.lineTo(px+U-12,py-10);x.lineTo(px+6,py-10)}x.closePath();x.fill();x.shadowBlur=0}
      else if(o.k=='o'){const px=sx(o.cx),py=sy(o.cy),r=11+Math.sin(time*7+o.id)*1.5,used=S.used.indexOf(o.id)>=0;
        x.strokeStyle=used?'#8a7a30':'#ffe066';x.lineWidth=4;x.shadowColor='#ffd21f';x.shadowBlur=used?0:14;x.beginPath();x.arc(px,py,r,0,7);x.stroke();x.fillStyle='#ffe06655';x.fill();x.shadowBlur=0}
      else if(o.k=='c'){const got=S.cs.indexOf(o.n)>=0||(sv.coins[L.def.id]||[])[o.n];const px=sx(o.cx),py=sy(o.cy),sc=Math.abs(Math.cos(time*3+o.n));
        x.globalAlpha=got?.35:1;x.fillStyle='#ffd21f';x.strokeStyle='#b8860b';x.lineWidth=3;x.shadowColor='#ffd21f';x.shadowBlur=got?0:12;x.beginPath();x.ellipse(px,py,12*Math.max(.25,sc),12,0,0,7);x.fill();x.stroke();x.shadowBlur=0;x.globalAlpha=1}
    }
    for(const p of L.por)if(p.x>x0&&p.x<x1)drawPortal(p);
    // finish wall
    const fx=sx(L.len-8);if(fx<W+40){x.fillStyle=`hsla(${hue},95%,70%,.25)`;x.fillRect(fx,0,W,H);x.fillStyle='#fff';x.font='bold 28px Arial';x.textAlign='center';x.fillText('FINISH',fx+120,GY-120)}
    // practice checkpoints
    if(practice)for(const cp of cps){const px=sx(cp.x+.4);if(px>-20&&px<W+20){x.fillStyle='#4ade80';x.beginPath();x.moveTo(px,GY-14);x.lineTo(px+8,GY-24);x.lineTo(px,GY-34);x.lineTo(px-8,GY-24);x.closePath();x.fill()}}
    // trail, particles, player
    const k=skinOf();
    for(const t of trail){x.globalAlpha=.5*(1-t.t/.35);x.fillStyle=k.a;const s=U*.3*(1-t.t/.35);x.fillRect(sx(t.x)+8,sy(t.y)-s-4,s,s)}x.globalAlpha=1;
    if(!dead)drawPlayer();
    for(const p of parts){x.globalAlpha=clampN(1-p.t/p.l,0,1);x.fillStyle=p.c;const s=p.s*U;x.fillRect(sx(p.x)-s/2,sy(p.y)-s/2,s,s)}x.globalAlpha=1;
    x.restore();
    // HUD
    x.fillStyle='#0008';x.fillRect(W/2-150,10,300,10);x.fillStyle=`hsl(${hue},90%,60%)`;x.fillRect(W/2-150,10,300*prog,10);
    x.strokeStyle='#fff8';x.lineWidth=1;x.strokeRect(W/2-150,10,300,10);
    x.fillStyle='#fff';x.font='bold 13px Arial';x.textAlign='left';x.fillText(pct()+'%',W/2+158,20);
    x.textAlign='right';x.fillText(practice?'PRACTICE':'Attempt '+att,W-10,20);x.textAlign='left';x.fillText(lv.name,10,20);
    for(let i=0;i<3;i++){const got=S.cs.indexOf(i)>=0;x.fillStyle=got?'#ffd21f':'#ffffff33';x.beginPath();x.arc(W-20-i*18,36,6,0,7);x.fill()}
    if(flash>0){x.fillStyle=`rgba(255,255,255,${flash*5})`;x.fillRect(0,0,W,H)}
    if(dead&&!practice&&deadT>.15){x.fillStyle='#fff';x.font='bold 22px Arial';x.textAlign='center';x.fillText(pct()+'%',W/2,150)}
    if(scr=='end')drawEnd();
  }
  function drawEnd(){
    const a=clampN(endT*2,0,1);x.fillStyle=`rgba(0,0,0,${.6*a})`;x.fillRect(0,0,W,H);
    x.globalAlpha=a;x.textAlign='center';x.fillStyle='#ffd21f';x.font='bold 40px Arial';x.fillText('LEVEL COMPLETE!',W/2,120);
    x.fillStyle='#fff';x.font='18px Arial';
    x.fillText(practice?'Practice run. Play for real to save progress.':`Attempts: ${att}   Coins: ${S.cs.length}/3`,W/2,160);
    if(newBest&&!practice)x.fillText(`Stars: ${stars()}  (new cube colors unlock at more stars)`,W/2,190);
    x.font='bold 16px Arial';x.fillStyle='#38e8ff';x.fillText('Press Enter, Space or tap for the menu',W/2,250);x.globalAlpha=1;
  }

  /* ---------- menu ---------- */
  function btn(rx,ry,rw,rh,fn){btns.push({x:rx,y:ry,w:rw,h:rh,fn})}
  function cubeIcon(cx,cy,s,k,locked){x.fillStyle=locked?'#3a3a48':k.a;x.fillRect(cx-s/2,cy-s/2,s,s);x.strokeStyle=locked?'#222':k.b;x.lineWidth=2;x.strokeRect(cx-s/2,cy-s/2,s,s);
    if(!locked){x.fillStyle='#111';x.fillRect(cx-s*.27,cy-s*.2,s*.2,s*.26);x.fillRect(cx+s*.07,cy-s*.2,s*.2,s*.26);x.fillRect(cx-s*.27,cy+s*.2,s*.54,s*.1)}}
  function drawMenu(){
    btns=[];const hue=LV[sel].def.hue;camX=time*6;
    bg(hue,Math.pow(1-((time*2)%1),3));
    x.fillStyle=`hsl(${hue},50%,6%)`;x.fillRect(0,GY,W,H-GY);x.fillStyle=`hsl(${hue},95%,70%)`;x.fillRect(0,GY-1,W,3);
    x.textAlign='center';x.fillStyle='#fff';x.shadowColor=`hsl(${hue},95%,60%)`;x.shadowBlur=18;x.font='bold 44px Arial';x.fillText('CUBE DASH',W/2,56);x.shadowBlur=0;
    const cw=186,gap=14,x0=(W-(cw*3+gap*2))/2;
    LV.forEach((lv,i)=>{
      const d=lv.def,cx=x0+i*(cw+gap),cy=74,ch=150,on=i==sel;
      x.fillStyle=on?`hsla(${d.hue},60%,25%,.95)`:'#0009';x.fillRect(cx,cy,cw,ch);x.strokeStyle=on?`hsl(${d.hue},95%,65%)`:'#fff3';x.lineWidth=on?3:1;x.strokeRect(cx,cy,cw,ch);
      x.fillStyle='#fff';x.font='bold 19px Arial';x.fillText(d.name,cx+cw/2,cy+30);
      x.fillStyle='#ffd21f';x.font='16px Arial';x.fillText('\u2605'.repeat(d.diff)+'\u2606'.repeat(5-d.diff),cx+cw/2,cy+54);
      const b=sv.best[d.id]||0;x.fillStyle='#0008';x.fillRect(cx+16,cy+70,cw-32,12);x.fillStyle=`hsl(${d.hue},90%,60%)`;x.fillRect(cx+16,cy+70,(cw-32)*b/100,12);
      x.fillStyle='#fff';x.font='13px Arial';x.fillText(sv.done[d.id]?'Complete!':'Best '+b+'%',cx+cw/2,cy+104);
      const cc=sv.coins[d.id]||[];for(let k=0;k<3;k++){x.fillStyle=cc[k]?'#ffd21f':'#ffffff33';x.beginPath();x.arc(cx+cw/2-20+k*20,cy+126,7,0,7);x.fill()}
      btn(cx,cy,cw,ch,()=>{if(sel==i)start(i);else{sel=i;sfx('click')}});
    });
    // skins
    x.fillStyle='#fff';x.font='bold 13px Arial';x.fillText(`Cube color: ${SK[skinI].n}   (Stars: ${stars()})`,W/2,254);
    SK.forEach((k,i)=>{const cx=W/2-(SK.length-1)*22+i*44,cy=282,lock=k.need>stars();
      if(i==skinI){x.strokeStyle='#fff';x.lineWidth=3;x.strokeRect(cx-17,cy-17,34,34)}
      cubeIcon(cx,cy,26,k.rb?skinOf():k,lock);
      if(lock){x.fillStyle='#fff';x.font='bold 10px Arial';x.fillText('\u2605'+k.need,cx,cy+4)}
      btn(cx-20,cy-20,40,40,()=>{if(!lock){skinI=i;sv.skin=i;save();sfx('click')}});
    });
    x.fillStyle=practice?'#4ade80':'#ffffff22';x.fillRect(W/2-160,314,150,30);x.strokeStyle='#fff6';x.lineWidth=1;x.strokeRect(W/2-160,314,150,30);
    x.fillStyle='#fff';x.font='bold 13px Arial';x.fillText('Practice: '+(practice?'ON':'OFF')+' (P)',W/2-85,334);btn(W/2-160,314,150,30,()=>{practice=!practice;sfx('click')});
    x.fillStyle='#38e8ff';x.fillRect(W/2+10,314,150,30);x.fillStyle='#04121a';x.fillText('PLAY (Space)',W/2+85,334);btn(W/2+10,314,150,30,()=>start(sel));
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
