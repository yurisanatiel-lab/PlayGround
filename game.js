(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = 960, H = 540;
  const $ = (id) => document.getElementById(id);
  const levels = [
    {name:'Bosque dos Começos', short:'Bosque', title:'O primeiro passo', desc:'Atravesse o bosque e encontre a saída.', sky:['#8bc9c2','#d5d9a1'], far:'#739b75', hills:'#537e68', ground:'#584c46', grass:'#8aab68', length:2200, boss:'Guardião Musgoso', bossColor:'#72aa78', puzzle:'Acenda o antigo farol', items:[['coin',280,350],['coin',450,300],['star',680,290],['coin',790,350],['trophy',900,350],['coin',1180,340],['trophy',1390,295],['star',1570,270],['coin',1760,345],['trophy',1810,315]], platforms:[[220,390,110],[390,340,115],[620,330,120],[760,390,100],[1040,360,115],[1210,310,120],[1350,335,100],[1530,300,120],[1720,360,110]], switchX:1060},
    {name:'Grutas de Cristal', short:'Grutas', title:'O enigma de pedra', desc:'Resolva o enigma e desperte o guardião.', sky:['#536b81','#a5a18e'], far:'#49566a', hills:'#35465b', ground:'#48484d', grass:'#849594', length:2300, boss:'Touro de Basalto', bossColor:'#c48668', puzzle:'Ative o cristal azul', items:[['coin',300,350],['star',500,285],['trophy',710,330],['coin',900,375],['coin',1120,340],['trophy',1340,300],['star',1600,285],['coin',1810,350]], platforms:[[240,390,120],[430,335,120],[650,380,110],[850,325,120],[1040,380,110],[1260,340,120],[1470,300,120],[1690,350,120],[1880,315,100]], switchX:1040},
    {name:'Céu Antigo', short:'Céu antigo', title:'O dragão adormecido', desc:'Suba às nuvens e enfrente a última prova.', sky:['#6d87bb','#e1b5b3'], far:'#8ca6c2', hills:'#627eaa', ground:'#596276', grass:'#a5c5b7', length:2400, boss:'Dragão das Nuvens', bossColor:'#b18ad0', puzzle:'Alinhe as estrelas', items:[['coin',290,340],['star',480,280],['coin',680,350],['coin',900,290],['star',1110,280],['trophy',1320,345],['coin',1510,290],['star',1740,260],['trophy',1920,340]], platforms:[[230,380,130],[420,325,120],[640,385,120],[850,330,120],[1050,380,130],[1270,325,130],[1480,370,120],[1700,310,130],[1890,365,120]]}
  ];
  const game = {started:false,paused:false,level:0,camera:0,coins:0,stars:0,trophies:0,orb:false,wishes:0,health:3,items:[],switchOn:false,boss:{x:0,hp:3,max:3,dir:-1,hit:0},player:{x:70,y:390,vx:0,vy:0,w:28,h:38,grounded:false,facing:1,attack:0,invuln:0},keys:{},last:0,toastTimer:0,won:false};
  const input = game.keys;
  function level(){return levels[game.level]}
  function beginLevel(){
    const l=level(); game.camera=0; game.switchOn=false; game.items=l.items.map(([type,x,y],i)=>({type,x,y,got:false,phase:i*.8}));
    game.boss={x:l.length-210,hp:3,max:3,dir:-1,hit:0,defeated:false}; game.enemies=[{x:560+game.level*30,dir:1},{x:850+game.level*25,dir:-1},{x:1510,dir:1}]; game.player.x=75;game.player.y=390;game.player.vx=0;game.player.vy=0;game.player.grounded=false;game.player.invuln=0;
    $('worldName').textContent=l.name; $('topLevel').textContent=`MUNDO 0${game.level+1}`; $('missionNumber').textContent=`0${game.level+1}`;$('missionTitle').textContent=l.title;$('missionText').textContent=l.desc;$('progressText').textContent=l.name.toUpperCase();
    updateWorldList(); updateUI();
  }
  function updateWorldList(){document.querySelectorAll('.world-row').forEach((el,i)=>{el.classList.toggle('active',i===game.level);el.classList.toggle('locked',i>game.level);const s=el.querySelector('.world-state');s.textContent=i<game.level?'✓':i===game.level?'AGORA':'⌑';});}
  function updateUI(){ $('coinCount').textContent=String(game.coins).padStart(2,'0');$('starCount').textContent=String(game.stars).padStart(2,'0');$('invCoins').textContent=String(game.coins).padStart(2,'0');$('invStars').textContent=String(game.stars).padStart(2,'0');$('invTrophies').textContent=`${game.trophies}/7`; $('invOrb').textContent=game.orb?'1':'—';$('exchangeCount').textContent=`${Math.min(game.trophies,7)} / 7`;$('exchangeBtn').disabled=game.orb?game.wishes>=3:game.trophies<7;
    document.querySelectorAll('.health i').forEach((el,i)=>el.style.opacity=i<game.health?'1':'.2');
    const exchange=$('exchangeBtn');exchange.innerHTML=game.orb?'<span>✧</span> INVOCAR O DRAGÃO <span class="exchange-count">'+game.wishes+' / 3</span>':'<span>✧</span> TROCAR 7 RELÍQUIAS <span class="exchange-count" id="exchangeCount">'+Math.min(game.trophies,7)+' / 7</span>';
    const p=Math.min(100,Math.round((game.player.x/level().length)*100));$('missionProgress').style.width=`${p}%`;$('progressPercent').textContent=`${p}%`;
    $('controlTip').textContent=game.switchOn?'A passagem abriu. Encontre o guardião!':level().puzzle+' — aproxime-se e pressione X.';
  }
  function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');game.toastTimer=2.2;}
  function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
  function pixelText(text,x,y,size,color,align='left'){ctx.fillStyle=color;ctx.font=`${size}px "DM Mono", monospace`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left'}
  function drawBackground(l,cam){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,l.sky[0]);g.addColorStop(1,l.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // chunky sun and drifting pixel clouds
    ctx.fillStyle='#f8df9b';ctx.fillRect(738,92,42,42);ctx.fillRect(730,100,58,26);ctx.fillStyle='#fff0bb';ctx.fillRect(746,84,25,8);
    for(let i=0;i<5;i++){let x=((i*247-cam*.14+1200)%1200)-120;let y=65+(i%3)*39;rect(x,y,60,13,'#fff5d5a0');rect(x+13,y-8,32,12,'#fff5d5a0');rect(x+23,y+13,42,8,'#fff5d5a0')}
    // distant mountains / trees
    for(let i=0;i<9;i++){let x=((i*170-cam*.24+1700)%1530)-200;let y=280+(i%3)*24;rect(x+18,y-52,14,100,l.far);rect(x,y-48,50,45,l.far);rect(x+9,y-67,33,23,l.far);}
    for(let i=0;i<9;i++){let x=((i*163-cam*.43+1500)%1450)-160;let y=330+(i%2)*18;rect(x+27,y-95,15,140,l.hills);rect(x,y-79,68,65,l.hills);rect(x+12,y-100,44,30,l.hills);rect(x+8,y-5,10,5,'#a3bc7d')}
    // little floating motes
    for(let i=0;i<12;i++){let x=(i*89+42-cam*.55)%W,y=170+(i*47)%180;rect(x,y,3,3,i%2?'#f8e8a4':'#e9fff0')}
  }
  function drawEnemies(){
    const cam=game.camera;
    for(const e of game.enemies){if(e.dead)continue;const x=e.x-cam;if(x<-30||x>W+30)continue;const y=417+Math.sin(performance.now()/220+e.x)*2;
      rect(x-12,y-13,24,16,'#695a5c');rect(x-9,y-20,18,11,'#88736a');rect(x-9,y-10,5,4,'#f1d176');rect(x+4,y-10,5,4,'#f1d176');rect(x-9,y+3,7,5,'#393c48');rect(x+3,y+3,7,5,'#393c48');rect(x-4,y-19,4,3,'#d3a088');
    }
  }
  function drawBoss(){
    const b=game.boss;if(!b||b.defeated)return;const x=b.x-game.camera,y=394+Math.sin(performance.now()/270)*3;if(x<-100||x>W+100)return;
    // chunky, original guardian sprite
    rect(x-37,y-37,74,38,level().bossColor);rect(x-30,y-50,60,19,level().bossColor);rect(x-40,y-28,12,24,'#52695e');rect(x+28,y-28,12,24,'#52695e');
    rect(x-19,y-46,8,7,'#fff0c8');rect(x+11,y-46,8,7,'#fff0c8');rect(x-16,y-44,4,5,'#27354a');rect(x+14,y-44,4,5,'#27354a');rect(x-8,y-28,16,5,'#493f4a');
    rect(x-36,y-58,13,9,'#d9c779');rect(x+24,y-58,13,9,'#d9c779');rect(x-27,y+1,19,8,'#394556');rect(x+8,y+1,19,8,'#394556');
    // boss health bar
    rect(x-41,y-72,82,8,'#17243a');rect(x-39,y-70,78*Math.max(0,b.hp)/b.max,4,'#ef8e78');rect(x-38,y-86,76,9,'#132137b8');pixelText(level().boss, x, y-79,8,'#fff0cd','center');
  }
  function drawPlayer(){
    const p=game.player,x=p.x-game.camera,y=p.y; if(p.invuln>0&&Math.floor(performance.now()/90)%2)return;
    // scarf trail
    if(p.facing>0){rect(x-13,y+8,8,5,'#e68867');rect(x-19,y+10,7,4,'#e68867')}else{rect(x+5,y+8,8,5,'#e68867');rect(x+12,y+10,7,4,'#e68867')}
    // boots / body / face / cap
    rect(x-10,y+28,9,10,'#534553');rect(x+2,y+28,10,10,'#534553');rect(x-11,y+34,12,4,'#263448');rect(x+1,y+34,13,4,'#263448');
    rect(x-11,y+9,23,21,'#e87759');rect(x-14,y+13,5,13,'#e87759');rect(x-8,y-3,19,18,'#f2c397');rect(x-12,y-8,25,9,'#da7255');rect(x-9,y-13,19,8,'#e88d65');rect(x+3,y+3,4,5,'#29384c');rect(x+9,y+7,5,3,'#7a4c4a');
    rect(x-7,y+16,4,9,'#f1cc72');rect(x+2,y+16,4,9,'#f1cc72');
    if(p.attack>0){let ax=x+p.facing*24;rect(ax-5,y+7,10,17,'#fff0a5');rect(ax-9,y+11,18,8,'#f6d77c');rect(ax-2,y+3,4,4,'#fff')}
  }
  function drawWorld(){
    const l=level(),cam=game.camera;drawBackground(l,cam);
    // distant path
    rect(0,436,W,104,l.ground);rect(0,436,W,9,l.grass);rect(0,445,W,5,'#b3b773');
    for(let x=-((cam*.8)%48);x<W;x+=48){rect(x,461,18,4,'#423f45');rect(x+24,487,12,4,'#6d5b4b');rect(x+5,519,24,4,'#514b4c')}
    // decorative shrub and flowers
    for(let i=0;i<16;i++){let x=((i*151-cam*.88+1800)%1660)-150;if(x<0||x>W)continue;let y=433-(i%3)*2;rect(x,y-15,20,15,i%2?'#557d61':'#6d9468');rect(x+6,y-22,12,9,'#749e6d');if(i%3===0){rect(x+14,y-19,4,4,'#f3d37e');}}
    // platforms
    for(const [wx,py,pw] of l.platforms){let x=wx-cam;if(x>W||x+pw<0)continue;rect(x,py,pw,13,l.grass);rect(x,py+13,pw,10,'#4d584f');for(let i=4;i<pw;i+=15)rect(x+i,py+15,5,4,'#71816a');}
    // puzzle plinth and gate
    const sx=l.switchX-cam;rect(sx-28,414,56,22,'#776a59');rect(sx-20,400,40,14,'#968872');rect(sx-7,376,14,24,game.switchOn?'#baf3da':'#647989');rect(sx-3,381,6,8,game.switchOn?'#f6df82':'#91b9be');
    if(!game.switchOn){let gx=l.length-125-cam;rect(gx,292,15,144,'#51445e');rect(gx+29,292,15,144,'#51445e');rect(gx-5,286,54,10,'#bd9b66');for(let y=308;y<434;y+=27)rect(gx+15,y,14,7,'#ad8e61');}
    // floating items
    game.items.forEach(it=>{if(it.got)return;let x=it.x-cam,y=it.y+Math.sin(performance.now()/400+it.phase)*4;if(x<-30||x>W+30)return;
      if(it.type==='coin'){ctx.fillStyle='#ffd15e';ctx.beginPath();ctx.ellipse(x,y,8,11,0,0,Math.PI*2);ctx.fill();rect(x-2,y-7,4,14,'#fff0a1');rect(x-6,y-12,5,3,'#fff0a1')}
      if(it.type==='star'){ctx.fillStyle='#b9f1ed';ctx.beginPath();for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,r=i%2?7:13;let px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-2,y-4,3,3)}
      if(it.type==='trophy'){rect(x-9,y-10,18,14,'#f0ca6c');rect(x-13,y-8,5,9,'#e1b44d');rect(x+8,y-8,5,9,'#e1b44d');rect(x-4,y+4,8,4,'#d7ad58');rect(x-7,y+8,14,4,'#b68c4b');rect(x-2,y-7,4,6,'#fff0a5')}
    });
    drawEnemies();drawBoss();drawPlayer();
    // stage border sparkle accents
    if(!game.switchOn){let gX=level().length-125-cam; if(gX>0&&gX<W)pixelText('✦',gX+10,260,14,'#f0d47a','center')}
  }
  function action(){
    if(!game.started||game.paused||game.won)return;
    const p=game.player,l=level();
    if(!game.switchOn&&Math.abs(p.x-l.switchX)<62){game.switchOn=true;toast('Puzzle resolvido! A passagem está aberta.');updateUI();return;}
    p.attack=.2;
    const b=game.boss;
    if(b&&!b.defeated&&game.switchOn&&Math.abs(p.x-b.x)<78&&Math.abs(p.y-390)<65&&b.hit<=0){
      b.hp--;b.hit=.7;toast(b.hp>0?'Acertou! Continue atacando.':`${l.boss} derrotado! Relíquia conquistada.`);
      if(b.hp<=0){b.defeated=true;game.trophies=Math.min(7,game.trophies+1);game.stars++;updateUI();}
    }
  }
  function hurt(){const p=game.player;if(p.invuln>0)return;game.health--;p.invuln=1.5;p.vx=-p.facing*180;p.vy=-250;updateUI();if(game.health<=0){game.health=3;p.x=Math.max(50,game.player.x-160);p.y=350;updateUI();toast('Respire fundo. Você voltou ao caminho.');}}
  function update(dt){
    if(!game.started||game.paused||game.won)return;
    const p=game.player,l=level();dt=Math.min(dt,.035);
    const left=input.left||input.ArrowLeft||input.a||input.A,right=input.right||input.ArrowRight||input.d||input.D;
    if(left){p.vx=-220;p.facing=-1}else if(right){p.vx=220;p.facing=1}else p.vx*=Math.pow(.001,dt);
    if((input.jump||input[' ']||input.ArrowUp||input.w||input.W)&&p.grounded){p.vy=-465;p.grounded=false;}
    p.vy+=1120*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    p.x=Math.max(20,Math.min(l.length-22,p.x));
    // Ground and platform landing
    p.grounded=false;
    if(p.y+p.h>=436){p.y=436-p.h;p.vy=0;p.grounded=true;}
    for(const [x,y,w] of l.platforms){if(p.vy>=0&&p.x+12>x&&p.x-12<x+w&&p.y+p.h>=y&&p.y+p.h<=y+18){p.y=y-p.h;p.vy=0;p.grounded=true;}}
    // Closed puzzle gate
    const gateX=l.length-125;if(!game.switchOn&&p.x>gateX-20){p.x=gateX-20;p.vx=0;}
    for(const it of game.items){if(it.got)continue;if(Math.abs(p.x-it.x)<25&&Math.abs((p.y+18)-it.y)<27){it.got=true;if(it.type==='coin'){game.coins++;toast('+1 moeda')}if(it.type==='star'){game.stars++;toast('Estrela brilhante! +1')}if(it.type==='trophy'){game.trophies=Math.min(7,game.trophies+1);toast('Relíquia antiga coletada!')}updateUI();}}
    for(const e of game.enemies){if(e.dead)continue;e.x+=e.dir*45*dt;if(e.x<150||e.x>l.length-400)e.dir*=-1;if(Math.abs(p.x-e.x)<27&&Math.abs(p.y-e.y)<44){if(p.vy>80&&p.y<400){e.dead=true;p.vy=-300;game.coins++;updateUI();toast('Inimigo vencido! +1 moeda')}else hurt();}}
    const b=game.boss;if(b&&!b.defeated){if(game.switchOn){b.x+=b.dir*28*dt;if(Math.abs(b.x-p.x)<115)b.dir=p.x>b.x?1:-1;if(b.x<l.length-540)b.dir=1;if(Math.abs(p.x-b.x)<45&&Math.abs(p.y-b.y)<60)hurt();}if(b.hit>0)b.hit-=dt;}
    if(p.attack>0)p.attack-=dt;if(p.invuln>0)p.invuln-=dt;if(game.toastTimer>0){game.toastTimer-=dt;if(game.toastTimer<=0)$('toast').classList.remove('show');}
    if(!game.boss.defeated&&p.x>l.length-85)p.x=l.length-85;
    if(game.boss.defeated&&p.x>l.length-55){
      if(game.level<levels.length-1){game.level++;beginLevel();toast(`Mundo 0${game.level+1} desbloqueado!`)}else{game.won=true;showFinish();}
    }
    game.camera=Math.max(0,Math.min(l.length-W+70,p.x-300));updateUI();
  }
  function loop(now){const dt=(now-game.last)/1000||0;game.last=now;update(dt);drawWorld();requestAnimationFrame(loop);}
  function setModal(html){$('modalLayer').innerHTML=html;$('modalLayer').classList.remove('hidden');}
  function closeModal(){$('modalLayer').classList.add('hidden');game.paused=false;}
  function pauseGame(){if(!game.started||game.won)return;game.paused=true;setModal(`<div class="dialog"><div class="dialog-mark">Ⅱ</div><h2>Uma pausa merecida</h2><p>Seu progresso está seguro. A jornada espera por você.</p><div class="dialog-actions"><button class="dialog-btn gold" id="resumeBtn">CONTINUAR</button></div></div>`);$('resumeBtn').onclick=closeModal;}
  function showFinish(){setModal(`<div class="dialog"><div class="dialog-mark">✦</div><h2>O reino está em paz!</h2><p>Você atravessou os três mundos, derrotou os guardiões e reuniu ${game.trophies} relíquias. ${game.orb?'A bola mística aguarda seus pedidos.':'Troque suas 7 relíquias pela bola mística!'}</p><div class="dialog-actions"><button class="dialog-btn gold" id="finishWish">${game.orb&&game.wishes<3?'INVOCAR O DRAGÃO':'JOGAR NOVAMENTE'}</button></div></div>`);$('finishWish').onclick=()=>{if(game.orb&&game.wishes<3)invokeDragon();else location.reload()};}
  function exchange(){if(game.trophies<7||game.orb)return;game.trophies-=7;game.orb=true;updateUI();toast('A bola mística é sua!');setModal(`<div class="dialog"><div class="dialog-mark">✧</div><h2>A Bola Mística</h2><p>As sete relíquias se uniram. Um brilho antigo desperta dentro da esfera...<br><br>Use <b>INVOCAR</b> na mochila para chamar o dragão e fazer seus 3 pedidos.</p><div class="dialog-actions"><button class="dialog-btn gold" id="orbOkay">MARAVILHOSO</button></div></div>`);$('orbOkay').onclick=closeModal;}
  function invokeDragon(){if(!game.orb||game.wishes>=3){toast('Seus três desejos já foram realizados.');return;}game.paused=true;setModal(`<div class="dialog"><div class="dialog-mark">🐉</div><h2>O dragão ancestral</h2><p>“Viajante, sua coragem despertou meu sono. Você tem <b>${3-game.wishes} desejo${game.wishes===2?'':'s'}</b>. O que seu coração pede?”</p><div class="wish-options"><button data-wish="coins">I · Uma bolsa de 25 moedas</button><button data-wish="stars">II · Um céu cheio de 5 estrelas</button><button data-wish="health">III · Recuperar toda a energia</button></div></div>`);document.querySelectorAll('[data-wish]').forEach(btn=>btn.onclick=()=>{const wish=btn.dataset.wish;game.wishes++;if(wish==='coins')game.coins+=25;if(wish==='stars')game.stars+=5;if(wish==='health')game.health=3;updateUI();setModal(`<div class="dialog"><div class="dialog-mark">✦</div><h2>Seu desejo foi realizado</h2><p>Uma luz dourada envolve o reino. Você ainda pode fazer <b>${3-game.wishes}</b> desejo${game.wishes===2?'':'s'}.</p><div class="dialog-actions"><button class="dialog-btn gold" id="wishNext">${game.wishes<3?'FAZER OUTRO PEDIDO':'AGRADECER AO DRAGÃO'}</button></div></div>`);$('wishNext').onclick=()=>{if(game.wishes<3)invokeDragon();else{closeModal();toast('O dragão repousa novamente. Boa jornada!')}};});}
  function start(){if(game.started)return;game.started=true;$('startOverlay').classList.add('dismissed');beginLevel();}
  $('startBtn').addEventListener('click',start);
  $('pauseBtn').addEventListener('click',pauseGame);
  $('exchangeBtn').addEventListener('click',()=>game.orb?invokeDragon():exchange());
  $('inventoryInfo').addEventListener('click',()=>{setModal(`<div class="dialog"><div class="dialog-mark">▣</div><h2>Sua mochila</h2><p><b>${game.coins}</b> moedas · <b>${game.stars}</b> estrelas · <b>${game.trophies}/7</b> relíquias<br><br>${game.orb?`Bola mística · ${game.wishes}/3 desejos realizados`:'Encontre relíquias antigas nos mundos. Junte 7 para obter a bola mística.'}</p><div class="dialog-actions"><button class="dialog-btn gold" id="bagClose">FECHAR</button>${game.orb&&game.wishes<3?'<button class="dialog-btn" id="bagInvoke">INVOCAR</button>':''}</div></div>`);$('bagClose').onclick=closeModal;const inv=$('bagInvoke');if(inv)inv.onclick=invokeDragon;});
  $('soundBtn').addEventListener('click',e=>{const on=e.currentTarget.dataset.on!=='true';e.currentTarget.dataset.on=String(on);e.currentTarget.innerHTML=on?'♫ <span>SOM ON</span>':'♫ <span>SOM</span>';toast(on?'Som ativado':'Som desativado');});
  window.addEventListener('keydown',e=>{const k=e.key;if(['ArrowLeft','ArrowRight','ArrowUp',' '].includes(k))e.preventDefault();input[k]=true;input[k.toLowerCase()]=true;if(k==='x'||k==='X'||k==='e'||k==='E')action();if(k==='Escape'||k==='p'||k==='P')pauseGame();if(!game.started&&(k==='Enter'||k===' '))start();});
  window.addEventListener('keyup',e=>{input[e.key]=false;input[e.key.toLowerCase()]=false;});
  document.querySelectorAll('[data-control]').forEach(btn=>{const key=btn.dataset.control;const down=e=>{e.preventDefault();if(key==='action')action();else input[key]=true;};const up=e=>{e.preventDefault();input[key]=false;};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);btn.addEventListener('pointercancel',up);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.started&&!game.paused)pauseGame()});
  beginLevel();requestAnimationFrame(loop);
})();
