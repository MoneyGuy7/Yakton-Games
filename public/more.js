function clicker(el){
  const U=[['Oven',15,1],['Pizza cook',100,5],['Delivery car',600,25],['Food truck',3000,120],['Pizza factory',15000,600],['Pizza planet',100000,3500]];
  let s={n:0,c:1,own:U.map(()=>0)},note='';try{Object.assign(s,JSON.parse(localStorage.getItem('pc')))}catch{}
  const fmt=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':String(Math.floor(n));
  const rate=()=>U.reduce((t,u,i)=>t+u[2]*s.own[i],0),save=()=>{try{localStorage.setItem('pc',JSON.stringify(s))}catch{}};
  const big=mk('div',{class:'big'}),pz=mk('button',{class:'pz','aria-label':'Make pizza'}),shop=mk('div',{class:'shop'}),gp=mk('button',{class:'goldpz','aria-label':'Golden pizza'},'★');
  gp.hidden=true;el.append(big,pz,shop,gp);
  const items=[['Thicker crust',()=>Math.ceil(50*1.7**(s.c-1)),()=>s.c++,()=>s.c],...U.map((u,i)=>[u[0],()=>Math.ceil(u[1]*1.15**s.own[i]),()=>s.own[i]++,()=>s.own[i]])];
  const bs=items.map(it=>{const b=mk('button');b.onclick=()=>{const p=it[1]();if(s.n>=p){s.n-=p;it[2]();upd()}};shop.append(b);return b});
  function upd(){big.textContent=fmt(s.n)+' pizzas';st(note||`${fmt(rate())} per second, ${s.c} per click`);
    bs.forEach((b,i)=>{const p=items[i][1]();b.disabled=s.n<p;b.textContent=`${items[i][0]} (${items[i][3]()}) - ${fmt(p)}`})}
  pz.onclick=()=>{s.n+=s.c;upd()};
  gp.onclick=()=>{const b=Math.max(50,Math.round(rate()*60));s.n+=b;gp.hidden=true;note='Golden pizza! +'+fmt(b);setTimeout(()=>{note=''},3000)};
  const t=setInterval(()=>{s.n+=rate()/10;upd();if(gp.hidden&&Math.random()<.004){gp.style.left=rnd(80)+'%';gp.style.top=rnd(80)+'%';gp.hidden=false;setTimeout(()=>{gp.hidden=true},8000)}},100),sv=setInterval(save,3000);
  upd();return()=>{clearInterval(t);clearInterval(sv);save()};
}

