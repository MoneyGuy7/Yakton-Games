function racer(el){
  const W=360,H=560,c=mk('canvas',{width:W,height:H}),x=c.getContext('2d'),LC=[67,142,217,292],cols=['#3b82f6','#22c55e','#f97316','#a855f7','#eab308','#e5e7eb'],k={};el.append(c);
  let px,cars,sp,dist,over,nit,off,bonus,tdir,gap,msg,msgT;
  const score=()=>Math.floor(dist/10)+bonus;
  function reset(){px=LC[1];cars=[];sp=6;dist=0;over=0;nit=100;off=0;bonus=0;tdir=0;gap=100;msgT=0;st('Dodge traffic. Hold Space or Up for nitro.')}
  function car(cx,cy,col,me){
    x.fillStyle='#000a';x.fillRect(cx-17,cy-29,36,64);
    x.fillStyle='#000';[[-20,-20],[14,-20],[-20,12],[14,12]].forEach(w=>x.fillRect(cx+w[0],cy+w[1],6,16));
    x.fillStyle=col;x.fillRect(cx-16,cy-31,32,62);
    x.fillStyle='#0b1220';x.fillRect(cx-12,cy-14,24,14);x.fillRect(cx-12,cy+10,24,8);
    x.fillStyle=me?'#fff':'#fde68a';x.fillRect(cx-14,cy-31,6,4);x.fillRect(cx+8,cy-31,6,4);
    x.fillStyle='#ef4444';x.fillRect(cx-14,cy+27,7,4);x.fillRect(cx+7,cy+27,7,4);
  }
  function tick(){
    if(!over){
      const nb=(k.shift||k[' ']||k.arrowup||k.w)&&nit>0;
      nit=nb?nit-.7:Math.min(100,nit+.12);
      sp=Math.min(13,sp+.0025);const v=sp+(nb?4:0);
      const d=(k.arrowright||k.d||tdir>0?1:0)-(k.arrowleft||k.a||tdir<0?1:0);
      px=Math.max(48,Math.min(312,px+d*5.5));
      off+=v;dist+=v;gap-=v;
      if(gap<0){gap=rnd(120)+260-sp*8;const l=rnd(4);if(!cars.some(e=>e.l==l&&e.y<150))cars.push({l,x:LC[l],y:-70,ev:2+Math.random()*2,col:cols[rnd(6)]})}
      cars.forEach(e=>e.y+=v-e.ev);cars=cars.filter(e=>e.y<H+80);
      for(const e of cars){const dx=Math.abs(e.x-px),dy=Math.abs(e.y-470);
        if(dx<30&&dy<58){over=1;st(`Crashed! ${score()} points. Best ${best('racer',score())}. Click or press Enter.`);break}
        if(!e.pass&&e.y>530){e.pass=1;if(dx<52){bonus+=25;msg='Close call +25';msgT=40}}}
    }
    draw();
  }
  function draw(){
    x.fillStyle='#1c3b2b';x.fillRect(0,0,W,H);x.fillStyle='#2a2a2e';x.fillRect(30,0,300,H);
    x.fillStyle='#f4f4f0';x.fillRect(28,0,4,H);x.fillRect(328,0,4,H);
    for(let l=1;l<4;l++)for(let y=-80+off%80;y<H;y+=80)x.fillRect(30+75*l-2,y,4,40);
    cars.forEach(e=>car(e.x,e.y,e.col));car(px,470,'#e63027',1);
    x.textAlign='left';x.font='bold 18px system-ui';x.fillStyle='#fff';x.fillText(score()+' pts',12,26);x.fillText(Math.round(sp*12)+' km/h',12,48);
    x.fillStyle='#333';x.fillRect(W-112,12,100,10);x.fillStyle='#ffd21f';x.fillRect(W-112,12,Math.max(0,nit),10);
    if(msgT-->0){x.fillStyle='#ffd21f';x.fillText(msg,110,110)}
    if(over){x.fillStyle='#000b';x.fillRect(0,H/2-50,W,100);x.fillStyle='#fff';x.font='36px Impact,"Arial Black",sans-serif';x.fillText('CRASHED',118,H/2+12)}
  }
  on(document,'keydown',e=>{const n=e.key.toLowerCase();k[n]=1;if(n.startsWith('arrow')||n==' ')e.preventDefault();if(over&&n=='enter')reset()});
  on(document,'keyup',e=>{k[e.key.toLowerCase()]=0});
  on(c,'pointerdown',e=>{tdir=e.offsetX<c.clientWidth/2?-1:1});
  on(c,'pointerup',()=>{tdir=0});on(c,'pointerleave',()=>{tdir=0});
  on(c,'click',()=>{if(over)reset()});
  reset();const t=setInterval(tick,16);return()=>clearInterval(t);
}
