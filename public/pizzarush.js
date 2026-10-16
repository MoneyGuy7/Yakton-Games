// Pizza Rush (upgraded): deliver pizzas through a scrolling city full of traffic.
// Load up at the red P (the bag holds 1 to 3 pizzas), then deliver each one to its glowing house before its timer runs out.
// Fast, clean deliveries pay tips. Crashes spoil the pizza and break your streak. Cash is banked at the end of each shift
// and spent in the Garage under the game on Engine, Tires, Nitro, Pizza bag, Bumpers and Shift clock upgrades.
function rush(el){
  const VW=720,VH=440,DPR=Math.min(2,window.devicePixelRatio||1);
  const CELL=280,RD=84,HR=42,COLS=6,ROWS=4,WW=COLS*CELL+RD,WH=ROWS*CELL+RD,L=20;
  const c=mk('canvas',{width:VW*DPR,height:VH*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${VW}px,100%,calc(72vh*${(VW/VH).toFixed(4)}));height:auto;max-height:none`;
  el.append(c);x.scale(DPR,DPR);
  const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),PI=Math.PI,pick=a=>a[rnd(a.length)];
  const rx=i=>HR+i*CELL,ry=j=>HR+j*CELL;

  /* ---------- garage / upgrades ---------- */
  const UPS=[
    {id:'eng',name:'Engine',desc:'Higher top speed, quicker acceleration',max:5,cost:[40,80,140,220,320]},
    {id:'tire',name:'Tires',desc:'More grip and sharper turns',max:5,cost:[30,60,110,180,260]},
    {id:'nit',name:'Nitro',desc:'Bigger tank, faster refill',max:5,cost:[40,80,140,220,320]},
    {id:'bag',name:'Pizza bag',desc:'Carry more pizzas per trip',max:2,cost:[100,260]},
    {id:'bump',name:'Bumpers',desc:'Crashes spoil less pizza',max:4,cost:[40,90,160,250]},
    {id:'clock',name:'Shift clock',desc:'+6 seconds at the start of every shift',max:5,cost:[30,70,120,190,280]}
  ];
  let bank=0,up={eng:0,tire:0,nit:0,bag:0,bump:0,clock:0};
  try{bank=+localStorage.getItem('rush-bank')||0;const u=JSON.parse(localStorage.getItem('rush-up'));if(u)Object.assign(up,u)}catch(e){}
  const saveG=()=>{try{localStorage.setItem('rush-bank',bank);localStorage.setItem('rush-up',JSON.stringify(up))}catch(e){}};
  const panel=mk('div',{class:'garage'});el.append(panel);
  function renderGarage(){
    panel.innerHTML='';panel.append(mk('h3',{},'Garage  -  $'+bank));
    UPS.forEach(u=>{
      const n=up[u.id]|0,maxed=n>=u.max,price=u.cost[n];
      const b=mk('button',{type:'button'},maxed?'Maxed':'Buy $'+price);b.disabled=maxed||bank<price;
      b.onclick=()=>{if(bank>=price&&n<u.max){bank-=price;up[u.id]=n+1;saveG();sfx('win');renderGarage();hud()}b.blur()};
      const r=mk('div',{class:'grow'}),t=mk('div');t.append(mk('b',{},`${u.name}  ${n}/${u.max}`),mk('small',{},u.desc));r.append(t,b);panel.append(r);
    });
    panel.append(mk('small',{style:'color:#9a9aa3;display:block;margin-top:6px'},'Upgrades apply from your next shift.'));
  }

  /* ---------- the city (built once) ---------- */
  const solids=[],trees=[],houses=[],blocks=[];
  let shop,map,mm;
  (function build(){
    const m=document.createElement('canvas');m.width=WW;m.height=WH;const g=m.getContext('2d');
    g.fillStyle='#3a3a42';g.fillRect(0,0,WW,WH);
    for(let i=0;i<2200;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.045})`;g.fillRect(Math.random()*WW,Math.random()*WH,2,2)}
    const PAL=['#b8574a','#4a7bb8','#c9a24a','#7d5ab8','#4aa387','#b8704a','#6b7a8f','#a84a7d','#5b8a3c','#8a6f4a'];
    const parkSet=new Set();while(parkSet.size<4){const i=rnd(COLS),j=rnd(ROWS);if(!(i==2&&j==1))parkSet.add(i+','+j)}
    for(let i=0;i<COLS;i++)for(let j=0;j<ROWS;j++){
      const x0=rx(i)+HR,y0=ry(j)+HR,x1=rx(i+1)-HR,y1=ry(j+1)-HR,kind=i==2&&j==1?'shop':parkSet.has(i+','+j)?'park':'house';
      blocks.push({x0,y0,x1,y1,kind});
      g.fillStyle='#9a9aa4';g.fillRect(x0,y0,x1-x0,y1-y0);g.strokeStyle='#6e6e78';g.lineWidth=3;g.strokeRect(x0+1.5,y0+1.5,x1-x0-3,y1-y0-3);
      if(kind=='park'){
        g.fillStyle='#3f8f4a';g.fillRect(x0+4,y0+4,x1-x0-8,y1-y0-8);
        g.fillStyle='rgba(255,255,255,.06)';for(let k=0;k<30;k++)g.fillRect(R(x0+6,x1-8),R(y0+6,y1-8),4,2);
        g.fillStyle='#4aa8d8';g.beginPath();g.ellipse((x0+x1)/2,(y0+y1)/2,34,22,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse((x0+x1)/2-8,(y0+y1)/2-6,12,5,0,0,7);g.fill();
        for(let k=0;k<7;k++){const tx=R(x0+22,x1-22),ty=R(y0+22,y1-22);if(Math.hypot(tx-(x0+x1)/2,ty-(y0+y1)/2)<50){k--;continue}trees.push({x:tx,y:ty,r:13})}
      }else if(kind=='shop'){
        const b={x:x0+6,y:y0+6,w:x1-x0-12,h:y1-y0-12};solids.push(b);
        g.fillStyle='rgba(0,0,0,.35)';g.fillRect(b.x+7,b.y+9,b.w,b.h);
        g.fillStyle='#d9381e';g.fillRect(b.x,b.y,b.w,b.h);g.fillStyle='#f2a33a';g.fillRect(b.x+8,b.y+8,b.w-16,b.h-16);
        g.fillStyle='#fff3c4';g.beginPath();g.arc(b.x+b.w/2,b.y+b.h/2-6,46,0,7);g.fill();g.fillStyle='#e63027';
        for(let k=0;k<7;k++){g.beginPath();g.arc(b.x+b.w/2+Math.cos(k*.9)*26,b.y+b.h/2-6+Math.sin(k*.9)*26,8,0,7);g.fill()}
        g.fillStyle='#17171a';g.font='bold 26px Impact,"Arial Black",sans-serif';g.textAlign='center';g.fillText('PIZZA',b.x+b.w/2,b.y+b.h-18);
        g.fillStyle='#fff';for(let k=0;k<10;k++){g.fillStyle=k%2?'#fff':'#e63027';g.fillRect(b.x+k*(b.w/10),b.y+b.h-8,b.w/10,8)}
        shop={x:(x0+x1)/2,y:y1+24};
      }else{
        const bw=(x1-x0-20)/2;
        for(let a=0;a<2;a++)for(let b=0;b<2;b++){
          const B={x:x0+6+a*(bw+8),y:y0+6+b*(bw+8),w:bw,h:bw},col=pick(PAL);solids.push(B);
          g.fillStyle='rgba(0,0,0,.35)';g.fillRect(B.x+6,B.y+8,B.w,B.h);
          g.fillStyle=col;g.fillRect(B.x,B.y,B.w,B.h);
          g.fillStyle='rgba(255,255,255,.18)';g.fillRect(B.x+6,B.y+6,B.w-12,B.h-12);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(B.x+6,B.y+B.h/2-1,B.w-12,2);g.fillRect(B.x+B.w/2-1,B.y+6,2,B.h-12);
          g.fillStyle='rgba(0,0,0,.35)';if(Math.random()<.6)g.fillRect(B.x+R(12,B.w-30),B.y+R(12,B.h-30),16,16);
          const sides=[];if(a==0)sides.push('L');else sides.push('R');if(b==0)sides.push('T');else sides.push('B');
          const sd=pick(sides);let dx,dy;
          if(sd=='L'){dx=x0-24;dy=B.y+B.h/2;g.fillStyle='#f5e6c8';g.fillRect(B.x-2,B.y+B.h/2-8,5,16)}
          else if(sd=='R'){dx=x1+24;dy=B.y+B.h/2;g.fillStyle='#f5e6c8';g.fillRect(B.x+B.w-3,B.y+B.h/2-8,5,16)}
          else if(sd=='T'){dx=B.x+B.w/2;dy=y0-24;g.fillStyle='#f5e6c8';g.fillRect(B.x+B.w/2-8,B.y-2,16,5)}
          else{dx=B.x+B.w/2;dy=y1+24;g.fillStyle='#f5e6c8';g.fillRect(B.x+B.w/2-8,B.y+B.h-3,16,5)}
          houses.push({x:B.x,y:B.y,w:B.w,h:B.h,door:{x:dx,y:dy}});
        }
      }
    }
    // trees
    trees.forEach(t=>{g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.arc(t.x+4,t.y+5,t.r,0,7);g.fill();g.fillStyle='#2a7a3a';g.beginPath();g.arc(t.x,t.y,t.r,0,7);g.fill();g.fillStyle='#3da354';g.beginPath();g.arc(t.x-3,t.y-3,t.r*.6,0,7);g.fill()});
    // lane dashes and crosswalks
    g.strokeStyle='#e8c84a';g.lineWidth=3;g.setLineDash([20,16]);
    for(let j=0;j<=ROWS;j++)for(let i=0;i<COLS;i++){g.beginPath();g.moveTo(rx(i)+HR+14,ry(j));g.lineTo(rx(i+1)-HR-14,ry(j));g.stroke()}
    for(let i=0;i<=COLS;i++)for(let j=0;j<ROWS;j++){g.beginPath();g.moveTo(rx(i),ry(j)+HR+14);g.lineTo(rx(i),ry(j+1)-HR-14);g.stroke()}
    g.setLineDash([]);g.fillStyle='rgba(255,255,255,.7)';
    for(let i=0;i<=COLS;i++)for(let j=0;j<=ROWS;j++){
      if(i<COLS)for(let k=0;k<7;k++)g.fillRect(rx(i)+HR+4,ry(j)-HR+8+k*10.5,8,5);
      if(i>0)for(let k=0;k<7;k++)g.fillRect(rx(i)-HR-12,ry(j)-HR+8+k*10.5,8,5);
      if(j<ROWS)for(let k=0;k<7;k++)g.fillRect(rx(i)-HR+8+k*10.5,ry(j)+HR+4,5,8);
      if(j>0)for(let k=0;k<7;k++)g.fillRect(rx(i)-HR+8+k*10.5,ry(j)-HR-12,5,8);
    }
    map=m;
    mm=document.createElement('canvas');mm.width=120;mm.height=Math.round(120*WH/WW);mm.getContext('2d').drawImage(m,0,0,mm.width,mm.height);
  })();

  /* ---------- state ---------- */
  let p,cam,time,cash,delivered,streak,bestStreak,nit,padT,oilT,over,started,shake,parts,traffic,cones,oils,pads,bag,shopCool,shiftT,deadT,lastTxt,msgs,lastHit;
  let TOP,ACC,GRIP,TURN,NMAX,NREF,CAP,CRASHQ;
  const K={};

  function placeHazards(){
    cones=[];oils=[];pads=[];
    const onRoad=()=>{
      for(let n=0;n<40;n++){
        const horiz=Math.random()<.5;let px,py;
        if(horiz){const j=rnd(ROWS+1),i=rnd(COLS);px=R(rx(i)+HR+50,rx(i+1)-HR-50);py=ry(j)+R(-34,34)}
        else{const i=rnd(COLS+1),j=rnd(ROWS);px=rx(i)+R(-34,34);py=R(ry(j)+HR+50,ry(j+1)-HR-50)}
        if(Math.hypot(px-shop.x,py-shop.y)>170&&!houses.some(h=>Math.hypot(px-h.door.x,py-h.door.y)<70))return{x:px,y:py,horiz};
      }
      return{x:rx(1),y:ry(1)+200,horiz:false};
    };
    for(let i=0;i<34;i++){const q=onRoad();cones.push({x:q.x,y:q.y,down:0,vx:0,vy:0})}
    for(let i=0;i<9;i++){const q=onRoad();oils.push({x:q.x,y:q.y,r:24})}
    for(let i=0;i<9;i++){const q=onRoad();pads.push({x:q.x,y:q.y,horiz:q.horiz})}
  }
  function reset(){
    TOP=230+up.eng*22;ACC=300+up.eng*30;GRIP=8+up.tire*1.1;TURN=2.5+up.tire*.13;NMAX=100+up.nit*20;NREF=7+up.nit*2.5;CAP=1+up.bag;CRASHQ=14-up.bump*2.8;
    p={x:shop.x,y:shop.y,a:PI/2,vx:0,vy:0};cam={x:clamp(p.x-VW/2,0,WW-VW),y:clamp(p.y-VH/2,0,WH-VH)};
    time=70+up.clock*6;cash=0;delivered=0;streak=0;bestStreak=0;nit=NMAX;padT=0;oilT=0;over=false;started=false;shake=0;parts=[];traffic=[];bag=[];shopCool=0;shiftT=0;deadT=0;lastTxt='';msgs=[];lastHit=0;
    placeHazards();renderGarage();hud();
  }
  function hud(){
    const m=over?`Shift over! Earned $${cash}, ${delivered} delivered, best streak ${bestStreak}. Banked. Best shift $${best('rush',cash)}. Press Enter or click to start another.`
      :started?`$${cash}   Bag ${bag.length}/${CAP}   Streak x${streak}   ${Math.round(Math.hypot(p.vx,p.vy)*.28)} km/h`
      :`Press any key or tap to start your shift. Bank $${bank}. Spend it in the Garage below.`;
    if(m!==lastTxt){lastTxt=m;st(m)}
  }
  const score=()=>cash;

  /* ---------- orders ---------- */
  function loadBag(){
    let n=0;
    while(bag.length<CAP){
      let h,tries=0;
      do{h=pick(houses);tries++}while((Math.hypot(h.door.x-shop.x,h.door.y-shop.y)<350||bag.some(o=>o.h==h))&&tries<60);
      const d=Math.hypot(h.door.x-shop.x,h.door.y-shop.y),lv=clamp(shiftT/120,0,1),tm=(8+d/150)*(1-.2*lv);
      bag.push({h,t:tm,tmax:tm,q:100});n++;
    }
    if(n){sfx('hop');say(n>1?'Loaded '+n+' pizzas':'Pizza loaded! Deliver it!')}
    shopCool=1;
  }
  function say(s){msgs.push({s,t:2.2})}

  /* ---------- traffic ---------- */
  function newCar(){
    for(let tries=0;tries<30;tries++){
      const horiz=Math.random()<.5,dir=Math.random()<.5?1:-1;let cx,cy;
      if(horiz){cy=ry(rnd(ROWS+1))+L*dir;cx=R(rx(0),rx(COLS))}else{cx=rx(rnd(COLS+1))-L*dir;cy=R(ry(0),ry(ROWS))}
      if(Math.hypot(cx-p.x,cy-p.y)<320)continue;
      traffic.push({x:cx,y:cy,hx:horiz?dir:0,hy:horiz?0:dir,sp:0,cruise:R(75,125),a:horiz?(dir>0?PI/2:-PI/2):(dir>0?PI:0),col:pick(['#3b82f6','#16a34a','#a855f7','#f97316','#e5e7eb','#0ea5e9','#ef4444']),stun:0,node:''});
      return;
    }
  }
  function stepCar(q,dt){
    const px=q.x,py=q.y;
    if(q.stun>0){q.stun-=dt;q.sp=0}
    // look ahead for anything blocking the lane
    let block=false;
    const chk=(ox,oy)=>{const dx=ox-q.x,dy=oy-q.y,f=dx*q.hx+dy*q.hy,l=Math.abs(-dx*q.hy+dy*q.hx);if(f>0&&f<48&&l<19)block=true};
    chk(p.x,p.y);for(const o of traffic)if(o!==q)chk(o.x,o.y);
    const target=block||q.stun>0?0:q.cruise;q.sp+=clamp(target-q.sp,-340*dt,110*dt);
    q.x+=q.hx*q.sp*dt;q.y+=q.hy*q.sp*dt;
    // drift into the correct lane line
    if(q.hx!=0){const j=clamp(Math.round((q.y-HR)/CELL),0,ROWS),ty=ry(j)+L*q.hx;q.y+=clamp(ty-q.y,-110*dt,110*dt)}
    else{const i=clamp(Math.round((q.x-HR)/CELL),0,COLS),tx=rx(i)-L*q.hy;q.x+=clamp(tx-q.x,-110*dt,110*dt)}
    // choose a direction at each intersection
    const i=clamp(Math.round((q.x-HR)/CELL),0,COLS),j=clamp(Math.round((q.y-HR)/CELL),0,ROWS),nx=rx(i),ny=ry(j);
    const crossed=q.hx!=0?(px-nx)*(q.x-nx)<=0:(py-ny)*(q.y-ny)<=0;
    const key=i+','+j;
    if(crossed&&q.node!=key&&Math.abs(q.x-nx)<HR&&Math.abs(q.y-ny)<HR){
      q.node=key;
      const opts=[];
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      for(const[dx,dy]of dirs){
        if(dx==-q.hx&&dy==-q.hy&&(q.hx||q.hy))continue;
        const ni=i+dx,nj=j+dy;if(ni<0||ni>COLS||nj<0||nj>ROWS)continue;
        opts.push([dx,dy,dx==q.hx&&dy==q.hy?3:1]);
      }
      if(!opts.length)opts.push([-q.hx,-q.hy,1]);
      let tot=opts.reduce((a,b)=>a+b[2],0),r=Math.random()*tot,ch=opts[0];
      for(const o of opts){if(r<o[2]){ch=o;break}r-=o[2]}
      q.hx=ch[0];q.hy=ch[1];
    }
    const ta=Math.atan2(q.hx,-q.hy);let d=ta-q.a;while(d>PI)d-=2*PI;while(d<-PI)d+=2*PI;q.a+=d*Math.min(1,8*dt);
  }

  /* ---------- physics ---------- */
  function crash(imp,weak){
    if(imp>110&&!weak){
      shake=.3;sfx('crash');lastHit=.5;
      if(bag.length){bag.forEach(o=>o.q=Math.max(20,o.q-CRASHQ));if(streak>0)say('Streak lost!');streak=0}
      for(let i=0;i<10;i++)parts.push({x:p.x,y:p.y,vx:R(-160,160),vy:R(-160,160),life:R(.3,.7),col:pick(['#ffd21f','#fff','#f97316']),r:R(2,4)});
    }else if(imp>45){sfx('bump')}
  }
  function pushRect(r,rad){
    const cx=clamp(p.x,r.x,r.x+r.w),cy=clamp(p.y,r.y,r.y+r.h);let dx=p.x-cx,dy=p.y-cy,d=Math.hypot(dx,dy);
    if(d>=rad)return 0;
    if(d<.001){dx=0;dy=-1;d=1}
    const nx=dx/d,ny=dy/d;p.x+=nx*(rad-d);p.y+=ny*(rad-d);
    const vn=p.vx*nx+p.vy*ny;if(vn<0){p.vx-=1.45*vn*nx;p.vy-=1.45*vn*ny;p.vx*=.8;p.vy*=.8;return -vn}
    return 0;
  }
  function pushCircle(cx,cy,cr,rad){
    const dx=p.x-cx,dy=p.y-cy,d=Math.hypot(dx,dy)||1;if(d>=rad+cr)return 0;
    const nx=dx/d,ny=dy/d;p.x+=nx*(rad+cr-d);p.y+=ny*(rad+cr-d);
    const vn=p.vx*nx+p.vy*ny;if(vn<0){p.vx-=1.5*vn*nx;p.vy-=1.5*vn*ny;return -vn}return 0;
  }
  const inPark=()=>blocks.some(b=>b.kind=='park'&&p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1);
  function update(dt){
    time0+=dt;
    parts=parts.filter(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=1-1.5*dt;q.vy*=1-1.5*dt;q.life-=dt;return q.life>0});
    msgs=msgs.filter(m=>(m.t-=dt)>0);
    if(shake>0)shake-=dt;if(lastHit>0)lastHit-=dt;
    if(over){deadT+=dt;for(const q of traffic)stepCar(q,dt);hud();return}
    if(!started){for(const q of traffic)stepCar(q,dt);hud();return}
    shiftT+=dt;time-=dt;
    if(time<=0){time=0;over=true;deadT=0;bank+=cash;saveG();renderGarage();sfx('win');hud();return}
    if(time<10&&Math.floor(time*2)!=Math.floor((time+dt)*2)&&Math.floor(time)!=Math.floor(time+dt))sfx('warn');
    const gas=K.arrowup||K.w||K.gas,brk=K.arrowdown||K.s||K.brake,lt=K.arrowleft||K.a||K.left,rt=K.arrowright||K.d||K.right,hb=K[' ']||K.hb,bst=(K.shift||K.boost)&&nit>0&&(gas||true);
    const fx=Math.sin(p.a),fy=-Math.cos(p.a),rxn=Math.cos(p.a),ryn=Math.sin(p.a);
    let vf=p.vx*fx+p.vy*fy,vl=p.vx*rxn+p.vy*ryn;
    const boosting=bst||padT>0;
    const top=TOP*(boosting?1.5:1),acc=ACC*(boosting?1.9:1);
    if(bst){nit=Math.max(0,nit-48*dt);for(let i=0;i<2;i++)parts.push({x:p.x-fx*14+R(-3,3),y:p.y-fy*14+R(-3,3),vx:-fx*120+R(-30,30),vy:-fy*120+R(-30,30),life:.3,col:pick(['#ffd21f','#f97316','#fff']),r:R(2,5)})}
    else nit=Math.min(NMAX,nit+NREF*dt);
    if(padT>0)padT-=dt;
    if(gas||bst){if(vf<top)vf+=acc*dt;else vf*=Math.exp(-1.2*dt)}
    if(brk){if(vf>8)vf-=560*dt;else vf=Math.max(-90,vf-acc*.55*dt)}
    vf*=Math.exp(-(inPark()?2.6:.32)*dt);
    let grip=GRIP;if(hb){grip=2.3;vf*=Math.exp(-.7*dt)}if(oilT>0){grip=1.1;oilT-=dt}
    vl*=Math.exp(-grip*dt);
    const steer=(rt?1:0)-(lt?1:0);
    p.a+=steer*TURN*(hb?1.5:1)*dt*clamp(vf/80,-1,1)/(1+Math.abs(vf)/520);
    p.vx=fx*vf+rxn*vl;p.vy=fy*vf+ryn*vl;
    if(Math.abs(vl)>70&&Math.random()<dt*30)parts.push({x:p.x-fx*8,y:p.y-fy*8,vx:R(-20,20),vy:R(-20,20),life:.5,col:'rgba(220,220,220,.6)',r:R(3,6)});
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    // collisions
    let imp=0;
    for(const b of solids){if(Math.abs(p.x-(b.x+b.w/2))<b.w/2+30&&Math.abs(p.y-(b.y+b.h/2))<b.h/2+30)imp=Math.max(imp,pushRect(b,10))}
    for(const t of trees)if(Math.abs(p.x-t.x)<40&&Math.abs(p.y-t.y)<40)imp=Math.max(imp,pushCircle(t.x,t.y,t.r,9));
    if(p.x<10){p.x=10;if(p.vx<0){imp=Math.max(imp,-p.vx);p.vx*=-.4}}if(p.x>WW-10){p.x=WW-10;if(p.vx>0){imp=Math.max(imp,p.vx);p.vx*=-.4}}
    if(p.y<10){p.y=10;if(p.vy<0){imp=Math.max(imp,-p.vy);p.vy*=-.4}}if(p.y>WH-10){p.y=WH-10;if(p.vy>0){imp=Math.max(imp,p.vy);p.vy*=-.4}}
    // traffic
    const lv=clamp(shiftT/120,0,1),want=6+Math.floor(lv*9);
    if(traffic.length<want&&Math.random()<dt*2)newCar();
    for(const q of traffic){
      stepCar(q,dt);
      const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);
      if(d<23){
        const nx=dx/(d||1),ny=dy/(d||1);p.x+=nx*(23-d);p.y+=ny*(23-d);
        const rv=(p.vx-q.hx*q.sp)*nx+(p.vy-q.hy*q.sp)*ny;
        if(rv<0){p.vx-=1.3*rv*nx;p.vy-=1.3*rv*ny;p.vx*=.85;p.vy*=.85;imp=Math.max(imp,-rv*1.15);q.stun=.9}
      }
    }
    if(imp>0)crash(imp);
    // hazards
    for(const q of cones){
      if(q.down){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=1-3*dt;q.vy*=1-3*dt;continue}
      if(Math.hypot(p.x-q.x,p.y-q.y)<15){q.down=1;q.vx=p.vx*.7+R(-30,30);q.vy=p.vy*.7+R(-30,30);p.vx*=.88;p.vy*=.88;sfx('bump')}
    }
    for(const q of oils)if(Math.hypot(p.x-q.x,p.y-q.y)<q.r){if(oilT<=0)sfx('slide');oilT=.8}
    for(const q of pads)if(Math.abs(p.x-q.x)<(q.horiz?26:17)&&Math.abs(p.y-q.y)<(q.horiz?17:26)){if(padT<.5){sfx('swipe');nit=Math.min(NMAX,nit+25)}padT=1.2}
    // shop and deliveries
    if(shopCool>0)shopCool-=dt;
    if(shopCool<=0&&bag.length<CAP&&Math.hypot(p.x-shop.x,p.y-shop.y)<36)loadBag();
    for(const o of bag){o.t-=dt}
    for(let i=bag.length-1;i>=0;i--){
      const o=bag[i];
      if(Math.hypot(p.x-o.h.door.x,p.y-o.h.door.y)<34){
        const late=o.t<=0;bag.splice(i,1);delivered++;
        let pay;
        if(late){pay=4;streak=0;time+=2;say('Late! +$'+pay)}
        else{
          streak++;bestStreak=Math.max(bestStreak,streak);
          const tip=Math.round(12*(o.q/100)*clamp(o.t/o.tmax,0,1));
          pay=Math.round((8+tip)*(1+.1*Math.min(streak-1,5)));time+=6;
          say(`+$${pay}${tip>=8?'  Great tip!':o.q<60?'  Cold pizza':''}${streak>1?'  x'+streak+' streak':''}`);
        }
        cash+=pay;sfx(late?'bump':'coin');
        for(let k=0;k<14;k++)parts.push({x:o.h.door.x,y:o.h.door.y,vx:R(-150,150),vy:R(-180,40),life:R(.5,1),col:pick(['#ffd21f','#fff','#34d399']),r:R(2,4)});
      }
    }
    // camera
    const tx=clamp(p.x+p.vx*.35-VW/2,0,WW-VW),ty=clamp(p.y+p.vy*.35-VH/2,0,WH-VH);
    cam.x+=(tx-cam.x)*Math.min(1,5*dt);cam.y+=(ty-cam.y)*Math.min(1,5*dt);
    hud();
  }
  let time0=0;

  /* ---------- drawing ---------- */
  function text(s,px,py,size,col,al){x.font=`${size}px Impact,"Arial Black",sans-serif`;x.textAlign=al||'center';x.lineWidth=Math.max(3,size/7);x.strokeStyle='#000b';x.strokeText(s,px,py);x.fillStyle=col;x.fillText(s,px,py)}
  function sprite(px,py,a,col,player,boost){
    x.save();x.translate(px,py);x.rotate(a);
    x.fillStyle='rgba(0,0,0,.35)';x.fillRect(-8,-11,16,27);
    x.fillStyle='#111';x.fillRect(-8,-9,2.5,7);x.fillRect(5.5,-9,2.5,7);x.fillRect(-8,5,2.5,7);x.fillRect(5.5,5,2.5,7);
    x.fillStyle=col;x.fillRect(-6.5,-13,13,26);x.fillStyle='rgba(255,255,255,.22)';x.fillRect(-6.5,-13,13,6);
    x.fillStyle='#0b1220';x.fillRect(-5,-7,10,5);x.fillRect(-5,4,10,4);
    x.fillStyle='#fde68a';x.fillRect(-6,-14,3,2);x.fillRect(3,-14,3,2);
    x.fillStyle='#ff4d4d';x.fillRect(-6,12,3,1.5);x.fillRect(3,12,3,1.5);
    if(player){x.fillStyle='#ffd21f';x.fillRect(-4,-1,8,5);x.fillStyle='#e63027';x.fillRect(-1,0,2,3)}
    x.restore();
  }
  function ring(px,py,r,col,frac){x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=6;x.beginPath();x.arc(px,py,r,0,7);x.stroke();x.strokeStyle=col;x.lineWidth=4;x.beginPath();x.arc(px,py,r,-PI/2,-PI/2+2*PI*frac);x.stroke()}
  function draw(){
    x.save();
    const sx=shake>0?R(-3,3):0,sy=shake>0?R(-3,3):0;
    x.translate(sx,sy);
    x.drawImage(map,cam.x,cam.y,VW,VH,0,0,VW,VH);
    x.translate(-cam.x,-cam.y);
    const vis=(px,py,m)=>px>cam.x-m&&px<cam.x+VW+m&&py>cam.y-m&&py<cam.y+VH+m;
    // road hazards
    for(const q of oils){if(!vis(q.x,q.y,40))continue;x.fillStyle='rgba(20,10,40,.75)';x.beginPath();x.ellipse(q.x,q.y,q.r,q.r*.7,.3,0,7);x.fill();x.fillStyle='rgba(120,80,255,.25)';x.beginPath();x.ellipse(q.x-4,q.y-3,q.r*.5,q.r*.3,.3,0,7);x.fill()}
    for(const q of pads){if(!vis(q.x,q.y,40))continue;x.save();x.translate(q.x,q.y);if(!q.horiz)x.rotate(PI/2);
      x.fillStyle='#111';x.fillRect(-26,-16,52,32);x.fillStyle='#22d3ee';for(let k=0;k<3;k++){const o=((time0*60+k*14)%42)-21;x.globalAlpha=1-Math.abs(o)/24;x.beginPath();x.moveTo(o-8,-11);x.lineTo(o+6,0);x.lineTo(o-8,11);x.lineTo(o-3,0);x.fill()}x.globalAlpha=1;x.restore()}
    for(const q of cones){if(!vis(q.x,q.y,30))continue;
      if(q.down){x.fillStyle='#f97316';x.save();x.translate(q.x,q.y);x.rotate(q.x*.1);x.fillRect(-7,-3,14,6);x.restore()}
      else{x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.arc(q.x+2,q.y+2,7,0,7);x.fill();x.fillStyle='#f97316';x.beginPath();x.arc(q.x,q.y,6,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(q.x,q.y,3.2,0,7);x.fill();x.fillStyle='#f97316';x.beginPath();x.arc(q.x,q.y,1.5,0,7);x.fill()}}
    // shop zone and delivery markers
    const pulse=Math.sin(time0*5)*3;
    if(vis(shop.x,shop.y,60)){const full=bag.length>=CAP;x.fillStyle=full?'rgba(120,120,120,.5)':'rgba(230,48,39,.9)';x.beginPath();x.arc(shop.x,shop.y,24+(full?0:pulse),0,7);x.fill();x.fillStyle='#fff';x.font='bold 22px system-ui';x.textAlign='center';x.fillText('P',shop.x,shop.y+8)}
    bag.forEach((o,i)=>{const d=o.h.door;if(!vis(d.x,d.y,60))return;const late=o.t<=0,col=late?'#ef4444':o.t<5?'#f59e0b':'#22c55e';
      x.fillStyle=late?'rgba(239,68,68,.35)':'rgba(255,210,31,.9)';x.beginPath();x.arc(d.x,d.y,22+pulse,0,7);x.fill();ring(d.x,d.y,28,col,late?0:clamp(o.t/o.tmax,0,1));
      x.fillStyle='#111';x.font='bold 20px system-ui';x.textAlign='center';x.fillText('$',d.x,d.y+7)});
    // cars
    for(const q of traffic)if(vis(q.x,q.y,40))sprite(q.x,q.y,q.a,q.col);
    for(const q of parts){x.globalAlpha=clamp(q.life*2.5,0,1);x.fillStyle=q.col;x.fillRect(q.x-q.r/2,q.y-q.r/2,q.r,q.r)}x.globalAlpha=1;
    if(padT>0||(K.shift||K.boost)&&nit>0&&started){x.fillStyle='rgba(34,211,238,.25)';x.beginPath();x.arc(p.x,p.y,24,0,7);x.fill()}
    sprite(p.x,p.y,p.a,lastHit>0&&Math.floor(time0*20)%2?'#fff':'#e63027',true);
    // arrow to target
    let tg=shop;if(bag.length){let bd=1e9;for(const o of bag){const d=Math.hypot(o.h.door.x-p.x,o.h.door.y-p.y);if(d<bd){bd=d;tg=o.h.door}}}
    if(started&&!over){const g=Math.atan2(tg.x-p.x,-(tg.y-p.y));x.save();x.translate(p.x+Math.sin(g)*38,p.y-Math.cos(g)*38);x.rotate(g);x.fillStyle=bag.length?'#ffd21f':'#ff6b5e';x.strokeStyle='#000a';x.lineWidth=2;x.beginPath();x.moveTo(0,-9);x.lineTo(7,7);x.lineTo(0,3);x.lineTo(-7,7);x.closePath();x.fill();x.stroke();x.restore()}
    x.restore();
    // tint toward evening as the shift gets long
    const dusk=clamp(shiftT/150,0,1)*.28;if(dusk>0){x.fillStyle=`rgba(40,20,90,${dusk})`;x.fillRect(0,0,VW,VH)}
    hudDraw();
    if(!started){x.fillStyle='#000a';x.fillRect(0,VH/2-84,VW,170);text('PIZZA RUSH',VW/2,VH/2-26,54,'#ffd21f');x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';
      x.fillText('Tap or press any key to start your shift',VW/2,VH/2+8);x.fillText('Arrows or WASD drive   Shift: nitro   Space: handbrake drift',VW/2,VH/2+32);x.fillStyle='#b9f6ca';x.fillText('Grab pizzas at the red P, deliver them fast, dodge traffic',VW/2,VH/2+58)}
    if(over&&deadT>.4){x.fillStyle='#000c';x.fillRect(0,VH/2-96,VW,192);text('SHIFT OVER',VW/2,VH/2-36,52,'#ffd21f');text('$'+cash+'  earned',VW/2,VH/2+8,32,'#fff');
      x.font='16px system-ui';x.textAlign='center';x.fillStyle='#fff';x.fillText(delivered+' delivered   best streak '+bestStreak+'   bank $'+bank,VW/2,VH/2+40);x.fillText('Spend your cash in the Garage, then press Enter or tap',VW/2,VH/2+66)}
  }
  function hudDraw(){
    text('$'+cash,14,38,34,'#fff','left');
    const low=time<10;text(Math.ceil(time)+'s',VW/2,38,34,low&&Math.floor(time0*4)%2?'#ef4444':'#fff');
    if(streak>1)text('x'+streak+' streak',14,64,18,'#ffd21f','left');
    // nitro bar
    x.fillStyle='#0008';x.fillRect(14,VH-26,130,12);x.fillStyle='#22d3ee';x.fillRect(15,VH-25,128*(nit/NMAX),10);x.font='11px system-ui';x.textAlign='left';x.fillStyle='#fff';x.fillText('NITRO (Shift)',16,VH-30);
    // pizza orders
    bag.forEach((o,i)=>{const yy=84+i*22,late=o.t<=0;x.fillStyle='#0009';x.fillRect(VW-150,yy-14,136,19);x.fillStyle=late?'#ef4444':o.t<5?'#f59e0b':'#22c55e';x.fillRect(VW-150,yy-14,136*clamp(o.t/o.tmax,0,1),19);
      x.fillStyle='#fff';x.font='bold 12px system-ui';x.textAlign='left';x.fillText(`Pizza ${i+1}  ${late?'LATE':Math.ceil(o.t)+'s'}  ${o.q}%`,VW-144,yy);});
    // messages
    msgs.forEach((m,i)=>{x.globalAlpha=clamp(m.t,0,1);text(m.s,VW/2,100+i*26,22,'#ffd21f');x.globalAlpha=1});
    // minimap
    const mx=VW-132,my=VH-mm.height-12;x.fillStyle='#000a';x.fillRect(mx-3,my-3,mm.width+6,mm.height+6);x.drawImage(mm,mx,my);
    const sc=mm.width/WW;
    x.fillStyle='#e63027';x.fillRect(mx+shop.x*sc-3,my+shop.y*sc-3,6,6);
    bag.forEach(o=>{x.fillStyle='#ffd21f';x.beginPath();x.arc(mx+o.h.door.x*sc,my+o.h.door.y*sc,3.2,0,7);x.fill()});
    x.fillStyle='#fff';traffic.forEach(q=>x.fillRect(mx+q.x*sc-1,my+q.y*sc-1,2,2));
    x.fillStyle='#38bdf8';x.beginPath();x.arc(mx+p.x*sc,my+p.y*sc,3,0,7);x.fill();
    x.strokeStyle='#fff6';x.lineWidth=1;x.strokeRect(mx+cam.x*sc,my+cam.y*sc,VW*sc,VH*sc);
  }

  /* ---------- input and loop ---------- */
  const used=new Set(['arrowup','arrowdown','arrowleft','arrowright',' ']);
  on(document,'keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const n=e.key.toLowerCase();
    if(used.has(n))e.preventDefault();
    if(over){if((n=='enter'||n==' ')&&deadT>.4)reset();return}
    K[n]=1;
    if(!started&&(used.has(n)||'wasd'.includes(n)&&n.length==1||n=='enter'||n=='shift')){started=true;hud()}
  });
  on(document,'keyup',e=>{K[e.key.toLowerCase()]=0});
  on(c,'pointerdown',()=>{if(over){if(deadT>.4)reset()}else if(!started){started=true;hud()}});
  // touch buttons (shown on touch screens)
  if(window.matchMedia&&matchMedia('(pointer:coarse)').matches){
    const bar=mk('div',{style:'display:flex;gap:6px;flex-wrap:wrap;justify-content:center;touch-action:none;user-select:none'});
    [['◀','left'],['▶','right'],['Gas','gas'],['Brake','brake'],['Nitro','boost'],['Drift','hb']].forEach(([lab,key])=>{
      const b=mk('button',{type:'button',class:'ghost'},lab);b.style.cssText='min-width:64px;padding:12px 10px;touch-action:none';
      const down=e=>{e.preventDefault();K[key]=1;if(!started&&!over){started=true;hud()}},upf=()=>{K[key]=0};
      b.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,upf));bar.append(b)});
    el.insertBefore(bar,panel);
  }
  reset();
  c.__pr={step(dt){update(dt)},st(){return{p,cam,time,cash,delivered,streak,over,started,bag,traffic,nit,houses,shop,CAP,TOP}},K,setUp(u){Object.assign(up,u)},reset,manual(v){manual=v}};
  let manual=false,last=performance.now(),raf;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!manual)update(dt);draw();raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf);
}
