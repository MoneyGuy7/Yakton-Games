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
    return o}
  function apply(s,m){const b=s.b.slice(),t=s.t,p=b[m.f],c=s.c.slice();b[m.t]=p;b[m.f]=0;
    if(m.ep)b[m.t+(t==1?8:-8)]=0;
    if(m.cas==1){b[m.f+1]=b[m.f+3];b[m.f+3]=0}
    if(m.cas==2){b[m.f-1]=b[m.f-4];b[m.f-4]=0}
    const row=m.t>>3;if(Math.abs(p)==1&&(row==0||row==7))b[m.t]=5*t;
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
  const GL=['','♟︎','♞','♝','♜','♛','♚'];let s,mode,me=1,lv=3,sel=null,last=null,over=0,hist=[],ws,dead=0,wait=0,room='',result='';
  const menu=mk('div',{class:'cm'}),bd=mk('div',{class:'cb'}),row=(...a)=>{const d=mk('div',{class:'row'});d.append(...a);return d};
  const lvs=mk('select',{'aria-label':'Skill level'}),side=mk('select',{'aria-label':'Your color'}),code=mk('input',{placeholder:'Room code',maxlength:8,'aria-label':'Room code'});
  ['Beginner','Easy','Medium','Hard','Expert','Master'].forEach((n,i)=>lvs.append(mk('option',{value:i+1},n)));lvs.value='3';
  [['White','1'],['Black','-1'],['Random','0']].forEach(o=>side.append(mk('option',{value:o[1]},o[0])));
  const b1=mk('button',{type:'button'},'Play the computer'),b2=mk('button',{type:'button'},'Two players, one screen'),b3=mk('button',{type:'button'},'Play a friend online'),b4=mk('button',{type:'button'},'New code');
  menu.append(row(mk('b',{},'Skill'),lvs,mk('b',{},'You play'),side),row(b1),row(b2),row(code,b4,b3));
  menu.append(mk('p',{class:'sm'},'Online: both of you type the same code. First in plays White.'));
  el.append(menu,bd);
  const find=(f,t)=>CE.legal(s).find(m=>m.f==f&&m.t==t);
  function fresh(m){mode=m;s=CE.start();sel=last=null;over=0;hist=[];menu.hidden=true;wait=0}
  b1.onclick=()=>{lv=+lvs.value;fresh('cpu');me=+side.value||(Math.random()<.5?1:-1);draw();status();if(s.t!=me)think()};
  b2.onclick=()=>{fresh('local');me=1;draw();status()};
  b4.onclick=()=>{code.value=Math.random().toString(36).slice(2,6).toUpperCase()};
  b3.onclick=()=>{room=code.value.trim().toUpperCase().replace(/\W/g,'');if(!room){st('Type a room code, or press New code.');return}
    try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws/'+room)}catch{st('Online play only works on the website.');return}
    fresh('online');wait=1;draw();st('Connecting...');
    ws.onmessage=e=>{const m=JSON.parse(e.data);
      if(m.t=='hello'){me=m.c;wait=m.n<2;draw();status()}
      else if(m.t=='join'){wait=0;ws.send(JSON.stringify({t:'sync',h:hist}));status()}
      else if(m.t=='sync'){if(!hist.length)m.h.forEach(h=>play(find(h[0],h[1]),1))}
      else if(m.t=='mv'){play(find(m.f,m.to),1)}
      else if(m.t=='left'){wait=1;st('Your friend left. They can rejoin with code '+room+'.')}
      else if(m.t=='full'){st('That room already has two players.')}};
    ws.onclose=()=>{if(!dead&&!over)st('Disconnected. Press Restart to reconnect.')}};
  function think(){setTimeout(()=>{if(!dead&&!over)play(CE.pick(s,lv))},60)}
  function play(m,remote){if(!m)return;s=CE.apply(s,m);last=m;sel=null;hist.push([m.f,m.t]);
    if(mode=='online'&&!remote)ws.send(JSON.stringify({t:'mv',f:m.f,to:m.t}));
    const n=CE.legal(s).length,chk=CE.inCheck(s,s.t);
    if(!n){over=1;result=chk?`Checkmate. ${s.t==1?'Black':'White'} wins.`:'Stalemate. It is a draw.'}else if(CE.insuf(s)){over=1;result='Draw: not enough pieces left to checkmate.'}
    draw();status();if(!over&&mode=='cpu'&&s.t!=me)think()}
  function status(){if(over)return st(result);const chk=CE.inCheck(s,s.t)?' Check!':'';
    if(mode=='online')return st(wait?`Waiting for a friend. Room code: ${room}`:`${s.t==me?'Your move':'Their move'} (you are ${me==1?'White':'Black'}).${chk}`);
    if(mode=='cpu')return st(s.t==me?'Your move.'+chk:'Computer is thinking...');
    st((s.t==1?'White':'Black')+' to move.'+chk)}
  function onSq(i){if(over||(mode=='cpu'&&s.t!=me)||(mode=='online'&&(wait||s.t!=me)))return;
    const m=sel!=null&&CE.legal(s).find(x=>x.f==sel&&x.t==i);if(m)play(m);else{sel=s.b[i]*s.t>0?i:null;draw()}}
  function draw(){bd.innerHTML='';const ms=sel==null?[]:CE.legal(s).filter(m=>m.f==sel),ks=CE.inCheck(s,s.t)?s.b.indexOf(6*s.t):-1,flip=me==-1&&mode!='local';
    for(let k=0;k<64;k++){const i=flip?63-k:k,p=s.b[i],r=i>>3,c=i&7;let cl='sq '+((r+c)%2?'d':'l')+(p>0?' w':p<0?' b':'');
      if(i==sel)cl+=' sel';else if(ms.some(m=>m.t==i))cl+=p?' cap':' to';else if(i==ks)cl+=' chk';else if(last&&(last.f==i||last.t==i))cl+=' last';
      const q=mk('button',{type:'button',class:cl,'aria-label':'Square '+'abcdefgh'[c]+(8-r)},p?GL[Math.abs(p)]:'');q.onclick=()=>onSq(i);bd.append(q)}}
  st('Pick a game mode.');return()=>{dead=1;if(ws)ws.close()};
}
