// Step 11 action games: Slope Run (3D-ish rolling ball), Pixel Hopper (platformer, 8 levels plus Endless mode), Candy Snip (cut the ropes physics puzzle).
// The physics cores (HopCore, CandyCore) are separate from drawing so they can be tested headless.

/* ============================ Candy Snip core ============================ */
const CandyCore=(()=>{
  const W=640,H=360,GR=900,SEG=12;
  function make(lv){
    const w={t:0,ropes:[],candy:{x:lv.c.x,y:lv.c.y,px:lv.c.x,py:lv.c.y,w:.35},got:[false,false,false],won:false,lost:false,lv,cut:[]};
    lv.a.forEach((a,ri)=>{
      const n=Math.max(3,Math.round(a.len/SEG)),nodes=[];
      for(let i=0;i<=n;i++){const f=i/n;const x=a.x+(lv.c.x-a.x)*f,y=a.y+(lv.c.y-a.y)*f;nodes.push({x,y,px:x,py:y})}
      w.ropes.push({ax:a.x,ay:a.y,n,seg:a.len/n,nodes,alive:true,id:ri});
    });
    return w;
  }
  function step(w,dt){
    if(w.won||w.lost)return;
    w.t+=dt;const c=w.candy;
    let vx=(c.x-c.px)*.9995,vy=(c.y-c.py)*.9995;c.px=c.x;c.py=c.y;c.x+=vx;c.y+=vy+GR*dt*dt;
    for(const r of w.ropes){if(!r.alive)continue;
      for(let i=1;i<r.n;i++){const p=r.nodes[i];const ux=(p.x-p.px)*.998,uy=(p.y-p.py)*.998;p.px=p.x;p.py=p.y;p.x+=ux;p.y+=uy+GR*dt*dt}
    }
    for(let it=0;it<14;it++){
      for(const r of w.ropes){if(!r.alive)continue;
        const nd=r.nodes;nd[0].x=r.ax;nd[0].y=r.ay;
        for(let i=0;i<r.n;i++){
          const a=nd[i],b=i+1==r.n?c:nd[i+1];
          const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1e-6;
          if(d<=r.seg)continue;
          const diff=(d-r.seg)/d;
          const wa=i==0?0:1,wb=i+1==r.n?c.w:1,ws=wa+wb;if(!ws)continue;
          a.x+=dx*diff*wa/ws;a.y+=dy*diff*wa/ws;b.x-=dx*diff*wb/ws;b.y-=dy*diff*wb/ws;
        }
      }
    }
    const L=w.lv;
    L.s.forEach((s,i)=>{if(!w.got[i]&&Math.hypot(c.x-s.x,c.y-s.y)<26)w.got[i]=true});
    if(Math.hypot(c.x-L.m.x,c.y-L.m.y)<34){w.won=true;return}
    if(c.y>H+40||c.x<-60||c.x>W+60)w.lost=true;
  }
  function slice(w,x0,y0,x1,y1){
    let n=0;
    const inter=(ax,ay,bx,by,cx,cy,dx,dy)=>{const d=(bx-ax)*(dy-cy)-(by-ay)*(dx-cx);if(!d)return false;const t=((cx-ax)*(dy-cy)-(cy-ay)*(dx-cx))/d,u=((cx-ax)*(by-ay)-(cy-ay)*(bx-ax))/d;return t>=0&&t<=1&&u>=0&&u<=1};
    for(const r of w.ropes){if(!r.alive)continue;
      for(let i=0;i<r.n;i++){const a=r.nodes[i],b=i+1==r.n?w.candy:r.nodes[i+1];
        if(inter(x0,y0,x1,y1,a.x,a.y,b.x,b.y)){r.alive=false;w.cut.push({id:r.id,t:w.t,nodes:r.nodes.map(p=>({x:p.x,y:p.y})),i});n++;break}}}
    return n;
  }
  function run(lv,plan,maxT=9,dt=1/120){
    const w=make(lv);let k=0;const trail=[];
    while(!w.won&&!w.lost&&w.t<maxT){
      plan.forEach((t,i)=>{if(t!=null&&w.ropes[i].alive&&w.t>=t){w.ropes[i].alive=false}});
      step(w,dt);if(k++%6==0)trail.push([w.candy.x,w.candy.y,w.t]);
    }
    return{w,trail};
  }
  // Copy of a world so we can ask "what if I cut this rope right now?" without touching the real game.
  function clone(w){return{t:w.t,candy:Object.assign({},w.candy),got:w.got.slice(),won:false,lost:false,lv:w.lv,cut:[],ropes:w.ropes.map(r=>({ax:r.ax,ay:r.ay,n:r.n,seg:r.seg,alive:r.alive,id:r.id,nodes:r.nodes.map(p=>Object.assign({},p))}))}}
  function cutWins(w,ri,secs=3){const s=clone(w);s.ropes[ri].alive=false;for(let i=0,n=Math.round(secs*240);i<n&&!s.won&&!s.lost;i++)step(s,1/240);return s.won}
  return{make,step,slice,run,clone,cutWins,W,H};
})();
if(typeof module!='undefined'){module.exports={CandyCore}}

/* ============================ Pixel Hopper core ============================ */
const HopCore=(()=>{
  const GRAV=65,JV=21.5,RUN=7,ACC=60,PW=.7,PH=.9,SPR=34;
  function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const ROWS=12;
  function build(def){
    const R=rng(def.seed),cols=[],coins=[],en=[],springs=[];let x=0,base=3,tight=def.tight||0;
    const col=(h,ex)=>{const c=Array(ROWS).fill(' ');for(let i=0;i<h;i++)c[ROWS-1-i]='#';if(ex&&ex.spike)c[ROWS-1-h]='s';cols.push(c);x++};
    const flat=n=>{n=Math.max(1,n-tight);for(let i=0;i<n;i++)col(base)};
    const gap=n=>{for(let i=0;i<n;i++)cols.push(Array(ROWS).fill(' ')),x++};
    const coin=(cx,h)=>coins.push({x:cx+.5,y:ROWS-h-.5});
    const plat=(px,h,w)=>{while(cols.length<px+w)cols.push(Array(ROWS).fill(' '));for(let i=0;i<w;i++)cols[px+i][ROWS-1-h]='#';x=Math.max(x,px+w)};
    const P={
      hop:()=>{flat(3);col(base,{spike:1});flat(3);coin(x-4,base+2)},
      spikes2:()=>{flat(2);col(base,{spike:1});col(base,{spike:1});flat(3);coin(x-4,base+2)},
      gap2:()=>{flat(2);coin(x+.5|0,base+2.4);gap(2);flat(2)},
      gap3:()=>{flat(2);coin(x+1,base+3);gap(3);flat(3)},
      gap4:()=>{flat(3);coin(x+1.5,base+3.2);gap(4);flat(3)},
      step:()=>{flat(2);base=Math.min(6,base+1);flat(3);coin(x-2,base+1)},
      drop:()=>{flat(2);base=Math.max(2,base-1);flat(3);coin(x-2,base+1)},
      wall:()=>{flat(2);const h=Math.min(8,base+3);col(h);col(h);flat(2);coin(x-4,h+1)},
      stairs:()=>{flat(2);for(let i=0;i<3;i++){base=Math.min(7,base+1);flat(2)}coin(x-2,base+1)},
      pits:()=>{flat(2);gap(2);const n=2+R()*2|0;for(let i=0;i<n;i++){flat(2);gap(2)}flat(3);coin(x-6,base+2)},
      float:()=>{flat(2);const gx=x;gap(11);plat(gx+1,base+1,3);plat(gx+5,base+2,3);plat(gx+9,base+1,3);coin(gx+6,base+4);x=gx+11;flat(3)},
      spring:()=>{flat(2);springs.push({x:x,h:base});col(base);const h=Math.min(9,base+5);gap(2);for(let i=0;i<3;i++)col(h);base=h;coin(x-5,h+1);flat(2)},
      enemy:()=>{flat(3);const ex=x+4;flat(10);en.push({x:ex,y:ROWS-base,r:3.2,sp:1.2+R()*.8,ph:R()*6.28,id:en.length%30});flat(3);coin(ex,base+1.5)},
      spikes3:()=>{flat(2);for(let i=0;i<3;i++)col(base,{spike:1});flat(3);coin(x-5,base+2.5)},
      gapspike:()=>{flat(3);gap(2);flat(2);col(base,{spike:1});flat(3);coin(x-6,base+3)},
      tfloat:()=>{flat(2);const gx=x;gap(13);plat(gx+1,base+1,2);plat(gx+5,base+2,2);plat(gx+9,base+1,2);coin(gx+6,base+4);x=gx+13;flat(3)},
      enemygap:()=>{flat(3);const ex=x+3;flat(9);en.push({x:ex,y:ROWS-base,r:2.4,sp:1.5,ph:R()*6.28,id:en.length%30});gap(2);flat(3);coin(ex,base+1.5)},
      enemy2:()=>{flat(3);const ex=x+3;flat(14);en.push({x:ex,y:ROWS-base,r:2.6,sp:1.6,ph:R()*6.28,id:en.length%30});en.push({x:ex+7,y:ROWS-base,r:2.6,sp:1.9,ph:R()*6.28,id:en.length%30});flat(3)}
    };
    const gen=(n,pool)=>{for(let i=0;i<n;i++)P[pool[Math.floor(R()*pool.length)]]()};
    flat(8);
    for(const sec of def.secs)gen(sec.n,sec.p);
    if(def.endless){const E={w:cols.length,cols,coins,en,springs,goal:{x:1e9,y:ROWS-base},len:1e9,def};E.ext=(n,pool,t)=>{tight=t||0;gen(n,pool);E.w=cols.length};return E}
    flat(6);const goalX=x;flat(8);
    return{w:cols.length,cols,coins,en,springs,goal:{x:goalX+.5,y:ROWS-base},len:goalX,def}
  }
  const sol=(L,tx,ty)=>{const cx=Math.floor(tx),cy=Math.floor(ty);if(cx<0||cx>=L.w)return cx<0;if(cy<0)return false;if(cy>=ROWS)return false;return L.cols[cx][cy]=='#'};
  const spk=(L,tx,ty)=>{const cx=Math.floor(tx),cy=Math.floor(ty);return cx>=0&&cx<L.w&&cy>=0&&cy<ROWS&&L.cols[cx][cy]=='s'};
  function init(L){return{x:3,y:ROWS-3-PH,vx:0,vy:0,on:false,co:0,jb:0,jh:0,t:0,dead:0,done:0,killed:0,face:1}}
  function clone(S){return Object.assign({},S)}
  const enPos=(e,t)=>e.x+Math.sin(t*e.sp+e.ph)*e.r;
  function step(S,L,dir,jump,dt){
    S.t+=dt;
    if(jump&&!S.jh)S.jb=.12;else S.jb=Math.max(0,S.jb-dt);S.jh=jump?1:0;
    S.co=S.on?.08:Math.max(0,S.co-dt);
    const tv=dir*RUN;S.vx+=Math.max(-ACC*dt,Math.min(ACC*dt,tv-S.vx));if(dir)S.face=dir;
    if(S.jb>0&&S.co>0){S.vy=-JV;S.jb=0;S.co=0;S.on=false;S.jmp=S.t}
    if(!jump&&S.vy<-7)S.vy=-7;
    S.vy=Math.min(26,S.vy+GRAV*dt);
    S.x+=S.vx*dt;
    const hitX=()=>{for(let ty=Math.floor(S.y+.05);ty<=Math.floor(S.y+PH-.05);ty++){if(sol(L,S.x-PW/2,ty+.5)||sol(L,S.x+PW/2,ty+.5))return true}return false};
    if(S.x-PW/2<0){S.x=PW/2;S.vx=0}
    if(hitX()){if(S.vx>0)S.x=Math.floor(S.x+PW/2)-PW/2-.001;else if(S.vx<0)S.x=Math.floor(S.x-PW/2)+1+PW/2+.001;S.vx=0}
    S.y+=S.vy*dt;S.on=false;
    const l=S.x-PW/2+.01,r=S.x+PW/2-.01;
    if(S.vy>=0){const fy=S.y+PH;if(sol(L,l,fy)||sol(L,r,fy)){S.y=Math.floor(fy)-PH-.0005;S.vy=0;S.on=true}}
    else{const ty=S.y;if(sol(L,l,ty)||sol(L,r,ty)){S.y=Math.floor(ty)+1+.0005;S.vy=0}}
    for(const sp of L.springs){if(S.vy>=0&&Math.abs(S.x-(sp.x+.5))<.65&&Math.abs(S.y+PH-(ROWS-sp.h))<.25){S.vy=-SPR;S.on=false}}
    const cx0=Math.floor(S.x-PW/2),cx1=Math.floor(S.x+PW/2);
    for(let cx=cx0;cx<=cx1;cx++)for(let cy=Math.floor(S.y);cy<=Math.floor(S.y+PH-.01);cy++){if(spk(L,cx+.5,cy+.5)){const sx=cx+.5,sy=cy+1;if(Math.abs(S.x-sx)<.45+PW/2-.25&&S.y+PH>sy-.45){S.dead=1;return 1}}}
    if(S.y>ROWS+2){S.dead=1;return 1}
    for(const e of L.en){if(S.killed>>e.id&1){if(S.x-e.x>26)S.killed&=~(1<<e.id);continue}const ex=enPos(e,S.t),ey=e.y;
      if(Math.abs(S.x-ex)<(PW+.8)/2-.05&&S.y+PH>ey-.8&&S.y<ey){
        if(S.vy>0&&S.y+PH<ey-.3+S.vy*dt+.3){S.killed|=1<<e.id;S.vy=-14;S.on=false;S.stomp=S.t}else{S.dead=1;return 1}}}
    if(S.x>=L.goal.x){S.done=1;return 2}
    return 0;
  }
  function solve(L,hz=15,cap=500){
    const sub=Math.round(120/hz),dt=1/120;let layer=[init(L)],tick=0,maxX=0;
    const acts=[[-1,0],[0,0],[1,0],[1,1],[0,1],[-1,1]];
    const maxTick=Math.ceil(L.len/RUN*hz*1.7)+60;
    while(layer.length&&tick<maxTick){
      const nxt=new Map();
      for(const S of layer)for(const[d,j]of acts){
        const T=clone(S);let r=0;for(let i=0;i<sub&&!r;i++)r=step(T,L,d,j,dt);
        if(r==2)return{ok:true,ticks:tick};if(r==1)continue;
        if(T.x>maxX)maxX=T.x;
        const k=Math.round(T.x*5)+'|'+Math.round(T.y*5)+'|'+Math.round(T.vx)+'|'+Math.round(T.vy/2)+'|'+(T.on?1:0)+'|'+T.killed+'|'+(T.jb>0?1:0)+'|'+T.jh;
        if(!nxt.has(k))nxt.set(k,T)}
      layer=[...nxt.values()];
      if(layer.length>cap){layer.sort((a,b)=>b.x-a.x);const keep=layer.slice(0,Math.floor(cap/2)),rest=layer.slice(Math.floor(cap/2));for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]]}layer=keep.concat(rest.slice(0,cap-keep.length))}
      tick++;
    }
    return{ok:false,maxX,len:L.len}
  }
  const LEVELS=[
    {name:'Green Hills',seed:3,secs:[{n:16,p:['hop','gap2','step','drop','spikes2','gap3']}]},
    {name:'Slime Valley',seed:11,secs:[{n:20,p:['hop','gap2','enemy','enemy2','step','drop','spikes2','gap3','spikes3']}]},
    {name:'Rocky Climb',seed:23,secs:[{n:22,p:['stairs','wall','gap3','spikes3','enemy','drop','pits','gapspike','enemygap']}]},
    {name:'Sky Bridges',seed:31,secs:[{n:22,p:['float','tfloat','gap3','spring','enemy','pits','wall','gapspike']}]},
    {name:'Spike Canyon',seed:47,tight:1,secs:[{n:24,p:['spikes3','gap4','pits','enemy2','wall','float','stairs','gapspike','enemygap']}]},
    {name:'Final Run',seed:59,tight:1,secs:[{n:28,p:['gap4','float','tfloat','enemy2','spikes3','spring','pits','wall','stairs','gapspike','enemygap']}]},
    {name:'Lava Gauntlet',seed:71,tight:1,secs:[{n:32,p:['gap4','tfloat','enemy2','spikes3','pits','wall','gapspike','enemygap','stairs','spring']}]},
    {name:'Hopper Hell',seed:83,tight:1,secs:[{n:38,p:['gap4','tfloat','enemy2','spikes3','pits','wall','gapspike','enemygap','float','stairs']}]}
  ];
  // Endless mode: the course is built as you run, and the pools get harder every 200 tiles.
  const POOLS=[
    ['hop','gap2','step','drop','spikes2'],
    ['hop','gap2','step','drop','spikes2','enemy','gap3'],
    ['stairs','wall','gap3','spikes3','enemy','drop','pits','gapspike'],
    ['float','spring','enemygap','enemy','gap3','spikes3','wall','pits','stairs'],
    ['spikes3','gap4','pits','enemy2','wall','float','tfloat','gapspike','enemygap','stairs'],
    ['gap4','tfloat','enemy2','spikes3','pits','wall','gapspike','enemygap','spring','stairs']
  ];
  return{build,init,clone,step,solve,enPos,LEVELS,POOLS,ROWS,PW,PH};
})();
if(typeof module!='undefined'){module.exports.HopCore=HopCore}

const CANDY_LEVELS=[{"a":[{"x":355,"y":73,"len":185}],"c":{"x":243,"y":180},"m":{"x":486,"y":256},"s":[{"x":243,"y":215},{"x":316,"y":254},{"x":405,"y":250}],"g":[0.9]},{"a":[{"x":201,"y":41,"len":278}],"c":{"x":354,"y":189},"m":{"x":87,"y":299},"s":[{"x":354,"y":224},{"x":313,"y":290},{"x":184,"y":312}],"g":[1]},{"a":[{"x":160,"y":50,"len":204}],"c":{"x":300,"y":190},"m":{"x":47,"y":300},"s":[{"x":271,"y":219},{"x":84,"y":237},{"x":34,"y":212}],"g":[1.3]},{"a":[{"x":120,"y":50,"len":216},{"x":420,"y":50,"len":234}],"c":{"x":260,"y":200},"m":{"x":579,"y":300},"s":[{"x":260,"y":189},{"x":262,"y":214},{"x":502,"y":267}],"g":[0,0.9]},{"a":[{"x":323,"y":67,"len":178},{"x":487,"y":77,"len":135}],"c":{"x":454,"y":153},"m":{"x":233,"y":260},"s":[{"x":397,"y":179},{"x":372,"y":230},{"x":295,"y":218}],"g":[0.7,0]},{"a":[{"x":281,"y":59,"len":196},{"x":531,"y":67,"len":198}],"c":{"x":395,"y":202},"m":{"x":160,"y":258},"s":[{"x":399,"y":215},{"x":348,"y":240},{"x":246,"y":250}],"g":[0.9,0]},{"a":[{"x":90,"y":60,"len":235},{"x":400,"y":40,"len":267}],"c":{"x":240,"y":230},"m":{"x":64,"y":300},"s":[{"x":233,"y":205},{"x":72,"y":282},{"x":-28,"y":263}],"g":[0.7,0]},{"a":[{"x":452,"y":49,"len":364},{"x":349,"y":48,"len":227}],"c":{"x":173,"y":183},"m":{"x":510,"y":260},"s":[{"x":256,"y":252},{"x":345,"y":275},{"x":424,"y":258}],"g":[0,0.9]},{"a":[{"x":256,"y":42,"len":226},{"x":91,"y":31,"len":392}],"c":{"x":410,"y":201},"m":{"x":102,"y":258},"s":[{"x":353,"y":243},{"x":263,"y":268},{"x":183,"y":253}],"g":[0.9,0]},{"a":[{"x":320,"y":40,"len":201},{"x":130,"y":80,"len":256},{"x":520,"y":80,"len":255}],"c":{"x":330,"y":230},"m":{"x":166,"y":300},"s":[{"x":330,"y":242},{"x":269,"y":228},{"x":200,"y":232}],"g":[0.4,0.9,0.1]},{"a":[{"x":157,"y":78,"len":169},{"x":405,"y":89,"len":254},{"x":438,"y":37,"len":298}],"c":{"x":214,"y":193},"m":{"x":448,"y":296},"s":[{"x":295,"y":185},{"x":366,"y":314},{"x":537,"y":299}],"g":[0.7,1.6,0.2]},{"a":[{"x":296,"y":31,"len":167},{"x":533,"y":82,"len":332},{"x":477,"y":53,"len":267}],"c":{"x":260,"y":154},"m":{"x":95,"y":256},"s":[{"x":410,"y":153},{"x":360,"y":185},{"x":177,"y":173}],"g":[1.9,0.8,1]},{"a":[{"x":100,"y":50,"len":309},{"x":300,"y":40,"len":209},{"x":570,"y":60,"len":324}],"c":{"x":330,"y":240},"m":{"x":124,"y":300},"s":[{"x":332,"y":247},{"x":401,"y":221},{"x":239,"y":239}],"g":[0.8,0.7,0]},{"a":[{"x":290,"y":47,"len":208},{"x":324,"y":53,"len":177},{"x":189,"y":50,"len":310}],"c":{"x":407,"y":186},"m":{"x":215,"y":297},"s":[{"x":217,"y":191},{"x":261,"y":218},{"x":301,"y":280}],"g":[0.6,0.9,0.4]},{"a":[{"x":405,"y":78,"len":177},{"x":148,"y":33,"len":240},{"x":206,"y":38,"len":239}],"c":{"x":326,"y":169},"m":{"x":515,"y":256},"s":[{"x":269,"y":185},{"x":309,"y":222},{"x":424,"y":252}],"g":[2,1.2,0.2]},{"a":[{"x":170,"y":40,"len":255},{"x":460,"y":40,"len":315},{"x":320,"y":30,"len":249}],"c":{"x":250,"y":260},"m":{"x":480,"y":300},"s":[{"x":256,"y":271},{"x":325,"y":279},{"x":428,"y":257}],"g":[0.9,1.7,0.7]},{"a":[{"x":97,"y":52,"len":433},{"x":93,"y":31,"len":426},{"x":326,"y":56,"len":246}],"c":{"x":467,"y":191},"m":{"x":121,"y":261},"s":[{"x":402,"y":289},{"x":304,"y":298},{"x":214,"y":274}],"g":[0.5,1.2,1]},{"a":[{"x":551,"y":81,"len":249},{"x":310,"y":67,"len":160},{"x":271,"y":48,"len":182}],"c":{"x":339,"y":158},"m":{"x":150,"y":260},"s":[{"x":382,"y":192},{"x":313,"y":223},{"x":209,"y":217}],"g":[0.5,0.6,1.8]}];

/* ============================ shared helpers ============================ */
function cvs(el,W,H){const DPR=Math.min(2,window.devicePixelRatio||1),c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');c.style.cssText=`width:min(${W}px,100%,calc(72vh*${(W/H).toFixed(4)}));height:auto;max-height:none;touch-action:none`;x.scale(DPR,DPR);el.append(c);return[c,x]}
const sfxp=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
const saveGet=(k,d)=>{try{return Object.assign(d,JSON.parse(localStorage.getItem(k)))}catch(e){return d}};
const savePut=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

/* ============================ Pixel Hopper ============================ */
function hopper(el){
  const H=HopCore,W=640,HH=360,T=30,RW=H.ROWS;
  const [c,x]=cvs(el,W,HH);
  const sv=saveGet('hop-save',{done:{},coins:{}});
  const LV=H.LEVELS.map(d=>({d,L:H.build(d)}));
  let li=0,endless=0,score=0,bestE=0,L,S,keys={l:0,r:0,j:0},cam=0,got,time=0,dead=0,deadT=0,win=0,parts=[],raf,last=0,acc=0,ptr={};
  const touch='ontouchstart' in window;
  const lb=zbar(el,[...LV.map((l,i)=>[String(i+1)+' '+l.d.name,()=>{if(i==0||sv.done[i-1])start(i);else st('Finish the previous level first.')}]),['\u221E Endless',()=>startEndless()]]);
  const lock=()=>lb.forEach((b,i)=>{b.classList.toggle('on',endless?i==LV.length:i==li);b.style.opacity=(i==0||i==LV.length||sv.done[i-1])?1:.45});
  function start(i){endless=0;li=i;L=LV[i].L;S=H.init(L);cam=0;got=new Set();dead=0;win=0;parts=[];lock();msg()}
  try{bestE=+(localStorage.getItem('best-hopper-endless')||0)}catch(e){}
  function startEndless(){endless=1;score=0;L=H.build({seed:Math.random()*1e9|0,endless:1,secs:[{n:6,p:H.POOLS[0]}]});S=H.init(L);cam=0;got=new Set();dead=0;win=0;parts=[];lock();msg()}
  const msg=()=>endless?st(`Endless: ${score} points   Best ${bestE}   Coins ${got.size}`):st(`Level ${li+1}: ${LV[li].d.name}   Coins ${got.size}/${L.coins.length}`);
  function die(){dead=1;deadT=0;sfxp('crash');for(let i=0;i<14;i++)parts.push({x:S.x,y:S.y+.45,vx:(Math.random()-.5)*9,vy:-Math.random()*10,t:0,l:.8,c:'#ff5d5d'})}
  function update(dt){
    time+=dt;parts.forEach(p=>{p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt});parts=parts.filter(p=>p.t<p.l);
    if(dead){deadT+=dt;if(!endless&&deadT>.7)start(li);return}
    if(win)return;
    const dir=(keys.r?1:0)-(keys.l?1:0),pj=S.jmp,pst=S.stomp;
    if(endless)while(L.w-S.x<70){const g=Math.min(5,Math.floor((S.x-3)/200));L.ext(5,H.POOLS[g],g>=4?1:0)}
    const r=H.step(S,L,dir,!!keys.j,dt);
    if(endless){const sc=Math.max(0,Math.floor(S.x-3))+got.size*5;if(sc!=score){score=sc;if(score%5==0)msg()}}
    if(S.jmp!=pj)sfxp('hop');
    if(S.stomp!=pst)sfxp('splat');
    L.coins.forEach((q,i)=>{if(!got.has(i)&&Math.hypot(S.x-q.x,S.y+.45-q.y)<.7){got.add(i);sfxp('coin');if(endless)score+=5;msg()}});
    if(r==1){if(endless){bestE=best('hopper-endless',score);st(`Game over. ${score} points. Best ${bestE}. Press Enter or tap to try again.`)}die();return}
    if(r==2){win=1;sfxp('win');sv.done[li]=1;sv.coins[li]=Math.max(sv.coins[li]||0,got.size);savePut('hop-save',sv);lock();
      st(`Level complete! Coins ${got.size}/${L.coins.length}. ${li<LV.length-1?'Press Enter for the next level.':'You beat them all!'}`)}
  }
  function bgDraw(){
    const g=x.createLinearGradient(0,0,0,HH);g.addColorStop(0,'#5ec8ff');g.addColorStop(1,'#cdeeff');x.fillStyle=g;x.fillRect(0,0,W,HH);
    x.fillStyle='#fff';for(let i=0;i<6;i++){const cx=((i*230-cam*T*.2)%(W+260)+W+260)%(W+260)-130,cy=40+i*28%110;x.beginPath();x.arc(cx,cy,24,0,7);x.arc(cx+26,cy+4,20,0,7);x.arc(cx-24,cy+6,18,0,7);x.fill()}
    x.fillStyle='#8fd9a0';for(let i=0;i<5;i++){const cx=((i*300-cam*T*.35)%(W+400)+W+400)%(W+400)-200;x.beginPath();x.arc(cx,HH-60,170,Math.PI,0);x.fill()}
    x.fillStyle='#6cc47e';for(let i=0;i<5;i++){const cx=((i*260+100-cam*T*.55)%(W+400)+W+400)%(W+400)-200;x.beginPath();x.arc(cx,HH-30,120,Math.PI,0);x.fill()}
  }
  function draw(){
    cam+=(Math.max(0,S.x-5.5)-cam)*.2;bgDraw();
    const c0=Math.max(0,Math.floor(cam)),c1=Math.min(L.w-1,Math.ceil(cam+W/T)+1);
    for(let cx=c0;cx<=c1;cx++){const col=L.cols[cx];for(let cy=0;cy<RW;cy++){const k=col[cy],px=(cx-cam)*T,py=cy*T;
      if(k=='#'){const top=cy==0||col[cy-1]!='#';x.fillStyle='#8a5a33';x.fillRect(px,py,T+1,T+1);x.fillStyle='#744a28';x.fillRect(px+4,py+T-9,8,5);x.fillRect(px+18,py+9,7,5);if(top){x.fillStyle='#4caf50';x.fillRect(px,py,T+1,9);x.fillStyle='#7bd46d';x.fillRect(px,py,T+1,4)}}
      else if(k=='s'){x.fillStyle='#e8e8f0';x.strokeStyle='#555';x.lineWidth=1.5;for(let i=0;i<2;i++){x.beginPath();x.moveTo(px+i*15+1,py+T);x.lineTo(px+i*15+8,py+8);x.lineTo(px+i*15+15,py+T);x.closePath();x.fill();x.stroke()}}}}
    for(const sp of L.springs){const px=(sp.x-cam)*T,py=(RW-sp.h)*T;x.fillStyle='#e63946';x.fillRect(px+3,py-8,T-6,8);x.fillStyle='#ccc';x.fillRect(px+8,py-12,T-16,4)}
    const gx=(L.goal.x-cam)*T,gy=L.goal.y*T;x.fillStyle='#ddd';x.fillRect(gx-2,gy-100,4,100);x.fillStyle='#ffd21f';x.beginPath();x.moveTo(gx+2,gy-100);x.lineTo(gx+44,gy-86+Math.sin(time*5)*3);x.lineTo(gx+2,gy-72);x.fill();
    L.coins.forEach((q,i)=>{if(got.has(i))return;const px=(q.x-cam)*T,py=q.y*T,sc=Math.abs(Math.cos(time*3+i));x.fillStyle='#ffd21f';x.strokeStyle='#b8860b';x.lineWidth=2;x.beginPath();x.ellipse(px,py,9*Math.max(.25,sc),9,0,0,7);x.fill();x.stroke()});
    for(const e of L.en){if(S.killed>>e.id&1)continue;const ex=(H.enPos(e,S.t)-cam)*T,ey=e.y*T,bob=Math.abs(Math.sin(time*6+e.id))*3;
      x.fillStyle='#a855f7';x.beginPath();x.ellipse(ex,ey-12+bob*.2,16,14-bob,0,Math.PI,0);x.rect(ex-16,ey-12,32,12);x.fill();x.fillStyle='#fff';x.fillRect(ex-9,ey-20,6,7);x.fillRect(ex+3,ey-20,6,7);x.fillStyle='#111';x.fillRect(ex-7,ey-18,3,4);x.fillRect(ex+5,ey-18,3,4)}
    if(!dead){const px=(S.x-cam)*T,py=S.y*T,sq=Math.max(-.2,Math.min(.25,S.vy/90));x.save();x.translate(px,py+H.PH*T);x.scale(1-sq*.6,1+sq);
      x.fillStyle='#ff7849';x.fillRect(-11,-H.PH*T,22,H.PH*T-3);x.strokeStyle='#b84a1d';x.lineWidth=2;x.strokeRect(-11,-H.PH*T,22,H.PH*T-3);
      x.fillStyle='#fff';x.fillRect(S.face>0?-1:-8,-H.PH*T+6,8,8);x.fillStyle='#111';x.fillRect(S.face>0?3:-6,-H.PH*T+8,3,5);
      const f=S.on&&Math.abs(S.vx)>.5?Math.sin(time*18)*3:0;x.fillStyle='#b84a1d';x.fillRect(-9+f,-3,7,3);x.fillRect(3-f,-3,7,3);x.restore()}
    for(const p of parts){x.globalAlpha=1-p.t/p.l;x.fillStyle=p.c;x.fillRect((p.x-cam)*T,p.y*T,6,6)}x.globalAlpha=1;
    if(endless){x.fillStyle='#fff';x.strokeStyle='#0008';x.lineWidth=4;x.font='bold 20px Arial';x.textAlign='left';x.strokeText(score+' pts',12,26);x.fillText(score+' pts',12,26);x.font='13px Arial';x.textAlign='right';x.strokeText('Best '+bestE,W-12,22);x.fillText('Best '+bestE,W-12,22);
      if(dead&&deadT>.3){x.fillStyle='#0008';x.fillRect(0,0,W,HH);x.fillStyle='#ff6b6b';x.font='bold 40px Arial';x.textAlign='center';x.fillText('GAME OVER',W/2,150);x.fillStyle='#fff';x.font='18px Arial';x.fillText(`${score} points   Best ${bestE}`,W/2,186);x.fillText('Press Enter or tap to try again',W/2,216)}}
    else{x.fillStyle='#0006';x.fillRect(W/2-100,8,200,8);x.fillStyle='#ffd21f';x.fillRect(W/2-100,8,200*Math.min(1,S.x/L.len),8)}
    if(touch){x.globalAlpha=.35;x.fillStyle='#000';for(const bx of[10,84,W-84]){x.beginPath();x.arc(bx+32,HH-44,34,0,7);x.fill()}x.globalAlpha=.9;x.fillStyle='#fff';x.font='28px Arial';x.textAlign='center';x.fillText('\u25C0',42,HH-34);x.fillText('\u25B6',116,HH-34);x.fillText('\u25B2',W-52,HH-34);x.globalAlpha=1}
    if(win){x.fillStyle='#0008';x.fillRect(0,0,W,HH);x.fillStyle='#ffd21f';x.font='bold 40px Arial';x.textAlign='center';x.fillText('LEVEL COMPLETE!',W/2,150);x.fillStyle='#fff';x.font='18px Arial';x.fillText(`Coins ${got.size}/${L.coins.length}   ${li<LV.length-1?'Press Enter or tap for the next level':'All levels cleared!'}`,W/2,190)}
  }
  const kd={ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r',ArrowUp:'j',w:'j',W:'j',' ':'j'};
  on(document,'keydown',e=>{const k=kd[e.key];if(k){e.preventDefault();keys[k]=1}if(e.key=='Enter'){if(win&&li<LV.length-1)start(li+1);else if(endless&&dead&&deadT>.4)startEndless()}if(endless&&dead&&deadT>.4&&(k=='j'))startEndless()});
  on(document,'keyup',e=>{const k=kd[e.key];if(k)keys[k]=0});
  const zone=e=>{const r=c.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*HH;return px<75?'l':px<160?'r':px>W-170?'j':py<HH-100?'j':null};
  const sync=()=>{keys.l=keys.r=keys.j=0;for(const id in ptr)keys[ptr[id]]=1};
  on(c,'pointerdown',e=>{e.preventDefault();if(win&&li<LV.length-1){start(li+1);return}if(endless&&dead&&deadT>.4){startEndless();return}if(e.pointerType=='mouse')return;const z=zone(e);if(z){ptr[e.pointerId]=z;sync()}try{c.setPointerCapture(e.pointerId)}catch(_){}});
  on(c,'pointerup',e=>{delete ptr[e.pointerId];sync()});on(c,'pointercancel',e=>{delete ptr[e.pointerId];sync()});on(window,'blur',()=>{keys.l=keys.r=keys.j=0});
  function frame(ts){raf=requestAnimationFrame(frame);const dt=Math.min(.05,(ts-last)/1000||0);last=ts;acc+=dt;while(acc>=1/120){update(1/120);acc-=1/120}draw()}
  let first=0;for(let i=0;i<LV.length-1;i++)if(sv.done[i])first=i+1;
  start(first);raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}

/* ============================ Candy Snip ============================ */
function candy(el){
  const C=CandyCore,W=640,H=360,[c,x]=cvs(el,W,H);
  const sv=saveGet('candy-save2',{stars:{}}),NL=CANDY_LEVELS.length;
  let li=0,w,deb=[],ptr=null,time=0,raf,last=0,acc=0,endT=0,fin=0,cuts=0,idle=0,hintT=0,tutOn=0,guide=[],base=[],cutLog=[],gAcc=0,ready=.9;
  const TIPS={0:['Swipe your finger (or mouse) across the rope to cut it.','Yellow means get ready. Cut when the rope glows GREEN and the candy flies to the monster!'],1:['Cut at the green glow again. Where the candy is when you cut decides where it flies.','Grab the stars on the way for a perfect score.'],2:['The monster is on the other side this time.','Wait for the green glow, then swipe across the rope.'],3:['Two ropes! Cut one and the candy swings on the other.','Cut the second rope at the right moment. Press Hint if you are stuck.'],4:['Try cutting the ropes in a different order.','Cutting at the wrong time is fine: Retry is instant.'],10:['Three ropes! Plan the order of your cuts.','The Hint button shows when cutting a rope will work.']};
  const lb=zbar(el,CANDY_LEVELS.map((_,i)=>[String(i+1),()=>{if(i==0||sv.stars[i-1]!=null)start(i);else st('Beat the previous level first.')}]).concat([['Hint',()=>hint()],['How to play',()=>start(0)],['Retry',()=>start(li)]]));
  const lock=()=>lb.slice(0,NL).forEach((b,i)=>{b.classList.toggle('on',i==li);b.style.opacity=(i==0||sv.stars[i-1]!=null)?1:.45;b.textContent=sv.stars[i]!=null?(i+1)+' '+'\u2605'.repeat(sv.stars[i]):String(i+1)});
  function start(i){li=i;w=C.make(CANDY_LEVELS[i]);deb=[];endT=0;fin=0;cuts=0;idle=0;hintT=0;guide=[];base=[];cutLog=[];gAcc=0;ready=.9;tutOn=i<3;lock();st('Swipe across a rope to cut it. Feed the candy to the monster and grab the stars.')}
  function hint(){if(w.won||w.lost)return;hintT=6;gAcc=1;sfxp('click');st('Hint on: a rope glows green when cutting it now will work. Wait for it!')}
  const guideOn=()=>tutOn||hintT>0;
  // Glow = cutting this rope right now wins, OR it is the moment of the level's tested plan (still on plan if every cut so far matched it).
  const onPlan=()=>{const g=CANDY_LEVELS[li].g;return !!g&&cutLog.every(c=>g[c.id]!=null&&Math.abs(c.t-g[c.id])<=.2)&&w.ropes.every((r,i)=>!r.alive||g[i]==null||w.t<=g[i]+.1)};
  // 2 = green (cut now), 1 = yellow (get ready, the green moment is about half a second away)
  const planState=i=>{const g=CANDY_LEVELS[li].g;if(!g||g[i]==null||!w.ropes[i].alive)return 0;const d=w.t-g[i];return d>=-.1&&d<=.1?2:d>=-.65&&d<-.1?1:0}
  const pos=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]};
  on(c,'pointerdown',e=>{e.preventDefault();if(w.won&&endT>.8){start(Math.min(CANDY_LEVELS.length-1,li+1));return}if(w.lost){start(li);return}ptr=pos(e);try{c.setPointerCapture(e.pointerId)}catch(_){}});
  on(c,'pointermove',e=>{if(!ptr||w.won||w.lost)return;const p=pos(e);if(C.slice(w,ptr[0],ptr[1],p[0],p[1])){sfxp('slide');cuts++;idle=0;
    for(const d of w.cut.splice(0)){cutLog.push({id:d.id,t:d.t});for(const n of d.nodes)deb.push({x:n.x,y:n.y,vx:(Math.random()-.5)*30,vy:0,t:0})}}ptr=p});
  on(c,'pointerup',()=>{ptr=null});on(c,'pointercancel',()=>{ptr=null});
  on(document,'keydown',e=>{if(e.key=='r'||e.key=='R')start(li);if(e.key=='h'||e.key=='H')hint();if(e.key=='Enter'&&w.won)start(Math.min(CANDY_LEVELS.length-1,li+1))});
  function finish(){const n=w.got.filter(Boolean).length;sv.stars[li]=Math.max(sv.stars[li]||0,n);savePut('candy-save',sv);lock();sfxp('win');st(`Yum! ${n} of 3 stars. Tap or press Enter for the next level.`)}
  function frame(ts){
    raf=requestAnimationFrame(frame);const dt=Math.min(.05,(ts-last)/1000||0);last=ts;acc+=dt;time+=dt;
    if(ready>0&&!cuts){ready-=dt;acc=0}
    while(acc>=1/240){const before=w.got.filter(Boolean).length;C.step(w,1/240);if(w.got.filter(Boolean).length>before)sfxp('coin');acc-=1/240}
    if(!w.won&&!w.lost){if(!cuts)idle+=dt;if(hintT>0)hintT-=dt;gAcc+=dt;if(guideOn()&&gAcc>.14){gAcc=0;base=w.ropes.map((r,i)=>r.alive&&C.cutWins(w,i))}guide=guideOn()?w.ropes.map((r,i)=>onPlan()?planState(i):(base[i]?2:0)):[]}
    if(w.won){endT+=dt;if(!fin){fin=1;finish()}}
    if(w.lost&&!w.lostSaid){w.lostSaid=1;sfxp('lose');st('The candy got away. Tap to try again.')}
    deb.forEach(d=>{d.t+=dt;d.vy+=900*dt;d.y+=d.vy*dt;d.x+=d.vx*dt});deb=deb.filter(d=>d.y<H+20&&d.t<2);
    draw();
  }
  function draw(){
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#3a7d44');g.addColorStop(1,'#245a31');x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='#ffffff10';for(let i=0;i<14;i++)for(let j=0;j<8;j++)if((i+j)%2)x.fillRect(i*48,j*48,48,48);
    const L=w.lv;
    const near=Math.hypot(w.candy.x-L.m.x,w.candy.y-L.m.y),open=w.won?0:near<130?1:.25,mx=L.m.x,my=L.m.y;
    x.fillStyle='#7cdc4a';x.strokeStyle='#3d8a22';x.lineWidth=3;x.beginPath();x.arc(mx,my+10,40,0,7);x.fill();x.stroke();
    x.fillStyle='#fff';x.beginPath();x.arc(mx-14,my-26,10,0,7);x.arc(mx+14,my-26,10,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(mx-14+(w.candy.x-mx)*.02,my-26+(w.candy.y-my)*.02,4,0,7);x.arc(mx+14+(w.candy.x-mx)*.02,my-26+(w.candy.y-my)*.02,4,0,7);x.fill();
    x.fillStyle='#5a1020';x.beginPath();x.ellipse(mx,my+14,22,8+open*16,0,0,7);x.fill();
    if(w.won){x.fillStyle='#fff';x.font='bold 22px Arial';x.textAlign='center';x.fillText('YUM!',mx,my-62)}
    L.s.forEach((s,i)=>{const got=w.got[i];x.save();x.translate(s.x,s.y);x.rotate(time*1.5);x.globalAlpha=got?.25:1;x.fillStyle=got?'#999':'#ffd21f';x.strokeStyle='#b8860b';x.lineWidth=2;x.beginPath();for(let k=0;k<10;k++){const a=k/10*6.283-1.57,r=k%2?7:16;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.fill();x.stroke();x.restore()});
    for(const r of w.ropes){if(!r.alive)continue;x.strokeStyle='#8a5a2b';x.lineWidth=4;x.lineCap='round';x.beginPath();x.moveTo(r.ax,r.ay);for(let i=1;i<r.n;i++)x.lineTo(r.nodes[i].x,r.nodes[i].y);x.lineTo(w.candy.x,w.candy.y);x.stroke();
      if(guide[r.id]&&!w.won&&!w.lost){const pu=.55+.45*Math.sin(time*9);x.save();x.strokeStyle=guide[r.id]==2?'rgba(110,255,110,'+(.35+.4*pu)+')':'rgba(255,214,60,'+(.3+.3*pu)+')';x.lineWidth=11;x.beginPath();x.moveTo(r.ax,r.ay);for(let i=1;i<r.n;i++)x.lineTo(r.nodes[i].x,r.nodes[i].y);x.lineTo(w.candy.x,w.candy.y);x.stroke();
        const mn=r.nodes[Math.floor(r.n/2)];x.font='bold 16px Arial';x.textAlign='center';x.lineWidth=4;x.strokeStyle=guide[r.id]==2?'#0a3d12':'#4a3a00';x.fillStyle=guide[r.id]==2?'#b8ffb8':'#ffe98a';const lab=guide[r.id]==2?'CUT NOW!':'GET READY...';x.strokeText(lab,mn.x,mn.y-14);x.fillText(lab,mn.x,mn.y-14);x.restore()}
      x.fillStyle='#bbb';x.beginPath();x.arc(r.ax,r.ay,7,0,7);x.fill();x.fillStyle='#666';x.beginPath();x.arc(r.ax,r.ay,3,0,7);x.fill()}
    if(tutOn&&!cuts&&!w.won&&!w.lost){const r0=w.ropes.find(r=>r.alive);if(r0){const mn=r0.nodes[Math.floor(r0.n/2)],ph=(time*.8)%1.8,f=Math.min(1,ph/1),e=f*f*(3-2*f),fx=mn.x-50+100*e,fy=mn.y-28+56*e;
      x.save();x.globalAlpha=ph<1.3?.95:0;x.strokeStyle='#fff';x.lineWidth=3;x.setLineDash([6,6]);x.beginPath();x.moveTo(mn.x-50,mn.y-28);x.lineTo(fx,fy);x.stroke();x.setLineDash([]);x.fillStyle='#fff';x.strokeStyle='#333';x.beginPath();x.arc(fx,fy,11,0,7);x.fill();x.stroke();x.restore()}}
    x.fillStyle='#8a5a2b';for(const d of deb)x.fillRect(d.x-2,d.y-2,4,4);
    if(!w.won&&(!w.lost||w.candy.y<H+30)){const cd=w.candy;x.save();x.translate(cd.x,cd.y);x.rotate(time*.8);x.fillStyle='#ff4d8d';x.beginPath();x.arc(0,0,14,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=3;x.beginPath();x.arc(0,0,8,0,4.4);x.stroke();x.fillStyle='#ff4d8d';x.beginPath();x.moveTo(14,0);x.lineTo(24,-8);x.lineTo(24,8);x.moveTo(-14,0);x.lineTo(-24,-8);x.lineTo(-24,8);x.fill();x.restore()}
    x.fillStyle='#fff';x.font='bold 13px Arial';x.textAlign='right';x.fillText('Level '+(li+1)+' / '+NL,W-8,H-8);
    let tl=null;const tip=TIPS[li];
    if(w.lost)tl=guideOn()||tip?['Missed! Tap to retry.','Cut when the rope glows green.']:null;
    else if(w.won){if(tutOn||tip)tl=['Yum!','Collect all 3 stars for a perfect score.']}
    else if(!cuts&&tip&&(tutOn||idle<9))tl=tip;
    else if(cuts&&tutOn&&li==0)tl=['Nice! Now the candy flies.','Land it in the monster\'s mouth and grab stars on the way.'];
    else if(!cuts&&idle>8)tl=['Stuck? Swipe across a rope to cut it.','Or press Hint to see a good moment.'];
    else if(hintT>0&&!guide.some(Boolean))tl=['Hint on: waiting for a good moment...','A rope glows green when cutting it will work.'];
    if(tl){x.fillStyle='rgba(0,0,0,.62)';x.fillRect(0,0,W,44);x.textAlign='center';x.fillStyle='#ffd21f';x.font='bold 15px Arial';x.fillText(tl[0],W/2,18);x.fillStyle='#fff';x.font='13px Arial';x.fillText(tl[1],W/2,36)}
    if(w.lost){x.fillStyle='#0008';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.font='bold 30px Arial';x.textAlign='center';x.fillText('Oops! Tap to retry',W/2,H/2)}
    if(w.won&&endT>.4){x.fillStyle='#0006';x.fillRect(0,H-70,W,70);const n=w.got.filter(Boolean).length;x.font='bold 26px Arial';x.textAlign='center';x.fillStyle='#ffd21f';x.fillText('\u2605'.repeat(n)+'\u2606'.repeat(3-n),W/2,H-38);x.font='14px Arial';x.fillStyle='#fff';x.fillText('Tap for next level',W/2,H-16)}
  }
  let first=0;for(let i=0;i<CANDY_LEVELS.length-1;i++)if(sv.stars[i]!=null)first=i+1;
  start(first);raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}

/* ============================ Slope Run ============================ */
// Roll down an endless neon track. Left and right steer, Space or Up jumps. A safe path is always generated.
function slopegame(el){
  const W=640,H=360,F=300,HZ=105,CAMY=3.1,COLS=7,RL=2,[c,x]=cvs(el,W,H);
  const rg=n=>Math.random()*n|0;
  let rows,gen,p,pw=4,hold,tr,q=[],cool=0,pcool=0,lastK='',hams={},b,sp,over,started,camX,camZ,t,score,key={l:0,r:0},raf,last=0,acc=0,fall,hue,parts,ptr={},wantJump=false,tick=0,bestV=0;
  const touch='ontouchstart' in window;
  const PIV=3.6,spdZ=z=>16+24*Math.min(1,z/2200);
  const hamPos=h=>{const a=h.amp*Math.sin(h.w*t+h.ph);return[h.cx+h.L*Math.sin(a),PIV-h.L*Math.cos(a)]};
  const bridge=(c,l,h)=>{for(let i=0;i<COLS;i++)if(i<l||i>h)c[i]=1};
  // Picks the next obstacle section. Spacing is measured in seconds, so it stays fair as the ball speeds up.
  function startPat(d,z,lo,hi){
    const s0=spdZ(z),base=Math.ceil(s0*(1.25-.5*d)/RL),opts=['wall','gap'];
    if(d>.05)opts.push('slalom');if(d>.1)opts.push('ramp','hammer');if(d>.45)opts.push('hammer2','ramp');
    let k;do k=opts[rg(opts.length)];while(k==lastK);lastK=k;
    const ham=ph=>(c,l,h,g)=>{bridge(c,l,h);hams[g]=[{z:g*RL+RL/2,cx:(l+h+1)/2-COLS/2,L:2.7,amp:.85+.2*d,w:2.2+1.3*d,ph}]};
    const rep=(n,f)=>Array(n).fill(f);
    q=[];pcool=base+rg(3);
    if(k=='wall')q=[c=>c.fill(2)];
    else if(k=='gap')q=rep(1+(d>.35&&rg(2)?1:0),c=>c.fill(1));
    else if(k=='slalom'){let g=lo+rg(hi-lo+1);const n=3+(d>.4?1:0)+rg(2),sep=Math.max(2,Math.ceil(s0*.5/RL)),gw=d<.3?2:1;
      for(let j=0;j<n;j++){const gg=Math.max(lo,Math.min(hi-gw+1,g));q.push(c=>{c.fill(2);for(let i=0;i<gw;i++)c[gg+i]=0});for(let u=0;u<sep;u++)q.push(null);g+=(rg(2)?1:-1)*(1+rg(2))}}
    else if(k=='ramp'){const gl=2+rg(2)+(s0>28?1:0);q=[c=>c.fill(3),...rep(gl,c=>c.fill(1))];pcool=Math.ceil(s0*.95/RL)+gl+2}
    else if(k=='hammer')q=[...rep(2,bridge),ham(rg(628)/100),...rep(2,bridge)];
    else q=[...rep(2,bridge),ham(rg(628)/100),...rep(Math.max(3,Math.ceil(s0*.7/RL)),bridge),ham(rg(628)/100),...rep(2,bridge)];
    hold=Math.max(hold,q.length+3);
  }
  function row(r){
    if(rows[r])return rows[r];
    while(gen<=r){
      const z=gen*RL,d=Math.min(1,z/2200),cells=Array(COLS).fill(0);pw=d<.45?4:3;
      if(gen>=8){
        if(!q.length&&--hold<=0){const np=Math.max(0,Math.min(COLS-pw,p+(Math.random()<.5?-1:1)*(1+rg(2))));tr={from:p,to:np,left:Math.ceil(spdZ(z)*.35/RL)};p=np;hold=7+rg(5)}
        let lo=p,hi=p+pw-1;const moving=tr&&tr.left>0;
        if(moving){lo=Math.min(tr.from,tr.to);hi=Math.max(tr.from,tr.to)+pw-1;tr.left--}
        const cl=.06+.3*d;for(let i=0;i<COLS;i++){if(i>=lo&&i<=hi)continue;if(Math.random()<cl)cells[i]=Math.random()<.5?2:1}
        if(!q.length&&cool<=0&&gen>=14&&!moving)startPat(d,z,lo,hi);
        if(q.length){const f=q.shift();if(f)f(cells,lo,hi,gen);if(!q.length)cool=pcool}else cool--;
      }
      rows[gen++]=cells;
    }
    return rows[r];
  }
  const cellAt=(px,pz)=>{const cx=Math.floor(px+COLS/2);if(cx<0||cx>=COLS)return 1;return row(Math.floor(pz/RL))[cx]};
  function reset(){rows=[];gen=0;p=2;pw=4;hold=6;tr=null;q=[];cool=0;pcool=0;lastK='';hams={};b={x:0,y:0,z:4,vy:0,vx:0,rot:0,grounded:true};sp=14;over=false;started=false;camX=0;camZ=-1.5;t=0;score=0;fall=0;parts=[];hue=0;wantJump=false}
  const proj=(px,py,pz)=>{const dz=pz-camZ;const s=F/dz;return[W/2+(px-camX)*s,HZ+(CAMY-py)*s,s]};
  function end(){over=true;sfxp('crash');bestV=best('slope',Math.floor(score));st(`Crashed at ${Math.floor(score)}. Best ${bestV}. Tap or press Enter to roll again.`)}
  function update(dt){
    for(const q of parts){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.vy-=20*dt}parts=parts.filter(q=>q.t<.8);
    if(over||!started)return;
    t+=dt;sp=16+Math.min(24,t*.3);
    const dir=(key.r?1:0)-(key.l?1:0);b.vx+=(dir*9.5-b.vx)*Math.min(1,dt*9);
    b.z+=sp*dt;b.rot+=sp*dt*2.4;
    if(fall){b.vy-=34*dt;b.y+=b.vy*dt;b.x+=b.vx*dt*.4;if(b.y<-7)end();score=b.z*.5;camX+=(b.x*.85-camX)*dt*5;camZ=b.z-5.5;return}
    b.x+=b.vx*dt;
    let gh=-9,blockHit=false;
    for(const[ox,oz]of[[0,0],[.3,0],[-.3,0],[0,.3],[0,-.3]]){const k=cellAt(b.x+ox,b.z+oz);if(k==0)gh=Math.max(gh,0);else if(k==2){gh=Math.max(gh,1);if(b.y<.72)blockHit=true}else gh=Math.max(gh,0)}
    b.vy-=32*dt;b.y+=b.vy*dt;
    if(blockHit){end();return}
    if(b.y<=gh&&gh>-9){b.y=gh;b.vy=0;b.grounded=true}else{b.grounded=false;if(gh==-9&&b.y<0&&b.vy<0){fall=1}}
    if(b.grounded&&b.y<.05&&cellAt(b.x,b.z)==3&&(b.z/RL)%1>.3){b.vy=13;b.grounded=false;sfxp('boing')}
    for(let r=Math.floor((b.z-1)/RL);r<=Math.floor((b.z+1)/RL);r++){const hs=hams[r];if(hs)for(const h of hs){const hp=hamPos(h);if(Math.abs(b.z-h.z)<.9&&Math.hypot(b.x-hp[0],b.y+.4-hp[1])<.95){end();return}}}
    if(wantJump&&b.grounded){b.vy=10;b.grounded=false;wantJump=false;sfxp('hop')}
    score=b.z*.5;camX+=(b.x*.85-camX)*Math.min(1,dt*6);camZ=b.z-5.5;hue=(score*.6)%360;
    if(Math.random()<.5)parts.push({x:b.x+(Math.random()-.5)*.3,y:b.y+.1,z:b.z-.2,vx:(Math.random()-.5),vy:Math.random()*2,vz:-3,t:0});
    if(++tick%12==0)st(`${Math.floor(score)} m   speed ${Math.round(sp*3.6)} km/h   best ${bestV}`);
  }
  const shade=(h,s,l,a=1)=>`hsla(${h},${s}%,${l}%,${a})`;
  function quad(p1,p2,p3,p4,fill){x.fillStyle=fill;x.beginPath();x.moveTo(p1[0],p1[1]);x.lineTo(p2[0],p2[1]);x.lineTo(p3[0],p3[1]);x.lineTo(p4[0],p4[1]);x.closePath();x.fill();x.strokeStyle=fill;x.lineWidth=1;x.stroke()}
  function draw(){
    const hh=(200+hue)%360;
    const g=x.createLinearGradient(0,0,0,HZ+20);g.addColorStop(0,shade(hh,70,12));g.addColorStop(1,shade((hh+30)%360,70,40));x.fillStyle=g;x.fillRect(0,0,W,HZ+20);
    x.fillStyle=shade((hh+60)%360,80,70,.9);x.beginPath();x.arc(W/2+(camX*-6)%60,HZ-22,34,0,7);x.fill();
    x.fillStyle=shade((hh+10)%360,50,22);x.fillRect(0,HZ,W,H-HZ);
    const r0=Math.max(0,Math.floor((camZ+1)/RL)),r1=r0+36,br=Math.floor(b.z/RL);let drawn=false;
    for(let r=r1;r>=r0;r--){const cells=row(r),z0=Math.max(r*RL,camZ+.9),z1=r*RL+RL;if(z1<=camZ+.9)continue;
      const dz=z0-camZ,f=Math.min(1,dz/70),order=[...Array(COLS).keys()].sort((a,c)=>Math.abs(c+.5-COLS/2-camX)-Math.abs(a+.5-COLS/2-camX));
      for(const i of order){const k=cells[i];if(k==1)continue;const x0=i-COLS/2,x1=x0+1,par=(i+r)%2;
        const lum=par?34:30,col=`hsl(${(hh+r*.6)%360},${55-f*20}%,${lum*(1-f*.55)+f*15}%)`;
        const A=proj(x0,0,z0),B=proj(x1,0,z0),C=proj(x1,0,z1),D=proj(x0,0,z1);
        quad(A,B,C,D,col);
        if(k==3){const R0=proj(x0,0,z0),R1=proj(x1,0,z0),R2=proj(x1,.9,z1),R3=proj(x0,.9,z1);quad(R0,R1,R2,R3,`hsl(${30+(r%2)*12},95%,${56*(1-f*.5)}%)`)}
        if(k==2){const hi=`hsl(${(hh+160)%360},80%,${58*(1-f*.5)}%)`,sd=`hsl(${(hh+160)%360},80%,${38*(1-f*.5)}%)`;
          const A2=proj(x0,1,z0),B2=proj(x1,1,z0),C2=proj(x1,1,z1),D2=proj(x0,1,z1);
          if(camX<x0)quad(proj(x0,0,z0),proj(x0,0,z1),D2,A2,sd);else if(camX>x1)quad(proj(x1,0,z0),proj(x1,0,z1),C2,B2,sd);
          quad(A,B,B2,A2,`hsl(${(hh+160)%360},80%,${48*(1-f*.5)}%)`);quad(A2,B2,C2,D2,hi)}}
      if(hams[r])for(const h of hams[r])drawHam(h);
      if(r==br){drawBall();drawn=true}
    }
    if(!drawn)drawBall();
    for(const q of parts){const P=proj(q.x,q.y,q.z);x.globalAlpha=Math.max(0,1-q.t/.8);x.fillStyle='#fff';x.fillRect(P[0],P[1],3,3)}x.globalAlpha=1;
    x.fillStyle='#fff';x.font='bold 22px Arial';x.textAlign='left';x.fillText(Math.floor(score)+' m',12,28);x.textAlign='right';x.font='14px Arial';x.fillText('Best '+bestV,W-12,22);
    if(!started&&!over){x.fillStyle='#0008';x.fillRect(0,H/2-50,W,100);x.fillStyle='#fff';x.textAlign='center';x.font='bold 24px Arial';x.fillText('Jump gaps, ride ramps, dodge hammers',W/2,H/2-6);x.font='16px Arial';x.fillText('Press any key or tap to start',W/2,H/2+26)}
    if(over){x.fillStyle='#0009';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.textAlign='center';x.font='bold 34px Arial';x.fillText('CRASHED  '+Math.floor(score)+' m',W/2,H/2-6);x.font='16px Arial';x.fillText('Tap or press Enter to roll again',W/2,H/2+28)}
    if(touch){x.globalAlpha=.3;x.fillStyle='#fff';x.fillRect(0,H-110,W/3,110);x.fillRect(W*2/3,H-110,W/3,110);x.globalAlpha=1}
  }
  function drawHam(h){
    const hp=hamPos(h),Pv=proj(h.cx,PIV+4,h.z),Hd=proj(hp[0],hp[1],h.z),G0=proj(hp[0],0,h.z),s=Hd[2];if(h.z-camZ<1)return;
    x.fillStyle='#0006';x.beginPath();x.ellipse(G0[0],G0[1],.6*s,.2*s,0,0,7);x.fill();
    x.strokeStyle='#cfd3da';x.lineWidth=Math.max(2,.09*s);x.beginPath();x.moveTo(Pv[0],Pv[1]);x.lineTo(Hd[0],Hd[1]);x.stroke();
    x.save();x.translate(Hd[0],Hd[1]);x.rotate(Math.atan2(Hd[1]-Pv[1],Hd[0]-Pv[0])-Math.PI/2);
    x.fillStyle='#e63027';x.fillRect(-.65*s,-.3*s,1.3*s,.6*s);x.fillStyle='#ffd21f';for(let i=-1;i<=1;i++)x.fillRect(i*.4*s-.08*s,-.3*s,.16*s,.6*s);
    x.strokeStyle='#111';x.lineWidth=2;x.strokeRect(-.65*s,-.3*s,1.3*s,.6*s);x.restore();
  }
  function drawBall(){
    const gh=b.y>.9?1:0,G0=proj(b.x,gh,b.z),P=proj(b.x,b.y+.4,b.z),r=.4*P[2];if(P[1]>H+60)return;
    x.fillStyle='#0006';x.beginPath();x.ellipse(G0[0],G0[1],r*(1.1-Math.min(.5,(b.y-gh)*.2)),r*.35,0,0,7);x.fill();
    const g=x.createRadialGradient(P[0]-r*.35,P[1]-r*.35,r*.1,P[0],P[1],r);g.addColorStop(0,'#fff');g.addColorStop(.4,'#ff6b9d');g.addColorStop(1,'#8a1c52');
    x.fillStyle=g;x.shadowColor='#ff6b9d';x.shadowBlur=14;x.beginPath();x.arc(P[0],P[1],r,0,7);x.fill();x.shadowBlur=0;
    x.strokeStyle='#ffffff88';x.lineWidth=2;x.beginPath();x.arc(P[0],P[1],r*.65,b.rot,b.rot+1.6);x.stroke();
  }
  function go(){if(over)reset();started=true}
  const kd={ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r'};
  on(document,'keydown',e=>{if(e.key==' '||e.key=='ArrowUp'||e.key=='w'||e.key=='W'){e.preventDefault();if(!e.repeat)wantJump=true;if(!started||over)go();return}
    const k=kd[e.key];if(k){e.preventDefault();key[k]=1;if(!started||over)go()}if(e.key=='Enter'&&over)go()});
  on(document,'keyup',e=>{const k=kd[e.key];if(k)key[k]=0});
  const sync=()=>{key.l=key.r=0;for(const id in ptr)key[ptr[id]]=1};
  on(c,'pointerdown',e=>{e.preventDefault();if(!started||over)go();const r=c.getBoundingClientRect(),px=(e.clientX-r.left)/r.width;
    const z=px<.33?'l':px>.67?'r':null;if(z){ptr[e.pointerId]=z;sync()}else wantJump=true;try{c.setPointerCapture(e.pointerId)}catch(_){}});
  on(c,'pointerup',e=>{delete ptr[e.pointerId];sync()});on(c,'pointercancel',e=>{delete ptr[e.pointerId];sync()});on(window,'blur',()=>{key.l=key.r=0});
  function frame(ts){raf=requestAnimationFrame(frame);const dt=Math.min(.05,(ts-last)/1000||0);last=ts;acc+=dt;while(acc>=1/120){update(1/120);acc-=1/120}draw()}
  reset();try{bestV=+(localStorage.getItem('best-slope')||0)}catch(e){}st('Press any key or tap to start. Orange ramps launch you over big gaps. Dodge the swinging hammers.');raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
