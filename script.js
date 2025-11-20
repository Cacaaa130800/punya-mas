/* script.js — Optimized Super-Complete
   Put in same folder as index.html
   Ensure music.mp3 is in same folder (or edit audio src in index.html)
*/

/* -------------------------
   Small DOM helpers
   ------------------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* DOM refs */
const gate = $('#gate');
const gateInput = $('#gateInput');
const gateMsg = $('#gateMsg');
const gateEnterBtn = $('#gateEnterBtn');
const gateSurpriseBtn = $('#gateSurprise');
const moodEls = $$('.mood');
const reaction = $('#reaction');
const entriesBox = $('#entries');
const notesBox = $('#notes');
const noteInput = $('#noteInput');
const bgm = $('#bgm');
const sticker = $('#sticker');
const secretModal = $('#secretModal');
const hugButton = $('#hugButton');
const themeBtn = $('#themeBtn');
const musicBtn = $('#musicBtn');
const secretBtn = $('#secretBtn');
const closeSecret = $('#closeSecret');
const downloadBtn = $('#downloadBtn');
const gachaBtn = $('#gachaBtn');

let moodChart;
let EXP = parseInt(localStorage.getItem('loveEXP') || '0');

/* Tunables (optimized frequencies) */
const SPARKLE_INTERVAL = 700;
const SAKURA_INTERVAL = 1500;
const VOICE_BUBBLE_INTERVAL = 22000;
const RANDOM_STICKER_INTERVAL = 6000;
const STICKER_SHOW_MS = 2200;

/* sticker list */
const stickerList = [
  'https://i.imgur.com/cy7Q5pA.png',
  'https://i.imgur.com/6XH8O1g.png',
  'https://i.imgur.com/OeQO3ZN.png'
];

/* reactions (cacaaa used) */
const reactionsMap = {
  '😄 Senang':'mas seneng?? cacaaa ikut senenggg 😭💙 peluk dulu sini 🫂',
  '🙂 Biasa aja':'mas biasa aja ya hari ini? sini cacaaa temenin ya 🩵',
  '😢 Sedih':'kok mas sedihhhh???? cini ciniiiii, cacaa peyukkk masss 🩵😭',
  '😡 Kesel':'siapa yang bikin mas kesel?? ceritain ke cacaaa, cacaaa lindungi 🛡️😤',
  '🥰 Sayang cacaaa':'aaaa mas sayang cacaaa??? cacaaa juga sayang mas banyak banyakkkk 🥹🩵💙'
};

/* -------------------------
   Storage helpers
   ------------------------- */
function loadLogs(){ return JSON.parse(localStorage.getItem('masMoodLog')||'[]'); }
function saveLogs(l){ localStorage.setItem('masMoodLog', JSON.stringify(l)); }
function loadNotes(){ return JSON.parse(localStorage.getItem('masNotes')||'[]'); }
function saveNotes(n){ localStorage.setItem('masNotes', JSON.stringify(n)); }
function loadEXP(){ return parseInt(localStorage.getItem('loveEXP')||'0'); }
function saveEXP(v){ localStorage.setItem('loveEXP', String(v)); EXP = v; updateLoveBadge(); }

/* -------------------------
   Gate (fixed + smooth)
   ------------------------- */
function enterGate(mode){
  if(mode === 'surprise'){ gate.style.opacity='0'; setTimeout(()=>gate.style.display='none',350); showBubble('surprise buat mas 🩵'); initAfterGate(); return; }
  const val = (gateInput.value||'').trim().toLowerCase();
  if(val === 'mas'){ gate.style.opacity='0'; setTimeout(()=> gate.style.display='none',350); showBubble('Halo mas 🩵 masuk ya~'); initAfterGate(); }
  else { gateMsg.textContent = 'jawabannya salah 😡 cuma mas yang boleh masuk!'; }
}
gateEnterBtn.addEventListener('click', ()=> enterGate());
gateSurpriseBtn.addEventListener('click', ()=> enterGate('surprise'));
gateInput.addEventListener('keydown', e=> { if(e.key === 'Enter') gateEnterBtn.click(); });

/* -------------------------
   Init after gate
   ------------------------- */
function initAfterGate(){
  renderLogs(); renderNotes(); updateChart(); calcAverage(); updateLoveBadge();
  startSparkles(); startSakura(); startRandomStickers(); startVoiceBubbles(); addModeButtons();
}

/* -------------------------
   Mood handling
   ------------------------- */
function addEXP(amount = 5){
  const cur = loadEXP();
  const next = cur + amount;
  saveEXP(next);
  showBubble('❤️ LOVE EXP +'+amount+' (Total: '+next+')', 1800);
  if(next % 50 === 0) loveExplosion();
  return next;
}

function saveMood(mood){
  const date = new Date().toISOString();
  const logs = loadLogs();
  logs.unshift({ mood, date });
  saveLogs(logs);
  renderLogs();
  showReaction(mood);
  spawnTinyHearts();
  if(mood.includes('Sayang') || mood.includes('cacaaa')) spawnBigHearts();
  showSticker();
  updateChart();
  calcAverage();
  aiReplyToMood(mood);
  addEXP();
}

moodEls.forEach(el => el.addEventListener('click', ()=> saveMood(el.dataset.mood)));

function showReaction(mood){ reaction.textContent = reactionsMap[mood] || ''; }

/* render logs + delete */
function renderLogs(){
  const logs = loadLogs();
  entriesBox.innerHTML = '';
  if(logs.length === 0){ entriesBox.innerHTML = '<em>Belum ada mood tercatat.</em>'; return; }
  logs.forEach((l, idx) => {
    const row = document.createElement('div');
    const left = document.createElement('span'); left.textContent = formatDateForDisplay(l.date) + ' — ' + l.mood;
    const del = document.createElement('button'); del.textContent='🗑️ Hapus'; del.className='btn secondary'; del.style.padding='6px 8px';
    del.onclick = ()=> deleteMood(idx);
    row.appendChild(left); row.appendChild(del);
    entriesBox.appendChild(row);
  });
}

function deleteMood(i){
  const logs = loadLogs();
  if(!logs[i]) return;
  if(!confirm('Yakin mas mau hapus mood ini?')) return;
  logs.splice(i,1);
  saveLogs(logs);
  renderLogs(); updateChart(); calcAverage();
  showBubble('Catatan dihapus 🗑️',1500);
}

/* -------------------------
   Chart & monthly avg
   ------------------------- */
function updateChart(){
  const logs = loadLogs();
  const labels = ['😄 Senang','🙂 Biasa aja','😢 Sedih','😡 Kesel','🥰 Sayang cacaaa'];
  const counts = labels.map(m => logs.filter(l => l.mood === m).length);
  const ctx = document.getElementById('moodChart').getContext('2d');
  if(moodChart) moodChart.destroy();
  moodChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: counts, backgroundColor:['#66c2ff','#99d6ff','#aab6ff','#c0c0ff','#ffb6c1'] }] },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{ y:{ beginAtZero:true, ticks:{precision:0} } } }
  });
}

function calcAverage(){
  const logs = loadLogs();
  if(logs.length === 0){ $('#avgMood').textContent = 'Belum ada mood'; return; }
  const now = new Date();
  const thisMonthLogs = logs.filter(l => { const d = new Date(l.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  if(thisMonthLogs.length === 0){ $('#avgMood').textContent = 'Belum ada mood di bulan ini'; return; }
  const score = {'😄 Senang':5,'🙂 Biasa aja':3,'😢 Sedih':1,'😡 Kesel':2,'🥰 Sayang cacaaa':4};
  let total = 0; thisMonthLogs.forEach(l=> total += (score[l.mood]||0));
  const avg = (total / thisMonthLogs.length).toFixed(2);
  let moodText = ''; if(avg >= 4.5) moodText='Mas happy banget bulan ini 🥰💙'; else if(avg >=3) moodText='Mood mas lumayan stabil bulan ini 🩵'; else moodText='Mas lagi butuh banyak peluk nih 😭💙';
  $('#avgMood').textContent = `Rata-rata mood: ${avg} — ${moodText}`;
}

/* -------------------------
   Notes + bubble
   ------------------------- */
function showBubble(msg, ms=2000){
  const b = document.createElement('div'); b.className='bubble'; b.textContent = msg;
  document.body.appendChild(b);
  setTimeout(()=> b.style.opacity='0', ms - 400);
  setTimeout(()=> b.remove(), ms);
}

$('#saveNote').addEventListener('click', ()=> {
  const text = noteInput.value.trim(); if(!text) return;
  const notes = loadNotes(); notes.unshift({ text, time: new Date().toISOString() }); saveNotes(notes);
  noteInput.value = ''; renderNotes(); addEXP(); showBubble('Catatan mas udah cacaaa simpen 🩵', 2000);
});

$('#clearNotes').addEventListener('click', ()=> {
  if(confirm('Bersihkan semua catatan?')) { localStorage.removeItem('masNotes'); renderNotes(); showBubble('Semua catatan dibersihin 🧹',1400); }
});

function renderNotes(){
  const notes = loadNotes(); notesBox.innerHTML = '';
  if(notes.length === 0){ notesBox.innerHTML = '<em>Belum ada catatan.</em>'; return; }
  notes.forEach(n=> { const d = document.createElement('div'); d.textContent = formatDateForDisplay(n.time) + ' — ' + n.text; notesBox.appendChild(d); });
}

/* -------------------------
   Sticker, hearts, sparkles, sakura (throttled)
   ------------------------- */
function showSticker(){ sticker.classList.add('show'); setTimeout(()=> sticker.classList.remove('show'), STICKER_SHOW_MS); }

function spawnTinyHearts(count=5){
  for(let i=0;i<count;i++){
    const h = document.createElement('div'); h.className='loveHeart'; h.textContent='💙';
    h.style.left = (10 + Math.random()*80) + 'vw'; h.style.bottom = '-10px';
    document.body.appendChild(h); setTimeout(()=> h.remove(), 2400);
  }
}
function spawnBigHearts(){
  for(let i=0;i<10;i++){
    const h = document.createElement('div'); h.className='loveHeart'; h.textContent = ['💖','💗','💕'][Math.floor(Math.random()*3)];
    h.style.fontSize = (26 + Math.floor(Math.random()*20)) + 'px'; h.style.left = (30 + Math.random()*40) + 'vw'; h.style.bottom = '-10px';
    document.body.appendChild(h); setTimeout(()=> h.remove(), 2600);
  }
}

/* Sparkles */
let sparkleTimer;
function startSparkles(){ if(sparkleTimer) return; sparkleTimer = setInterval(()=>{ const s = document.createElement('div'); s.textContent='✨'; s.className='spark'; s.style.left = Math.random()*100 + 'vw'; s.style.top='-8px'; s.style.fontSize = (10 + Math.random()*12) + 'px'; document.body.appendChild(s); setTimeout(()=>{ s.style.top = '100vh'; s.style.opacity = '0' }, 50); setTimeout(()=> s.remove(), 3000); }, SPARKLE_INTERVAL); }
function stopSparkles(){ clearInterval(sparkleTimer); sparkleTimer = null; }

/* Sakura petals */
let sakuraTimer;
function startSakura(){ if(sakuraTimer) return; sakuraTimer = setInterval(()=>{ const p = document.createElement('div'); p.textContent='🌸'; p.className='sakura'; p.style.left = Math.random()*100 + 'vw'; p.style.fontSize = (12 + Math.random()*14) + 'px'; document.body.appendChild(p); setTimeout(()=>{ p.style.top = '100vh'; p.style.opacity = '0' }, 20); setTimeout(()=> p.remove(), 3800); }, SAKURA_INTERVAL); }
function stopSakura(){ clearInterval(sakuraTimer); sakuraTimer = null; }

/* Random sticker pop */
let stickerPopTimer;
function startRandomStickers(){ if(stickerPopTimer) return; stickerPopTimer = setInterval(()=>{ const img = document.createElement('img'); img.src = stickerList[Math.floor(Math.random()*stickerList.length)]; img.style.position='fixed'; img.style.left = Math.random()*80 + 'vw'; img.style.top = '-30px'; img.style.width='86px'; img.style.transition='3s'; img.style.zIndex='99999'; document.body.appendChild(img); setTimeout(()=>{ img.style.top='100vh'; img.style.opacity='0' }, 50); setTimeout(()=> img.remove(), 3000); }, RANDOM_STICKER_INTERVAL); }
function stopRandomStickers(){ clearInterval(stickerPopTimer); stickerPopTimer = null; }

/* Voice bubbles (less frequent) */
let voiceInterval;
function startVoiceBubbles(){ if(voiceInterval) return; voiceInterval = setInterval(()=>{ const lines = ['mas lagi ngapain siiihh 🥺💙','cacaaa liat mas dari sini 😳','mas jangan lupa minum ya 🩵','cacaaa kangen mas 😭💙']; voiceBubble(lines[Math.floor(Math.random()*lines.length)]); }, VOICE_BUBBLE_INTERVAL); }
function stopVoiceBubbles(){ clearInterval(voiceInterval); voiceInterval = null; }
function voiceBubble(text){ const b = document.createElement('div'); b.className='voiceBubble'; b.textContent = text; document.body.appendChild(b); setTimeout(()=> b.style.opacity='0',1500); setTimeout(()=> b.remove(),2500); }

/* -------------------------
   AI auto-reply to mood (simple rule-based)
   ------------------------- */
function aiReplyToMood(mood){
  const replies = {
    '😄 Senang':'cacaaa ikut seneng bangettt 😭💙 ayo kita rayain dikit yuk! ✨',
    '🙂 Biasa aja':'ga papa mas, sini cacaaa temenin biar hari mas lebih hangat 🩵',
    '😢 Sedih':'mas sedih?? cacaaa disini yaaa, caca peluk sampai tenang 😭🤍',
    '😡 Kesel':'siapa yang buat mas kesel?? panggil cacaaa, biar kita cubit bareng barengggg! 😤💙',
    '🥰 Sayang cacaaa':'MAS SAYANG CACAAA??? cacaaa LEBIH sayang mas 10000x 😭💗'
  };
  showBubble(replies[mood] || 'cacaaa ada buat mas 🩵', 2200);
}

/* -------------------------
   Love EXP & badge
   ------------------------- */
function updateLoveBadge(){
  const exp = loadEXP();
  let badge = '';
  if(exp < 50) badge = '💗 Baby Love';
  else if(exp < 150) badge = '💞 Sweetheart';
  else if(exp < 300) badge = '💘 Lover Lv.3';
  else badge = '💝 Soulmate Max';
  let box = document.getElementById('loveBadge');
  if(!box){ box = document.createElement('div'); box.id = 'loveBadge'; box.className = 'loveBadge'; document.body.insertBefore(box, document.body.children[1]); }
  box.textContent = '❤️ Love Level: ' + badge + ' (EXP:' + loadEXP() + ')';
}
updateLoveBadge();
function addEXPLocal(n = 10){ const cur = loadEXP(); const next = cur + n; saveEXP(next); return next; }

/* love explosion */
function loveExplosion(){
  for(let i=0;i<18;i++){
    const h = document.createElement('div'); h.textContent='💗';
    h.style.position='fixed'; h.style.left='50vw'; h.style.top='50vh'; h.style.fontSize=(16+Math.random()*28)+'px'; h.style.transition='1.2s';
    const angle = Math.random()*Math.PI*2; document.body.appendChild(h);
    setTimeout(()=>{ h.style.transform = `translate(${Math.cos(angle)*200}px,${Math.sin(angle)*200}px)`; h.style.opacity='0'; }, 20);
    setTimeout(()=> h.remove(), 1200);
  }
}

/* -------------------------
   Gacha modal
   ------------------------- */
function startGacha(){
  const box = document.createElement('div'); box.style.position='fixed'; box.style.inset='0'; box.style.background='rgba(0,0,0,0.6)'; box.style.display='flex'; box.style.alignItems='center'; box.style.justifyContent='center'; box.style.zIndex='99999';
  const card = document.createElement('div'); card.style.background='white'; card.style.padding='18px'; card.style.borderRadius='12px'; card.style.textAlign='center';
  const img = document.createElement('img'); img.src = stickerList[Math.floor(Math.random()*stickerList.length)]; img.style.width='180px'; img.style.borderRadius='10px';
  const p = document.createElement('p'); p.textContent = 'mas dapet stiker lucuuu 🩵';
  const btn = document.createElement('button'); btn.textContent='tutup'; btn.className='btn'; btn.style.marginTop='12px'; btn.onclick = ()=> box.remove();
  card.appendChild(img); card.appendChild(p); card.appendChild(btn); box.appendChild(card); document.body.appendChild(box);
  addEXPLocal(10);
}
gachaBtn.addEventListener('click', startGacha);

/* -------------------------
   Daily quest (once per day)
   ------------------------- */
function showDailyQuestOnce(){
  const last = localStorage.getItem('lastQuestShown');
  const today = new Date().toISOString().slice(0,10);
  if(last === today) return;
  localStorage.setItem('lastQuestShown', today);
  const quests = ['kirim mood jujur hari ini 🩵','tulis satu kalimat buat cacaaa 😳💗','peluk cacaaa 3x 🤗','bilang “mas sayang cacaaa” 😭💙','kasih stiker favorit mas 🩵'];
  const q = quests[Math.floor(Math.random()*quests.length)];
  const box = document.createElement('div'); box.style.position='fixed'; box.style.inset='0'; box.style.background='rgba(0,0,0,0.5)'; box.style.display='flex'; box.style.alignItems='center'; box.style.justifyContent='center'; box.style.zIndex='999999';
  const card = document.createElement('div'); card.style.background='white'; card.style.padding='20px'; card.style.borderRadius='14px'; card.style.textAlign='center'; card.style.boxShadow='0 8px 20px rgba(0,0,0,0.3)';
  const t = document.createElement('h3'); t.textContent='🎀 Daily Quest Mas'; const p = document.createElement('p'); p.textContent = q; const ok = document.createElement('button'); ok.className='btn'; ok.textContent='oke cacaaa 🩵'; ok.onclick = ()=> box.remove();
  card.appendChild(t); card.appendChild(p); card.appendChild(ok); box.appendChild(card); document.body.appendChild(box);
}
setTimeout(showDailyQuestOnce, 1500);

/* -------------------------
   Mode buttons (injected)
   ------------------------- */
function addModeButtons(){
  const modes = [
    {label:'🥺 Mode Kangen', action: ()=>{
      const on = document.body.dataset.kangen !== '1'; document.body.dataset.kangen = on ? '1':'0';
      document.body.style.filter = on ? 'hue-rotate(300deg) brightness(1.12)':'';
      showBubble(on? 'mas lagi kangen cacaaa yaaa? 😭🩵':'' );
    }},
    {label:'🐰 Mode Manja', action: ()=>{
      const on = document.body.dataset.manja !== '1'; document.body.dataset.manja = on ? '1':'0';
      if(on){ showBubble('mas lagi manja yaaa?? cacaaa sukaaaaa 🥺💗🐰'); startManja(); } else stopManja();
    }},
    {label:'🌧️ Mode Sedih', action: ()=>{
      const on = document.body.dataset.sedih !== '1'; document.body.dataset.sedih = on ? '1':'0';
      if(on){ showBubble('mas sedih yaaa?? siniiiii caca peluk 😭💙'); startRain(); } else stopRain();
    }},
    {label:'😤 Mode Jealous', action: ()=>{
      const on = document.body.dataset.jealous !== '1'; document.body.dataset.jealous = on ? '1':'0';
      document.body.style.background = on ? '#ffe6e6' : ''; showBubble(on? 'mas lagi jealous ya?? jealous sama siapa tuchhhh? 😤💗':'' );
    }},
    {label:'⚡ Mode Marah', action: ()=>{
      const on = document.body.dataset.marah !== '1'; document.body.dataset.marah = on ? '1':'0';
      if(on){ showBubble('mas lagi marahh?? cacaaa disiniiiiii, peluk mas kuat biar cepet redaaaa 😭💙'); startLightning(); } else stopLightning();
    }},
    {label:'😴 Mode Ngantuk', action: ()=>{
      const on = document.body.dataset.sleepy !== '1'; document.body.dataset.sleepy = on ? '1':'0';
      if(on){ showBubble('mas ngantuk ya? cacaaa temenin tidur 🩵😴'); startZZZ(); } else stopZZZ();
    }},
    {label:'🛡️ Mode Protektif', action: ()=>{
      const on = document.body.dataset.protek !== '1'; document.body.dataset.protek = on ? '1':'0';
      if(on){ showBubble('mas protektif ya?? cacaaa aman kok sama mas 😳🛡️'); startShield(); } else stopShield();
    }}
  ];
  const container = document.createElement('div'); container.style.display='flex'; container.style.flexWrap='wrap'; container.style.gap='8px'; container.style.marginTop='10px'; container.style.justifyContent='center';
  modes.forEach(m => { const b = document.createElement('button'); b.className='btn secondary'; b.textContent = m.label; b.onclick = m.action; container.appendChild(b); });
  document.body.insertBefore(container, document.body.children[3]);
}

/* manja */
let manjaTimer;
function startManja(){ if(manjaTimer) return; manjaTimer = setInterval(()=>{ const b=document.createElement('div'); b.textContent='💕'; b.style.position='fixed'; b.style.left=Math.random()*100+'vw'; b.style.top='-20px'; b.style.fontSize='22px'; b.style.transition='3s linear'; document.body.appendChild(b); setTimeout(()=>{ b.style.top='100vh'; b.style.opacity='0' },20); setTimeout(()=> b.remove(),3000); }, 900); }
function stopManja(){ clearInterval(manjaTimer); manjaTimer=null; }

/* rain */
let rainTimer;
function startRain(){ if(rainTimer) return; rainTimer = setInterval(()=>{ const r = document.createElement('div'); r.textContent='💧'; r.style.position='fixed'; r.style.left=Math.random()*100+'vw'; r.style.top='-20px'; r.style.fontSize='16px'; r.style.transition='2s linear'; document.body.appendChild(r); setTimeout(()=>{ r.style.top='100vh'; r.style.opacity='0' },20); setTimeout(()=> r.remove(),2000); }, 160); }
function stopRain(){ clearInterval(rainTimer); rainTimer=null; }

/* shield */
let shieldTimer;
function startShield(){ if(shieldTimer) return; shieldTimer=setInterval(()=>{ const s=document.createElement('div'); s.textContent='🛡️'; s.style.position='fixed'; s.style.left=(10+Math.random()*80)+'vw'; s.style.top=(20+Math.random()*60)+'vh'; s.style.fontSize='26px'; s.style.opacity='0'; s.style.transition='1s'; document.body.appendChild(s); setTimeout(()=> s.style.opacity='1',50); setTimeout(()=> s.remove(),1400); }, 600); }
function stopShield(){ clearInterval(shieldTimer); shieldTimer=null; }

/* lightning */
let lightningTimer;
function startLightning(){ if(lightningTimer) return; lightningTimer=setInterval(()=>{ const f = document.createElement('div'); f.style.position='fixed'; f.style.inset='0'; f.style.background='rgba(255,255,255,0.75)'; f.style.zIndex='999999'; document.body.appendChild(f); setTimeout(()=> f.style.opacity='0',80); setTimeout(()=> f.remove(),200); }, 1200); }
function stopLightning(){ clearInterval(lightningTimer); lightningTimer=null; }

/* zzz */
let zzzTimer;
function startZZZ(){ if(zzzTimer) return; zzzTimer=setInterval(()=>{ const z = document.createElement('div'); z.textContent='💤'; z.style.position='fixed'; z.style.left=Math.random()*100+'vw'; z.style.top='-10px'; z.style.fontSize='20px'; z.style.transition='3s linear'; document.body.appendChild(z); setTimeout(()=>{ z.style.top='100vh'; z.style.opacity='0' },20); setTimeout(()=> z.remove(),3000); }, 900); }
function stopZZZ(){ clearInterval(zzzTimer); zzzTimer=null; }

/* -------------------------
   Random stickers + sparkles + sakura throttled
   ------------------------- */
let stickerPopTimer;
function startRandomStickers(){ if(stickerPopTimer) return; stickerPopTimer = setInterval(()=>{ const img = document.createElement('img'); img.src = stickerList[Math.floor(Math.random()*stickerList.length)]; img.style.position='fixed'; img.style.left = Math.random()*80+'vw'; img.style.top='-30px'; img.style.width='86px'; img.style.transition='3s'; img.style.zIndex='99999'; document.body.appendChild(img); setTimeout(()=>{ img.style.top='100vh'; img.style.opacity='0' },50); setTimeout(()=> img.remove(),3000); }, RANDOM_STICKER_INTERVAL); }
function stopRandomStickers(){ clearInterval(stickerPopTimer); stickerPopTimer=null; }

let sparkleTimer;
function startSparkles(){ if(sparkleTimer) return; sparkleTimer = setInterval(()=>{ const s = document.createElement('div'); s.textContent='✨'; s.className='spark'; s.style.left = Math.random()*100 + 'vw'; s.style.top='-8px'; s.style.fontSize = (10 + Math.random()*12) + 'px'; document.body.appendChild(s); setTimeout(()=>{ s.style.top = '100vh'; s.style.opacity = '0' }, 50); setTimeout(()=> s.remove(), 3000); }, SPARKLE_INTERVAL); }
function stopSparkles(){ clearInterval(sparkleTimer); sparkleTimer=null; }

let sakuraTimer;
function startSakura(){ if(sakuraTimer) return; sakuraTimer = setInterval(()=>{ const p = document.createElement('div'); p.textContent='🌸'; p.className='sakura'; p.style.left = Math.random()*100 + 'vw'; p.style.fontSize = (12 + Math.random()*14) + 'px'; document.body.appendChild(p); setTimeout(()=>{ p.style.top = '100vh'; p.style.opacity = '0' }, 20); setTimeout(()=> p.remove(), 3800); }, SAKURA_INTERVAL); }
function stopSakura(){ clearInterval(sakuraTimer); sakuraTimer=null; }

/* -------------------------
   Voice bubbles (less frequent)
   ------------------------- */
let voiceInterval;
function startVoiceBubbles(){ if(voiceInterval) return; voiceInterval = setInterval(()=>{ const lines = ['mas lagi ngapain siiihh 🥺💙','cacaaa liat mas dari sini 😳','mas jangan lupa minum ya 🩵','cacaaa kangen mas 😭💙']; voiceBubble(lines[Math.floor(Math.random()*lines.length)]); }, VOICE_BUBBLE_INTERVAL); }
function stopVoiceBubbles(){ clearInterval(voiceInterval); voiceInterval=null; }
function voiceBubble(text){ const b = document.createElement('div'); b.className='voiceBubble'; b.textContent = text; document.body.appendChild(b); setTimeout(()=> b.style.opacity='0',1500); setTimeout(()=> b.remove(),2500); }

/* -------------------------
   AI auto-reply (simple)
   ------------------------- */
function aiReplyToMood(mood){
  const replies = {
    '😄 Senang':'cacaaa ikut seneng bangettt 😭💙 ayo kita rayain dikit yuk! ✨',
    '🙂 Biasa aja':'ga papa mas, sini cacaaa temenin biar hari mas lebih hangat 🩵',
    '😢 Sedih':'mas sedih?? cacaaa disini yaaa, caca peluk sampai tenang 😭🤍',
    '😡 Kesel':'siapa yang buat mas kesel?? panggil cacaaa, biar kita cubit bareng barengggg! 😤💙',
    '🥰 Sayang cacaaa':'MAS SAYANG CACAAA??? cacaaa LEBIH sayang mas 10000x 😭💗'
  };
  showBubble(replies[mood] || 'cacaaa ada buat mas 🩵', 2200);
}

/* -------------------------
   util & format
   ------------------------- */
function formatDateForDisplay(iso){
  try{ return new Date(iso).toLocaleString(); }catch(e){ return iso; }
}

/* -------------------------
   secret modal, music, hug, download bindings
   ------------------------- */
secretBtn.addEventListener('click', ()=> secretModal.style.display='flex');
closeSecret.addEventListener('click', ()=> secretModal.style.display='none');
$('#secretPreview').addEventListener('click', ()=> secretModal.style.display='flex');

musicBtn.addEventListener('click', ()=> {
  if(bgm.paused){ bgm.play().catch(()=> showBubble('Klik play lagi untuk izinkan audio',1200)); musicBtn.textContent='⏸ Backsound'; }
  else { bgm.pause(); musicBtn.textContent='▶ Backsound'; }
});

themeBtn.addEventListener('click', ()=> { document.body.classList.toggle('dark'); themeBtn.textContent = document.body.classList.contains('dark')? '☀️ Mode' : '🌙 Mode'; });

hugButton.addEventListener('click', ()=> { showBubble('cacaaa dapet peluk dari mas 🤗🩵',2000); spawnBigHearts(); addEXP(); updateLoveBadge(); });

downloadBtn.addEventListener('click', ()=> {
  const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'index.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

/* -------------------------
   init small helpers
   ------------------------- */
function renderNotes(){ const notes = loadNotes(); notesBox.innerHTML=''; if(notes.length===0){ notesBox.innerHTML = '<em>Belum ada catetan.</em>'; return; } notes.forEach(n=>{ const d = document.createElement('div'); d.textContent = formatDateForDisplay(n.time) + ' — ' + n.text; notesBox.appendChild(d); }); }
function renderLogsSafe(){ renderLogs(); }
function updateChartSafe(){ updateChart(); }
function updateLoveBadgeSafe(){ updateLoveBadge(); }

/* -------------------------
   init on load if gate already closed
   ------------------------- */
if(getComputedStyle(gate).display === 'none' || gate.style.display === 'none'){ initAfterGate(); }

/* -------------------------
   small helpers used earlier
   ------------------------- */
function renderLogs(){ /* already defined above in mood handling area but ensure callable */ const logs = loadLogs(); entriesBox.innerHTML=''; if(logs.length===0){ entriesBox.innerHTML = '<em>Belum ada mood tercatat.</em>'; return; } logs.forEach((l,idx) => { const row = document.createElement('div'); const left = document.createElement('span'); left.textContent = formatDateForDisplay(l.date) + ' — ' + l.mood; const del = document.createElement('button'); del.textContent='🗑️ Hapus'; del.className='btn secondary'; del.style.padding='6px 8px'; del.onclick = ()=> deleteMood(idx); row.appendChild(left); row.appendChild(del); entriesBox.appendChild(row); }); }

/* ensure daily quest */
setTimeout(showDailyQuestOnce, 1500);

/* initial love badge update */
updateLoveBadge();

/* expose some dev helpers in window for quick testing (optional) */
window._mt = { saveMood, renderLogs, renderNotes, addEXP, startSparkles, stopSparkles, startSakura, stopSakura };

