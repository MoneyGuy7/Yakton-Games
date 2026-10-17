const G=[
  {id:'pong',name:'Pong Online',tag:'Multiplayer',a:'#ffd21f',b:'#17171a',help:'Play a bot or a friend with the same room code. Up and Down or W and S to move. First to 7 wins.',run:pong},
  {id:'stack',name:'Stack',tag:'Arcade',a:'#7c3aed',b:'#1b1b4a',help:'Click, tap or press Space to drop the sliding block. Misaligned parts get cut off.',run:stack},
  {id:'hop',name:'Sky Hop',tag:'Arcade',a:'#38bdf8',b:'#2f9e44',help:'Pick Easy (the relaxed original) or Hard (narrow, fast platforms, crumbling brown ones, and birds you can stomp from above or must dodge). Arrow keys, A and D, or drag to steer. Press 1 or 2 on the menu. Do not fall.',run:hop},
  {id:'heli',name:'Heli Duel',tag:'Multiplayer',a:'#3b82f6',b:'#e63027',help:'Dogfight a bot (Easy, Normal, Hard) or a friend with the same room code. WASD flies, the mouse aims, hold click to fire the gun, right click or R launches a rocket. On a phone: left thumb flies, right thumb aims and fires, tap ROCKET.',run:heli},
  {id:'lanes',name:'Subway Rush',tag:'Runner',a:'#f2784b',b:'#2b1b4a',help:'Swipe or use arrows. Left and right change lane, Up jumps, Down slides. Jump the low red barriers and short gaps, slide under the yellow signs, and switch lanes around walls, holes and trains. Fast trains come at you with a flashing warning, and the whole run keeps speeding up. You have two hearts. Orange ramps lead up onto a train roof: ride it for coins, then drop off the back.',run:lanes},
  {id:'jungle',name:'Jungle Dash',tag:'Runner',a:'#16a34a',b:'#1a2e0f',help:'A side-scrolling temple escape with a giant boulder chasing you. Space, Up or the left side of the screen jumps (press again in the air to double jump, which you need for tall pillars). Down or the right side slides. Jump logs, spikes, totems and pits, slide under hanging vines, and slide or jump bats. Every hit lets the boulder gain; it falls back while you run clean. Grab gems, magnets, shields and the golden idol. The jungle turns to sunset ruins and then a glowing night, and it keeps getting faster. Hard mode now: rolling logs, snakes, darts and falling rocks, and two hits close together let the boulder catch you.',run:jungle},
  {id:'drift',name:'Drift King',tag:'Runner',a:'#ec4899',b:'#2b1b4a',help:'Hold Space or press the screen to drift left. Let go to go right. Time your turns at the corners and stay on the road. It starts forgiving, then the road narrows, speeds up and the help fades, and the colors change as you score. Grab gems and spend them in the Garage under the game.',run:drift},
  {id:'void',name:'Void Run',tag:'Runner',a:'#22d3ee',b:'#1b0f3d',help:'A square tunnel with four faces. Run left or right (arrows, A and D, or drag) and you go around the corner onto the walls and the ceiling while the whole tunnel spins. Space or tap jumps the holes and pink blocks. Grab the glowing orbs. It speeds up the longer you run.',run:voidrun},
  {id:'royale',name:'Heli Royale',tag:'Multiplayer',a:'#a855f7',b:'#1d5fa8',help:'Battle royale with helicopters. Every hit shows a hit marker, a tick sound and a damage number, and a kill shows ELIMINATED. Last one flying wins. Solo vs bots, or up to 8 friends with a room code (bots fill the lobby to 12). Move with WASD or arrows, aim with the mouse, click or Space shoots, right click or R fires a rocket. Grab crates for health, shields, rockets and speed, and stay inside the storm circle. On a phone, drag to fly (it aims for you) and tap ROCKET.',run:royale},
  {id:'link',name:'Link Blast',tag:'Shooter',a:'#22d3ee',b:'#1b0f3d',help:'Drag from dot to dot to link them. Every linked dot fires, and the lines are lasers. Drag back to your first dot to close a loop: it blasts everything inside and drops a power-up. Shoot or touch power-ups to grab them: more shots, damage, piercing, freeze, fast charge, extra life, bomb. Do not let the blobs reach your base.',run:linkblast},
  {id:'sudoku',name:'Sudoku',tag:'Puzzle',a:'#3b82f6',b:'#0f172a',help:'Fill every row, column and 3 by 3 box with 1 to 9. Click a square and type a number or use the pad. Notes mode (N) lets you pencil in candidates. Easy, Medium and Hard puzzles have exactly one answer.',run:sudoku},
  {id:'connect4',name:'Connect 4',tag:'Multiplayer',a:'#2447d6',b:'#0b1020',help:'Get four in a row. Play the computer (three levels), a friend on this screen, or a friend online with a room code. Click a column or press 1 to 7.',run:connect4},
  {id:'solitaire',name:'Solitaire',tag:'Cards',a:'#15803d',b:'#052e16',help:'Klondike. Click a card, then click where it goes. Double-click to send a card to the foundation. Build the four suits up from Ace to King. Draw 1 or Draw 3, with Undo.',run:solitaire},
  {id:'slope',name:'Slope Run',tag:'Runner',a:'#ff6b9d',b:'#1b0f3d',help:'Roll down an endless neon track. Left and Right steer, Space or Up jumps. Jump over walls and gaps, weave through block slaloms, hit an orange ramp to fly over a huge gap, and time the swinging hammers on narrow bridges. It keeps getting faster. On touch, press the left or right side to steer and the middle to jump.',run:slopegame},
  {id:'hopper',name:'Pixel Hopper',tag:'Platformer',a:'#ff7849',b:'#5ec8ff',help:'Eight platformer levels, or Endless mode that never stops and keeps getting harder (pick it in the bar under the game). Arrows or A and D to run, Space or Up to jump (hold for a higher jump). Stomp slimes, bounce on red springs, avoid spikes and pits, grab coins and reach the flag. In Endless, distance and coins make your score.',run:hopper},
  {id:'candy',name:'Candy Snip',tag:'Physics',a:'#7cdc4a',b:'#245a31',help:'Swipe across the ropes to cut them. Swing the candy into the hungry monster and grab the stars on the way. 18 levels, and there is no timer, so take your time. The first levels teach you with a tutorial and a green glow that shows the best moment to cut. Stuck? Press Hint (or H) and the glow comes back for a few seconds.',run:candy},
  {id:'lights',name:'Lights Out',tag:'Puzzle',a:'#ffd21f',b:'#1b1b2a',help:'Tapping a light flips it and the lights next to it. Turn them all off. Levels get harder.',run:lights},
  {id:'slide',name:'Slide Puzzle',tag:'Puzzle',a:'#3b6fd4',b:'#0f172a',help:'Slide the tiles into order, 1 to 15. Click a tile next to the gap, or use the arrow keys.',run:slide},
  {id:'clicker',name:'Pizza Clicker',tag:'Idle',a:'#f2a33a',b:'#8f2a1a',help:'Click the pizza (or press Space) to bake. Buy ovens, cooks, cars, trucks, factories and pizza planets and watch them show up in your pizzeria. Use x1, x10 or Max to buy in bulk, and grab the golden pizza for a bonus or a click frenzy. Progress saves, and your team keeps baking while you are away.',run:clicker},
  {id:'chess',name:'Chess',tag:'Board',a:'#94a3b8',b:'#17171a',help:'Play the computer at six skill levels, a friend on this screen, or a friend online with a room code. Click or drag pieces (they slide into place), pick a promotion piece, undo, flip the board and switch between Walnut, Marble and Forest boards. Captured pieces and a move list are shown.',run:chess},
  {id:'racer',name:'Traffic Racer',tag:'Cars',a:'#e63027',b:'#17171a',help:'Five modes: Cruise (3 lives), Endless, Rush Hour (5 lanes, trucks, lane swappers), Time Attack (gates add time) and Night Run (dark, headlights only). Steer with arrows or A and D, Space or Up is nitro, Down brakes, P pauses. Near misses build a combo, coins add points, blue cans refill nitro. On a phone, touch the left or right side to steer and use the NITRO button.',run:racer},
  {id:'dash',name:'Cube Dash',tag:'Arcade',a:'#7c3aed',b:'#17171a',help:'A rhythm platformer with 3 levels (Warm Up, Flip Side, Deep Core). It is much gentler now, with wider gaps and a grace window for late jumps. Hold Space, Up or the screen to jump over spikes, saw blades and blocks. Yellow pads and rings boost you higher (tap while touching a ring). Portals turn you into a flying ship (hold to rise), flip gravity or speed you up. Grab the 3 coins in each level, and turn on Practice mode for checkpoints. Stars unlock new cube colors.',run:dash},
  {id:'tetris',name:'Block Drop',tag:'Puzzle',a:'#06b6d4',b:'#17171a',help:'Arrows move, Up rotates, Down drops one step, Space slams it down. Tap rotates on a phone.',run:tetris},
  {id:'rush',name:'Pizza Rush',tag:'Cars',a:'#ffd21f',b:'#17171a',help:'New here? Press the How to play button (or T) for a quick hands-on tutorial. Deliver pizzas through a busy city before the shift clock runs out. Arrows or WASD drive, Shift is nitro, Space is a handbrake drift. Load up at the red P (the bag holds 1 to 3 pizzas), then reach each glowing $ house before its timer ends. Fast clean deliveries pay tips and build a streak bonus, crashes spoil the pizza, and cyan pads give a boost. Cash is banked each shift and spent in the Garage below on engine, tires, nitro, a bigger bag, bumpers and more time.',run:rush},
  {id:'flappy',name:'Flappy Pizza',tag:'Arcade',a:'#38bdf8',b:'#17171a',help:'Space, click or tap to flap between the chimneys. Gaps shrink and start to bob as your score climbs, and the sky turns from day to night. Grab the coins to unlock new pizzas (use the arrows on the title screen), and aim for the bronze, silver, gold and platinum medals.',run:flappy},
  {id:'breakout',name:'Brick Breaker',tag:'Arcade',a:'#f43f5e',b:'#17171a',help:'Mouse, touch drag or arrow keys move the paddle. Click or Space launches the ball. Metal bricks cannot be broken, bombs blow up their neighbours, and tough bricks take several hits. Catch falling capsules: W wide paddle, M multiball, S slow ball, L lasers (click or Space to fire), heart for an extra life. Chain hits without touching the paddle for a combo bonus.',run:breakout},
  {id:'cross',name:'Road Hop',tag:'Runner',a:'#22c55e',b:'#17171a',help:'Hop forward as far as you can. Arrow keys, WASD, swipe, or tap to go forward. Ride the logs, dodge cars, watch for trains, and do not stand still or the eagle gets you.',run:cross},
  {id:'snake',name:'Snake',tag:'Arcade',a:'#2f9e6f',b:'#17171a',help:'Arrow keys or WASD, or swipe on a phone. Pick a mode: Classic (walls kill), Wrap Around (walls are portals), Maze (rocks, and more of them as you eat), Time Attack (60 seconds) or Power-Ups (gold stars for points, ice to slow down, ghost to pass through yourself). Choose Chill, Normal or Fast. Eat apples quickly one after another for a streak bonus up to x5. P pauses, Esc goes back to the menu. Every mode and speed keeps its own best score.',run:snake},
  {id:'react',name:'Reaction Time',tag:'Arcade',a:'#3ddc84',b:'#17171a',help:'Click as soon as the box turns green.',run:react},
  {id:'2048',name:'2048',tag:'Puzzle',a:'#f2c14e',b:'#17171a',help:'Slide tiles with arrow keys or swipes. Matching numbers merge.',run:g2048},
  {id:'memory',name:'Memory Match',tag:'Puzzle',a:'#e63027',b:'#f4f4f0',help:'Flip two cards at a time and find the pairs.',run:memory},
  {id:'mines',name:'Minesweeper',tag:'Puzzle',a:'#7a7a86',b:'#17171a',help:'Numbers count the mines next to a square. Your first click is safe.',run:mines},
  {id:'ttt',name:'Tic-Tac-Toe',tag:'Board',a:'#5b6cff',b:'#17171a',help:'Three in a row beats the computer.',run:ttt}
];
let tag='All';
function load(id){
  const g=G.find(x=>x.id==id);if(!g)return;cur=g.id;offs.forEach(f=>f());offs=[];if(stop)stop();
  const el=$('#game');el.innerHTML='';$('#gt').textContent=g.name;$('#help').textContent=g.help;st('');
  $('#stage').hidden=false;stop=g.run(el);history.replaceState(0,'','#'+g.id);
}
function openGame(id){load(id);$('#stage').scrollIntoView({behavior:'smooth'})}
function closeGame(){offs.forEach(f=>f());offs=[];if(stop)stop();stop=null;$('#game').innerHTML='';$('#stage').hidden=true;history.replaceState(0,'',location.pathname)}
function filter(){const q=$('#q').value.toLowerCase();G.forEach(g=>{g.el.hidden=!(g.name.toLowerCase().includes(q)&&(tag=='All'||g.tag==tag))})}
G.forEach(g=>{const b=mk('button',{type:'button',class:'tile'});b.style.cssText=`--a:${g.a};--b:${g.b}`;
  b.innerHTML=`<small>${g.tag}</small><b>${g.name}</b>`;b.onclick=()=>openGame(g.id);g.el=b;$('#grid').append(b)});
['All',...new Set(G.map(g=>g.tag))].forEach(t=>{const b=mk('button',{type:'button'},t);b.onclick=()=>{tag=t;document.querySelectorAll('#chips button').forEach(x=>x.setAttribute('aria-pressed',x==b));filter()};
  b.setAttribute('aria-pressed',t=='All');$('#chips').append(b)});
$('#q').oninput=filter;$('#again').onclick=()=>load(cur);$('#back').onclick=closeGame;
$('#fs').onclick=()=>{const s=$('#stage');document.fullscreenElement?document.exitFullscreen():s.requestFullscreen&&s.requestFullscreen()};
addEventListener('hashchange',()=>load(location.hash.slice(1)));
load(location.hash.slice(1));

// Logo goes home: closes the current game and returns to the game list. Never gets stuck: if anything fails, do a full reload of the home page.
function goHome(){
  try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}
  try{closeGame()}catch(e){try{offs=[];$('#game').innerHTML='';$('#stage').hidden=true;history.replaceState(0,'',location.pathname)}catch(e2){}}
  try{$('#q').value='';tag='All';document.querySelectorAll('#chips button').forEach((x,i)=>x.setAttribute('aria-pressed',i==0));filter()}catch(e){}
  scrollTo({top:0,behavior:'smooth'});
}
$('#logo').addEventListener('click',e=>{e.preventDefault();try{goHome()}catch(err){location.href='/'}});
// Blank-screen guard: coming back (back button, bfcache, tab restore) after visiting /admin must never show an empty page.
function ensureVisible(){if(!$('#grid').children.length||document.body.scrollHeight<50)location.reload()}
addEventListener('pageshow',e=>{
  let nav='';try{nav=performance.getEntriesByType('navigation')[0].type}catch(x){}
  if(e.persisted||nav==='back_forward')location.reload();else setTimeout(ensureVisible,300)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ensureVisible()});
// If the game list ever fails to build, show a reload button instead of an empty page.
setTimeout(()=>{if(!$('#grid').children.length&&!document.querySelector('.rfail')){const d=mk('div',{class:'rfail'});d.append(mk('p',{},'Something went wrong loading the games.'));const b=mk('button',{type:'button'},'Reload');b.onclick=()=>location.reload();d.append(b);$('main').append(d)}},1500);

// Feedback: a tab on the right edge of the game area, a button under the game, and one by the categories.
(function feedbackUI(){
  const box=mk('div',{id:'fbm',hidden:'',role:'dialog','aria-label':'Send feedback'});
  box.innerHTML=`<form class="fbbox"><h2>Send feedback</h2><p class="sm" id="fbg"></p>
    <textarea id="fbt" maxlength="1000" rows="5" placeholder="What did you like, what is broken, what should we add?" aria-label="Feedback"></textarea>
    <input id="fbn" maxlength="40" placeholder="Your name (optional)" aria-label="Your name">
    <p class="sm" id="fbs" aria-live="polite"></p>
    <div class="fbrow"><button type="button" class="ghost" id="fbx">Cancel</button><button type="submit" class="abtn" id="fbgo">Send</button></div></form>`;
  document.body.append(box);
  const f=box.querySelector('form'),t=$('#fbt'),s=$('#fbs'),go=$('#fbgo');
  const game=()=>{const g=G.find(x=>x.id==cur);return g?{game:g.name,gameId:g.id}:{game:'General (home page)',gameId:''}};
  const open=v=>{box.hidden=!v;if(v){$('#fbg').textContent='About: '+game().game;s.textContent='';t.focus();if(document.fullscreenElement)document.exitFullscreen()}};
  const mkBtn=(cls,txt)=>{const b=mk('button',{type:'button',class:cls},txt);b.onclick=()=>open(1);return b};
  $('.bar').append(mkBtn('','Feedback'));
  $('#stage').append(mkBtn('fbtab','💬 Feedback'));
  const hint=mk('p',{class:'fbhome'});hint.append('Got an idea or found a bug? ',mkBtn('fblink','Send feedback'));
  $('#chips').before(hint);
  $('#fbx').onclick=()=>open(0);box.onclick=e=>{if(e.target==box)open(0)};
  addEventListener('keydown',e=>{if(e.key=='Escape'&&!box.hidden)open(0)});
  // keep game keys (WASD, M) from firing while typing
  box.addEventListener('keydown',e=>e.stopPropagation());
  f.onsubmit=async e=>{e.preventDefault();go.disabled=true;s.textContent='Sending…';
    try{const r=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...game(),text:t.value,name:$('#fbn').value})});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Could not send');
      t.value='';s.textContent='Thank you! Feedback sent.';setTimeout(()=>open(0),1100)}
    catch(x){s.textContent=x.message}go.disabled=false};
})();

// Warning notice: shown once to each visitor (again whenever the admin saves a new one). Text is set in the admin panel.
(function noticeUI(){
  fetch('/api/notice',{cache:'no-store'}).then(r=>r.json()).then(n=>{
    if(!n||!n.on||!String(n.text||'').trim())return;
    let seen='';try{seen=localStorage.getItem('yk-notice')}catch(e){}
    if(seen===String(n.v))return;
    const o=mk('div',{id:'wn',role:'alertdialog','aria-modal':'true','aria-label':'Warning'}),bx=mk('div',{class:'wnbox'});
    const ic=mk('div',{class:'wnico','aria-hidden':'true'},'⚠'),tx=mk('p',{class:'wntx'},n.text),ok=mk('button',{type:'button',class:'abtn'},'Accept');
    bx.append(ic,mk('h2',{},'Warning'),tx,ok);o.append(bx);document.body.append(o);ok.focus();
    const swallow=e=>{if(o.isConnected&&e.key!='Tab')e.stopPropagation()};addEventListener('keydown',swallow,true);
    ok.onclick=()=>{try{localStorage.setItem('yk-notice',String(n.v))}catch(e){}removeEventListener('keydown',swallow,true);o.remove()};
  }).catch(()=>{});
})();
