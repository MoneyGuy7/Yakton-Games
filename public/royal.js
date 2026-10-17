// Heli Royale: top-down battle royale with helicopters.
// Solo: you vs 14 bots. Online: up to 8 pilots share a room code, bots fill the lobby to 12.
// The first pilot in a room is the host: the host's browser runs the bots, the storm and the crates.
// Every pilot's browser runs their own helicopter and only checks hits on itself.
// Desktop: WASD or arrows fly, mouse aims, click or Space shoots, right click or R fires a rocket.
// Phone: drag to fly (it aims and fires at the nearest enemy), tap the ROCKET button.
function royale(el){
  const VW=720,VH=450,MAP=3000,TOTAL=12,HR=20,DPR=Math.min(2,window.devicePixelRatio||1);
  const c=mk('canvas',{width:VW*DPR,height:VH*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${VW}px,100%,calc(72vh*${(VW/VH).toFixed(4)}));height:auto;max-height:none;cursor:crosshair`;
  x.scale(DPR,DPR);
  const COL=['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#f97316','#14b8a6','#ec4899','#84cc16','#06b6d4','#f43f5e','#8b5cf6'];
  const BN=['Maverick','Goose','Viper','Iceman','Rooster','Hangman','Phoenix','Cougar','Merlin','Slider','Jester','Sundown','Wolfman','Stinger','Chipper'];
  const ROOF=['#b45309','#9f1239','#475569','#1e3a8a','#6d28d9','#0f766e'];
  const PH=[{w:25,s:25,r:1150,d:2},{w:20,s:20,r:750,d:4},{w:15,s:15,r:450,d:7},{w:12,s:12,r:250,d:11},{w:10,s:10,r:100,d:16},{w:8,s:8,r:0,d:22}];
  const LV=[{sp:.3,err:.3,cd:24,rng:420,dm:.6},{sp:.38,err:.18,cd:15,rng:520,dm:.9},{sp:.44,err:.08,cd:9,rng:640,dm:1.1}];
  const CC={hp:['#ef4444','+'],sh:['#38bdf8','S'],rk:['#f59e0b','R'],sp:['#a3e635','>']};
  const R=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),PI2=Math.PI*2;
  const angD=(a,b)=>((a-b+Math.PI*3)%PI2)-Math.PI,sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  function mkRng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

  /* ---------- menu and lobby ---------- */
  const menu=mk('div',{class:'cm'}),lobby=mk('div',{class:'cm'}),row=(...a)=>{const d=mk('div',{class:'row'});d.append(...a);return d};
  const nm=mk('input',{placeholder:'Your name',maxlength:12,'aria-label':'Your name'}),lvS=mk('select',{'aria-label':'Bot difficulty'}),
    b1=mk('button',{type:'button'},'Play solo (14 bots)'),
    code=mk('input',{placeholder:'Room code',maxlength:8,'aria-label':'Room code'}),b3=mk('button',{type:'button'},'New code'),b2=mk('button',{type:'button'},'Join online');
  nm.style.width='14ch';nm.style.textTransform='none';
  ['Easy bots','Normal bots','Hard bots'].forEach((t,i)=>lvS.append(mk('option',{value:i},t)));lvS.value=1;
  try{nm.value=localStorage.getItem('royale-name')||''}catch(e){}
  menu.append(row(nm,lvS),row(b1),row(code,b3,b2),mk('p',{class:'sm'},'Online: friends type the same room code (up to 8 pilots). The first one in is the host and starts the match.'));
  lobby.hidden=true;c.hidden=true;el.append(menu,lobby,c);

  /* ---------- state ---------- */
  let phase='menu',online=0,ws,myId='me',isHost=1,room='',peers={},dead=0,T=0,grace=0,lvl=1,raf;
  let E=[],byId={},me,bul=[],par=[],feed=[],crates=[],lakes=[],towns=[],trees=[],roads=[],z,spec=null;
  let hm=0,km=0,kt='',flash=0,dn=[],hd=[],rg=[];
  let cam={x:0,y:0},shake=0,banner=null,over=null,endd=null,ovT=0,lastShr=0,lastSt='',rocketReq=0;
  const keys={},ms={x:VW/2,y:VH/2,at:-1e9,down:0},tp={on:0,id:null,x:0,y:0},tu={seen:0};
  const send=o=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))};
  const nameVal=()=>{const n=nm.value.trim().slice(0,12)||'Pilot';try{localStorage.setItem('royale-name',nm.value.trim())}catch(e){}return n};
  const alive=()=>E.filter(e=>e.al);
  const nearest=(e,rng)=>{let t=null,bd=rng;for(const q of E)if(q!=e&&q.al){const d=Math.hypot(q.x-e.x,q.y-e.y);if(d<bd){bd=d;t=q}}return t};

  /* ---------- world ---------- */
  function genWorld(seed){
    const r=mkRng(seed);lakes=[];towns=[];trees=[];roads=[];crates=[];
    for(let i=0;i<7;i++)lakes.push({x:300+r()*(MAP-600),y:300+r()*(MAP-600),r:90+r()*130});
    const inLake=(px,py,m)=>lakes.some(l=>Math.hypot(px-l.x,py-l.y)<l.r+m);
    for(let n=0;n<220&&towns.length<11;n++){
      const tx=300+r()*(MAP-600),ty=300+r()*(MAP-600);
      if(inLake(tx,ty,160)||towns.some(o=>Math.hypot(o.x-tx,o.y-ty)<380))continue;
      const bl=[],k=6+(r()*5|0);
      for(let i=0;i<k;i++){const w=40+r()*50,h=34+r()*44;bl.push({x:tx+(r()-.5)*260-w/2,y:ty+(r()-.5)*260-h/2,w,h,c:ROOF[r()*ROOF.length|0]})}
      towns.push({x:tx,y:ty,bl});
    }
    for(let i=1;i<towns.length;i++)roads.push([towns[i-1],towns[i]]);
    for(let i=0;i<300;i++){const tx=60+r()*(MAP-120),ty=60+r()*(MAP-120);if(inLake(tx,ty,20)||towns.some(o=>Math.hypot(o.x-tx,o.y-ty)<170))continue;trees.push({x:tx,y:ty,r:14+r()*14})}
    const KT=['hp','hp','hp','sh','sh','rk','rk','sp'];
    for(let i=0;i<72;i++){let px,py;
      if(r()<.6&&towns.length){const t=towns[r()*towns.length|0];px=t.x+(r()-.5)*300;py=t.y+(r()-.5)*300}else{px=150+r()*(MAP-300);py=150+r()*(MAP-300)}
      crates.push({x:clamp(px,60,MAP-60),y:clamp(py,60,MAP-60),k:KT[r()*KT.length|0],taken:0})}
  }

  function startMatch(seed,hs,nb,lv){
    lvl=lv;genWorld(seed);const r=mkRng(seed^0x5bd1);
    E=[];byId={};
    const add=o=>{Object.assign(o,{vx:0,vy:0,a:0,ta:0,hp:100,sh:0,rk:2,bo:0,al:1,k:0,cd:0,rcd:0,m:1,lh:null,tx:0,ty:0,gx:0,gy:0,gt:0,st:R()*6,place:0});E.push(o);byId[o.id]=o};
    hs.forEach(h=>add({id:h.id,name:h.name,bot:0}));
    for(let i=0;i<nb;i++)add({id:'b'+i,name:BN[i%BN.length],bot:1});
    const pts=[];
    E.forEach((e,i)=>{let px,py,n=0;
      do{px=250+r()*(MAP-500);py=250+r()*(MAP-500)}while(n++<40&&pts.some(p=>Math.hypot(p[0]-px,p[1]-py)<420));
      pts.push([px,py]);e.x=e.tx=px;e.y=e.ty=py;e.a=e.ta=r()*PI2;e.col=COL[i%COL.length]});
    me=byId[myId];
    z={cx:MAP/2,cy:MAP/2,r:2200,ph:0,t:0,r0:2200,cx0:MAP/2,cy0:MAP/2,tx:MAP/2,ty:MAP/2};
    if(isHost)startPh();
    bul=[];par=[];feed=[];hm=0;km=0;flash=0;dn=[];hd=[];rg=[];T=0;grace=180;over=null;endd=null;spec=null;banner=null;lastShr=0;lastSt='';rocketReq=0;
    cam.x=me.x-VW/2;cam.y=me.y-VH/2;
    phase='play';menu.hidden=true;lobby.hidden=true;c.hidden=false;
    st('Fly! Last helicopter flying wins.');
  }
  function startSolo(){online=0;isHost=1;myId='me';startMatch(R()*1e9|0,[{id:'me',name:nameVal()}],TOTAL+2,lvl)}

  /* ---------- storm ---------- */
  function startPh(){
    const p=PH[z.ph];if(!p)return;
    z.r0=z.r;z.cx0=z.cx;z.cy0=z.cy;
    const a=R()*PI2,d=R()*Math.max(0,z.r-p.r)*.85;
    z.tx=clamp(z.cx+Math.cos(a)*d,200,MAP-200);z.ty=clamp(z.cy+Math.sin(a)*d,200,MAP-200);
  }
  function zoneStep(dt){
    const p=PH[z.ph];if(!p)return;
    z.t+=dt;
    if(z.t>=p.w+p.s){z.r=p.r;z.cx=z.tx;z.cy=z.ty;z.ph++;z.t=0;startPh();return}
    if(z.t>=p.w){const f=(z.t-p.w)/p.s;z.r=z.r0+(p.r-z.r0)*f;z.cx=z.cx0+(z.tx-z.cx0)*f;z.cy=z.cy0+(z.ty-z.cy0)*f}
  }
  const stormDmg=()=>PH[Math.min(z.ph,PH.length-1)].d;
  const outside=e=>Math.hypot(e.x-z.cx,e.y-z.cy)>z.r;

  /* ---------- combat ---------- */
  function spark(px,py){for(let i=0;i<4;i++)par.push({x:px,y:py,vx:(R()-.5)*4,vy:(R()-.5)*4,l:12,m:12,c:'#ffd21f',s:2})}
  function boom(px,py,n,col){for(let i=0;i<n;i++){const a=R()*PI2,s=R()*5;par.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:25+R()*30|0,m:55,c:R()<.5?col:'#555',s:3+R()*5})}
    if(par.length>400)par.splice(0,par.length-400)}
  function die(e,by){
    if(!e.al)return;
    e.al=0;e.hp=0;boom(e.x,e.y,28,'#ff9a2e');
    if(me&&Math.hypot(e.x-me.x,e.y-me.y)<700)sfx('boom');
    e.place=alive().length+1;
    const kr=byId[by];if(kr&&kr!=e)kr.k++;
    feed.push({t:T,s:kr&&kr!=e?kr.name+' shot down '+e.name:by=='storm'?e.name+' was lost in the storm':e.name+' crashed'});
    if(online&&(e==me||(e.bot&&isHost)))send({t:'dead',id:e.id,by});
    if(by==myId&&e!=me){km=70;kt=e.name;hm=0;sfx('win');shake=Math.max(shake,8);rg.push({x:e.x,y:e.y,r:10,l:30,m:30,c:'#ffd21f'})}
    if(e==me){over={win:0,place:e.place};ovT=T}
  }
  function hurt(e,d,by){
    if(!e.al||grace>0)return;
    if(e.sh>0){const a=Math.min(e.sh,d);e.sh-=a;d-=a}
    e.hp-=d;e.lh=by;
    if(e==me){shake=Math.min(10,shake+2.5);flash=Math.min(.5,flash+.16);if(T%4==0)sfx('hurt');const at=byId[by];if(at&&at!=me)hd.push({a:Math.atan2(at.y-me.y,at.x-me.x),l:50})}
    if(e.hp<=0)die(e,by);
  }
  function shoot(e){
    const err=e.bot?LV[lvl].err:.025,a=e.a+(R()-.5)*2*err;e.m=-e.m;
    const b={x:e.x+Math.cos(e.a)*26-Math.sin(e.a)*10*e.m,y:e.y+Math.sin(e.a)*26+Math.cos(e.a)*10*e.m,vx:Math.cos(a)*11,vy:Math.sin(a)*11,o:e.id,k:'g',l:52,d:6*(e.bot?LV[lvl].dm:1)};
    bul.push(b);
    par.push({x:b.x,y:b.y,vx:Math.cos(a)*2,vy:Math.sin(a)*2,l:4,m:4,c:'#fff2b0',s:7});
    par.push({x:e.x-Math.sin(e.a)*8*e.m,y:e.y+Math.cos(e.a)*8*e.m,vx:-Math.sin(e.a)*2*e.m+(R()-.5),vy:Math.cos(e.a)*2*e.m+(R()-.5),l:16,m:16,c:'#d4a017',s:1.6});
    if(online&&(e==me||(e.bot&&isHost)))send({t:'sh',o:b.o,x:b.x,y:b.y,vx:b.vx,vy:b.vy,k:'g',l:b.l,d:b.d});
    if(e==me){shake=Math.min(10,shake+.7);me.vx-=Math.cos(a)*.12;me.vy-=Math.sin(a)*.12;sfx('gun')}
    else if(me&&Math.hypot(e.x-me.x,e.y-me.y)<500&&T%3==0)sfx('gun');
  }
  function rocket(e){
    e.rk--;e.rcd=70;const a=e.a;
    const b={x:e.x+Math.cos(a)*28,y:e.y+Math.sin(a)*28,vx:Math.cos(a)*7.5,vy:Math.sin(a)*7.5,o:e.id,k:'r',l:75,d:45};
    bul.push(b);
    if(online&&(e==me||(e.bot&&isHost)))send({t:'sh',o:b.o,x:b.x,y:b.y,vx:b.vx,vy:b.vy,k:'r',l:b.l,d:b.d});
    if(e==me){sfx('rocket');shake=Math.min(12,shake+4)}
  }
  function explode(b){
    boom(b.x,b.y,30,'#ffb020');rg.push({x:b.x,y:b.y,r:10,l:22,m:22,c:'#ffd27a'});shake=Math.max(shake,Math.hypot(b.x-(me?me.x:0),b.y-(me?me.y:0))<400?9:0);
    if(b.o==myId)for(const e of E)if(e.al&&e.id!=b.o&&Math.hypot(e.x-b.x,e.y-b.y)<85){hm=18;sfx('hitm');dn.push({x:e.x,y:e.y-20,v:Math.round(b.d*(1-Math.hypot(e.x-b.x,e.y-b.y)/85*.7)),l:50,big:1})}
    if(me&&Math.hypot(b.x-me.x,b.y-me.y)<700)sfx('boom');
    for(const e of E){
      if(!e.al||e.id==b.o)continue;
      if(!(e==me||(e.bot&&isHost)))continue;
      const d=Math.hypot(e.x-b.x,e.y-b.y);
      if(d<85)hurt(e,b.d*(1-d/85*.7),b.o);
    }
  }
  function take(e,k){
    if(k=='hp')e.hp=Math.min(100,e.hp+35);
    else if(k=='sh')e.sh=Math.min(60,e.sh+40);
    else if(k=='rk')e.rk=Math.min(8,e.rk+3);
    else e.bo=480;
  }

  /* ---------- bots ---------- */
  function ai(b){
    const L=LV[lvl];let tg=null,td=1e9;
    for(const e of E)if(e!=b&&e.al){const d=Math.hypot(e.x-b.x,e.y-b.y);if(d<td){td=d;tg=e}}
    const zd=Math.hypot(b.x-z.cx,b.y-z.cy),ph=PH[z.ph];
    let gx=b.x,gy=b.y,combat=0;
    if(zd>z.r-120){gx=z.cx;gy=z.cy}
    else if(ph&&z.t>ph.w*.4&&Math.hypot(b.x-z.tx,b.y-z.ty)>ph.r-80){gx=z.tx;gy=z.ty}
    else if(tg&&td<L.rng)combat=1;
    else{
      let cb=null,cd=800;
      for(const cr of crates)if(!cr.taken){const d=Math.hypot(cr.x-b.x,cr.y-b.y);if(d<cd){cd=d;cb=cr}}
      if(cb){gx=cb.x;gy=cb.y}
      else{
        if(--b.gt<=0||Math.hypot(b.gx-b.x,b.gy-b.y)<80){const a=R()*PI2,d=R()*z.r*.7;b.gx=clamp(z.cx+Math.cos(a)*d,100,MAP-100);b.gy=clamp(z.cy+Math.sin(a)*d,100,MAP-100);b.gt=600}
        gx=b.gx;gy=b.gy;
      }
    }
    let ux=0,uy=0,aim=null;
    if(combat){
      const dx=tg.x-b.x,dy=tg.y-b.y,d=td||1,nx=dx/d,ny=dy/d,orb=Math.sin(T/70+b.st)>0?1:-1,want=d>320?1:d<190?-1:0;
      ux=nx*want-ny*orb*.8;uy=ny*want+nx*orb*.8;
      aim=Math.atan2(dy+(tg.vy||0)*d/11*.6,dx+(tg.vx||0)*d/11*.6);
      const ok=Math.abs(angD(aim,b.a))<.3;
      if(grace<=0&&b.cd<=0&&d<L.rng*.9&&ok){shoot(b);b.cd=L.cd}
      if(grace<=0&&b.rk>0&&b.rcd<=0&&d>150&&d<400&&ok&&R()<.015)rocket(b);
    }else{const dx=gx-b.x,dy=gy-b.y,d=Math.hypot(dx,dy)||1;ux=dx/d;uy=dy/d}
    const acc=L.sp*(b.bo>0?1.4:1);
    b.vx=(b.vx+ux*acc)*.9;b.vy=(b.vy+uy*acc)*.9;
    b.x=clamp(b.x+b.vx,25,MAP-25);b.y=clamp(b.y+b.vy,25,MAP-25);
    const want=aim!=null?aim:(Math.hypot(b.vx,b.vy)>.6?Math.atan2(b.vy,b.vx):b.a);
    b.a+=clamp(angD(want,b.a),-.1,.1);
  }

  /* ---------- my helicopter ---------- */
  function control(){
    let ax=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.a?1:0),ay=(keys.arrowdown||keys.s?1:0)-(keys.arrowup||keys.w?1:0);
    let fire=keys[' ']||ms.down,rk=keys.r||keys.e||keys.shift||rocketReq,aim=null;
    if(tp.on){
      const dx=tp.x+cam.x-me.x,dy=tp.y+cam.y-me.y;
      ax=clamp(dx/60,-1,1);ay=clamp(dy/60,-1,1);
      const t=nearest(me,560);if(t){aim=Math.atan2(t.y-me.y,t.x-me.x);fire=1}
    }else if(performance.now()-ms.at<2500)aim=Math.atan2(ms.y+cam.y-me.y,ms.x+cam.x-me.x);
    const l=Math.hypot(ax,ay);if(l>1){ax/=l;ay/=l}
    const acc=me.bo>0?.65:.45;
    me.vx=(me.vx+ax*acc)*.9;me.vy=(me.vy+ay*acc)*.9;
    me.x=clamp(me.x+me.vx,20,MAP-20);me.y=clamp(me.y+me.vy,20,MAP-20);
    if(aim==null)aim=Math.hypot(me.vx,me.vy)>.8?Math.atan2(me.vy,me.vx):me.a;
    me.a=aim;
    if(fire&&me.cd<=0&&grace<=0){shoot(me);me.cd=7}
    if(rk&&me.rk>0&&me.rcd<=0&&grace<=0)rocket(me);
    rocketReq=0;
  }

  /* ---------- one game step (60 per second) ---------- */
  function step(){
    T++;if(phase!='play')return;
    if(grace>0)grace--;
    if(isHost)zoneStep(1/60);else z.t+=1/60;
    const shr=z.ph<PH.length&&z.t>=PH[z.ph].w;
    if(shr&&!lastShr)banner={s:z.ph==PH.length-1?'Final zone!':'The storm is closing in!',t:T};
    lastShr=shr;
    for(const e of E){if(e.cd>0)e.cd--;if(e.rcd>0)e.rcd--;if(e.bo>0)e.bo--}
    if(me.al)control();
    for(const e of E){
      if(!e.al||e==me)continue;
      if(e.bot&&isHost)ai(e);
      else{e.x+=(e.tx-e.x)*.3;e.y+=(e.ty-e.y)*.3;e.a+=angD(e.ta,e.a)*.3}
    }
    // bullets and rockets
    for(let i=bul.length-1;i>=0;i--){
      const b=bul[i];b.x+=b.vx;b.y+=b.vy;b.l--;
      if(b.k=='r'&&T%2==0)par.push({x:b.x,y:b.y,vx:0,vy:0,l:18,m:18,c:'#888',s:3});
      let hit=0;const rad=b.k=='r'?26:HR;
      for(const e of E){
        if(!e.al||e.id==b.o)continue;
        if(Math.hypot(e.x-b.x,e.y-b.y)<rad){
          hit=1;
          if(b.k=='g'){if(e==me||(e.bot&&isHost))hurt(e,b.d,b.o);spark(b.x,b.y);if(b.o==myId){hm=14;sfx('hitm');dn.push({x:e.x+(R()-.5)*16,y:e.y-20,v:Math.round(b.d),l:36});for(let q=0;q<4;q++)par.push({x:b.x,y:b.y,vx:(R()-.5)*6,vy:(R()-.5)*6,l:14,m:14,c:'#fff',s:2})}}
          break;
        }
      }
      if(hit||b.l<=0||b.x<-50||b.y<-50||b.x>MAP+50||b.y>MAP+50){if(b.k=='r')explode(b);bul.splice(i,1)}
    }
    // crates, storm
    for(let i=0;i<crates.length;i++){
      const cr=crates[i];if(cr.taken)continue;
      if(me.al&&Math.hypot(cr.x-me.x,cr.y-me.y)<28){cr.taken=1;take(me,cr.k);sfx('coin');if(online)send({t:'pk',n:i});continue}
      if(isHost)for(const b of E)if(b.bot&&b.al&&Math.hypot(cr.x-b.x,cr.y-b.y)<28){cr.taken=1;take(b,cr.k);if(online)send({t:'pk',n:i});break}
    }
    const sd=stormDmg()/60;
    for(const e of E)if(e.al&&(e==me||(e.bot&&isHost))&&grace<=0&&outside(e)){e.hp-=sd;e.lh='storm';if(e.hp<=0)die(e,'storm')}
    // net
    if(online){
      if(me.al&&T%4==0)send({t:'st',x:+me.x.toFixed(1),y:+me.y.toFixed(1),a:+me.a.toFixed(2),hp:me.hp|0,sh:me.sh|0});
      if(isHost&&T%6==0){
        const b=[];E.forEach((e,i)=>{if(e.bot&&e.al)b.push([i,+e.x.toFixed(1),+e.y.toFixed(1),+e.a.toFixed(2),e.hp|0,e.sh|0])});
        send({t:'snap',z:[z.cx,z.cy,z.r,z.ph,z.t,z.tx,z.ty],b});
      }
    }
    // end of match
    const al=alive();
    if(!endd&&al.length<=1&&grace<=0){
      endd={w:al[0]?al[0].name:'nobody'};ovT=T;
      if(al[0]==me&&!over)over={win:1,place:1};
    }
    for(let i=par.length-1;i>=0;i--){const p=par[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.94;p.vy*=.94;if(--p.l<=0)par.splice(i,1)}
    while(feed.length&&T-feed[0].t>420)feed.shift();
    if(shake>0)shake*=.85;if(hm>0)hm--;if(km>0)km--;if(flash>0)flash-=.012;
    dn=dn.filter(d=>{d.l--;d.y-=.7;return d.l>0});hd=hd.filter(d=>--d.l>0);rg=rg.filter(r=>{r.l--;r.r+=(r.m>25?4:3);return r.l>0});
    // camera
    let f=me;
    if(!me.al){if(!spec||!spec.al)spec=(byId[me.lh]&&byId[me.lh].al)?byId[me.lh]:nearest(me,1e9)||me;f=spec}
    let lx=0,ly=0;
    if(me.al&&!tp.on&&performance.now()-ms.at<2500){lx=(ms.x-VW/2)*.25;ly=(ms.y-VH/2)*.25}
    cam.x+=(f.x+lx-VW/2-cam.x)*.14;cam.y+=(f.y+ly-VH/2-cam.y)*.14;
    const s=`Alive ${al.length}  Kills ${me.k}`;if(s!=lastSt){lastSt=s;st(s)}
  }

  /* ---------- drawing ---------- */
  function heli(e,t){
    const px=e.x,py=e.y;
    x.save();x.translate(px,py);
    x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(12,16,26,11,e.a,0,PI2);x.fill();
    x.rotate(e.a);
    if(e.bo>0){x.fillStyle='rgba(255,170,40,.8)';x.beginPath();x.moveTo(-30,-3);x.lineTo(-48-R()*10,0);x.lineTo(-30,3);x.fill()}
    x.fillStyle='#2a2a30';x.fillRect(-48,-3,30,6);x.fillRect(-50,-9,7,12);
    x.strokeStyle='#222';x.lineWidth=3;x.beginPath();x.moveTo(-14,-15);x.lineTo(20,-15);x.moveTo(-14,15);x.lineTo(20,15);x.stroke();
    x.fillStyle='#333';x.fillRect(6,-19,16,5);x.fillRect(6,14,16,5);
    x.fillStyle=e.col;x.beginPath();x.ellipse(0,0,25,13,0,0,PI2);x.fill();
    x.fillStyle='rgba(255,255,255,.22)';x.beginPath();x.ellipse(-4,-4,16,4,0,0,PI2);x.fill();
    x.fillStyle='#bfe9ff';x.beginPath();x.ellipse(12,0,9,8,0,0,PI2);x.fill();
    x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(14,-3,4,2.5,0,0,PI2);x.fill();
    x.save();x.rotate(t*.8+e.st);
    x.fillStyle='rgba(20,20,24,.18)';x.beginPath();x.arc(0,0,46,0,PI2);x.fill();
    x.strokeStyle='#15151a';x.lineWidth=4;x.beginPath();x.moveTo(-46,0);x.lineTo(46,0);x.moveTo(0,-46);x.lineTo(0,46);x.stroke();
    x.restore();
    x.fillStyle='#555';x.beginPath();x.arc(0,0,5,0,PI2);x.fill();
    x.restore();
    if(e.sh>0){x.strokeStyle=`rgba(56,189,248,${.3+e.sh/120})`;x.lineWidth=3;x.beginPath();x.arc(px,py,34,0,PI2);x.stroke()}
  }
  const vis=(px,py,m)=>px>cam.x-m&&px<cam.x+VW+m&&py>cam.y-m&&py<cam.y+VH+m;
  function world(){
    // ocean and land
    x.fillStyle='#1d5fa8';x.fillRect(cam.x-10,cam.y-10,VW+20,VH+20);
    x.fillStyle='#e8d9a0';x.fillRect(-40,-40,MAP+80,MAP+80);
    x.fillStyle='#4f8f3f';x.fillRect(0,0,MAP,MAP);
    x.fillStyle='rgba(0,0,0,.05)';
    for(let i=Math.max(0,Math.floor(cam.x/200));i<=Math.min(14,Math.floor((cam.x+VW)/200));i++)
      for(let j=Math.max(0,Math.floor(cam.y/200));j<=Math.min(14,Math.floor((cam.y+VH)/200));j++)if((i+j)%2)x.fillRect(i*200,j*200,200,200);
    for(const l of lakes)if(vis(l.x,l.y,l.r+10)){
      x.fillStyle='#2a78c4';x.beginPath();x.arc(l.x,l.y,l.r,0,PI2);x.fill();
      x.strokeStyle='#5aa5e8';x.lineWidth=6;x.stroke();
    }
    x.strokeStyle='#6b6b70';x.lineWidth=22;x.lineCap='round';
    for(const r of roads){x.beginPath();x.moveTo(r[0].x,r[0].y);x.lineTo(r[1].x,r[1].y);x.stroke()}
    for(const t of towns)if(vis(t.x,t.y,260))for(const b of t.bl){
      x.fillStyle='rgba(0,0,0,.3)';x.fillRect(b.x+6,b.y+8,b.w,b.h);
      x.fillStyle=b.c;x.fillRect(b.x,b.y,b.w,b.h);
      x.fillStyle='rgba(255,255,255,.14)';x.fillRect(b.x,b.y,b.w,b.h/2);
      x.fillStyle='rgba(0,0,0,.25)';x.fillRect(b.x+b.w/2-1,b.y,2,b.h);
    }
    for(const t of trees)if(vis(t.x,t.y,40)){
      x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.arc(t.x+4,t.y+6,t.r,0,PI2);x.fill();
      x.fillStyle='#2d6a2d';x.beginPath();x.arc(t.x,t.y,t.r,0,PI2);x.fill();
      x.fillStyle='#3f8f3f';x.beginPath();x.arc(t.x-t.r*.25,t.y-t.r*.25,t.r*.55,0,PI2);x.fill();
    }
    x.textAlign='center';x.font='bold 14px system-ui';
    crates.forEach((cr,i)=>{
      if(cr.taken||!vis(cr.x,cr.y,40))return;
      const col=CC[cr.k],by=cr.y+Math.sin(T/15+i)*3;
      x.fillStyle=col[0]+'44';x.beginPath();x.arc(cr.x,by,26,0,PI2);x.fill();
      x.fillStyle=col[0];x.fillRect(cr.x-12,by-12,24,24);
      x.strokeStyle='#fff';x.lineWidth=2;x.strokeRect(cr.x-12,by-12,24,24);
      x.fillStyle='#111';x.fillText(col[1],cr.x,by+5);
    });
    // storm
    x.fillStyle='rgba(110,30,190,.4)';x.beginPath();x.rect(cam.x-60,cam.y-60,VW+120,VH+120);x.arc(z.cx,z.cy,Math.max(0,z.r),0,PI2,true);x.fill('evenodd');
    x.strokeStyle='#c084fc';x.lineWidth=6;x.beginPath();x.arc(z.cx,z.cy,Math.max(0,z.r),0,PI2);x.stroke();
    if(z.ph<PH.length){x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=3;x.setLineDash([12,10]);x.beginPath();x.arc(z.tx,z.ty,PH[z.ph].r,0,PI2);x.stroke();x.setLineDash([])}
    // helicopters
    for(const e of E)if(e.al&&e!=me&&vis(e.x,e.y,70))heli(e,T);
    if(me.al)heli(me,T);
    // bullets
    for(const b of bul){
      if(b.k=='r'){x.fillStyle='#ff7a1a';x.beginPath();x.arc(b.x,b.y,5,0,PI2);x.fill();x.fillStyle='#fff3a0';x.beginPath();x.arc(b.x,b.y,2.5,0,PI2);x.fill()}
      else{const mine=b.o==myId;x.strokeStyle=mine?'#ffd21f':'#ff9a9a';x.lineWidth=3;x.shadowColor=x.strokeStyle;x.shadowBlur=8;x.beginPath();x.moveTo(b.x,b.y);x.lineTo(b.x-b.vx*2.2,b.y-b.vy*2.2);x.stroke();x.shadowBlur=0;x.strokeStyle='#fff';x.lineWidth=1.2;x.beginPath();x.moveTo(b.x,b.y);x.lineTo(b.x-b.vx*1,b.y-b.vy*1);x.stroke()}
    }
    for(const p of par){x.globalAlpha=Math.max(0,p.l/p.m);x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,p.s*(.5+p.l/p.m*.5),0,PI2);x.fill()}
    x.globalAlpha=1;
    for(const r of rg){x.globalAlpha=Math.max(0,r.l/r.m);x.strokeStyle=r.c;x.lineWidth=4;x.beginPath();x.arc(r.x,r.y,r.r,0,PI2);x.stroke()}x.globalAlpha=1;
    x.textAlign='center';for(const d of dn){x.globalAlpha=Math.min(1,d.l/18);x.font=`bold ${d.big?20:14}px system-ui`;x.lineWidth=3;x.strokeStyle='#000';x.strokeText('-'+d.v,d.x,d.y);x.fillStyle=d.big?'#ffb020':'#fff';x.fillText('-'+d.v,d.x,d.y)}x.globalAlpha=1;
    // names and bars
    x.font='bold 11px system-ui';x.textAlign='center';
    for(const e of E){
      if(!e.al||e==me||!vis(e.x,e.y,70))continue;
      x.fillStyle='#fff';x.strokeStyle='#000';x.lineWidth=3;x.strokeText(e.name,e.x,e.y-38);x.fillText(e.name,e.x,e.y-38);
      x.fillStyle='#0008';x.fillRect(e.x-20,e.y-33,40,5);x.fillStyle=e.hp>40?'#4ade80':'#f87171';x.fillRect(e.x-20,e.y-33,40*Math.max(0,e.hp)/100,5);
      if(e.sh>0){x.fillStyle='#38bdf8';x.fillRect(e.x-20,e.y-33,40*Math.min(1,e.sh/60),2)}
    }
  }
  const txt=(s,px,py,size,col,al)=>{x.font=`bold ${size}px system-ui`;x.textAlign=al||'left';x.lineWidth=4;x.strokeStyle='#000b';x.strokeText(s,px,py);x.fillStyle=col||'#fff';x.fillText(s,px,py)};
  function hud(){
    const al=alive();
    // storm warning
    if(me.al&&outside(me)){
      const g=x.createRadialGradient(VW/2,VH/2,VH*.3,VW/2,VH/2,VH*.85);g.addColorStop(0,'rgba(140,40,220,0)');g.addColorStop(1,'rgba(140,40,220,.55)');
      x.fillStyle=g;x.fillRect(0,0,VW,VH);
      txt(`IN THE STORM  -${stormDmg()} HP/s`,VW/2,96,18,'#f0abfc','center');
      const a=Math.atan2(z.cy-me.y,z.cx-me.x);x.save();x.translate(VW/2+Math.cos(a)*70,VH/2+Math.sin(a)*70);x.rotate(a);
      x.fillStyle='#f0abfc';x.beginPath();x.moveTo(14,0);x.lineTo(-8,-9);x.lineTo(-8,9);x.fill();x.restore();
    }
    // damage vignette and where it came from
    if(flash>0){const g=x.createRadialGradient(VW/2,VH/2,VH*.3,VW/2,VH/2,VH*.9);g.addColorStop(0,'rgba(255,0,0,0)');g.addColorStop(1,`rgba(255,40,30,${flash})`);x.fillStyle=g;x.fillRect(0,0,VW,VH)}
    for(const d of hd){x.save();x.translate(VW/2,VH/2);x.rotate(d.a);x.globalAlpha=Math.min(1,d.l/25);x.fillStyle='#ff3b30';x.beginPath();x.moveTo(120,0);x.lineTo(100,-12);x.lineTo(100,12);x.fill();x.restore()}x.globalAlpha=1;
    // crosshair, hit marker, kill marker
    {const mouse=performance.now()-ms.at<8000&&!tu.seen;const cx=mouse?ms.x:VW/2,cy=mouse?ms.y:VH/2;
      if(mouse&&me.al){x.strokeStyle='#ffffffcc';x.lineWidth=2;x.beginPath();x.arc(cx,cy,9,0,PI2);x.moveTo(cx-16,cy);x.lineTo(cx-6,cy);x.moveTo(cx+16,cy);x.lineTo(cx+6,cy);x.moveTo(cx,cy-16);x.lineTo(cx,cy-6);x.moveTo(cx,cy+16);x.lineTo(cx,cy+6);x.stroke()}
      if(hm>0&&me.al){const q=7+(14-Math.min(14,hm))*.6,o=5;x.strokeStyle='#fff';x.lineWidth=3;x.globalAlpha=Math.min(1,hm/8);x.beginPath();
        [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{x.moveTo(cx+sx*q,cy+sy*q);x.lineTo(cx+sx*(q+o),cy+sy*(q+o))});x.stroke();x.globalAlpha=1}
      if(km>0){const a=Math.min(1,km/25),q=14+(70-km)*.25;x.globalAlpha=a;x.strokeStyle='#ff3b30';x.lineWidth=4;x.beginPath();
        [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{x.moveTo(cx+sx*q,cy+sy*q);x.lineTo(cx+sx*(q+12),cy+sy*(q+12))});x.stroke();x.globalAlpha=1;
        txt('ELIMINATED '+kt,VW/2,VH/2-90,22,'#ff6b5a','center')}}
    // top left
    txt(`ALIVE ${al.length}`,12,26,20,'#fff');txt(`KILLS ${me.k}`,12,48,14,'#ffd21f');
    feed.slice(-4).forEach((f,i)=>txt(f.s,12,72+i*16,12,'#fff'));
    // zone timer
    const ph=PH[z.ph];
    if(ph){const left=Math.max(0,Math.ceil(z.t<ph.w?ph.w-z.t:ph.w+ph.s-z.t));txt(z.t<ph.w?`Storm closes in ${left}s`:'Storm closing!',VW/2,24,14,z.t<ph.w?'#fff':'#f0abfc','center')}
    else txt('Final storm',VW/2,24,14,'#f0abfc','center');
    // bars
    x.fillStyle='#0009';x.fillRect(12,VH-56,176,40);
    x.fillStyle='#333';x.fillRect(16,VH-52,168,12);x.fillStyle=me.hp>40?'#4ade80':'#f87171';x.fillRect(16,VH-52,168*Math.max(0,me.hp)/100,12);
    x.fillStyle='#333';x.fillRect(16,VH-36,168,6);x.fillStyle='#38bdf8';x.fillRect(16,VH-36,168*Math.min(1,me.sh/60),6);
    txt(`ROCKETS ${me.rk}`,16,VH-20,12,'#fbbf24');if(me.bo>0)txt('BOOST',110,VH-20,12,'#a3e635');
    // minimap
    const mx=VW-114,my=10,s=104,k=s/MAP;
    x.fillStyle='#000a';x.fillRect(mx-2,my-2,s+4,s+4);x.fillStyle='#3a6b30';x.fillRect(mx,my,s,s);
    x.fillStyle='#2a78c4';for(const l of lakes){x.beginPath();x.arc(mx+l.x*k,my+l.y*k,l.r*k,0,PI2);x.fill()}
    x.save();x.beginPath();x.rect(mx,my,s,s);x.clip();
    x.strokeStyle='#d8b4fe';x.lineWidth=2;x.beginPath();x.arc(mx+z.cx*k,my+z.cy*k,Math.max(0,z.r*k),0,PI2);x.stroke();
    if(ph){x.strokeStyle='#fff';x.lineWidth=1;x.beginPath();x.arc(mx+z.tx*k,my+z.ty*k,ph.r*k,0,PI2);x.stroke()}
    for(const e of E)if(e.al&&e!=me&&Math.hypot(e.x-me.x,e.y-me.y)<800){x.fillStyle='#f87171';x.fillRect(mx+e.x*k-2,my+e.y*k-2,4,4)}
    if(me.al){x.fillStyle='#fff';x.beginPath();x.arc(mx+me.x*k,my+me.y*k,3.5,0,PI2);x.fill()}
    x.restore();
    // touch rocket button
    if(tu.seen){x.fillStyle='rgba(245,158,11,.55)';x.beginPath();x.arc(VW-58,VH-58,32,0,PI2);x.fill();txt('ROCKET',VW-58,VH-54,11,'#fff','center')}
    // banners
    if(banner&&T-banner.t<180){x.globalAlpha=Math.min(1,(180-(T-banner.t))/40);txt(banner.s,VW/2,128,22,'#f0abfc','center');x.globalAlpha=1}
    if(grace>0)txt(String(Math.ceil(grace/60)),VW/2,VH/2-60,64,'#fff','center');
    // end screens
    if(endd){
      x.fillStyle='#000a';x.fillRect(0,VH/2-80,VW,160);
      txt(over&&over.win?'VICTORY ROYALE!':'Winner: '+endd.w,VW/2,VH/2-30,34,over&&over.win?'#ffd21f':'#fff','center');
      txt(over&&!over.win?`You placed #${over.place}  |  Kills ${me.k}`:`Kills ${me.k}`,VW/2,VH/2+6,18,'#fff','center');
      txt(!online?'Press Enter or tap for a new match':isHost?'Press Enter or tap to go back to the lobby':'Waiting for the host...',VW/2,VH/2+44,15,'#ffd21f','center');
    }else if(over){
      txt(`You placed #${over.place}. Spectating.`+(!online?' Press Enter for a new match.':''),VW/2,VH-20,14,'#fff','center');
    }
  }
  function draw(){
    if(phase!='play')return;
    x.save();x.fillStyle='#000';x.fillRect(0,0,VW,VH);
    x.translate(-cam.x+(R()-.5)*shake,-cam.y+(R()-.5)*shake);world();x.restore();
    hud();
  }
  function loop(now){
    raf=requestAnimationFrame(loop);
    acc+=Math.min(100,now-last);last=now;
    while(acc>=1000/60){step();acc-=1000/60}
    draw();
  }
  let acc=0,last=performance.now();

  /* ---------- lobby and online ---------- */
  function toLobby(){
    phase='lobby';menu.hidden=true;c.hidden=true;lobby.hidden=false;renderLobby();
  }
  function renderLobby(){
    lobby.replaceChildren();
    const ids=Object.keys(peers).sort();
    lobby.append(mk('h3',{},'Room '+room),mk('p',{class:'sm'},'Pilots here ('+ids.length+'/8):'));
    ids.forEach(id=>lobby.append(mk('p',{class:'sm'},peers[id].name+(id==myId?' (you)':''))));
    if(isHost){
      const b=mk('button',{type:'button'},'Start match');b.onclick=hostStart;
      lobby.append(b,mk('p',{class:'sm'},'Bots fill the rest of the 12 slots. Share the room code with friends first.'));
    }else lobby.append(mk('p',{class:'sm'},'Waiting for the host to start...'));
  }
  function hostStart(){
    const ids=Object.keys(peers).sort(),hs=ids.map(id=>({id,name:peers[id].name})),seed=R()*1e9|0,nb=Math.max(4,TOTAL-hs.length),lv=+lvS.value;
    send({t:'start',seed,hs,nb,lv});startMatch(seed,hs,nb,lv);
  }
  function onMsg(m){
    if(m.t=='hello'){myId=m.id;isHost=!!m.host;peers[myId]={name:nameVal()};send({t:'hi',name:peers[myId].name});toLobby()}
    else if(m.t=='join'){peers[m.id]=peers[m.id]||{name:'Pilot'};send({t:'hi',to:m.id,name:peers[myId].name});if(phase=='lobby')renderLobby()}
    else if(m.t=='hi'){peers[m.i]={name:String(m.name||'Pilot').slice(0,12)};if(phase=='lobby')renderLobby()}
    else if(m.t=='left'){
      delete peers[m.id];
      if(phase=='play'){
        if(m.host&&!isHost){endd={w:'nobody (the host left)'};ovT=T;online=0;st('The host left the match. Press Restart.')}
        else{const e=byId[m.id];if(e&&e.al)die(e,'left')}
      }else if(phase=='lobby')renderLobby();
    }
    else if(m.t=='host'){isHost=true;if(phase=='lobby')renderLobby()}
    else if(m.t=='start'){startMatch(m.seed,m.hs,m.nb,m.lv)}
    else if(m.t=='lobby'){toLobby()}
    else if(m.t=='full'||m.t=='busy'){st(m.t=='full'?'That room is full (8 pilots).':'That match already started. Try another code.');online=0;if(ws)ws.close()}
    else if(phase!='play')return;
    else if(m.t=='st'){const e=byId[m.i];if(e&&!e.bot&&e!=me&&e.al){e.tx=m.x;e.ty=m.y;e.ta=m.a;e.hp=m.hp;e.sh=m.sh}}
    else if(m.t=='sh'){bul.push({x:m.x,y:m.y,vx:m.vx,vy:m.vy,o:m.o,k:m.k,l:m.l,d:m.d})}
    else if(m.t=='pk'){const cr=crates[m.n];if(cr)cr.taken=1}
    else if(m.t=='dead'){const e=byId[m.id];if(e&&e!=me)die(e,m.by)}
    else if(m.t=='snap'&&!isHost){
      z.cx=m.z[0];z.cy=m.z[1];z.r=m.z[2];z.ph=m.z[3];z.t=m.z[4];z.tx=m.z[5];z.ty=m.z[6];
      m.b.forEach(a=>{const e=E[a[0]];if(e&&e.bot&&e.al){e.tx=a[1];e.ty=a[2];e.ta=a[3];e.hp=a[4];e.sh=a[5]}});
    }
  }
  function enter(){
    if(phase!='play'||!(over||endd)||T-ovT<90)return;
    if(!online)startSolo();
    else if(isHost&&endd){send({t:'lobby'});toLobby()}
  }

  /* ---------- buttons and input ---------- */
  b1.onclick=()=>{lvl=+lvS.value;startSolo()};
  b3.onclick=()=>{code.value=Math.random().toString(36).slice(2,6).toUpperCase()};
  b2.onclick=()=>{
    room=code.value.trim().toUpperCase().replace(/\W/g,'');
    if(!room){st('Type a room code, or press New code.');return}
    try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/arena/'+room)}catch{st('Online play only works on the website.');return}
    online=1;peers={};lvl=+lvS.value;st('Connecting...');
    ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}onMsg(m)};
    ws.onclose=()=>{if(!dead&&online)st('Disconnected. Press Restart.')};
  };
  const pt=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*VW/r.width,y:(e.clientY-r.top)*VH/r.height}};
  on(c,'pointerdown',e=>{
    const p=pt(e);
    if(phase=='play'&&(over||endd)&&T-ovT>=90&&e.pointerType!='mouse'){enter();return}
    if(e.pointerType=='mouse'){if(e.button==2)rocketReq=1;else ms.down=1;ms.x=p.x;ms.y=p.y;ms.at=performance.now()}
    else{
      tu.seen=1;
      if(Math.hypot(p.x-(VW-58),p.y-(VH-58))<44){rocketReq=1;return}
      tp.on=1;tp.id=e.pointerId;tp.x=p.x;tp.y=p.y;
    }
  });
  on(c,'pointermove',e=>{
    const p=pt(e);
    if(e.pointerType=='mouse'){ms.x=p.x;ms.y=p.y;ms.at=performance.now()}
    else if(tp.on&&tp.id==e.pointerId){tp.x=p.x;tp.y=p.y}
  });
  on(document,'pointerup',e=>{if(e.pointerType=='mouse')ms.down=0;else if(tp.on&&tp.id==e.pointerId)tp.on=0});
  on(c,'contextmenu',e=>e.preventDefault());
  on(document,'keydown',e=>{
    if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
    const n=e.key.toLowerCase();keys[n]=1;
    if(n.startsWith('arrow')||n==' ')e.preventDefault();
    if(n=='enter')enter();
  });
  on(document,'keyup',e=>{keys[e.key.toLowerCase()]=0});
  on(window,'blur',()=>{for(const k in keys)keys[k]=0;ms.down=0});

  st('Pick a mode.');
  raf=requestAnimationFrame(loop);
  return()=>{dead=1;cancelAnimationFrame(raf);if(ws)ws.close()};
}
