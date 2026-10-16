const G=[
  {id:'pong',name:'Pong Online',tag:'Multiplayer',a:'#ffd21f',b:'#17171a',help:'Play a bot or a friend with the same room code. Up and Down or W and S to move. First to 7 wins.',run:pong},
  {id:'stack',name:'Stack',tag:'Arcade',a:'#7c3aed',b:'#1b1b4a',help:'Click, tap or press Space to drop the sliding block. Misaligned parts get cut off.',run:stack},
  {id:'hop',name:'Sky Hop',tag:'Arcade',a:'#38bdf8',b:'#2f9e44',help:'Bounce up the platforms. Arrow keys, A and D, or drag to steer. Do not fall.',run:hop},
  {id:'heli',name:'Heli Duel',tag:'Multiplayer',a:'#3b82f6',b:'#e63027',help:'Dogfight a friend with the same room code, or a bot. Move with arrows or WASD, hold Space to shoot.',run:heli},
  {id:'lanes',name:'Subway Rush',tag:'Runner',a:'#f2784b',b:'#2b1b4a',help:'Swipe or use arrows. Left and right change lane, Up jumps, Down slides. Jump the low red barriers and short gaps, slide under the yellow signs, and switch lanes around walls, holes and trains. Fast trains come at you with a flashing warning, and the whole run keeps speeding up. You have two hearts.',run:lanes},
  {id:'jungle',name:'Jungle Dash',tag:'Runner',a:'#16a34a',b:'#1a2e0f',help:'A side-scrolling temple escape with a giant boulder chasing you. Space, Up or the left side of the screen jumps (press again in the air to double jump, which you need for tall pillars). Down or the right side slides. Jump logs, spikes, totems and pits, slide under hanging vines, and slide or jump bats. Every hit lets the boulder gain; it falls back while you run clean. Grab gems, magnets, shields and the golden idol. The jungle turns to sunset ruins and then a glowing night, and it keeps getting faster.',run:jungle},
  {id:'drift',name:'Drift King',tag:'Runner',a:'#ec4899',b:'#2b1b4a',help:'Hold Space or press the screen to drift left. Let go to go right. The car steers itself toward the middle of the road, so line up your turns. Grab gems and spend them in the Garage under the game on upgrades (Grip, Magnet, Shield, Gem pay) and new cars. The road gets narrower and faster.',run:drift},
  {id:'void',name:'Void Run',tag:'Runner',a:'#22d3ee',b:'#1b0f3d',help:'Steer with arrows or A and D (or drag on touch). Space or tap jumps. Leap the gaps, dodge the pink blocks, grab the glowing orbs. It speeds up the longer you run.',run:voidrun},
  {id:'royale',name:'Heli Royale',tag:'Multiplayer',a:'#a855f7',b:'#1d5fa8',help:'Battle royale with helicopters. Last one flying wins. Solo vs bots, or up to 8 friends with a room code (bots fill the lobby to 12). Move with WASD or arrows, aim with the mouse, click or Space shoots, right click or R fires a rocket. Grab crates for health, shields, rockets and speed, and stay inside the storm circle. On a phone, drag to fly (it aims for you) and tap ROCKET.',run:royale},
  {id:'link',name:'Link Blast',tag:'Shooter',a:'#22d3ee',b:'#1b0f3d',help:'Drag from dot to dot to link them. Every linked dot fires, and the lines are lasers. Drag back to your first dot to close a loop: it blasts everything inside and drops a power-up. Shoot or touch power-ups to grab them: more shots, damage, piercing, freeze, fast charge, extra life, bomb. Do not let the blobs reach your base.',run:linkblast},
  {id:'clicker',name:'Pizza Clicker',tag:'Idle',a:'#f2a33a',b:'#8f2a1a',help:'Click the pizza, buy ovens, cooks and trucks, and grab the golden pizza when it pops up. Progress saves.',run:clicker},
  {id:'chess',name:'Chess',tag:'Board',a:'#94a3b8',b:'#17171a',help:'Play the computer at four skill levels, a friend on this screen, or a friend online with a room code.',run:chess},
  {id:'racer',name:'Traffic Racer',tag:'Cars',a:'#e63027',b:'#17171a',help:'Left and right (or A and D) to steer. Hold Space or Up for nitro. On a phone, touch the left or right side.',run:racer},
  {id:'dash',name:'Cube Dash',tag:'Arcade',a:'#7c3aed',b:'#17171a',help:'A rhythm platformer with 3 levels. Hold Space, Up or the screen to jump over spikes, saw blades and blocks. Yellow pads and rings boost you higher (tap while touching a ring). Portals turn you into a flying ship (hold to rise), flip gravity or speed you up. Grab the 3 coins in each level, and turn on Practice mode for checkpoints. Stars unlock new cube colors.',run:dash},
  {id:'tetris',name:'Block Drop',tag:'Puzzle',a:'#06b6d4',b:'#17171a',help:'Arrows move, Up rotates, Down drops one step, Space slams it down. Tap rotates on a phone.',run:tetris},
  {id:'rush',name:'Pizza Rush',tag:'Cars',a:'#ffd21f',b:'#17171a',help:'Deliver pizzas through a busy city before the shift clock runs out. Arrows or WASD drive, Shift is nitro, Space is a handbrake drift. Load up at the red P (the bag holds 1 to 3 pizzas), then reach each glowing $ house before its timer ends. Fast clean deliveries pay tips and build a streak bonus, crashes spoil the pizza, and cyan pads give a boost. Cash is banked each shift and spent in the Garage below on engine, tires, nitro, a bigger bag, bumpers and more time.',run:rush},
  {id:'flappy',name:'Flappy Pizza',tag:'Arcade',a:'#38bdf8',b:'#17171a',help:'Space, click or tap to flap through the gaps.',run:flappy},
  {id:'breakout',name:'Brick Breaker',tag:'Arcade',a:'#f43f5e',b:'#17171a',help:'Mouse or arrow keys to move. Click or Space to launch the ball.',run:breakout},
  {id:'cross',name:'Road Hop',tag:'Runner',a:'#22c55e',b:'#17171a',help:'Hop forward as far as you can. Arrow keys, WASD, swipe, or tap to go forward. Ride the logs, dodge cars, watch for trains, and do not stand still or the eagle gets you.',run:cross},
  {id:'snake',name:'Snake',tag:'Arcade',a:'#2f9e6f',b:'#17171a',help:'Arrow keys or WASD. Swipe on a phone.',run:snake},
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
