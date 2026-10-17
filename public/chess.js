const CE=(()=>{
  const KD=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],ND=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],V=[0,100,320,330,500,900,0];
  const ok=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
  function start(){const b=Array(64).fill(0),B=[4,2,3,5,6,3,2,4];for(let c=0;c<8;c++){b[c]=-B[c];b[8+c]=-1;b[48+c]=1;b[56+c]=B[c]}return{b,t:1,c:[1,1,1,1],ep:-1}}
  function atk(b,sq,by){const r=sq>>3,c=sq&7,pr=r+by;
    if(pr>=0&&pr<8){if(c>0&&b[pr*8+c-1]==by)return 1;if(c<7&&b[pr*8+c+1]==by)return 1}
    for(const[d,e]of ND){const y=r+d,x=c+e;if(ok(y,x)&&b[y*8+x]==2*by)return 1}
    for(let i=0;i<8;i++){const[d,e]=KD[i];let y=r+d,x=c+e;if(ok(y,x)&&b[y*8+x]==6*by)return 1;
      while(ok(y,x)){const q=b[y*8+x];if(q){if(q==5*by||q==(i<4?4:3)*by)return 1;break}y+=d;x+=e}}
    return 0}
  const inCheck=(s,t)=>atk(s.b,s.b.indexOf(6*t),-t);
  function gen(s){const b=s.b,t=s.t,o=[];
    for(let f=0;f<64;f++){const p=b[f]*t;if(p<=0)continue;const r=f>>3,c=f&7;
      const add=(to,x)=>o.push(x?{f,t:to,...x}:{f,t:to});
      if(p==1){const d=-t,r1=r+d;if(r1<0||r1>7)continue;
        if(!b[r1*8+c]){add(r1*8+c);if(r==(t==1?6:1)&&!b[(r+2*d)*8+c])add((r+2*d)*8+c,{dbl:1})}
        for(const e of[-1,1]){const x=c+e;if(x<0||x>7)continue;const to=r1*8+x;if(b[to]*t<0)add(to);else if(to==s.ep)add(to,{ep:1})}}
      else if(p==2||p==6){for(const[d,e]of p==2?ND:KD){const y=r+d,x=c+e;if(ok(y,x)&&b[y*8+x]*t<=0)add(y*8+x)}
        if(p==6){const k=t==1?0:2;if(f==(t==1?60:4)&&!atk(b,f,-t)){
          if(s.c[k]&&!b[f+1]&&!b[f+2]&&b[f+3]==4*t&&!atk(b,f+1,-t)&&!atk(b,f+2,-t))add(f+2,{cas:1});
          if(s.c[k+1]&&!b[f-1]&&!b[f-2]&&!b[f-3]&&b[f-4]==4*t&&!atk(b,f-1,-t)&&!atk(b,f-2,-t))add(f-2,{cas:2})}}}
      else for(let i=p==3?4:0;i<(p==4?4:8);i++){const[d,e]=KD[i];let y=r+d,x=c+e;
        while(ok(y,x)){const q=b[y*8+x]*t;if(q>0)break;add(y*8+x);if(q<0)break;y+=d;x+=e}}}
    return o.flatMap(m=>Math.abs(b[m.f])==1&&((m.t>>3)==0||(m.t>>3)==7)?[5,4,3,2].map(pr=>({...m,pr})):[m])}
  function apply(s,m){const b=s.b.slice(),t=s.t,p=b[m.f],c=s.c.slice();b[m.t]=p;b[m.f]=0;
    if(m.ep)b[m.t+(t==1?8:-8)]=0;
    if(m.cas==1){b[m.f+1]=b[m.f+3];b[m.f+3]=0}
    if(m.cas==2){b[m.f-1]=b[m.f-4];b[m.f-4]=0}
    const row=m.t>>3;if(Math.abs(p)==1&&(row==0||row==7))b[m.t]=(m.pr||5)*t;
    for(const q of[m.f,m.t]){if(q==60)c[0]=c[1]=0;if(q==4)c[2]=c[3]=0;if(q==63)c[0]=0;if(q==56)c[1]=0;if(q==7)c[2]=0;if(q==0)c[3]=0}
    return{b,t:-t,c,ep:m.dbl?(m.f+m.t)/2:-1}}
  const legal=s=>gen(s).filter(m=>{const n=apply(s,m);return!atk(n.b,n.b.indexOf(6*s.t),-s.t)});
  function ev(s){let v=0;for(let i=0;i<64;i++){const p=s.b[i];if(!p)continue;const a=Math.abs(p),w=p>0?1:-1,r=i>>3,c=i&7,cen=3.5-Math.max(Math.abs(r-3.5),Math.abs(c-3.5));
    v+=w*(V[a]+(a==1?(w>0?6-r:r-1)*6+cen*3:a==2||a==3?cen*8:0))}return v}
  const sc=(s,m)=>Math.abs(s.b[m.t])*10-Math.abs(s.b[m.f])+(m.ep?10:0);
  function search(s,d,a,b){if(!d)return ev(s)*s.t;const ms=legal(s);if(!ms.length)return inCheck(s,s.t)?-9e4-d:0;
    ms.sort((x,y)=>sc(s,y)-sc(s,x));
    for(const m of ms){const v=-search(apply(s,m),d-1,-b,-a);if(v>=b)return b;if(v>a)a=v}return a}
  function pick(s,lv){const ms=legal(s);if(lv==1&&Math.random()<.6)return ms[Math.random()*ms.length|0];
    const d=[1,1,2,3,4,5][lv-1],nz=[150,60,20,0,0,0][lv-1];let best=ms[0],bv=-1e9;ms.sort((x,y)=>sc(s,y)-sc(s,x));
    for(const m of ms){const n=apply(s,m);let v;
      if(!legal(n).length)v=inCheck(n,n.t)?1e6:0;else v=-search(n,d-1,-1e9,nz?1e9:-bv)+Math.random()*nz;
      if(v>bv){bv=v;best=m}}
    return best}
  const insuf=s=>{const o=s.b.filter(p=>p&&Math.abs(p)!=6);return!o.length||(o.length==1&&(Math.abs(o[0])==2||Math.abs(o[0])==3))};
  return{start,legal,apply,inCheck,pick,insuf}
})();

function chess(el){
  const TH=[['Walnut','#efd9b0','#b07d52','#6e4b2e','#3f2815','#7a5230','#efd9b0'],['Marble','#e8ebf0','#8c9ab4','#4d566b','#2a303e','#6c7a96','#e8ebf0'],['Forest','#ecefd0','#6a9a5b','#4a6b3b','#2a3d20','#4d7a3e','#ecefd0']];
  let th=0;try{th=(+localStorage.getItem('chess-th')||0)%3}catch{}
  const LN=['Beginner','Easy','Medium','Hard','Expert','Master'],FL='abcdefgh',PV=[0,1,3,3,5,9,0];
  let s,mode,me=1,lv=3,sel=null,last=null,over=0,hist=[],ws,dead=0,wait=0,room='',result='',stk=[],sans=[],pcs=[],flipMan=false,thinking=0,muted=false,drag=null,promo=null,sideSet='1';

  // ---------- styles ----------
  if(!document.getElementById('chxstyle')){const c=document.createElement('style');c.id='chxstyle';c.textContent=`
  .chx{width:min(100%,800px);margin:0 auto;color:#f1ebe0;font-family:system-ui,sans-serif;text-align:left;--l:#efd9b0;--d:#b07d52;--f1:#6e4b2e;--f2:#3f2815}
  .chx-main[hidden],.chx-menu[hidden]{display:none}
  .chx-menu{display:grid;gap:14px;justify-items:center;padding:22px 14px;max-width:460px;margin:0 auto;border-radius:16px;background:linear-gradient(160deg,#2a2118,#16110c);box-shadow:0 12px 34px #0008,inset 0 0 0 1px #ffffff14}
  .chx-menu h3{margin:0;font:400 2rem Georgia,serif;letter-spacing:1px;color:#f0d9a8}
  .chx-menu .r{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;width:100%}
  .chx-menu label{font-size:.78rem;color:#c9bca5;display:flex;flex-direction:column;gap:3px;text-align:left}
  .chx-menu select,.chx-menu input{padding:8px 10px;border-radius:8px;border:1px solid #5a4630;background:#120e0a;color:#f1ebe0;font:inherit;width:auto}
  .chx-menu input{width:11ch;text-transform:uppercase}
  .chx-big{padding:12px 20px;border:0;border-radius:10px;background:linear-gradient(#f6d27a,#d9a23c);color:#2b1a08;font:800 1rem system-ui;cursor:pointer;box-shadow:0 3px 0 #8a5d1a;width:100%}
  .chx-big:active{transform:translateY(2px);box-shadow:0 1px 0 #8a5d1a}
  .chx-alt{padding:9px 14px;border:1px solid #6b5338;border-radius:10px;background:#251b12;color:#f1e3c5;font:700 .9rem system-ui;cursor:pointer}
  .chx-main{display:flex;gap:14px;align-items:flex-start;justify-content:center;flex-wrap:wrap}
  .chx-col{width:min(100%,560px)}
  .chx-strip{display:flex;align-items:center;gap:10px;padding:5px 4px;min-height:36px}
  .chx-av{width:28px;height:28px;border-radius:50%;flex:none;border:2px solid #0007}
  .chx-nm{font-weight:700;font-size:.92rem}.chx-nm small{display:block;font-weight:500;font-size:.7rem;color:#c9bca5}
  .chx-cap{display:flex;align-items:center;height:22px;margin-left:4px;flex-wrap:wrap}
  .chx-cap svg{width:19px;height:19px;margin-right:-7px;filter:drop-shadow(0 1px 1px #0006)}
  .chx-adv{font-size:.8rem;color:#c9bca5;margin-left:10px;font-weight:700}
  .chx-turn{margin-left:auto;width:10px;height:10px;border-radius:50%;background:#444;flex:none}.chx-turn.on{background:#7bd36b;box-shadow:0 0 8px #7bd36b}
  .chx-frame{padding:10px;border-radius:14px;background:linear-gradient(145deg,var(--f1),var(--f2));box-shadow:0 16px 38px #000a,inset 0 1px 0 #ffffff30,inset 0 0 0 1px #0006}
  .chx-bd{position:relative;aspect-ratio:1;width:100%;border-radius:4px;overflow:hidden;box-shadow:0 0 0 2px #0009;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}
  .chx-sqs{position:absolute;inset:0;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr)}
  .chx-sq{position:relative}.chx-sq.l{background:var(--l)}.chx-sq.d{background:var(--d)}
  .chx-sq.l{background-image:linear-gradient(135deg,#ffffff30,#0000 60%)}.chx-sq.d{background-image:linear-gradient(135deg,#ffffff1c,#0000 60%)}
  .chx-sq i{position:absolute;font:700 clamp(.5rem,1.8vw,.7rem) system-ui;font-style:normal;opacity:.85;pointer-events:none}
  .chx-sq.l i{color:var(--d)}.chx-sq.d i{color:var(--l)}.chx-sq i.f{right:4%;bottom:2%}.chx-sq i.r{left:5%;top:3%}
  .chx-sq.last::before,.chx-sq.sel::before{content:'';position:absolute;inset:0;background:rgba(255,214,70,.42)}.chx-sq.sel::before{background:rgba(255,226,80,.62)}
  .chx-sq.to::after{content:'';position:absolute;left:34%;top:34%;width:32%;height:32%;border-radius:50%;background:rgba(25,20,10,.3)}
  .chx-sq.cap::after{content:'';position:absolute;inset:3%;border-radius:50%;border:5px solid rgba(215,50,40,.6);box-sizing:border-box}
  .chx-sq.chk::before{content:'';position:absolute;inset:0;background:radial-gradient(circle,rgba(255,40,30,.95),rgba(255,40,30,0) 72%)}
  .chx-pcs{position:absolute;inset:0;pointer-events:none}
  .chx-pc{position:absolute;left:0;top:0;width:12.5%;height:12.5%;transition:transform .24s cubic-bezier(.25,.8,.3,1),opacity .2s;will-change:transform;z-index:2}
  .chx-pc.drag{transition:none;z-index:6}
  .chx-pc svg{width:100%;height:100%;display:block;filter:drop-shadow(0 2px 1.5px rgba(0,0,0,.5))}
  .chx-pc.drag svg{transform:scale(1.18);filter:drop-shadow(0 8px 5px rgba(0,0,0,.45))}
  .pw path,.pw circle,.pw rect,.pw ellipse{fill:url(#cgW);stroke:#33220f;stroke-width:1.3;stroke-linejoin:round}
  .pb path,.pb circle,.pb rect,.pb ellipse{fill:url(#cgB);stroke:#000;stroke-width:1.3;stroke-linejoin:round}
  .pw .dt{fill:none;stroke:#33220f;stroke-width:1.2;stroke-linecap:round}.pb .dt{fill:none;stroke:#aab3c6;stroke-width:1.2;stroke-linecap:round}
  .pw .ey{fill:#33220f;stroke:none}.pb .ey{fill:#dfe6f5;stroke:none}
  .chx-ov{position:absolute;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;background:rgba(10,8,5,.62);backdrop-filter:blur(2px)}
  .chx-ov[hidden]{display:none}
  .chx-card{padding:20px 24px;border-radius:14px;background:linear-gradient(160deg,#33261a,#1a130c);text-align:center;box-shadow:0 12px 30px #000a,inset 0 0 0 1px #ffffff18;display:grid;gap:10px;min-width:200px}
  .chx-card b{font:400 1.5rem Georgia,serif;color:#f6d995}
  .chx-pr{display:flex;gap:8px;justify-content:center}.chx-pr button{width:64px;height:64px;border-radius:10px;border:1px solid #6b5338;background:linear-gradient(#e8d3a8,#c9a66b);padding:4px;cursor:pointer}
  .chx-pr button:hover{filter:brightness(1.1)}.chx-pr svg{width:100%;height:100%}
  .chx-tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px}
  .chx-tools button{padding:8px 14px;border-radius:999px;border:1px solid #6b5338;background:#251b12;color:#f1e3c5;font:700 .82rem system-ui;cursor:pointer}
  .chx-tools button:disabled{opacity:.4;cursor:default}
  .chx-side{width:min(100%,190px);flex:none}
  .chx-ml{height:min(430px,40vh);overflow:auto;background:#17110b;border-radius:12px;padding:8px;box-shadow:inset 0 0 0 1px #ffffff12;font-size:.84rem}
  .chx-ml h4{margin:0 0 6px;font:700 .72rem system-ui;letter-spacing:.1em;color:#c9bca5;text-transform:uppercase}
  .chx-mv{display:grid;grid-template-columns:26px 1fr 1fr;gap:2px 4px;padding:2px 0}.chx-mv span:first-child{color:#8d7f68}
  .chx-mv span.cu{background:#ffd64633;border-radius:4px}
  @media(max-width:700px){.chx-side{width:100%}.chx-ml{height:90px}}
  `;document.head.append(c)}
  if(!document.getElementById('chxdefs')){const d=document.createElement('div');d.id='chxdefs';d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML='<svg width="0" height="0"><defs><linearGradient id="cgW" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#eee5d2"/><stop offset="1" stop-color="#b9a78a"/></linearGradient><linearGradient id="cgB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a7083"/><stop offset=".5" stop-color="#2e313d"/><stop offset="1" stop-color="#0c0d12"/></linearGradient></defs></svg>';document.body.append(d)}

  // ---------- piece art ----------
  const BASE='<rect x="11" y="36" width="23" height="4.5" rx="2"/>';
  const ART=[0,
    BASE+'<path d="M16 36C16 29 19 26 20.5 22L24.5 22C26 26 29 29 29 36Z"/><ellipse cx="22.5" cy="22" rx="6.5" ry="2.2"/><circle cx="22.5" cy="14.5" r="5.6"/>',
    BASE+'<path d="M12 36C12 30 14 27 17 25C14.5 25.6 11.2 26.6 9.6 25C9 22.6 12 19.2 14 17L16 11.5L18.2 13C19.4 10 21.3 8 23.5 8C29 9 33.5 14.5 33.5 24C33.5 29 32.5 33 32.5 36Z"/><circle class="ey" cx="18.3" cy="16.8" r="1.3"/><circle class="ey" cx="11.6" cy="23.2" r=".8"/><path class="dt" d="M24 9.5C28 12 30.5 17 31 24M26.5 10.5C29.5 14 31 19 31.5 25"/>',
    BASE+'<path d="M22.5 6C26.8 9.4 29.4 14.2 27.8 19C27.2 20.8 26.4 22 25.6 23L28 36L17 36L19.4 23C18.6 22 17.8 20.8 17.2 19C15.6 14.2 18.2 9.4 22.5 6Z"/><circle cx="22.5" cy="6.4" r="2.3"/><rect x="15" y="23.5" width="15" height="3.2" rx="1.6"/><path class="dt" d="M21 12.5L25.2 17.2"/>',
    BASE+'<path d="M14 36L15.6 18L29.4 18L31 36Z"/><path d="M12.5 18L12.5 9L17.4 9L17.4 12L20.4 12L20.4 9L24.6 9L24.6 12L27.6 12L27.6 9L32.5 9L32.5 18Z"/><path class="dt" d="M15.6 22L29.4 22"/>',
    BASE+'<path d="M12.5 36L8.8 17L16 25.5L16.6 12L20.6 24.6L22.5 10L24.4 24.6L28.4 12L29 25.5L36.2 17L32.5 36Z"/><circle cx="8.8" cy="14.8" r="2.4"/><circle cx="16.6" cy="10" r="2.4"/><circle cx="22.5" cy="7.6" r="2.4"/><circle cx="28.4" cy="10" r="2.4"/><circle cx="36.2" cy="14.8" r="2.4"/>',
    BASE+'<path d="M13 36C13 28 15 24.4 17.4 22.4L27.6 22.4C30 24.4 32 28 32 36Z"/><path d="M15 22.4C15 17.6 18.6 15.4 22.5 15.4C26.4 15.4 30 17.6 30 22.4Z"/><rect x="21" y="3.6" width="3" height="12" rx="1.2"/><rect x="17.4" y="7.2" width="10.2" height="3" rx="1.2"/>'];
  const svg=p=>`<svg viewBox="0 0 45 45" class="${p>0?'pw':'pb'}">${ART[Math.abs(p)]}</svg>`;

  // ---------- audio ----------
  let ac;const tone=(f,d,ty='triangle',v=.12,sl)=>{if(muted)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),a=ac.createGain(),n=ac.currentTime;o.type=ty;o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(sl,n+d);a.gain.setValueAtTime(v,n);a.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(a);a.connect(ac.destination);o.start(n);o.stop(n+d)}catch{}};
  const sMove=()=>tone(220,.07,'triangle',.18,120),sCap=()=>{tone(170,.12,'sawtooth',.12,70);setTimeout(()=>tone(240,.06,'triangle',.14,110),30)},sChk=()=>{tone(880,.25,'sine',.1)},sEnd=()=>[523,659,784].forEach((f,k)=>setTimeout(()=>tone(f,.35,'sine',.12),k*140));

  // ---------- DOM ----------
  const root=mk('div',{class:'chx'}),menu=mk('div',{class:'chx-menu'});
  const lvs=mk('select',{'aria-label':'Skill level'}),side=mk('select',{'aria-label':'Your color'}),code=mk('input',{placeholder:'CODE',maxlength:8,'aria-label':'Room code'});
  LN.forEach((n,i)=>lvs.append(mk('option',{value:i+1},n)));lvs.value='3';
  [['White','1'],['Black','-1'],['Random','0']].forEach(o=>side.append(mk('option',{value:o[1]},o[0])));
  const lab=(t,c)=>{const l=mk('label',{},t);l.append(c);return l};
  const rw=(...a)=>{const d=mk('div',{class:'r'});d.append(...a);return d};
  const b1=mk('button',{type:'button',class:'chx-big'},'Play the computer'),b2=mk('button',{type:'button',class:'chx-alt'},'Two players, one screen'),b3=mk('button',{type:'button',class:'chx-alt'},'Play a friend online'),b4=mk('button',{type:'button',class:'chx-alt'},'New code');
  menu.append(mk('h3',{},'Chess'),rw(lab('Skill',lvs),lab('You play',side)),b1,b2,mk('p',{class:'sm'},'Online: both of you type the same code. First in plays White.'),rw(code,b4,b3));
  const game=mk('div',{class:'chx-main'});game.hidden=true;
  const col=mk('div',{class:'chx-col'}),topS=mk('div',{class:'chx-strip'}),botS=mk('div',{class:'chx-strip'}),frame=mk('div',{class:'chx-frame'}),bd=mk('div',{class:'chx-bd'}),sqs=mk('div',{class:'chx-sqs'}),layer=mk('div',{class:'chx-pcs'}),ov=mk('div',{class:'chx-ov'});ov.hidden=true;
  bd.append(sqs,layer,ov);frame.append(bd);
  const tools=mk('div',{class:'chx-tools'}),bU=mk('button',{type:'button'},'Undo'),bF=mk('button',{type:'button'},'Flip board'),bT=mk('button',{type:'button'},'Board: '+TH[th][0]),bS=mk('button',{type:'button'},'Sound on'),bM=mk('button',{type:'button'},'Menu');
  tools.append(bU,bF,bT,bS,bM);col.append(topS,frame,botS,tools);
  const sideP=mk('div',{class:'chx-side'}),ml=mk('div',{class:'chx-ml'});sideP.append(ml);game.append(col,sideP);
  root.append(menu,game);el.append(root);
  const strip=(d)=>{d.av=mk('div',{class:'chx-av'});d.nm=mk('div',{class:'chx-nm'});d.cp=mk('div',{class:'chx-cap'});d.ad=mk('span',{class:'chx-adv'});d.tn=mk('div',{class:'chx-turn'});d.append(d.av,d.nm,d.cp,d.ad,d.tn)};strip(topS);strip(botS);
  function theme(){const t=TH[th];root.style.setProperty('--l',t[1]);root.style.setProperty('--d',t[2]);root.style.setProperty('--f1',t[3]);root.style.setProperty('--f2',t[4]);bT.textContent='Board: '+t[0]}
  theme();
  bT.onclick=()=>{th=(th+1)%3;try{localStorage.setItem('chess-th',th)}catch{}theme()};
  bS.onclick=()=>{muted=!muted;bS.textContent=muted?'Sound off':'Sound on'};
  bF.onclick=()=>{flipMan=!flipMan;squares();pcs.forEach(place);panel()};
  bM.onclick=()=>{if(ws){try{ws.close()}catch{}ws=null}game.hidden=true;menu.hidden=false;ov.hidden=true;over=0;mode=null;st('Pick a game mode.')};

  // ---------- geometry ----------
  const fl=()=>(me==-1&&mode!='local')!==flipMan;
  const place=o=>{const k=fl()?63-o.sq:o.sq;o.el.style.transform=`translate(${(k&7)*100}%,${(k>>3)*100}%)`};
  const sqOf=e=>{const r=bd.getBoundingClientRect(),x=Math.min(7,Math.max(0,((e.clientX-r.left)/r.width*8)|0)),y=Math.min(7,Math.max(0,((e.clientY-r.top)/r.height*8)|0)),k=y*8+x;return fl()?63-k:k};
  function mkPiece(sq,p){const e=mk('div',{class:'chx-pc'});e.innerHTML=svg(p);const o={el:e,sq,p};layer.append(e);pcs.push(o);place(o);return o}
  function rebuild(){layer.innerHTML='';pcs=[];for(let i=0;i<64;i++)if(s.b[i])mkPiece(i,s.b[i])}
  const find=(f,t,pr)=>CE.legal(s).find(m=>m.f==f&&m.t==t&&(!m.pr||m.pr==(pr||5)));

  // ---------- notation ----------
  function sanOf(sp,m){if(m.cas)return m.cas==1?'O-O':'O-O-O';const p=Math.abs(sp.b[m.f]),cap=sp.b[m.t]||m.ep,t=FL[m.t&7]+(8-(m.t>>3));
    if(p==1){let x=(cap?FL[m.f&7]+'x':'')+t;if(m.pr)x+='='+['','','N','B','R','Q'][m.pr];return x}
    let d='';const o=CE.legal(sp).filter(x=>x.f!=m.f&&x.t==m.t&&Math.abs(sp.b[x.f])==p);
    if(o.length){if(o.every(x=>(x.f&7)!=(m.f&7)))d=FL[m.f&7];else if(o.every(x=>(x.f>>3)!=(m.f>>3)))d=''+(8-(m.f>>3));else d=FL[m.f&7]+(8-(m.f>>3))}
    return['','','N','B','R','Q','K'][p]+d+(cap?'x':'')+t}

  // ---------- starting games ----------
  function fresh(m){mode=m;s=CE.start();sel=last=null;over=0;hist=[];stk=[];sans=[];wait=0;thinking=0;promo=null;menu.hidden=true;game.hidden=false;ov.hidden=true;flipMan=false;rebuild();}
  function startCpu(){lv=+lvs.value;sideSet=side.value;fresh('cpu');me=+sideSet||(Math.random()<.5?1:-1);rebuild();squares();panel();status();if(s.t!=me)think()}
  b1.onclick=startCpu;
  b2.onclick=()=>{fresh('local');me=1;rebuild();squares();panel();status()};
  b4.onclick=()=>{code.value=Math.random().toString(36).slice(2,6).toUpperCase()};
  b3.onclick=()=>{room=code.value.trim().toUpperCase().replace(/\W/g,'');if(!room){st('Type a room code, or press New code.');return}
    try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws/'+room)}catch{st('Online play only works on the website.');return}
    fresh('online');wait=1;squares();panel();st('Connecting...');
    ws.onmessage=e=>{const m=JSON.parse(e.data);
      if(m.t=='hello'){me=m.c;wait=m.n<2;rebuild();squares();panel();status()}
      else if(m.t=='join'){wait=0;ws.send(JSON.stringify({t:'sync',h:hist}));status()}
      else if(m.t=='sync'){if(!hist.length)m.h.forEach(h=>play(find(h[0],h[1],h[2]),1,1))}
      else if(m.t=='mv'){play(find(m.f,m.to,m.pr),1)}
      else if(m.t=='left'){wait=1;st('Your friend left. They can rejoin with code '+room+'.')}
      else if(m.t=='full'){st('That room already has two players.')}};
    ws.onclose=()=>{if(!dead&&!over)st('Disconnected. Press Restart to reconnect.')}};

  function think(){thinking=1;panel();setTimeout(()=>{if(dead||over||mode!='cpu'||s.t==me){thinking=0;return}const m=CE.pick(s,lv);thinking=0;play(m)},420)}

  // ---------- making a move ----------
  function play(m,remote,quiet){if(!m)return;const mover=s.t,A=pcs.find(o=>o.sq==m.f),capSq=m.ep?m.t+(mover==1?8:-8):m.t,C=pcs.find(o=>o.sq==capSq&&o!==A),isCap=!!C;
    const san=sanOf(s,m);stk.push({s,last,sn:sans.length,h:hist.length});
    s=CE.apply(s,m);last=m;sel=null;hist.push([m.f,m.t,m.pr||0]);
    if(C){pcs.splice(pcs.indexOf(C),1);C.el.style.opacity='0';setTimeout(()=>C.el.remove(),230)}
    if(A){A.sq=m.t;place(A);if(m.cas){const R=pcs.find(o=>o.sq==(m.cas==1?m.f+3:m.f-4));if(R){R.sq=m.cas==1?m.f+1:m.f-1;place(R)}}
      if(Math.abs(A.p)==1&&((m.t>>3)==0||(m.t>>3)==7)){const np=(m.pr||5)*mover;A.p=np;setTimeout(()=>{A.el.innerHTML=svg(np)},200)}}
    if(mode=='online'&&!remote)ws.send(JSON.stringify({t:'mv',f:m.f,to:m.t,pr:m.pr||0}));
    const n=CE.legal(s).length,chk=CE.inCheck(s,s.t);
    sans.push(san+(!n&&chk?'#':chk?'+':''));
    if(!n){over=1;result=chk?`Checkmate. ${s.t==1?'Black':'White'} wins.`:'Stalemate. It is a draw.'}else if(CE.insuf(s)){over=1;result='Draw: not enough pieces left to checkmate.'}
    if(!quiet){if(over)sEnd();else if(chk)sChk();else if(isCap)sCap();else sMove()}
    squares();panel();status();if(over)endCard();
    if(!over&&mode=='cpu'&&s.t!=me)think()}
  function endCard(){ov.innerHTML='';const c=mk('div',{class:'chx-card'});c.append(mk('b',{},result.split('.')[0]+'.'),mk('div',{class:'sm'},result.includes('wins')?(mode=='cpu'?((result.includes('White')?1:-1)==me?'You win!':'The computer wins.'):result):result));
    const r=mk('div',{class:'r',style:'display:flex;gap:8px;justify-content:center'});
    if(mode=='cpu'||mode=='local'){const a=mk('button',{type:'button',class:'chx-big'},'Rematch');a.onclick=()=>{mode=='cpu'?startCpu():b2.onclick()};r.append(a)}
    const m=mk('button',{type:'button',class:'chx-alt'},'View board');m.onclick=()=>{ov.hidden=true};r.append(m);c.append(r);ov.append(c);ov.hidden=false}
  function status(){if(over)return st(result);const chk=CE.inCheck(s,s.t)?' Check!':'';
    if(mode=='online')return st(wait?`Waiting for a friend. Room code: ${room}`:`${s.t==me?'Your move':'Their move'} (you are ${me==1?'White':'Black'}).${chk}`);
    if(mode=='cpu')return st(s.t==me?'Your move.'+chk:'Computer is thinking...');
    st((s.t==1?'White':'Black')+' to move.'+chk)}

  // ---------- undo ----------
  bU.onclick=()=>{if(thinking||!stk.length||mode=='online'||mode==null)return;
    let x;do{x=stk.pop()}while(mode=='cpu'&&x.s.t!=me&&stk.length);
    s=x.s;last=x.last;sans.length=x.sn;hist.length=x.h;over=0;sel=null;ov.hidden=true;rebuild();squares();panel();status();if(mode=='cpu'&&s.t!=me)think()};

  // ---------- rendering ----------
  function squares(){sqs.innerHTML='';const ms=sel==null?[]:CE.legal(s).filter(m=>m.f==sel),ks=CE.inCheck(s,s.t)?s.b.indexOf(6*s.t):-1,f=fl();
    for(let k=0;k<64;k++){const i=f?63-k:k,r=i>>3,c=i&7,p=s.b[i];let cl='chx-sq '+((r+c)%2?'d':'l');
      if(last&&(last.f==i||last.t==i))cl+=' last';if(i==ks)cl+=' chk';if(i==sel)cl+=' sel';else if(ms.some(m=>m.t==i))cl+=p||ms.some(m=>m.t==i&&m.ep)?' cap':' to';
      const q=mk('div',{class:cl});if((k>>3)==7)q.append(mk('i',{class:'f'},FL[c]));if((k&7)==0)q.append(mk('i',{class:'r'},String(8-r)));sqs.append(q)}}
  function strips(){const f=fl(),bot=f?-1:1,top=-bot,nm=c=>mode=='cpu'?(c==me?'You':'Computer'):mode=='online'?(c==me?'You':'Friend'):(c==1?'White':'Black'),sub=c=>mode=='cpu'&&c!=me?LN[lv-1]:(c==1?'White':'Black');
    const cnt={1:[0,0,0,0,0,0,0],'-1':[0,0,0,0,0,0,0]};let mat=0;s.b.forEach(p=>{if(p){cnt[p>0?1:-1][Math.abs(p)]++;mat+=(p>0?1:-1)*PV[Math.abs(p)]}});
    const S0=[0,8,2,2,2,1,1];
    [[topS,top],[botS,bot]].forEach(([d,c])=>{d.av.style.background=c==1?'linear-gradient(135deg,#fff,#bfae92)':'linear-gradient(135deg,#6a7083,#0c0d12)';d.nm.innerHTML='';d.nm.append(nm(c));d.nm.append(mk('small',{},sub(c)));
      d.cp.innerHTML='';for(let t=5;t>=1;t--){const miss=Math.max(0,S0[t]-cnt[-c][t]);for(let k=0;k<miss;k++){const w=mk('span');w.innerHTML=svg(-c*t);d.cp.append(w.firstChild)}}
      const adv=(mat*c);d.ad.textContent=adv>0?'+'+adv:'';d.tn.className='chx-turn'+(s.t==c&&!over?' on':'')})}
  function movesList(){ml.innerHTML='';ml.append(mk('h4',{},'Moves'));for(let i=0;i<sans.length;i+=2){const r=mk('div',{class:'chx-mv'});r.append(mk('span',{},(i/2+1)+'.'),mk('span',{class:i==sans.length-1?'cu':''},sans[i]),mk('span',{class:i+1==sans.length-1?'cu':''},sans[i+1]||''));ml.append(r)}ml.scrollTop=ml.scrollHeight}
  function panel(){strips();movesList();bU.disabled=thinking||!stk.length||mode=='online'}

  // ---------- input ----------
  function tryMove(ms){if(ms.length>1){openPromo(ms);return}play(ms[0])}
  function openPromo(ms){promo=ms;ov.innerHTML='';const c=mk('div',{class:'chx-card'}),r=mk('div',{class:'chx-pr'});c.append(mk('b',{},'Promote to'));
    [5,4,3,2].forEach(p=>{const b=mk('button',{type:'button','aria-label':['','','Knight','Bishop','Rook','Queen'][p]});b.innerHTML=svg(p*s.t);b.onclick=e=>{e.stopPropagation();ov.hidden=true;const m=ms.find(x=>x.pr==p);promo=null;play(m)};r.append(b)});
    c.append(r);ov.append(c);ov.hidden=false;ov.onclick=()=>{if(promo){promo=null;ov.hidden=true;squares()}}}
  const blocked=()=>over||promo||thinking||(mode=='cpu'&&s.t!=me)||(mode=='online'&&(wait||s.t!=me))||mode==null;
  bd.onpointerdown=e=>{if(blocked())return;const q=sqOf(e);
    if(sel!=null){const ms=CE.legal(s).filter(m=>m.f==sel&&m.t==q);if(ms.length){tryMove(ms);return}}
    if(s.b[q]*s.t>0){const was=sel==q;sel=q;const o=pcs.find(x=>x.sq==q);drag={o,x:e.clientX,y:e.clientY,on:0,q,was};try{bd.setPointerCapture(e.pointerId)}catch{}squares()}else{sel=null;squares()}};
  bd.onpointermove=e=>{if(!drag)return;if(!drag.on&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;drag.on=1;const r=bd.getBoundingClientRect(),w=r.width/8;drag.o.el.classList.add('drag');drag.o.el.style.transform=`translate(${((e.clientX-r.left)/w-.5)*100}%,${((e.clientY-r.top)/w-.5)*100}%)`};
  bd.onpointerup=e=>{if(!drag)return;const d=drag;drag=null;d.o.el.classList.remove('drag');
    if(d.on){const q=sqOf(e),ms=CE.legal(s).filter(m=>m.f==d.q&&m.t==q);if(ms.length){if(ms.length>1)place(d.o);tryMove(ms)}else place(d.o)}
    else if(d.was){sel=null;squares()}};
  bd.onpointercancel=()=>{if(drag){drag.o.el.classList.remove('drag');place(drag.o);drag=null}};

  st('Pick a game mode.');return()=>{dead=1;if(ws)ws.close()};
}
