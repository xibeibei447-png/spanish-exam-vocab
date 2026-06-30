const D=window.EXAM_DATA;
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const norm=s=>s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[¿?¡!.,;:«»“”'\"]/g,'').replace(/\s+/g,' ');
const storeKey='spanish-exam-sprint-v1';
let saved=JSON.parse(localStorage.getItem(storeKey)||'{}');
saved.grades=saved.grades||{}; saved.reviewed=saved.reviewed||0; saved.streak=saved.streak||1;
const persist=()=>localStorage.setItem(storeKey,JSON.stringify(saved));
let sound=true;
function speak(text){if(!sound||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=.88;speechSynthesis.speak(u)}
function updateStats(){const mastered=Object.values(saved.grades).filter(x=>x==='know').length;const total=D.nouns.length+D.cloze.vocab.length+D.passage16.length;$('#stat-reviewed').textContent=saved.reviewed;$('#stat-mastered').textContent=mastered;$('#stat-streak').textContent=saved.streak;const pct=Math.min(100,Math.round(mastered/total*100));$('#progress-label').textContent=pct+'%';$('#progress-bar').style.width=pct+'%'}

$('#sound-toggle').onclick=e=>{sound=!sound;e.currentTarget.textContent='发音 '+(sound?'开':'关');e.currentTarget.setAttribute('aria-pressed',sound)};

D.nouns.filter(x=>x.priority===3).forEach((x,i)=>{const el=document.createElement('article');el.className='priority-card';el.innerHTML=`<span class="num">0${i+1}</span>${x.uncertain?'<span class="uncertain">高概率</span>':''}<h3>${x.answer}</h3><p>${x.zh}</p><small>${x.clue}</small>`;el.onclick=()=>speak(x.clue.replace('___',x.answer));$('#priority-grid').append(el)});

let deck='nouns', cardIndex=0, deckItems=[];
function getDeck(){if(deck==='nouns')return D.nouns.map((x,i)=>({...x,id:'n'+i,kicker:x.priority===3?'老师点名':'名词 · 原句',example:x.clue.replace('___',x.answer)}));if(deck==='cloze')return D.cloze.vocab.map((x,i)=>({id:'c'+i,es:x[0],zh:x[1],kicker:'第五课 · 完形',example:'Un resfriado 高频词'}));return D.passage16.map((x,i)=>({id:'p'+i,...x,kicker:'第一册第16课',example:x.es}))}
function renderCard(){deckItems=getDeck();cardIndex=(cardIndex+deckItems.length)%deckItems.length;const x=deckItems[cardIndex];$('#flashcard').classList.remove('flipped');$('#card-count').textContent=String(cardIndex+1).padStart(2,'0')+' / '+String(deckItems.length).padStart(2,'0');$('#card-kicker').textContent=x.kicker;$('#card-es').textContent=x.es;$('#card-zh').textContent=x.zh;$('#card-example').textContent=x.example||'';$('#card-note').textContent=x.note||''}
function flipCard(){ $('#flashcard').classList.toggle('flipped') }
$('#flashcard').onclick=flipCard;$('#flashcard').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flipCard()}};
$('#speak-card').onclick=e=>{e.stopPropagation();speak(deckItems[cardIndex].es)};
$$('[data-deck]').forEach(b=>b.onclick=()=>{$$('[data-deck]').forEach(x=>x.classList.remove('active'));b.classList.add('active');deck=b.dataset.deck;cardIndex=0;renderCard()});
$$('[data-grade]').forEach(b=>b.onclick=()=>{const x=deckItems[cardIndex];saved.grades[x.id]=b.dataset.grade;saved.reviewed++;persist();updateStats();cardIndex++;renderCard()});

let quizMode='noun', question=null, score={right:0,total:0};
const pick=a=>a[Math.floor(Math.random()*a.length)];
function nextQuiz(){let prompt,answer,sub='',instruction,label;if(quizMode==='noun'){question=pick(D.nouns);prompt=question.clue;answer=question.answer;sub=question.zh;instruction='根据原句，填入一个名词';label='名词填空'}else if(quizMode==='article'){question=pick(D.articles);prompt=question.prompt;answer=question.answer;sub='填入冠词或介词';instruction='把固定位置补完整';label='冠词 / 固定搭配'}else{const v=pick(D.verbs),persons=['yo','tú','él / ella / usted','nosotros/as','vosotros/as','ellos / ellas / ustedes'],i=Math.floor(Math.random()*6);question={...v,answer:v.forms[i]};prompt=`${v.inf} → ${persons[i]}`;answer=question.answer;sub=v.zh+' · 简单过去时';instruction='写出正确的简单过去时变位';label='动词变位'}question.answer=answer;$('#quiz-mode-label').textContent=label;$('#quiz-instruction').textContent=instruction;$('#quiz-prompt').textContent=prompt;$('#quiz-sub').textContent=sub;$('#quiz-answer').value='';$('#quiz-answer').disabled=false;$('#quiz-form button').disabled=false;$('#quiz-feedback').className='feedback';$('#quiz-feedback').textContent='';$('#next-question').hidden=true;$('#quiz-score').textContent=score.right+' / '+score.total}
$$('[data-mode]').forEach(b=>b.onclick=()=>{$$('[data-mode]').forEach(x=>x.classList.remove('active'));b.classList.add('active');quizMode=b.dataset.mode;nextQuiz()});
$('#quiz-form').onsubmit=e=>{e.preventDefault();const raw=$('#quiz-answer').value;if(!raw.trim())return;const ok=norm(raw)===norm(question.answer);score.total++;if(ok)score.right++;const accent=raw.toLowerCase().trim()!==question.answer.toLowerCase()&&ok;const fb=$('#quiz-feedback');fb.className='feedback '+(ok?'good':'bad');fb.innerHTML=ok?`答对了。${accent?'拼写时记得重音：<strong>'+question.answer+'</strong>':''}`:`这题是 <strong>${question.answer}</strong>${question.tip?'。'+question.tip:''}`;$('#quiz-score').textContent=score.right+' / '+score.total;$('#quiz-answer').disabled=true;$('#quiz-form button').disabled=true;$('#next-question').hidden=false};$('#next-question').onclick=nextQuiz;

D.cloze.steps.forEach(x=>{const el=document.createElement('article');el.className='story-step';el.innerHTML=`<h3>${x.label}</h3><p>${x.text}</p>`;$('#story-line').append(el)});D.cloze.vocab.forEach(x=>{const el=document.createElement('div');el.innerHTML=`<strong>${x[0]}</strong><small>${x[1]}</small>`;$('#cloze-vocab').append(el)});

let transMode='c2s',transIndex=0;
function transItems(){return transMode==='c2s'?D.translations:D.passage16}
function renderTransList(){const list=$('#translation-list');list.innerHTML='';transItems().forEach((x,i)=>{const b=document.createElement('button');b.className=i===transIndex?'active':'';b.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><p>${transMode==='c2s'?x.zh:x.es}</p>`;b.onclick=()=>{transIndex=i;renderTransList();renderTranslation()};list.append(b)})}
function renderTranslation(){const x=transItems()[transIndex];$('#translation-number').textContent=String(transIndex+1).padStart(2,'0');$('#source-label').textContent=transMode==='c2s'?'请译成西班牙语':'请译成中文';$('#translation-source').textContent=transMode==='c2s'?x.zh:x.es;const ans=$('#translation-answer');ans.hidden=true;$('#reveal-translation').hidden=false;$('p',ans).textContent=transMode==='c2s'?x.es:x.zh;$('.chunks',ans).innerHTML=(x.chunks||[]).map(c=>`<span>${c}</span>`).join('');$('.speak-inline',ans).hidden=transMode!=='c2s'}
$$('[data-translation]').forEach(b=>b.onclick=()=>{$$('[data-translation]').forEach(x=>x.classList.remove('active'));b.classList.add('active');transMode=b.dataset.translation;transIndex=0;renderTransList();renderTranslation()});
$('#reveal-translation').onclick=()=>{$('#translation-answer').hidden=false;$('#reveal-translation').hidden=true};$('.speak-inline').onclick=()=>speak(D.translations[transIndex].es);

const categories={traffic:['atasco','accidente','trafico','ambulancia','testigo','comisaria','coche','metro','lugar'],home:['matrimonio','pareja','quehaceres','cansancio','satisfaccion','cocina','verduras','carne','utensilios'],health:['cabeza','hospital','farmacia','deportista','estadio','piscina','natacion','baloncesto','chaqueta','calor','viento','cuerpo','nariz','apetito','frente','fiebre','consultorio','pulso','lengua','garganta','termometro','resfriado','tableta','inyeccion','enfermera']};let libFilter='all';
function libraryItems(){return [...D.nouns,...D.cloze.vocab.map((x,i)=>({es:x[0],zh:x[1],clue:'第二册第5课 · Un resfriado',priority:0,id:'health'+i}))]}
function renderLibrary(){const q=norm($('#library-search').value);let items=libraryItems();if(libFilter==='priority')items=items.filter(x=>x.priority===3);else if(categories[libFilter])items=items.filter(x=>categories[libFilter].some(k=>norm(x.es).includes(k)));items=items.filter(x=>norm(x.es+' '+x.zh+' '+(x.clue||'')).includes(q));$('#library-grid').innerHTML='';items.forEach(x=>{const el=document.createElement('article');el.className='word-row';el.innerHTML=`<strong>${x.es}</strong><span>${x.zh}</span><button aria-label="播放 ${x.es}">◖))</button>`;$('button',el).onclick=()=>speak(x.es);$('#library-grid').append(el)})}
$('#library-search').oninput=renderLibrary;$$('[data-filter]').forEach(b=>b.onclick=()=>{$$('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');libFilter=b.dataset.filter;renderLibrary()});
$('#reset-progress').onclick=()=>{if(confirm('确定清空这台设备上的学习记录吗？')){localStorage.removeItem(storeKey);saved={grades:{},reviewed:0,streak:1};updateStats()}};

renderCard();nextQuiz();renderTransList();renderTranslation();renderLibrary();updateStats();
