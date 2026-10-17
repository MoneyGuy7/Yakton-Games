const $=s=>document.querySelector(s),rnd=n=>Math.random()*n|0;
function mk(t,a={},x=''){const e=document.createElement(t);for(const k in a)e.setAttribute(k,a[k]);e.textContent=x;return e}
let offs=[],stop,cur;
const on=(t,e,f,o)=>{t.addEventListener(e,f,o);offs.push(()=>t.removeEventListener(e,f,o))};
const st=t=>{$('#st').textContent=t};
function best(id,v,low){try{const k='best-'+id,o=localStorage.getItem(k);if(o===null||(low?v<+o:v>+o)){localStorage.setItem(k,v);return v}return +o}catch{return v}}
const K={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',a:'l',d:'r',w:'u',s:'d'};
function dirs(el,cb){
  on(document,'keydown',e=>{const d=K[e.key];if(d){e.preventDefault();cb(d)}});
  let p;on(el,'touchstart',e=>{p=e.touches[0]},{passive:true});
  on(el,'touchend',e=>{if(!p)return;const q=e.changedTouches[0],x=q.clientX-p.clientX,y=q.clientY-p.clientY;
    if(Math.max(Math.abs(x),Math.abs(y))>24)cb(Math.abs(x)>Math.abs(y)?(x<0?'l':'r'):(y<0?'u':'d'))});
}

function g2048(el){
  const wrap=mk('div',{class:'g48'}),bg=mk('div',{class:'g48bg'}),lay=mk('div',{class:'g48tiles'});
  for(let i=0;i<16;i++)bg.append(mk('i',{class:'t'}));
  wrap.append(bg,lay);el.append(wrap);
  let tiles=[],sc=0,uid=0,junk=[],tmo=[];
  const occ=()=>{const g=Array(16).fill(null);tiles.forEach(t=>g[t.r*4+t.c]=t);return g};
  function place(t){t.el.style.setProperty('--r',t.r);t.el.style.setProperty('--c',t.c)}
  function mkTile(v,r,c,cls){const t={id:uid++,v,r,c,el:mk('i',{class:'tl '+(cls||'')},String(v))};t.el.style.setProperty('--v',Math.log2(v));place(t);lay.append(t.el);return t}
  function spawn(){const g=occ(),e=[];g.forEach((t,i)=>t||e.push(i));if(!e.length)return;const i=e[rnd(e.length)];tiles.push(mkTile(Math.random()<.9?2:4,i>>2,i&3,'new'))}
  const stuck=()=>{const g=occ();if(g.includes(null))return 0;for(let i=0;i<16;i++){if((i%4<3&&g[i].v==g[i+1].v)||(i<12&&g[i].v==g[i+4].v))return 0}return 1};
  const flush=()=>{tmo.forEach(clearTimeout);tmo=[];junk.forEach(t=>t.el.remove());junk=[]};
  function move(d){flush();const hz='lr'.includes(d),rv='rd'.includes(d),g=occ();let ch=0;const made=[];
    for(let i=0;i<4;i++){const ix=[0,1,2,3].map(j=>hz?i*4+j:j*4+i);if(rv)ix.reverse();
      const line=ix.map(k=>g[k]).filter(Boolean);let pos=0;
      for(let k=0;k<line.length;k++){const t=line[k],n=line[k+1],tgt=ix[pos];
        const nr=tgt>>2,nc=tgt&3;
        if(n&&n.v==t.v){if(t.r!=nr||t.c!=nc||n.r!=nr||n.c!=nc)ch=1;ch=1;
          t.r=n.r=nr;t.c=n.c=nc;place(t);place(n);junk.push(t,n);sc+=t.v*2;made.push([t.v*2,nr,nc]);k++;pos++}
        else{if(t.r!=nr||t.c!=nc)ch=1;t.r=nr;t.c=nc;place(t);pos++}}}
    if(!ch)return;fx('slide');
    tiles=tiles.filter(t=>!junk.includes(t));
    made.forEach(m=>tiles.push(mkTile(m[0],m[1],m[2],'pop hid')));
    tmo.push(setTimeout(()=>{junk.forEach(t=>t.el.remove());junk=[];lay.querySelectorAll('.hid').forEach(e=>e.classList.remove('hid'));spawn();
      st(stuck()?`No moves left. Score ${sc}. Best ${best('2048',sc)}.`:'Score '+sc)},120));
    st('Score '+sc)}
  spawn();spawn();st('Score 0');dirs(wrap,move);
  return()=>flush();
}

function react(el){
  const b=mk('button',{class:'react'},'Click to start');el.append(b);let t,s=0,tm;
  b.onclick=()=>{
    if(s==0){s=1;b.className='react wait';b.textContent='Wait for green…';
      tm=setTimeout(()=>{s=2;t=performance.now();b.className='react go';b.textContent='Click!'},1000+rnd(2500))}
    else if(s==1){clearTimeout(tm);s=0;b.className='react';b.textContent='Too soon. Click to try again'}
    else{const ms=Math.round(performance.now()-t);s=0;b.className='react';b.textContent='Click to go again';st(`${ms} ms. Best ${best('react',ms,1)} ms.`)}};
  st('Click, then wait for green.');return()=>clearTimeout(tm);
}

