// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════
const RANKS=['E','D','C','B','A','S','SS','SSS','NATIONAL','SHADOW MONARCH'];
const XP_PER_RANK=500;
const XP_MAP={Easy:20,Medium:50,Hard:100};
const BONUS_XP={Easy:10,Medium:25,Hard:50};
const TIMER_MODES={
  25:'Scout Sprint',
  45:'Hunter Grind',
  60:'Dungeon Push',
  90:'Boss Raid'
};
const BASE_TOPICS=['Arrays','Strings','Linked List','Trees','Graphs','Dynamic Programming','Recursion','Sorting','Binary Search','Stack/Queue','Heap','Trie','Backtracking','Math','Bit Manipulation'];
const DEFAULT_REFERENCE_LINK='';
const SHEET_TEMPLATE_VERSION=4;
const STRIVER_TOPIC_ORDER=[
  'Array and String Family',
  'Linear Structures',
  'Stack and Queue Family',
  'Hashing Structures',
  'Tree Structures',
  'Graph Structures',
  'Advanced Structures'
];
const DEFAULT_SHEET_PROBLEMS=[
  {id:3001,topic:'Array and String Family',difficulty:'Easy',type:'Core',platform:'Custom',name:'Array',link:DEFAULT_REFERENCE_LINK},
  {id:3002,topic:'Array and String Family',difficulty:'Easy',type:'Core',platform:'Custom',name:'String',link:DEFAULT_REFERENCE_LINK},
  {id:3003,topic:'Array and String Family',difficulty:'Easy',type:'Core',platform:'Custom',name:'Matrix / 2D Array',link:DEFAULT_REFERENCE_LINK},
  {id:3004,topic:'Linear Structures',difficulty:'Easy',type:'Core',platform:'Custom',name:'Linked List',link:DEFAULT_REFERENCE_LINK},
  {id:3005,topic:'Linear Structures',difficulty:'Easy',type:'Core',platform:'Custom',name:'Doubly Linked List',link:DEFAULT_REFERENCE_LINK},
  {id:3006,topic:'Stack and Queue Family',difficulty:'Easy',type:'Core ADT',platform:'Custom',name:'Stack',link:DEFAULT_REFERENCE_LINK},
  {id:3007,topic:'Stack and Queue Family',difficulty:'Easy',type:'Core ADT',platform:'Custom',name:'Queue',link:DEFAULT_REFERENCE_LINK},
  {id:3008,topic:'Stack and Queue Family',difficulty:'Easy',type:'Core ADT',platform:'Custom',name:'Deque',link:DEFAULT_REFERENCE_LINK},
  {id:3009,topic:'Hashing Structures',difficulty:'Easy',type:'Lookup',platform:'Custom',name:'Hash Map',link:DEFAULT_REFERENCE_LINK},
  {id:3010,topic:'Hashing Structures',difficulty:'Easy',type:'Lookup',platform:'Custom',name:'Hash Set',link:DEFAULT_REFERENCE_LINK},
  {id:3011,topic:'Tree Structures',difficulty:'Easy',type:'Tree Basics',platform:'Custom',name:'Binary Tree',link:DEFAULT_REFERENCE_LINK},
  {id:3012,topic:'Tree Structures',difficulty:'Easy',type:'Tree Basics',platform:'Custom',name:'Binary Search Tree',link:DEFAULT_REFERENCE_LINK},
  {id:3013,topic:'Tree Structures',difficulty:'Easy',type:'Tree Basics',platform:'Custom',name:'Heap',link:DEFAULT_REFERENCE_LINK},
  {id:3014,topic:'Tree Structures',difficulty:'Easy',type:'Search Tree',platform:'Custom',name:'Trie',link:DEFAULT_REFERENCE_LINK},
  {id:3015,topic:'Graph Structures',difficulty:'Easy',type:'Graph Basics',platform:'Custom',name:'Graph',link:DEFAULT_REFERENCE_LINK},
  {id:3016,topic:'Graph Structures',difficulty:'Easy',type:'State Tracking',platform:'Custom',name:'Disjoint Set Union',link:DEFAULT_REFERENCE_LINK},
  {id:3017,topic:'Advanced Structures',difficulty:'Easy',type:'Range Query',platform:'Custom',name:'Segment Tree',link:DEFAULT_REFERENCE_LINK},
  {id:3018,topic:'Advanced Structures',difficulty:'Easy',type:'Range Query',platform:'Custom',name:'Fenwick Tree / BIT',link:DEFAULT_REFERENCE_LINK},
  {id:3019,topic:'Advanced Structures',difficulty:'Easy',type:'Query Support',platform:'Custom',name:'Prefix Sum Array',link:DEFAULT_REFERENCE_LINK},
  {id:3020,topic:'Advanced Structures',difficulty:'Easy',type:'Range Query',platform:'Custom',name:'Sparse Table',link:DEFAULT_REFERENCE_LINK}
];
const CONF_INTERVALS={1:1,2:2,3:5,4:10,5:21};
const SPACED_INTERVALS=[1,3,7,14,30,60];

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
let S={profile:null,problems:[],sheetProblems:[],dailyProgress:{},streak:0,totalXP:0,questClaims:{},timerSessions:[],lastActive:null,theme:'dark'};
let currentFilter='All',openProbId=null,editingProbId=null;
let openSheetId=null;
let timerSec=25*60,timerOriginalSec=25*60,timerRunning=false,timerInterval=null,currentTimerMode=TIMER_MODES[25];
let reviewQueue=[],reviewIdx=0,pwCallback=null;
let formConf=3;

// ═══════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════
const save=()=>{try{localStorage.setItem('htg_v7',JSON.stringify(S));}catch(e){}};
const load=()=>{
  try{
    // try v7 first, then fallback to v6/v5
    const r=localStorage.getItem('htg_v7')||localStorage.getItem('htg_v6')||localStorage.getItem('htg_v5');
    if(r)S={...S,...JSON.parse(r)};
  }catch(e){}
};

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
const todayStr=()=>new Date().toISOString().split('T')[0];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const nextReview=lvl=>{const d=new Date();d.setDate(d.getDate()+(SPACED_INTERVALS[Math.min(lvl,5)]||60));return d.toISOString().split('T')[0];};
const confReview=conf=>{const d=new Date();d.setDate(d.getDate()+(CONF_INTERVALS[conf]||3));return d.toISOString().split('T')[0];};
const RANK_THRESHOLDS=[0,500,1000,1500,2000,2500,3000,3500,4000,4500];
const getRank=()=>RANKS[Math.min(Math.floor(S.totalXP/XP_PER_RANK),RANKS.length-1)];
const getRankProg=()=>{
  const rankIdx=Math.min(Math.floor(S.totalXP/XP_PER_RANK),RANKS.length-1);
  const isMax=rankIdx>=RANKS.length-1;
  if(isMax)return{c:S.totalXP,next:S.totalXP,pct:100,label:S.totalXP+' XP'};
  const currentThresh=RANK_THRESHOLDS[rankIdx];
  const nextThresh=RANK_THRESHOLDS[rankIdx+1];
  const c=S.totalXP-currentThresh;
  const span=nextThresh-currentThresh;
  return{c:S.totalXP,next:nextThresh,pct:(c/span)*100,label:S.totalXP+'/'+nextThresh};
};
function getAllTopics(){
  const all=new Set(BASE_TOPICS);
  S.problems.forEach(p=>{if(p.topic)p.topic.split(',').forEach(t=>{const tr=t.trim();if(tr)all.add(tr);});});
  (S.sheetProblems||[]).forEach(p=>{if(p.topic)p.topic.split(',').forEach(t=>{const tr=t.trim();if(tr)all.add(tr);});});
  return[...all];
}
function ensureDefaultSheetProblems(){
  if(!Array.isArray(S.sheetProblems)||!S.sheetProblems.length||(S.sheetTemplateVersion||0)<SHEET_TEMPLATE_VERSION){
    S.sheetProblems=DEFAULT_SHEET_PROBLEMS.map(p=>({...p}));
    S.sheetTemplateVersion=SHEET_TEMPLATE_VERSION;
    save();
  }
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
function init(){
  load();applyTheme();
  setTimeout(()=>{
    if(!S.profile)openModal('onboard');
    else startApp();
  },3200);
}

// ═══════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════
function openModal(id){document.getElementById(id).classList.add('show');}
function closeModal(id){document.getElementById(id).classList.remove('show');}

// ═══════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════
function saveProfile(){
  const name=document.getElementById('ob-name').value.trim();
  const age=parseInt(document.getElementById('ob-age').value)||0;
  const pw=document.getElementById('ob-pw').value;
  const pw2=document.getElementById('ob-pw2').value;
  if(!name){notify('Enter hunter name!',false);return;}
  if(age<10||age>99){notify('Enter valid age (10-99)!',false);return;}
  if(!pw||pw.length<3){notify('Password min 3 characters',false);return;}
  if(pw!==pw2){notify('Passwords do not match!',false);return;}
  S.profile={name,age,daily:parseInt(document.getElementById('ob-daily').value)||3,pw};
  save();closeModal('onboard');startApp();
  notify('ARISE — HUNTER REGISTERED',true);
}
function fillEpModal(){
  if(!S.profile)return;
  document.getElementById('ep-name').value=S.profile.name||'';
  document.getElementById('ep-age').value=S.profile.age||'';
  document.getElementById('ep-daily').value=S.profile.daily||3;
  document.getElementById('ep-pw').value='';
  document.getElementById('ep-cur-pw').value='';
}
function saveEditProfile(){
  const cur=document.getElementById('ep-cur-pw').value;
  if(cur!==S.profile.pw){notify('Wrong current password!',false);return;}
  const name=document.getElementById('ep-name').value.trim();
  if(!name){notify('Name required',false);return;}
  const age=parseInt(document.getElementById('ep-age').value);
  if(age&&(age<10||age>99)){notify('Enter valid age (10-99)!',false);return;}
  const newPw=document.getElementById('ep-pw').value;
  if(newPw&&newPw.length<3){notify('New password min 3 characters',false);return;}
  S.profile={...S.profile,name,age:age||S.profile.age,daily:parseInt(document.getElementById('ep-daily').value)||3,pw:newPw||S.profile.pw};
  save();updateSidebar();renderDashboard();renderQuests();closeModal('ep-modal');
  notify('PROFILE UPDATED',true);
}

// ═══════════════════════════════════════════════════════
// PASSWORD
// ═══════════════════════════════════════════════════════
function requirePw(title,sub,cb){
  pwCallback=cb;
  document.getElementById('pw-title').textContent=title;
  document.getElementById('pw-sub').textContent=sub;
  document.getElementById('pw-inp').value='';
  document.getElementById('pw-err').textContent='';
  openModal('pw-modal');
  setTimeout(()=>document.getElementById('pw-inp').focus(),130);
}
function confirmPw(){
  const val=document.getElementById('pw-inp').value;
  if(val===S.profile.pw){
    closeModal('pw-modal');
    if(pwCallback)pwCallback();pwCallback=null;
  } else {
    const e=document.getElementById('pw-err');
    e.textContent='WRONG PASSWORD';
    e.style.animation='none';void e.offsetWidth;e.style.animation='shake .3s ease';
    document.getElementById('pw-inp').value='';
    document.getElementById('pw-inp').focus();
    setTimeout(()=>e.textContent='',1800);
  }
}
function cancelPw(){closeModal('pw-modal');pwCallback=null;}

// ═══════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════
function toggleTheme(){S.theme=S.theme==='dark'?'light':'dark';applyTheme();save();}
function applyTheme(){
  const root=document.documentElement;
  root.classList.add('theme-switching');
  root.setAttribute('data-theme',S.theme);
  const ico=S.theme==='dark'?'☀':'☾';
  ['theme-btn','tb-theme-btn'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=ico;});
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>root.classList.remove('theme-switching'));
  });
}

// ═══════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════
function openSb(){
  document.getElementById('sidebar').classList.add('open');
}
function closeSb(){
  document.getElementById('sidebar').classList.remove('open');
}

// ═══════════════════════════════════════════════════════
// APP START
// ═══════════════════════════════════════════════════════
function startApp(){
  ensureDefaultSheetProblems();
  checkStreak();updateSidebar();
  renderDashboard();renderProblemSheet();renderProblems();renderSkills();renderHeatmap();renderQuests();
  document.getElementById('today-date').textContent=new Date().toDateString().toUpperCase();
  initExImDrop();
  // init confidence pills
  setConf(3);
}

// ═══════════════════════════════════════════════════════
// STREAK
// ═══════════════════════════════════════════════════════
function checkStreak(){
  if(!S.lastActive)return;
  const diff=Math.floor((new Date(todayStr())-new Date(S.lastActive))/86400000);
  if(diff>1)S.streak=0;
}
function markActive(){
  const today=todayStr();
  if(S.lastActive===today){notify('Already marked today.',false);return;}
  const diff=S.lastActive?Math.floor((new Date(today)-new Date(S.lastActive))/86400000):1;
  S.streak=diff===1?S.streak+1:1;
  S.lastActive=today;
  if(!S.dailyProgress[today])S.dailyProgress[today]=0;
  save();updateSidebar();renderDashboard();renderHeatmap();
  notify('STREAK: '+S.streak+' DAYS',true);
}

// ═══════════════════════════════════════════════════════
// XP
// ═══════════════════════════════════════════════════════
function addXP(amt,x,y){
  const old=getRank();S.totalXP+=amt;const nw=getRank();
  save();updateSidebar();renderDashboard();
  if(old!==nw)triggerLevelUp(nw);
  if(x!==undefined&&y!==undefined){
    const el=document.createElement('div');
    el.className='xp-float';el.textContent='+'+amt+' XP';
    el.style.cssText=`left:${x}px;top:${y}px;`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1600);
  }
}


// ═══════════════════════════════════════════════════════
// SIDEBAR UPDATE
// ═══════════════════════════════════════════════════════
function updateSidebar(){
  const prog=getRankProg();
  document.getElementById('sb-rank').textContent=getRank();
  document.getElementById('xp-fill').style.width=prog.pct+'%';
  document.getElementById('xp-txt').textContent=prog.label;
  if(S.profile){
    document.getElementById('sb-name').textContent=S.profile.name.toUpperCase();
    const letter=S.profile.name.charAt(0).toUpperCase();
    ['sb-avatar','tb-avatar'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=letter;});
  }
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════
function renderDashboard(){
  const solved=S.problems.filter(p=>p.status==='Solved').length;
  function animVal(id,val){
    const el=document.getElementById(id);if(!el)return;
    el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');
    el.textContent=val;
  }
  animVal('dc-solved',solved);
  animVal('dc-streak',S.streak);
  animVal('dc-rank',getRank());
  animVal('dc-xp',S.totalXP);
  document.getElementById('streak-num').textContent=S.streak;
}

// ═══════════════════════════════════════════════════════
// QUESTS
// ═══════════════════════════════════════════════════════
function getQuestConfig(){
  const daily=S.profile?.daily||3;
  const solvedToday=getTodaySolvedCount();
  const loggedToday=getTodayLoggedCount();
  const focusToday=getTodayFocusCount();
  return[
    {cat:'solve',text:`Solve ${daily} question${daily>1?'s':''}`,tag:'SOLVE',xp:20*daily,target:daily,progress:solvedToday,check:()=>solvedToday>=daily},
    {cat:'log',text:`Log ${daily} question${daily>1?'s':''}`,tag:'LOG',xp:10*daily,target:daily,progress:loggedToday,check:()=>loggedToday>=daily},
    {cat:'focus',text:'Complete 1 focus mode session',tag:'FOCUS',xp:50,target:1,progress:focusToday,check:()=>focusToday>=1},
  ];
}
function renderQuests(){
  const list=document.getElementById('quest-list');if(!list)return;
  list.innerHTML='';
  const today=todayStr();
  getQuestConfig().forEach(q=>{
    const claimed=S.questClaims[today+'_'+q.cat];
    const done=q.check();
    const d=document.createElement('div');
    d.className='quest-item'+(claimed?' done claimed':'');
    d.innerHTML=`<div class="q-chk">${claimed?'✓':''}</div>
      <div class="q-diff">${q.tag}</div>
      <div class="q-text">${q.text} <span style="color:var(--t4);font-size:13px">(${Math.min(q.progress,q.target)}/${q.target})</span></div>
      <div class="q-xp">+${q.xp}</div>
      ${!claimed?`<button class="btn btn-xs" onclick="claimQuest('${q.cat}',${q.xp},event)">${done?'CLAIM':'–'}</button>`:'<div class="q-xp">CLAIMED</div>'}`;
    list.appendChild(d);
  });
  if(getQuestConfig().every(q=>q.check())){
    const doneCard=document.createElement('div');
    doneCard.style.cssText='font-family:Share Tech Mono,monospace;font-size:11px;color:var(--t1);margin-top:8px;padding:8px 10px;background:var(--bg4);border:1px solid var(--b2);';
    doneCard.textContent='// DAILY CHECKLIST COMPLETE';
    list.appendChild(doneCard);
  }
  const totalToday=S.problems.filter(p=>p.date===today&&p.status==='Solved').length;
  const daily=S.profile?.daily||3;
  if(totalToday>daily){
    const extra=totalToday-daily;
    const b=document.createElement('div');
    b.style.cssText='font-family:Share Tech Mono,monospace;font-size:10px;color:var(--t3);letter-spacing:1px;margin-top:8px;padding:6px 10px;background:var(--bg4);border:1px solid var(--b1);';
    b.textContent=`// BONUS: ${extra} extra problem${extra>1?'s':''} beyond daily target`;
    list.appendChild(b);
  }
}
function claimQuest(cat,xp,evt){
  const q=getQuestConfig().find(x=>x.cat===cat);
  if(!q||!q.check()){notify('Complete the objective first!',false);return;}
  const k=todayStr()+'_'+cat;
  if(S.questClaims[k])return;
  S.questClaims[k]=true;
  const rect=evt.target.getBoundingClientRect();
  addXP(xp,rect.left+rect.width/2,rect.top);
  save();renderQuests();
  notify('QUEST COMPLETE +'+xp+' XP',true);
}
const getTodaySolvedCount=()=>S.problems.filter(p=>p.date===todayStr()&&p.status==='Solved').length;
const getTodayLoggedCount=()=>S.problems.filter(p=>p.date===todayStr()).length;
const getTodayFocusCount=()=>S.timerSessions.filter(s=>s.date===todayStr()).length;

// ═══════════════════════════════════════════════════════
// HEATMAP
// ═══════════════════════════════════════════════════════
function renderHeatmap(){
  const c=document.getElementById('heatmap');if(!c)return;c.innerHTML='';
  const today=new Date();
  for(let i=364;i>=0;i--){
    const d=new Date(today);d.setDate(d.getDate()-i);
    const k=d.toISOString().split('T')[0];const n=S.dailyProgress[k]||0;
    const cell=document.createElement('div');
    let cls='hm-cell';
    if(n>=1)cls+=' i1';if(n>=2)cls+=' i2';if(n>=3)cls+=' i3';if(n>=5)cls+=' i4';if(n>=8)cls+=' i5';
    cell.className=cls;
    cell.innerHTML=`<div class="hm-tip">${k}: ${n}</div>`;
    c.appendChild(cell);
  }
}

// ═══════════════════════════════════════════════════════
// CONFIDENCE
// ═══════════════════════════════════════════════════════
function setConf(n){
  formConf=n;
  document.querySelectorAll('#f-conf-stars .conf-pill').forEach(btn=>{
    btn.classList.toggle('active', parseInt(btn.dataset.v)===n);
  });
}
function renderConfStars(n,prefix){
  formConf=n;
  if(prefix==='f'){
    document.querySelectorAll('#f-conf-stars .conf-pill').forEach(btn=>{
      btn.classList.toggle('active', parseInt(btn.dataset.v)===n);
    });
  } else {
    document.querySelectorAll(`#${prefix}-conf-stars .star`).forEach((s,i)=>s.classList.toggle('lit',i<n));
  }
}
let editConfMap={};
function setEditConf(pid,n){
  editConfMap[pid]=n;
  document.querySelectorAll(`#ef-conf-${pid}-stars .star`).forEach((s,i)=>s.classList.toggle('lit',i<n));
}

// ═══════════════════════════════════════════════════════
// TOPIC AUTOCOMPLETE
// ═══════════════════════════════════════════════════════
let topicHlIdx=-1;
function onTopicInput(inpId,ddId){
  const val=document.getElementById(inpId).value.toLowerCase();
  const dd=document.getElementById(ddId);
  if(!val){dd.classList.remove('open');return;}
  const matches=getAllTopics().filter(t=>t.toLowerCase().includes(val));
  if(!matches.length){dd.classList.remove('open');return;}
  dd.innerHTML='';topicHlIdx=-1;
  matches.slice(0,8).forEach(t=>{
    const opt=document.createElement('div');opt.className='topic-opt';opt.textContent=t;
    opt.onmousedown=()=>{document.getElementById(inpId).value=t;dd.classList.remove('open');};
    dd.appendChild(opt);
  });
  dd.classList.add('open');
}
function onTopicKey(e,inpId,ddId){
  const dd=document.getElementById(ddId);
  const opts=dd.querySelectorAll('.topic-opt');
  if(e.key==='ArrowDown'){e.preventDefault();topicHlIdx=Math.min(topicHlIdx+1,opts.length-1);opts.forEach((o,i)=>o.classList.toggle('hl',i===topicHlIdx));}
  else if(e.key==='ArrowUp'){e.preventDefault();topicHlIdx=Math.max(topicHlIdx-1,0);opts.forEach((o,i)=>o.classList.toggle('hl',i===topicHlIdx));}
  else if(e.key==='Enter'&&topicHlIdx>=0){document.getElementById(inpId).value=opts[topicHlIdx].textContent;dd.classList.remove('open');topicHlIdx=-1;}
  else if(e.key==='Escape'){dd.classList.remove('open');}
}
function closeTopicDd(ddId){document.getElementById(ddId)?.classList.remove('open');}

// ═══════════════════════════════════════════════════════
// ADD PROBLEM
// ═══════════════════════════════════════════════════════
function toggleForm(){
  const f=document.getElementById('add-form');
  f.classList.toggle('open');
  if(f.classList.contains('open')){formConf=3;setConf(3);}
}
function toggleSheetForm(){
  const f=document.getElementById('sheet-form');
  if(!f)return;
  f.classList.toggle('open');
}
function addSheetProblem(){
  const name=document.getElementById('sp-name').value.trim();
  const topic=document.getElementById('sp-topic').value.trim()||'General';
  const difficulty=document.getElementById('sp-diff').value;
  const type=document.getElementById('sp-type').value.trim()||'Core';
  const platform=document.getElementById('sp-platform').value;
  const link=document.getElementById('sp-link').value.trim();
  if(!name){notify('Enter a structure name!',false);return;}
  S.sheetProblems=S.sheetProblems||[];
  S.sheetProblems.push({id:Date.now(),name,topic,difficulty,type,platform,link});
  save();renderProblemSheet();
  ['sp-name','sp-topic','sp-type','sp-link'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('sp-diff').value='Easy';
  document.getElementById('sp-platform').value='Custom';
  document.getElementById('sheet-form').classList.remove('open');
  notify('ENTRY ADDED TO SHEET',true);
}
function deleteSheetProblem(id){
  requirePw('DELETE SHEET ITEM','// ENTER PASSWORD TO DELETE THIS PROBLEM',()=>{
    S.sheetProblems=(S.sheetProblems||[]).filter(p=>p.id!==id);
    save();renderProblemSheet();notify('SHEET ENTRY DELETED',true);
  });
}
function topicSortValue(topic){
  const striverIdx=STRIVER_TOPIC_ORDER.findIndex(t=>t.toLowerCase()===topic.toLowerCase());
  if(striverIdx!==-1)return striverIdx;
  const idx=BASE_TOPICS.findIndex(t=>t.toLowerCase()===topic.toLowerCase());
  return idx===-1?999:1000+idx;
}
function toggleSheetRow(id){
  openSheetId=openSheetId===id?null:id;
  renderProblemSheet();
}
function renderProblemSheet(){
  const wrap=document.getElementById('sheet-list');if(!wrap)return;
  const search=(document.getElementById('sheet-search')?.value||'').trim().toLowerCase();
  const items=(S.sheetProblems||[]).filter(p=>{
    const hay=[p.name,p.topic,p.difficulty,p.type,p.platform].join(' ').toLowerCase();
    return hay.includes(search);
  });
  if(!items.length){
    wrap.innerHTML=`<div class="empty"><div class="empty-icon">#</div><div class="empty-txt">NO DATA STRUCTURE ENTRIES YET</div></div>`;
    return;
  }
  const sorted=[...items].sort((a,b)=>{
    const ta=topicSortValue(a.topic||''),tb=topicSortValue(b.topic||'');
    if(ta!==tb)return ta-tb;
    return (a.name||'').localeCompare(b.name||'');
  });
  wrap.innerHTML=`<div class="sheet-wrap">${
    sorted.map((p,i)=>{
      const topOpen=openSheetId===p.id;
      return `<div class="prob-card sheet-accordion ${topOpen?'open':''}">
        <div class="prob-hdr" onclick="toggleSheetRow(${p.id})">
          <div class="prob-num">${i+1}</div>
          <div class="prob-name">${esc(p.name)}</div>
          <div class="prob-topic">${esc(p.topic||'General')}</div>
          <span class="badge dE">${esc(p.type||'Core')}</span>
          <div class="prob-chev">&#9662;</div>
        </div>
        <div class="accordion-body sheet-body">
          <div class="sheet-meta-row">
            <span>${esc(p.platform||'Custom')}</span>
            <span>${p.link?`<a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">LINK</a>`:'No link added'}</span>
          </div>
          <div class="pb-grid">
            <div class="pb-sec">
              <div class="pb-lbl">Structure</div>
              <div class="pb-txt">${esc(p.name)}</div>
            </div>
            <div class="pb-sec">
              <div class="pb-lbl">Category</div>
              <div class="pb-txt">${esc(p.topic||'General')}</div>
            </div>
            <div class="pb-sec pb-full">
              <div class="pb-lbl">Note</div>
              <div class="pb-txt">Use this section to collect problems, notes, or links for ${esc(p.name)}.</div>
            </div>
          </div>
          <div class="prob-actions">
            <button class="btn-g btn-xs" onclick="event.stopPropagation();deleteSheetProblem(${p.id})">DELETE</button>
          </div>
        </div>
      </div>`;
    }).join('')
  }</div>`;
}
function addProblem(){
  const name=document.getElementById('f-name').value.trim();
  if(!name){notify('Enter a problem name!',false);return;}
  const diff=document.getElementById('f-diff').value;
  const status=document.getElementById('f-status').value;
  const conf=formConf||3;
  // Count today's solved BEFORE adding new problem
  const todaySolvedBefore=S.problems.filter(x=>x.date===todayStr()&&x.status==='Solved').length;
  const daily=S.profile?.daily||3;
  const isBonus=status==='Solved'&&todaySolvedBefore>=daily;
  const p={
    id:Date.now(),name,
    topic:document.getElementById('f-topic').value.trim()||'General',
    difficulty:diff,status,
    time:parseInt(document.getElementById('f-time').value)||0,
    platform:document.getElementById('f-platform').value,
    lang:document.getElementById('f-lang').value,
    link:document.getElementById('f-link').value.trim(),
    approach:document.getElementById('f-approach').value.trim(),
    code:document.getElementById('f-code').value.trim(),
    notes:document.getElementById('f-notes').value.trim(),
    confidence:conf,
    date:todayStr(),reviewDate:confReview(conf),reviewLevel:0,
  };
  S.problems.unshift(p);
  let earnedXP=0;
  if(status==='Solved'){
    const base=XP_MAP[diff]||10;
    const bonus=isBonus?(BONUS_XP[diff]||0):0;
    earnedXP=base+bonus;
    addXP(earnedXP);
    S.dailyProgress[todayStr()]=(S.dailyProgress[todayStr()]||0)+1;
    if(isBonus)notify('BONUS XP! +'+bonus+' for extra grind',true);
  }
  save();renderProblems();renderSkills();renderHeatmap();renderDashboard();renderQuests();
  ['f-name','f-topic','f-time','f-approach','f-code','f-notes','f-link'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('add-form').classList.remove('open');
  notify('BATTLE LOGGED +'+(earnedXP)+' XP',earnedXP>0);
}

// ═══════════════════════════════════════════════════════
// PROBLEMS LIST
// ═══════════════════════════════════════════════════════
function setFilter(el){
  document.querySelectorAll('.ftag').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');currentFilter=el.dataset.f;openProbId=null;editingProbId=null;renderProblems();
}
const confToStars=n=>'★'.repeat(n||0)+'☆'.repeat(5-(n||0));

function renderProblems(){
  const search=(document.getElementById('search-inp')?.value||'').toLowerCase();
  const list=S.problems.filter(p=>{
    const ms=p.name.toLowerCase().includes(search)||p.topic.toLowerCase().includes(search);
    const mf=currentFilter==='All'||p.difficulty===currentFilter||p.status===currentFilter;
    return ms&&mf;
  });
  const c=document.getElementById('prob-list');if(!c)return;
  if(!list.length){c.innerHTML=`<div class="empty"><div class="empty-icon">⚔</div><div class="empty-txt">NO BATTLES — START YOUR GRIND</div></div>`;return;}
  c.innerHTML='';
  list.forEach((p,i)=>{
    const isOpen=openProbId===p.id;
    const isEditing=editingProbId===p.id;
    const card=document.createElement('div');
    card.className='prob-card'+(isOpen?' open':'')+(isEditing?' editing':'');
    card.id='pc-'+p.id;
    const editHtml=`
      <div class="edit-zone">
        <div class="form-tag" style="margin-top:12px">// EDIT RECORD</div>
        <div class="form-grid">
          <div class="form-field"><label class="form-lbl">Name</label><input class="form-inp" id="ef-name-${p.id}" value="${esc(p.name)}" /></div>
          <div class="form-field"><label class="form-lbl">Topic</label>
            <div class="topic-wrap">
              <input class="form-inp" id="ef-topic-${p.id}" value="${esc(p.topic)}" autocomplete="off"
                oninput="onTopicInput('ef-topic-${p.id}','ef-dd-${p.id}')"
                onkeydown="onTopicKey(event,'ef-topic-${p.id}','ef-dd-${p.id}')"
                onblur="setTimeout(()=>closeTopicDd('ef-dd-${p.id}'),150)"/>
              <div class="topic-dropdown" id="ef-dd-${p.id}"></div>
            </div>
          </div>
          <div class="form-field"><label class="form-lbl">Difficulty</label>
            <select class="form-sel" id="ef-diff-${p.id}">
              <option${p.difficulty==='Easy'?' selected':''}>Easy</option>
              <option${p.difficulty==='Medium'?' selected':''}>Medium</option>
              <option${p.difficulty==='Hard'?' selected':''}>Hard</option>
            </select>
          </div>
          <div class="form-field"><label class="form-lbl">Status</label>
            <select class="form-sel" id="ef-status-${p.id}">
              <option${p.status==='Solved'?' selected':''}>Solved</option>
              <option${p.status==='Revisit'?' selected':''}>Revisit</option>
              <option${p.status==='Failed'?' selected':''}>Failed</option>
            </select>
          </div>
          <div class="form-field"><label class="form-lbl">Time (mins)</label><input class="form-inp" id="ef-time-${p.id}" type="number" value="${p.time||''}" /></div>
          <div class="form-field"><label class="form-lbl">Platform</label>
            <select class="form-sel" id="ef-platform-${p.id}">
              ${['LeetCode','Codeforces','HackerRank','GFG','Other'].map(x=>`<option${p.platform===x?' selected':''}>${x}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label class="form-lbl">Language</label>
            <select class="form-sel" id="ef-lang-${p.id}">
              ${['C++','Java','Python','JavaScript','Go','Other'].map(x=>`<option${(p.lang||'C++')==x?' selected':''}>${x}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label class="form-lbl">Confidence</label>
            <div class="conf-stars" id="ef-conf-${p.id}-stars">
              ${[1,2,3,4,5].map(n=>`<span class="star${n<=(p.confidence||3)?' lit':''}" onclick="setEditConf(${p.id},${n})">★</span>`).join('')}
            </div>
          </div>
          <div class="form-field form-full"><label class="form-lbl">Link</label><input class="form-inp" id="ef-link-${p.id}" value="${esc(p.link||'')}" /></div>
          <div class="form-field form-full"><label class="form-lbl">Approach</label><textarea class="form-ta" id="ef-approach-${p.id}">${esc(p.approach||'')}</textarea></div>
          <div class="form-field form-full"><label class="form-lbl">Code</label><textarea class="form-ta code-ta" id="ef-code-${p.id}">${esc(p.code||'')}</textarea></div>
          <div class="form-field form-full"><label class="form-lbl">Notes</label><textarea class="form-ta" id="ef-notes-${p.id}" style="min-height:55px">${esc(p.notes||'')}</textarea></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-sm" onclick="event.stopPropagation();saveEdit(${p.id})">SAVE CHANGES</button>
          <button class="btn-g btn-sm" onclick="event.stopPropagation();cancelEdit()">CANCEL</button>
        </div>
      </div>`;
    const detailHtml=`
      <div class="accordion-body">
        <div class="prob-meta-row">
          <span>${p.date}</span>
          ${p.time?`<span>${p.time}m</span>`:''}
          <span>${p.platform}</span>
          ${p.lang?`<span>${esc(p.lang)}</span>`:''}
          ${p.link?`<span><a href="${esc(p.link)}" target="_blank" onclick="event.stopPropagation()">LINK ↗</a></span>`:''}
          ${p.confidence?`<span style="letter-spacing:2px">${confToStars(p.confidence)}</span>`:''}
        </div>
        <div class="pb-grid">
          ${p.approach?`<div class="pb-sec"><div class="pb-lbl">Approach</div><div class="pb-txt">${esc(p.approach)}</div></div>`:''}
          ${p.notes?`<div class="pb-sec"><div class="pb-lbl">Notes</div><div class="pb-txt">${esc(p.notes)}</div></div>`:''}
          ${p.code?`<div class="pb-sec pb-full"><div class="pb-lbl">Code (${esc(p.lang||'')})</div><pre class="pb-code">${esc(p.code)}</pre></div>`:''}
        </div>
        <div class="prob-actions">
          <button class="btn-g btn-xs" onclick="event.stopPropagation();triggerEdit(${p.id})">EDIT</button>
          <button class="btn-g btn-xs" onclick="event.stopPropagation();triggerDelete(${p.id})">DELETE</button>
        </div>
      </div>`;
    card.innerHTML=`
      <div class="prob-hdr" onclick="toggleProb(${p.id})">
        <div class="prob-num">${i+1}</div>
        <div class="prob-name">${esc(p.name)}</div>
        <div class="prob-topic">${esc(p.topic)}</div>
        <span class="badge d${p.difficulty[0]}">${p.difficulty}</span>
        <span class="badge s${p.status[0]}">${p.status}</span>
        <span class="conf-badge">${'★'.repeat(p.confidence||0)}</span>
        <div class="prob-chev">▾</div>
      </div>
      ${detailHtml}${editHtml}`;
    c.appendChild(card);
  });
}
function toggleProb(id){
  if(editingProbId===id)return;
  openProbId=openProbId===id?null:id;
  if(openProbId!==id)editingProbId=null;
  renderProblems();
  if(openProbId){const el=document.getElementById('pc-'+openProbId);if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'nearest'}),60);}
}
function triggerEdit(id){requirePw('EDIT RECORD','// ENTER PASSWORD',()=>{openProbId=id;editingProbId=id;renderProblems();setTimeout(()=>{const el=document.getElementById('pc-'+id);if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});},60);});}
function cancelEdit(){editingProbId=null;renderProblems();}
function saveEdit(id){
  const p=S.problems.find(x=>x.id===id);if(!p)return;
  p.name=document.getElementById('ef-name-'+id).value.trim()||p.name;
  p.topic=document.getElementById('ef-topic-'+id).value.trim()||p.topic;
  p.difficulty=document.getElementById('ef-diff-'+id).value;
  p.status=document.getElementById('ef-status-'+id).value;
  p.time=parseInt(document.getElementById('ef-time-'+id).value)||0;
  p.platform=document.getElementById('ef-platform-'+id).value;
  p.lang=document.getElementById('ef-lang-'+id).value;
  p.link=document.getElementById('ef-link-'+id).value.trim();
  p.approach=document.getElementById('ef-approach-'+id).value.trim();
  p.code=document.getElementById('ef-code-'+id).value.trim();
  p.notes=document.getElementById('ef-notes-'+id).value.trim();
  if(editConfMap[id]){p.confidence=editConfMap[id];p.reviewDate=confReview(p.confidence);delete editConfMap[id];}
  editingProbId=null;openProbId=id;
  save();renderProblems();renderSkills();renderDashboard();
  notify('RECORD UPDATED',true);
}
function triggerDelete(id){
  requirePw('DELETE RECORD','// ENTER PASSWORD',()=>{
    S.problems=S.problems.filter(p=>p.id!==id);
    if(openProbId===id)openProbId=null;if(editingProbId===id)editingProbId=null;
    save();renderProblems();renderSkills();renderDashboard();updateSidebar();
    notify('Battle record deleted.',false);
  });
}

// ═══════════════════════════════════════════════════════
// SKILLS
// ═══════════════════════════════════════════════════════
function renderSkills(){
  const c=document.getElementById('skills-grid');if(!c)return;c.innerHTML='';
  getAllTopics().forEach(topic=>{
    const probs=S.problems.filter(p=>p.topic.split(',').map(t=>t.trim().toLowerCase()).some(t=>t===topic.toLowerCase()));
    const solved=probs.filter(p=>p.status==='Solved').length;
    const pct=Math.min((solved/20)*100,100);
    const mastery=pct>=80?'MASTER':pct>=50?'ADEPT':pct>=20?'NOVICE':'LOCKED';
    const d=document.createElement('div');d.className='skill-card';
    d.innerHTML=`<div class="sk-name">${esc(topic)}</div><div class="sk-bar-wrap"><div class="sk-bar" style="width:${pct}%"></div></div><div class="sk-meta"><span>${solved}/${probs.length}</span><span>${mastery}</span></div>`;
    c.appendChild(d);
  });
}

// ═══════════════════════════════════════════════════════
// REVIEW
// ═══════════════════════════════════════════════════════
function renderReview(){
  const c=document.getElementById('review-wrap');if(!c)return;
  const due=S.problems.filter(p=>p.reviewDate<=todayStr());
  if(!due.length){c.innerHTML=`<div class="empty"><div class="empty-icon">◉</div><div class="empty-txt">NO REVIEWS DUE — BLADES STAY SHARP</div></div>`;return;}
  reviewQueue=due.sort((a,b)=>(a.confidence||3)-(b.confidence||3));
  reviewIdx=0;showReviewCard();
}
function showReviewCard(){
  const c=document.getElementById('review-wrap');if(!c)return;
  if(reviewIdx>=reviewQueue.length){c.innerHTML=`<div class="empty"><div class="empty-icon">✓</div><div class="empty-txt">ALL REVIEWS COMPLETE</div></div>`;return;}
  const p=reviewQueue[reviewIdx];
  const lvl=p.reviewLevel||0;
  const nextI={hard:SPACED_INTERVALS[Math.max(0,lvl-1)],ok:SPACED_INTERVALS[Math.min(lvl+1,5)],easy:SPACED_INTERVALS[Math.min(lvl+2,5)]};
  c.innerHTML=`
    <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--t3);letter-spacing:2px;margin-bottom:12px">REVIEW ${reviewIdx+1} / ${reviewQueue.length} &nbsp;·&nbsp; CONF: ${confToStars(p.confidence||3)}</div>
    <div class="rv-card">
      <div class="rv-name">${esc(p.name)}</div>
      <div class="rv-meta">${esc(p.topic)} &middot; ${p.difficulty} &middot; ${p.platform}${p.lang?' &middot; '+esc(p.lang):''}</div>
      <div class="rv-conf-info">Next → Struggled: ${nextI.hard}d &nbsp;|&nbsp; Got it: ${nextI.ok}d &nbsp;|&nbsp; Easy: ${nextI.easy}d</div>
      ${p.approach?`<div class="rv-approach"><b style="color:var(--t1)">APPROACH:</b><br>${esc(p.approach)}</div>`:''}
      ${p.code?`<pre class="pb-code" style="text-align:left;margin-bottom:16px">${esc(p.code)}</pre>`:''}
      <div class="rv-actions">
        <button class="btn-g" onclick="reviewResult('hard')">STRUGGLED</button>
        <button class="btn-g" onclick="reviewResult('ok')">GOT IT</button>
        <button class="btn" onclick="reviewResult('easy')">EASY +5XP</button>
      </div>
    </div>`;
}
function reviewResult(r){
  const p=reviewQueue[reviewIdx];const prob=S.problems.find(x=>x.id===p.id);if(!prob)return;
  const lvl=prob.reviewLevel||0;
  if(r==='hard'){prob.reviewLevel=Math.max(0,lvl-1);prob.reviewDate=nextReview(prob.reviewLevel);prob.confidence=Math.max(1,(prob.confidence||3)-1);}
  else if(r==='ok'){prob.reviewLevel=Math.min(5,lvl+1);prob.reviewDate=nextReview(prob.reviewLevel);}
  else{prob.reviewLevel=Math.min(5,lvl+2);prob.reviewDate=nextReview(prob.reviewLevel);prob.confidence=Math.min(5,(prob.confidence||3)+1);addXP(5);}
  save();reviewIdx++;showReviewCard();
}

// ═══════════════════════════════════════════════════════
// TIMER
// ═══════════════════════════════════════════════════════
function setTimer(m,label){
  if(timerRunning)pauseTimer();
  timerSec=m*60;
  timerOriginalSec=m*60;
  currentTimerMode=label||TIMER_MODES[m]||`${m}m Focus`;
  updateTimerDisp();
  updateTimerUI('idle');
}
function startTimer(){
  if(timerRunning)return;
  if(timerSec<=0){timerSec=25*60;updateTimerDisp();}
  timerRunning=true;
  document.getElementById('timer-panel').classList.add('running');
  updateTimerUI('running');
  timerInterval=setInterval(()=>{timerSec--;updateTimerDisp();if(timerSec<=0){clearInterval(timerInterval);timerInterval=null;timerRunning=false;document.getElementById('timer-panel').classList.remove('running');timerDone();}},1000);
}
function pauseTimer(){if(!timerRunning)return;timerRunning=false;clearInterval(timerInterval);timerInterval=null;document.getElementById('timer-panel').classList.remove('running');updateTimerUI('paused');}
function resetTimer(){timerRunning=false;clearInterval(timerInterval);timerInterval=null;timerSec=25*60;timerOriginalSec=25*60;currentTimerMode=TIMER_MODES[25];document.getElementById('timer-panel').classList.remove('running');updateTimerDisp();updateTimerUI('idle');}
function updateTimerDisp(){const m=Math.floor(timerSec/60).toString().padStart(2,'0');const s=(timerSec%60).toString().padStart(2,'0');const el=document.getElementById('timer-disp');if(el)el.textContent=m+':'+s;}
function updateTimerUI(state){
  const disp=document.getElementById('timer-disp');if(!disp)return;
  const status=document.getElementById('timer-status');
  const bs=document.getElementById('btn-start');const bp=document.getElementById('btn-pause');const br=document.getElementById('btn-reset');
  state==='running'?disp.classList.add('running'):disp.classList.remove('running');
  if(status){
    const lbl={
      idle:`READY · ${currentTimerMode}`,
      running:`${currentTimerMode.toUpperCase()} IN PROGRESS...`,
      paused:`PAUSED · ${currentTimerMode}`,
      done:`SESSION COMPLETE · ${currentTimerMode}`
    };
    status.textContent=lbl[state]||'';
  }
  if(bs){bs.textContent=state==='paused'?'RESUME':'START';bs.classList.toggle('btn-disabled',state==='running');}
  if(bp)bp.classList.toggle('btn-disabled',state!=='running');
  if(br)br.classList.toggle('btn-disabled',state==='idle'&&timerSec===25*60);
}
function timerDone(){
  updateTimerUI('done');
  const sessionMins=Math.round(timerOriginalSec/60);
  const xp=sessionMins>=90?120:sessionMins>=60?80:sessionMins>=45?65:50;
  addXP(xp);
  S.timerSessions.push({date:todayStr(),time:new Date().toLocaleTimeString(),mins:sessionMins,mode:currentTimerMode});
  save();renderQuests();notify('SESSION COMPLETE +'+xp+' XP',true);updateSessionLog();
  setTimeout(()=>{timerSec=25*60;timerOriginalSec=25*60;currentTimerMode=TIMER_MODES[25];updateTimerDisp();updateTimerUI('idle');},3000);
}
function updateSessionLog(){
  const log=document.getElementById('session-log');if(!log)return;
  const ts=S.timerSessions.filter(s=>s.date===todayStr());
  log.innerHTML=ts.length?ts.map((s,i)=>`[${i+1}] ${s.mode||'Focus Session'} · ${s.time}`).join('<br>'):'No sessions today.';
}

// ═══════════════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════════════
function exportData(){
  const {sheetProblems,sheetTemplateVersion,...exportState}=S;
  const blob=new Blob([JSON.stringify(exportState,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='dsa-hunter-'+todayStr()+'.json';a.click();
  URL.revokeObjectURL(url);notify('DATA EXPORTED',true);
}
function importData(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.problems&&!data.profile){notify('Invalid data file!',false);return;}
      S={...S,...data};save();startApp();
      notify('DATA IMPORTED — WELCOME BACK',true);
    }catch{notify('Failed to read file!',false);}
    input.value='';
  };
  reader.readAsText(file);
}
function initExImDrop(){
  const drop=document.getElementById('exim-drop');if(!drop)return;
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('over');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('over'));
  drop.addEventListener('drop',e=>{
    e.preventDefault();drop.classList.remove('over');
    const file=e.dataTransfer.files[0];
    if(!file||!file.name.endsWith('.json')){notify('Drop a .json file',false);return;}
    const reader=new FileReader();
    reader.onload=ev=>{
      try{const data=JSON.parse(ev.target.result);S={...S,...data};save();startApp();notify('DATA IMPORTED',true);}
      catch{notify('Failed to read file!',false);}
    };
    reader.readAsText(file);
  });
}

// ═══════════════════════════════════════════════════════
// LEVEL UP
// ═══════════════════════════════════════════════════════
function triggerLevelUp(rank){
  document.getElementById('lvl-rank-txt').textContent='RANK '+rank+' ACHIEVED';
  document.getElementById('lvl-overlay').classList.add('show');
  spawnParticles();
}
function closeLvl(){
  document.getElementById('lvl-overlay').classList.remove('show');
  const p=document.getElementById('ptcls');p.classList.remove('on');p.innerHTML='';
}
function spawnParticles(){
  const c=document.getElementById('ptcls');c.innerHTML='';c.classList.add('on');
  for(let i=0;i<60;i++){
    const p=document.createElement('div');p.className='ptcl';
    p.style.cssText=`left:${Math.random()*100}vw;top:-8px;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;opacity:${Math.random()};animation:ptclF ${Math.random()*3+2}s linear ${Math.random()*1.5}s forwards`;
    c.appendChild(p);
  }
}

// ═══════════════════════════════════════════════════════
// NOTIFY
// ═══════════════════════════════════════════════════════
function notify(msg,ok=true){
  const a=document.getElementById('notifs');
  const el=document.createElement('div');el.className='notif '+(ok?'ok':'err');el.textContent=msg;
  a.appendChild(el);setTimeout(()=>el.remove(),3200);
}

// ═══════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════
function showView(name,navEl){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('view-'+name)?.classList.add('active');
  if(navEl)navEl.classList.add('active');
  if(name==='sheet')renderProblemSheet();
  if(name==='review')renderReview();
  if(name==='skills')renderSkills();
  if(name==='timer'){updateSessionLog();updateTimerUI(timerRunning?'running':'idle');}
  closeSb();
}

// ═══════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════
init();
