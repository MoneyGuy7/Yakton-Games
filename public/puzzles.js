// Step 11 puzzles: Sudoku, Connect 4 (computer, two players, or online with a room code), Solitaire (Klondike), Lights Out, Slide Puzzle.
function zbar(el,items){const d=mk('div',{class:'zbar'});el.append(d);const bs=items.map(([t,f])=>{const b=mk('button',{type:'button'},t);b.onclick=()=>f(b,bs);d.append(b);return b});return bs}
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const zsfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};

/* ------------------------------ Sudoku ------------------------------ */
const SUDOKU={
  cand(g,i){const r=i/9|0,c=i%9,u=new Set();for(let k=0;k<9;k++){u.add(g[r*9+k]);u.add(g[k*9+c])}const br=r-r%3,bc=c-c%3;for(let a=0;a<3;a++)for(let b=0;b<3;b++)u.add(g[(br+a)*9+bc+b]);const o=[];for(let v=1;v<10;v++)if(!u.has(v))o.push(v);return o},
  count(g,lim){let bi=-1,bc=null;for(let i=0;i<81;i++)if(!g[i]){const c=SUDOKU.cand(g,i);if(!c.length)return 0;if(!bc||c.length<bc.length){bi=i;bc=c;if(c.length==1)break}}
    if(bi<0)return 1;let n=0;for(const v of bc){g[bi]=v;n+=SUDOKU.count(g,lim-n);g[bi]=0;if(n>=lim)break}return n},
  solved(){const g=Array(81).fill(0);const f=()=>{let bi=-1,bc=null;for(let i=0;i<81;i++)if(!g[i]){const c=SUDOKU.cand(g,i);if(!bc||c.length<bc.length){bi=i;bc=c}}if(bi<0)return true;for(const v of shuf(bc)){g[bi]=v;if(f())return true}g[bi]=0;return false};f();return g},
  make(keep){const sol=SUDOKU.solved(),g=sol.slice();for(const i of shuf([...Array(81).keys()])){if(g.filter(Boolean).length<=keep)break;const v=g[i];g[i]=0;if(SUDOKU.count(g.slice(),2)!=1)g[i]=v}return{sol,g}}
};
function sudoku(el){
  let sol,giv,val,notes,sel=-1,diff='Medium',nm=false,t0,done,miss=0;
  const grid=mk('div',{class:'sdg'}),pad=mk('div',{class:'sdp'});el.append(grid);
  const dbar=zbar(el,['Easy','Medium','Hard'].map(d=>[d,()=>newGame(d)]));
  const abar=zbar(el,[['Notes: off',b=>{nm=!nm;b.textContent='Notes: '+(nm?'on':'off');b.classList.toggle('on',nm)}],['Hint',()=>hint()],['Erase',()=>put(0)]]);
  el.append(pad);for(let v=1;v<10;v++){const b=mk('button',{type:'button'},v);b.onclick=()=>put(v);pad.append(b)}
  const cells=[...Array(81)].map((_,i)=>{const b=mk('button',{type:'button','aria-label':'cell '+(i+1)});b.onclick=()=>{sel=i;draw()};grid.append(b);return b});
  function newGame(d){diff=d;st('Making a puzzle...');setTimeout(()=>{const r=SUDOKU.make({Easy:40,Medium:33,Hard:27}[d]);sol=r.sol;giv=r.g;val=giv.slice();notes=Array.from({length:81},()=>new Set());sel=-1;done=false;miss=0;t0=Date.now();
    dbar.forEach(b=>b.classList.toggle('on',b.textContent==d));draw()},20)}
  function put(v){if(sel<0||giv[sel]||done)return;
    if(nm&&v){const n=notes[sel];n.has(v)?n.delete(v):n.add(v);val[sel]=0}
    else{val[sel]=v;notes[sel].clear();if(v&&v!=sol[sel]){miss++;zsfx('bump')}else if(v)zsfx('hop');
      if(v){const r=sel/9|0,c=sel%9;for(let k=0;k<9;k++){notes[r*9+k].delete(v);notes[k*9+c].delete(v)}}}
    draw();check()}
  function hint(){if(done)return;const e=[];val.forEach((v,i)=>{if(v!=sol[i])e.push(i)});if(!e.length)return;const i=e[rnd(e.length)];val[i]=sol[i];notes[i].clear();sel=i;miss++;draw();check()}
  function check(){if(val.every((v,i)=>v==sol[i])){done=true;const s=Math.round((Date.now()-t0)/1000);zsfx('win');st(`Solved in ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} with ${miss} mistake${miss==1?'':'s'}. Best ${best('sudoku-'+diff,s,1)}s on ${diff}.`)}}
  function draw(){if(!val)return;const sv=sel>=0?val[sel]:0,sr=sel/9|0,sc=sel%9;
    cells.forEach((b,i)=>{const v=val[i],r=i/9|0,c=i%9;let k=(c%3==2&&c<8?'r3 ':'')+((r%3==2&&r<8)?'b3 ':'');
      if(giv[i])k+='g ';if(i==sel)k+='se ';else if(sv&&v==sv)k+='sm ';else if(sel>=0&&(r==sr||c==sc||((r/3|0)==(sr/3|0)&&(c/3|0)==(sc/3|0))))k+='pe ';
      if(v&&!giv[i]&&v!=sol[i])k+='bad ';
      if(!v&&notes[i].size){k+='nt ';b.innerHTML=[1,2,3,4,5,6,7,8,9].map(n=>`<i style="font-style:normal">${notes[i].has(n)?n:''}</i>`).join('')}else b.textContent=v||'';
      b.className=k.trim()})}
  on(document,'keydown',e=>{if(!val)return;if(e.key>='1'&&e.key<='9'){put(+e.key)}else if(e.key=='Backspace'||e.key=='Delete'||e.key=='0')put(0);
    else if(e.key.startsWith('Arrow')){e.preventDefault();if(sel<0)sel=40;else{const d={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9}[e.key];const n=sel+d;if(n>=0&&n<81&&!(d==-1&&sel%9==0)&&!(d==1&&sel%9==8))sel=n}draw()}else if(e.key=='n'||e.key=='N')abar[0].click()});
  const tm=setInterval(()=>{if(!done&&t0){const s=Math.round((Date.now()-t0)/1000);st(`${diff}   ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}   mistakes ${miss}`)}},1000);
  newGame('Medium');return()=>clearInterval(tm);
}

/* ------------------------------ Connect 4 ------------------------------ */
function connect4(el){
  const W=560,H=520,CW=80,DPR=Math.min(2,devicePixelRatio||1),c=mk('canvas',{width:W*DPR,height:H*DPR}),x=c.getContext('2d');
  c.style.cssText=`width:min(${W}px,100%);height:auto;max-height:none`;x.scale(DPR,DPR);
  let mode='cpu',lvl=3,b,turn,over,anim,hover=3,ws=null,me=1,room='',wait=0,win=null,sc=[0,0];
  const bar=zbar(el,[['vs Computer',()=>setMode('cpu')],['2 Players',()=>setMode('two')],['Online',()=>setMode('net')],['Easy',()=>lvl=1],['Normal',()=>lvl=3],['Hard',()=>lvl=5]]);
  const nbar=mk('div',{class:'zbar'});const code=mk('input',{placeholder:'ROOM CODE',maxlength:12,'aria-label':'Room code'}),jb=mk('button',{type:'button'},'Join'),nb=mk('button',{type:'button'},'New code');nbar.append(code,jb,nb);nbar.hidden=true;
  el.append(nbar,c);
  const setLvl=()=>bar.slice(3).forEach((q,i)=>q.classList.toggle('on',[1,3,5][i]==lvl));
  bar.slice(3).forEach(q=>q.addEventListener('click',()=>{setLvl();reset()}));
  function setMode(m){mode=m;bar.slice(0,3).forEach((q,i)=>q.classList.toggle('on',['cpu','two','net'][i]==m));nbar.hidden=m!='net';bar.slice(3).forEach(q=>q.hidden=m!='cpu');if(ws){ws.close();ws=null}wait=0;reset();if(m=='net')st('Type a room code (or press New code), then Join. Your friend uses the same code.')}
  function reset(){b=Array.from({length:7},()=>[]);turn=1;over=0;anim=null;win=null;if(mode!='net'||ws)msg();draw()}
  const msg=()=>{if(over)return;st(mode=='net'?(wait?'Waiting for a friend. Room code: '+room:(turn==me?'Your turn':'Their turn')):mode=='cpu'?(turn==1?'Your turn (red)':'Computer thinking...'):(turn==1?'Red to move':'Yellow to move'))};
  const at=(B,col,r)=>B[col][r]||0;
  function wins(B,p){for(let cl=0;cl<7;cl++)for(let r=0;r<6;r++){if(at(B,cl,r)!=p)continue;for(const[dx,dy]of[[1,0],[0,1],[1,1],[1,-1]]){const l=[];for(let k=0;k<4;k++){const X=cl+dx*k,Y=r+dy*k;if(X>6||Y<0||Y>5||at(B,X,Y)!=p)break;l.push([X,Y])}if(l.length==4)return l}}return null}
  function score(B,p){let s=0;const q=3-p;const win=cells=>{let a=0,o=0;for(const[X,Y]of cells){const v=at(B,X,Y);if(v==p)a++;else if(v==q)o++}if(a&&o)return 0;return a==4?1000:a==3?9:a==2?3:o==3?-8:o==2?-2:0};
    for(let cl=0;cl<7;cl++)for(let r=0;r<6;r++)for(const[dx,dy]of[[1,0],[0,1],[1,1],[1,-1]]){const cells=[];for(let k=0;k<4;k++){const X=cl+dx*k,Y=r+dy*k;if(X>6||Y<0||Y>5)break;cells.push([X,Y])}if(cells.length==4)s+=win(cells)}
    for(let r=0;r<6;r++)if(at(B,3,r)==p)s+=3;return s}
  function nega(B,d,a,bt,p){const w1=wins(B,p),w2=wins(B,3-p);if(w2)return-100000-d;if(w1)return 100000+d;const mv=[3,2,4,1,5,0,6].filter(k=>B[k].length<6);if(!mv.length)return 0;if(!d)return score(B,p)-score(B,3-p);
    let bst=-1e9;for(const m of mv){B[m].push(p);const v=-nega(B,d-1,-bt,-a,3-p);B[m].pop();if(v>bst)bst=v;if(v>a)a=v;if(a>=bt)break}return bst}
  function cpuMove(){const mv=[3,2,4,1,5,0,6].filter(k=>b[k].length<6);let bm=mv[0],bv=-1e9;const B=b.map(q=>q.slice());
    if(lvl==1&&Math.random()<.35)return mv[rnd(mv.length)];
    for(const m of shuf(mv.slice())){B[m].push(2);const v=-nega(B,lvl,-1e9,1e9,1);B[m].pop();if(v>bv){bv=v;bm=m}}return bm}
  function drop(col,p,remote){if(over||anim||b[col].length>=6)return false;const r=b[col].length;b[col].push(p);anim={col,r,p,y:-40,vy:0};zsfx('hop');if(ws&&!remote)ws.send(JSON.stringify({t:'mv',c:col}));return true}
  function land(){const{p}=anim;anim=null;zsfx('bump');const w=wins(b,p);
    if(w){over=1;win=w;sc[p-1]++;zsfx(mode=='cpu'&&p==2?'lose':'win');st((mode=='cpu'?(p==1?'You win!':'Computer wins.'):mode=='net'?(p==me?'You win!':'They win.'):(p==1?'Red wins!':'Yellow wins!'))+`  Score ${sc[0]} to ${sc[1]}. Tap to play again.`)}
    else if(b.every(q=>q.length==6)){over=1;st('Draw. Tap to play again.')}
    else{turn=3-p;msg();if(mode=='cpu'&&turn==2)setTimeout(()=>{if(!over&&!anim)drop(cpuMove(),2)},350)}}
  function click(e){const r=c.getBoundingClientRect(),X=(e.clientX-r.left)/r.width*W,col=Math.floor((X-40)/CW);
    if(over){if(mode=='net'&&ws)ws.send(JSON.stringify({t:'again'}));reset();return}
    if(col<0||col>6||anim||wait)return;
    if(mode=='cpu'&&turn!=1)return;if(mode=='net'&&(!ws||turn!=me))return;drop(col,turn)}
  on(c,'pointerdown',click);on(c,'pointermove',e=>{const r=c.getBoundingClientRect();hover=Math.max(0,Math.min(6,Math.floor(((e.clientX-r.left)/r.width*W-40)/CW)))});
  on(document,'keydown',e=>{if(e.key>='1'&&e.key<='7'&&!over&&!anim&&!wait){const col=+e.key-1;if(mode=='cpu'&&turn!=1)return;if(mode=='net'&&(!ws||turn!=me))return;drop(col,turn)}});
  function join(){room=code.value.trim().toUpperCase().replace(/\W/g,'');if(!room){st('Type a room code first.');return}
    if(ws){ws.close();ws=null}
    try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws/'+room)}catch{st('Online play only works on the website.');return}
    ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}
      if(m.t=='hello'){me=m.c==1?1:2;wait=m.n<2;reset()}else if(m.t=='join'){wait=0;sc=[0,0];reset()}
      else if(m.t=='mv'){if(Number.isInteger(m.c)&&m.c>=0&&m.c<7&&turn!=me)drop(m.c,turn,true)}else if(m.t=='again')reset();
      else if(m.t=='left'){wait=1;reset();st('Your friend left. Room code: '+room)}else if(m.t=='full')st('That room already has two players.')};
    st('Joining '+room+'...')}
  jb.onclick=join;nb.onclick=()=>{code.value=Math.random().toString(36).slice(2,6).toUpperCase();join()};
  const COL=['','#e63946','#ffd21f'];
  function disc(cx,cy,p,glow){const g=x.createRadialGradient(cx-8,cy-8,4,cx,cy,34);g.addColorStop(0,'#fff8');g.addColorStop(.25,COL[p]);g.addColorStop(1,p==1?'#8a1521':'#b38f00');x.fillStyle=g;x.beginPath();x.arc(cx,cy,33,0,7);x.fill();if(glow){x.strokeStyle='#fff';x.lineWidth=5;x.stroke()}}
  const slot=(cl,r)=>[40+cl*CW+CW/2,H-20-r*CW-CW/2];
  function draw(){
    x.fillStyle='#0b1020';x.fillRect(0,0,W,H);
    for(let cl=0;cl<7;cl++)b[cl].forEach((p,r)=>{if(anim&&anim.col==cl&&anim.r==r)return;const[px,py]=slot(cl,r);disc(px,py,p,win&&win.some(q=>q[0]==cl&&q[1]==r))});
    if(anim){const[px,py]=slot(anim.col,anim.r);anim.vy+=40;anim.y+=anim.vy/60;
      if(anim.y>=py){anim.y=py;if(anim.vy>300){anim.vy*=-.28;anim.y=py-1}else{land()}}
      if(anim)disc(px,anim.y,anim.p)}
    if(!over&&!anim&&!wait&&(mode=='two'||(mode=='cpu'&&turn==1)||(mode=='net'&&ws&&turn==me))){x.globalAlpha=.7;disc(40+hover*CW+CW/2,24,turn);x.globalAlpha=1}
    x.fillStyle='#2447d6';x.beginPath();x.rect(40,40,7*CW,H-60);for(let cl=0;cl<7;cl++)for(let r=0;r<6;r++){const[px,py]=slot(cl,r);x.moveTo(px+34,py);x.arc(px,py,34,0,6.2832,true)}x.fill('evenodd');
    x.strokeStyle='#17308f';x.lineWidth=4;x.strokeRect(40,40,7*CW,H-60);
    for(let cl=0;cl<7;cl++)for(let r=0;r<6;r++){const[px,py]=slot(cl,r);x.lineWidth=3;x.beginPath();x.arc(px,py,34,0,7);x.stroke()}
  }
  setMode('cpu');setLvl();bar[0].classList.add('on');
  let raf;const loop=()=>{raf=requestAnimationFrame(loop);draw()};loop();
  return()=>{cancelAnimationFrame(raf);if(ws)ws.close()};
}

/* ------------------------------ Solitaire (Klondike) ------------------------------ */
function solitaire(el){
  const SU=['\u2660','\u2665','\u2666','\u2663'],RK=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  let G,sel=null,hist=[],moves=0,draw3=false,won=false;
  const root=mk('div',{class:'sol'});
  zbar(el,[['New deal',()=>deal()],['Undo',()=>undo()],['Draw 1',b=>{draw3=!draw3;b.textContent=draw3?'Draw 3':'Draw 1';deal()}],['Auto to foundation',()=>auto()]]);
  el.append(root);
  const red=c=>c.s==1||c.s==2;
  function deal(){const d=[];for(let s=0;s<4;s++)for(let r=1;r<14;r++)d.push({r,s,u:0});shuf(d);G={st:[],wa:[],f:[[],[],[],[]],t:[[],[],[],[],[],[],[]]};
    for(let i=0;i<7;i++)for(let j=0;j<=i;j++){const k=d.pop();k.u=j==i?1:0;G.t[i].push(k)}G.st=d;sel=null;hist=[];moves=0;won=false;render()}
  const snap=()=>{hist.push(JSON.stringify(G));if(hist.length>300)hist.shift()};
  function undo(){if(!hist.length)return;G=JSON.parse(hist.pop());sel=null;won=false;render()}
  const flip=()=>G.t.forEach(p=>{if(p.length&&!p[p.length-1].u)p[p.length-1].u=1});
  function src(p,i,k){if(p=='w')return G.wa.length?[G.wa[G.wa.length-1]]:null;if(p=='f')return G.f[i].length?[G.f[i][G.f[i].length-1]]:null;
    if(p=='t'){const pile=G.t[i];if(k<0||k>=pile.length||!pile[k].u)return null;return pile.slice(k)}return null}
  const take=(p,i,k)=>{if(p=='w')G.wa.pop();else if(p=='f')G.f[i].pop();else G.t[i].splice(k)};
  function canTab(cs,i){const t=G.t[i],top=t[t.length-1],c=cs[0];if(!top)return c.r==13;return top.u&&red(top)!=red(c)&&top.r==c.r+1}
  function canFound(cs){if(cs.length!=1)return -1;const c=cs[0];return G.f[c.s].length==c.r-1?c.s:-1}
  function move(from,to){const cs=src(from.p,from.i,from.k);if(!cs)return false;
    if(to.p=='t'&&canTab(cs,to.i)&&!(from.p=='t'&&from.i==to.i)){snap();take(from.p,from.i,from.k);G.t[to.i].push(...cs);after();return true}
    if(to.p=='f'){const f=canFound(cs);if(f>=0&&to.i==f){snap();take(from.p,from.i,from.k);G.f[f].push(cs[0]);after();return true}}
    return false}
  function after(){flip();moves++;sel=null;zsfx('hop');if(G.f.every(f=>f.length==13)){won=true;zsfx('win')}render()}
  function auto(){let any=true,n=0;while(any&&n<60){any=false;n++;for(const[p,i]of[['w',0],...G.t.map((_,i)=>['t',i])]){const pile=p=='w'?G.wa:G.t[i];if(!pile.length)continue;const c=pile[pile.length-1];if(c.u&&G.f[c.s].length==c.r-1){if(!any)snap();pile.pop();G.f[c.s].push(c);flip();any=true}}}moves++;if(G.f.every(f=>f.length==13)){won=true;zsfx('win')}render()}
  function click(p,i,k){
    if(p=='s'){snap();if(G.st.length){const n=draw3?3:1;for(let j=0;j<n&&G.st.length;j++){const c=G.st.pop();c.u=1;G.wa.push(c)}}else{G.st=G.wa.reverse().map(c=>(c.u=0,c));G.wa=[]}sel=null;moves++;render();return}
    if(sel){const s=sel;sel=null;if(move(s,{p,i,k}))return;if(s.p==p&&s.i==i&&s.k==k){render();return}}
    if(p=='t'&&k>=0&&!G.t[i][k].u&&k==G.t[i].length-1){snap();G.t[i][k].u=1;render();return}
    if(src(p,i,k)){sel={p,i,k};render()}else render()}
  function dbl(p,i,k){const cs=src(p,i,k);if(!cs)return;const f=canFound(cs);if(f>=0){sel=null;move({p,i,k},{p:'f',i:f})}}
  const cd=(c,p,i,k)=>{const o=sel&&sel.p==p&&sel.i==i&&c.u&&(p=='t'?k>=sel.k:k==sel.k);return `<div class="cd ${c.u?(red(c)?'red':'blk'):'dn'} ${o?'sel':''}" data-p="${p}" data-i="${i}" data-k="${k}"><span>${RK[c.r]}${SU[c.s]}</span><b>${SU[c.s]}</b></div>`};
  function render(){
    let h='';
    h+=`<div data-p="s" data-i="0" data-k="-1">${G.st.length?`<div class="cd dn" data-p="s" data-i="0" data-k="-1"></div>`:`<div class="sl" data-p="s" data-i="0" data-k="-1">\u21BB</div>`}</div>`;
    h+=`<div>${G.wa.length?cd(G.wa[G.wa.length-1],'w',0,G.wa.length-1):'<div class="sl"></div>'}</div><div></div>`;
    for(let i=0;i<4;i++)h+=`<div data-p="f" data-i="${i}" data-k="-1">${G.f[i].length?cd(G.f[i][G.f[i].length-1],'f',i,G.f[i].length-1):`<div class="sl" data-p="f" data-i="${i}" data-k="-1">${SU[i]}</div>`}</div>`;
    for(let i=0;i<7;i++)h+=`<div class="stack" data-p="t" data-i="${i}" data-k="-1" style="min-height:5em">${G.t[i].length?G.t[i].map((c,k)=>cd(c,'t',i,k)).join(''):`<div class="sl" data-p="t" data-i="${i}" data-k="-1"></div>`}</div>`;
    root.innerHTML=h;
    st(won?`You won in ${moves} moves! Best ${best('solitaire',moves,1)}. Press New deal.`:`Moves ${moves}   Stock ${G.st.length}`)}
  const q=e=>{const t=e.target.closest('[data-p]');return t?[t.dataset.p,+t.dataset.i,+t.dataset.k]:null};
  on(root,'click',e=>{const a=q(e);if(a&&!won)click(...a)});on(root,'dblclick',e=>{const a=q(e);if(a&&!won)dbl(...a)});
  deal();
}

/* ------------------------------ Lights Out ------------------------------ */
function lights(el){
  const g=mk('div',{class:'lo'});let L,mv,lv=1,start;el.append(g);
  zbar(el,[['New puzzle',()=>{lv=1;make()}],['Reset',()=>make(1)]]);
  const cells=[...Array(25)].map((_,i)=>{const b=mk('button',{type:'button','aria-label':'light '+(i+1)});b.onclick=()=>tap(i);g.append(b);return b});
  const flip=i=>{const r=i/5|0,c=i%5;for(const[dr,dc]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const R=r+dr,C=c+dc;if(R>=0&&R<5&&C>=0&&C<5)L[R*5+C]^=1}};
  function make(again){if(!again){L=Array(25).fill(0);const n=3+Math.min(lv*2,10);for(let k=0;k<n;k++)flip(rnd(25));if(!L.some(Boolean))flip(12);start=L.slice()}else L=start.slice();mv=0;draw()}
  function tap(i){if(!L.some(Boolean))return;flip(i);mv++;zsfx('click');draw();
    if(!L.some(Boolean)){zsfx('win');st(`Level ${lv} cleared in ${mv} moves! Next level coming up.`);lv++;setTimeout(()=>make(),900)}}
  const draw=()=>{cells.forEach((b,i)=>b.classList.toggle('on',!!L[i]));if(L.some(Boolean))st(`Level ${lv}   Moves ${mv}. Turn every light off. Each tap flips the light and its neighbors.`)};
  make();
}

/* ------------------------------ Slide Puzzle ------------------------------ */
function slide(el){
  const g=mk('div',{class:'sp'});let T,mv,t0,done;el.append(g);
  zbar(el,[['Shuffle',()=>shuffle()]]);
  const cells=[...Array(16)].map((_,i)=>{const b=mk('button',{type:'button'});b.onclick=()=>tap(i);g.append(b);return b});
  function shuffle(){T=[...Array(16).keys()].map(v=>(v+1)%16);let e=15,last=-1;for(let k=0;k<200;k++){const n=[];const r=e/4|0,c=e%4;if(r>0)n.push(e-4);if(r<3)n.push(e+4);if(c>0)n.push(e-1);if(c<3)n.push(e+1);const m=n.filter(v=>v!=last);const p=m[rnd(m.length)];[T[e],T[p]]=[T[p],T[e]];last=e;e=p}
    mv=0;t0=Date.now();done=false;draw()}
  function tap(i){if(done)return;const e=T.indexOf(0),r=i/4|0,c=i%4,er=e/4|0,ec=e%4;if(r!=er&&c!=ec||i==e)return;
    const dir=r==er?(c<ec?1:-1):(r<er?4:-4);let p=e;const path=[];while(p!=i){path.push(p);p-=dir}path.push(i);
    for(let k=0;k<path.length-1;k++)T[path[k]]=T[path[k+1]];T[i]=0;mv++;zsfx('click');draw();
    if(T.every((v,j)=>v==(j+1)%16)){done=true;const s=Math.round((Date.now()-t0)/1000);zsfx('win');st(`Solved in ${mv} moves and ${s}s. Best ${best('slide',mv,1)} moves.`)}}
  const draw=()=>{cells.forEach((b,i)=>{b.textContent=T[i]||'';b.className=T[i]?'':'e'});if(!done)st('Moves '+mv+'. Click a tile (or a row of tiles) next to the gap. Arrow keys work too.')};
  on(document,'keydown',e=>{const d={ArrowLeft:1,ArrowRight:-1,ArrowUp:4,ArrowDown:-4}[e.key];if(!d)return;e.preventDefault();const eI=T.indexOf(0),t=eI+d;if(t<0||t>15||(Math.abs(d)==1&&(t/4|0)!=(eI/4|0)))return;tap(t)});
  shuffle();
}
