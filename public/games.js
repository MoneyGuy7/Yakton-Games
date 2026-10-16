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
  const gr=mk('div',{class:'g4'});let b=Array(16).fill(0),sc=0;el.append(gr);
  const add=()=>{const e=[];b.forEach((v,i)=>v||e.push(i));b[e[rnd(e.length)]]=Math.random()<.9?2:4};
  const slide=r=>{r=r.filter(Boolean);const o=[];for(let i=0;i<r.length;i++){if(r[i]==r[i+1]){o.push(r[i]*2);sc+=r[i]*2;i++}else o.push(r[i])}while(o.length<4)o.push(0);return o};
  const stuck=()=>{if(b.includes(0))return 0;for(let i=0;i<16;i++)if((i%4<3&&b[i]==b[i+1])||(i<12&&b[i]==b[i+4]))return 0;return 1};
  function move(d){const hz='lr'.includes(d),rv='rd'.includes(d),nb=b.slice();let ch=0;
    for(let i=0;i<4;i++){const ix=[0,1,2,3].map(j=>hz?i*4+j:j*4+i);if(rv)ix.reverse();
      const o=slide(ix.map(k=>b[k]));ix.forEach((k,j)=>{if(nb[k]!=o[j])ch=1;nb[k]=o[j]})}
    if(ch){b=nb;add();draw()}}
  function draw(){gr.innerHTML=b.map(v=>`<i class="t"${v?` style="--v:${Math.log2(v)}"`:''}>${v||''}</i>`).join('');
    st(stuck()?`No moves left. Score ${sc}. Best ${best('2048',sc)}.`:'Score '+sc)}
  add();add();draw();dirs(gr,move);
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

