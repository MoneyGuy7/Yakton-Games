// Site features: sound effects engine (synthesized, no audio files) and the settings panel.
// Games call SFX.play('name'). Sounds respect the on/off switch and volume saved in Settings.
const SFX=(()=>{
  const KEY='yk-settings';
  const S={sound:true,vol:.7};
  try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)))}catch(e){}
  let ctx=null,master=null;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
  function init(){
    if(ctx){if(ctx.state=='suspended')ctx.resume();return true}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    ctx=new AC();master=ctx.createGain();master.gain.value=S.vol;master.connect(ctx.destination);return true;
  }
  function tone(f0,f1,dur,type='square',vol=.25,delay=0){
    const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02);
  }
  function noise(dur,fq,vol=.3,delay=0){
    const t=ctx.currentTime+delay,n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=b;f.type='lowpass';f.frequency.setValueAtTime(fq,t);f.frequency.exponentialRampToValueAtTime(100,t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(master);s.start(t);
  }
  const lib={
    click:()=>tone(520,780,.06,'square',.12),
    gun:()=>{noise(.06,3000,.12);tone(220,90,.05,'square',.06)},
    hitm:()=>{tone(1500,900,.05,'square',.14);tone(2200,1800,.04,'triangle',.08,.02)},
    boom:()=>{noise(.55,900,.5);tone(110,35,.5,'sawtooth',.3)},
    rocket:()=>{noise(.4,1800,.25);tone(300,900,.35,'sawtooth',.1)},
    hop:()=>tone(300,620,.09,'square',.16),
    boing:()=>{tone(200,800,.25,'sine',.28);tone(400,1200,.2,'triangle',.1,.05)},
    bump:()=>tone(150,90,.1,'triangle',.25),
    coin:()=>{tone(988,988,.07,'square',.16);tone(1319,1319,.16,'square',.16,.07)},
    splash:()=>{noise(.45,2600,.4);tone(500,120,.25,'sine',.15)},
    splat:()=>{noise(.2,900,.4);tone(140,50,.22,'triangle',.4)},
    warn:()=>{for(let i=0;i<3;i++)tone(1100,1100,.12,'square',.13,i*.3)},
    train:()=>{tone(220,220,.7,'sawtooth',.14);tone(277,277,.7,'sawtooth',.12);noise(.9,500,.12)},
    eagle:()=>{tone(1800,700,.5,'sawtooth',.18);tone(1500,500,.5,'square',.08,.05)},
    swipe:()=>tone(380,640,.05,'triangle',.1),
    slide:()=>noise(.25,2200,.18),
    crash:()=>{noise(.3,1200,.4);tone(120,45,.3,'triangle',.4)},
    win:()=>[523,659,784,1047].forEach((f,i)=>tone(f,f,.14,'square',.16,i*.1)),
    lose:()=>[400,330,260,180].forEach((f,i)=>tone(f,f*.9,.16,'sawtooth',.15,i*.13))
  };
  return{
    S,
    play(n){if(!S.sound||!lib[n]||!init())return;try{lib[n]()}catch(e){}},
    unlock(){if(S.sound)init()},
    setSound(v){S.sound=!!v;save();if(S.sound&&init())lib.click()},
    setVol(v){S.vol=Math.max(0,Math.min(1,v));save();if(master)master.gain.value=S.vol}
  };
})();

window.SFX=SFX;
(function settingsUI(){
  const hb=mk('div',{class:'hb'}),snd=mk('button',{type:'button',class:'ib','aria-label':'Toggle sound'}),cog=mk('button',{type:'button',class:'ib','aria-label':'Settings'},'⚙');
  hb.append($('#q'),snd,cog);$('header').append(hb);
  const panel=mk('div',{id:'settings',hidden:'',role:'dialog','aria-label':'Settings'});
  panel.innerHTML=`<div class="box"><h2>Settings</h2>
    <label class="srow"><span>Sound effects</span><input id="s-snd" type="checkbox"></label>
    <label class="srow"><span>Volume</span><input id="s-vol" type="range" min="0" max="100"></label>
    <div class="srow"><span>Test sound</span><button type="button" id="s-test" class="ghost">Play</button></div>
    <p class="sm">Tip: press M anywhere to mute or unmute.</p>
    <div class="srow"><span></span><button type="button" id="s-x" class="ghost">Close</button></div></div>`;
  document.body.append(panel);
  const cb=$('#s-snd'),vol=$('#s-vol');
  function sync(){snd.textContent=SFX.S.sound?'🔊':'🔇';cb.checked=SFX.S.sound;vol.value=Math.round(SFX.S.vol*100);vol.disabled=!SFX.S.sound}
  const toggle=v=>{SFX.setSound(v);sync()};
  snd.onclick=()=>toggle(!SFX.S.sound);
  cb.onchange=()=>toggle(cb.checked);
  vol.oninput=()=>{SFX.setVol(vol.value/100)};vol.onchange=()=>SFX.play('click');
  $('#s-test').onclick=()=>SFX.play('coin');
  const open=v=>{panel.hidden=!v;if(v)cb.focus();else cog.focus()};
  cog.onclick=()=>open(panel.hidden);$('#s-x').onclick=()=>open(false);
  panel.onclick=e=>{if(e.target==panel)open(false)};
  addEventListener('keydown',e=>{
    if(e.key=='Escape'&&!panel.hidden)open(false);
    if((e.key=='m'||e.key=='M')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!e.ctrlKey&&!e.metaKey&&!e.altKey)toggle(!SFX.S.sound);
  });
  // Browsers only allow audio after a click or key press.
  ['pointerdown','keydown'].forEach(t=>addEventListener(t,()=>SFX.unlock(),{once:true,capture:true}));
  // Small click sound on the game tiles and the buttons under the game.
  document.addEventListener('click',e=>{if(e.target.closest('.tile,.bar button,#chips button'))SFX.play('click')},true);
  sync();
})();

// Maintenance notice: if the site is switched to downtime while someone is playing, show a banner instead of cutting them off.
// An admin who is logged in can still see the site during downtime and gets a small reminder.
(function downtimeWatch(){
  let bar=null;
  const show=(txt,cls)=>{if(!bar){bar=mk('div',{class:'mbanner',role:'status'});document.body.append(bar)}bar.className='mbanner '+cls;bar.textContent=txt};
  const hide=()=>{if(bar){bar.remove();bar=null}};
  const check=()=>fetch('/api/status',{cache:'no-store'}).then(r=>r.json()).then(s=>{
    if(!s.down)hide();
    else if(s.bypass)show('Downtime is ON. Visitors see the downtime screen. You can see the site because you are logged in as admin.','pv');
    else show('Yakton Games is going down for maintenance soon. Finish your game, then refresh the page.','');
  }).catch(()=>{});
  setInterval(check,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
  check();
})();
