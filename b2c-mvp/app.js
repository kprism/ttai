(() => {
  function loadApiClient() {
    if (window.TTAI) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = './api-client.js?v=260816-3';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  loadApiClient().then(init).catch(() => alert('API 클라이언트를 불러오지 못했습니다.'));

  async function init() {
    if (!TTAI.isLoggedIn()) {
      location.href = './auth.html?next=studio';
      return;
    }

    const $ = id => document.getElementById(id);
    const pathButton=$('learningPathButton'),pathDrawer=$('pathDrawer'),closePathButton=$('closePathButton'),backdrop=$('drawerBackdrop'),companionToggle=$('companionToggle'),companionPanel=$('companionPanel'),voiceButton=$('voiceButton'),thoughtInput=$('thoughtInput'),pastePreview=$('pastePreview'),dialogueScroll=$('dialogueScroll'),openingState=$('openingState'),conversationState=$('conversationState'),historyRail=$('historyRail'),historyToggle=$('historyToggle'),historyClose=$('historyClose'),historyCount=$('historyCount'),profileButton=$('profileButton'),profileMenu=$('profileMenu'),attachButton=$('attachButton'),attachMenu=$('attachMenu'),imageInput=$('imageInput'),fileInput=$('fileInput');
    let attachments=[],historyItems=[],studySessionId=TTAI.currentStudySessionId();
    const SOCRATES_PROFILE='./assets/socrates-friend.webp';
    const VOICE_KEY='ttai-ai-voice-mode';
    let voiceMode=localStorage.getItem(VOICE_KEY)||'off';
    let STUDENT={name:'학생',avatar:'👦',grade:'중2'};

    const STEP_META={
      FIRST_ENCOUNTER:{label:'첫 만남',icon:'🌱',title:'처음 만나는 개념부터 쉽게'},
      THOUGHT:{label:'생각발화',icon:'💬',title:'내 생각을 먼저 꺼내보기'},
      COLLISION:{label:'생각충돌',icon:'💥',title:'예상과 실제를 비교해보기'},
      AHA:{label:'아하포인트',icon:'💡',title:'이것 하나만 잡고 가기'},
      TEACH:{label:'짧은 티칭',icon:'🧭',title:'질문을 멈추고 핵심만 배우기'},
      CHECK:{label:'확인',icon:'🧩',title:'아주 쉽게 확인하기'},
      APPLY:{label:'적용',icon:'🎯',title:'원래 문제에 다시 적용하기'}
    };

    installTeachingStyles();

    try {
      const me=await TTAI.me();
      STUDENT={...STUDENT,...me};
      localStorage.setItem('ttai-user',JSON.stringify(me));
      localStorage.setItem('ttai-profile',JSON.stringify(me));
    } catch(e) {
      location.href='./auth.html?expired=1';
      return;
    }

    function applyProfile(){
      if(profileButton)profileButton.textContent=STUDENT.avatar||'👦';
      const brand=document.querySelector('.topbar .brand');if(brand)brand.href='./home.html';
      const summary=profileMenu?.querySelector('.profile-summary');
      if(summary){const av=summary.querySelector('.profile-avatar'),name=summary.querySelector('strong'),grade=summary.querySelector('small');if(av)av.textContent=STUDENT.avatar||'👦';if(name)name.textContent=STUDENT.name||'학생';if(grade)grade.textContent=STUDENT.grade||''}
      profileMenu?.querySelectorAll('a').forEach(a=>{const t=a.textContent.trim();if(t.includes('내 성장'))a.href='./growth.html';else if(t.includes('내 프로필'))a.href='./profile.html';else if(t.includes('학습 기록'))a.href='./growth.html';});
      const logout=profileMenu?.querySelector('button:not(.voice-setting-button)');if(logout)logout.onclick=()=>{TTAI.logout();location.href='./auth.html'};
    }
    applyProfile();
    installVoiceSetting();

    function installVoiceSetting(){
      if(!profileMenu||profileMenu.querySelector('.voice-setting-button'))return;
      const button=document.createElement('button');button.type='button';button.className='voice-setting-button';
      const refresh=()=>{const labels={off:'끔',teach:'설명만',all:'모두'};button.textContent=`🔊 AI 음성 · ${labels[voiceMode]||'끔'}`;button.dataset.mode=voiceMode};
      button.onclick=e=>{e.stopPropagation();voiceMode=voiceMode==='off'?'teach':voiceMode==='teach'?'all':'off';localStorage.setItem(VOICE_KEY,voiceMode);if(voiceMode==='off'&&'speechSynthesis'in window)window.speechSynthesis.cancel();refresh()};
      const logout=profileMenu.querySelector('button');if(logout)profileMenu.insertBefore(button,logout);else profileMenu.appendChild(button);refresh();
    }

    async function ensureStudySession(){
      if(studySessionId) return studySessionId;
      const created=await TTAI.createStudySession({subject:'과학',unit:'자유낙하',stage:'개념응용'});
      studySessionId=created.id;
      return studySessionId;
    }

    function setDrawer(open){pathDrawer.hidden=!open;backdrop.hidden=!open;pathButton.setAttribute('aria-expanded',String(open))}
    pathButton.onclick=()=>setDrawer(pathDrawer.hidden);closePathButton.onclick=()=>setDrawer(false);backdrop.onclick=()=>setDrawer(false);
    profileButton.onclick=e=>{e.stopPropagation();profileMenu.hidden=!profileMenu.hidden;profileButton.setAttribute('aria-expanded',String(!profileMenu.hidden))};
    document.addEventListener('click',e=>{if(!profileMenu.hidden&&!profileMenu.contains(e.target)&&e.target!==profileButton){profileMenu.hidden=true;profileButton.setAttribute('aria-expanded','false')}if(!attachMenu.hidden&&!attachMenu.contains(e.target)&&e.target!==attachButton){attachMenu.hidden=true;attachButton.setAttribute('aria-expanded','false')}});
    companionToggle.onclick=()=>{const next=companionToggle.getAttribute('aria-pressed')!=='true';companionToggle.setAttribute('aria-pressed',String(next));if(companionPanel)companionPanel.hidden=!next};

    function addHistory(label,text){historyItems.push({label,text});historyCount.textContent=historyItems.length;historyToggle.hidden=false;const b=document.createElement('button');b.className='history-chip';b.type='button';b.innerHTML=`<small>${label}</small><span>${escapeHtml(text)}</span>`;historyRail.appendChild(b)}
    historyToggle.onclick=()=>historyRail.classList.toggle('collapsed');historyClose.onclick=()=>historyRail.classList.add('collapsed');

    function addMessage(role,text,items=[],meta={}){
      const row=document.createElement('div');row.className=`message-row ${role}`;let profile;
      if(role==='student'){profile=document.createElement('div');profile.className='message-profile';profile.textContent=STUDENT.avatar||'👦'}else{profile=document.createElement('img');profile.className='message-profile coach-profile';profile.src=SOCRATES_PROFILE;profile.alt='소크라테스'}
      const stack=document.createElement('div');stack.className='message-stack';const name=document.createElement('div');name.className='message-name';name.textContent=role==='student'?(STUDENT.name||'학생'):'소크라테스';stack.appendChild(name);
      if(role!=='student'&&meta.step&&STEP_META[meta.step]){const badge=document.createElement('div');badge.className=`learning-step-badge step-${meta.step.toLowerCase()}`;badge.textContent=`${STEP_META[meta.step].icon} ${STEP_META[meta.step].label}`;stack.appendChild(badge)}
      if(items.length){const gallery=document.createElement('div');gallery.className='message-gallery';items.forEach(item=>{if(item.file.type.startsWith('image/')){const img=document.createElement('img');img.src=item.url;img.alt=item.file.name||'첨부 이미지';gallery.appendChild(img)}else{const chip=document.createElement('div');chip.className='file-chip';chip.textContent=`📎 ${item.file.name}`;gallery.appendChild(chip)}});stack.appendChild(gallery)}
      if(text){const bubble=document.createElement('div');bubble.className='message-bubble';bubble.textContent=text;stack.appendChild(bubble)}
      if(role==='student')row.append(stack,profile);else row.append(profile,stack);dialogueScroll.appendChild(row);addHistory(role==='student'?'내 생각':(meta.step&&STEP_META[meta.step]?STEP_META[meta.step].label:'소크라테스'),text||'파일 첨부');requestAnimationFrame(()=>dialogueScroll.scrollTo({top:dialogueScroll.scrollHeight,behavior:'smooth'}));
    }

    function parseCoachPayload(raw){
      const source=String(raw||'').trim();
      const mode=/\[MODE:TEACH\]/i.test(source)?'teach':'question';
      const step=(source.match(/\[STEP:(FIRST_ENCOUNTER|THOUGHT|COLLISION|AHA|TEACH|CHECK|APPLY)\]/i)?.[1]||'THOUGHT').toUpperCase();
      const visual=(source.match(/\[VISUAL:(.*?)\]/i)?.[1]||'').trim();
      const say=(source.match(/\[SAY:(.*?)\]/i)?.[1]||'').trim();
      const text=source.replace(/\[MODE:(?:TEACH|QUESTION)\]\s*/ig,'').replace(/\[STEP:.*?\]\s*/ig,'').replace(/\[VISUAL:.*?\]\s*/ig,'').replace(/\[SAY:.*?\]\s*/ig,'').trim();
      return {mode,step,visual,say,text:text||'잠깐, 여기서 핵심을 한 번 잡고 다시 가보자.'};
    }

    function installTeachingStyles(){
      if(document.getElementById('ttaiTeachingStyles'))return;
      const style=document.createElement('style');style.id='ttaiTeachingStyles';style.textContent=`
        .visual-demo{position:relative;transition:.25s ease}.visual-demo.teaching-active{box-shadow:0 0 0 3px rgba(76,110,245,.16) inset;background:linear-gradient(180deg,#f7f9ff,#eef4ff)}
        .teaching-visual{position:absolute;left:18px;right:18px;bottom:18px;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.96);border:1px solid #dce5ff;box-shadow:0 10px 30px rgba(56,86,160,.12);z-index:4}
        .teaching-visual strong{display:flex;align-items:center;gap:7px;font-size:14px;color:#3156d3;margin-bottom:8px}.teaching-visual p{margin:0;font-size:13px;line-height:1.55;color:#4f5e78}
        .teaching-sketch{display:flex;align-items:center;justify-content:center;gap:10px;margin:10px 0;font-size:13px;font-weight:800;color:#26344f}.teaching-sketch span{padding:8px 11px;border-radius:12px;background:#eef3ff}.teaching-sketch b{color:#4c6ef5;font-size:18px}
        .problem-hint.teaching-hint{color:#3156d3;font-weight:750}.learning-step-badge{display:inline-flex;width:max-content;align-items:center;border-radius:999px;padding:4px 9px;margin-bottom:5px;font-size:11px;font-weight:800;background:#f1f4ff;color:#4057a8}.step-first_encounter{background:#edf9f0;color:#2d7a46}.step-collision{background:#fff2ea;color:#b85524}.step-aha{background:#fff8d9;color:#8a6a00}.step-teach{background:#edf3ff;color:#3156d3}.step-check{background:#f4efff;color:#6941a5}.step-apply{background:#edf9f6;color:#23725d}
        #voiceButton.listening{background:#fff0f0!important;color:#d33!important;border-color:#ffd0d0!important;box-shadow:0 0 0 4px rgba(220,53,69,.08)}
        .voice-setting-button{width:100%;text-align:left;border:0;background:transparent;padding:11px 14px;color:#26344f;font-weight:700;cursor:pointer}.voice-setting-button:hover{background:#f6f8fc}
      `;document.head.appendChild(style);
    }

    function showLearningVisual(payload){
      const visual=document.querySelector('.visual-demo');if(!visual)return;
      const meta=STEP_META[payload.step]||STEP_META.TEACH;
      if(payload.step==='APPLY'){
        const existing=visual.querySelector('.teaching-visual');if(existing)existing.remove();visual.classList.remove('teaching-active');
        const hint=document.querySelector('.problem-hint');if(hint){hint.classList.remove('teaching-hint');hint.textContent='좋아. 이제 방금 잡은 개념을 원래 문제에 다시 써보자.'}
        return;
      }
      visual.classList.add('teaching-active');
      let panel=visual.querySelector('.teaching-visual');if(!panel){panel=document.createElement('div');panel.className='teaching-visual';visual.appendChild(panel)}
      const sketch=(payload.step==='FIRST_ENCOUNTER'||payload.step==='TEACH'||payload.step==='AHA')?'<div class="teaching-sketch"><span>엘리베이터 ↓ g</span><b>=</b><span>사람 ↓ g</span></div>':'';
      panel.innerHTML=`<strong>${meta.icon} ${escapeHtml(meta.title)}</strong>${sketch}<p>${escapeHtml(payload.visual||'그림에서 둘의 움직임을 비교해보자.')}</p>`;
      const hint=document.querySelector('.problem-hint');if(hint){hint.classList.add('teaching-hint');hint.textContent=`${meta.label} 단계 · 지금 필요한 것 하나만 잡고 갈게.`}
    }

    function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

    function shouldSpeak(payload){return voiceMode==='all'||(voiceMode==='teach'&&['FIRST_ENCOUNTER','TEACH','AHA'].includes(payload.step))}
    function speakTeaching(payload){
      const text=(payload.say||payload.text||'').trim();if(!shouldSpeak(payload)||!('speechSynthesis' in window)||!text)return;
      window.speechSynthesis.cancel();
      const utter=new SpeechSynthesisUtterance(text);utter.lang='ko-KR';utter.rate=.96;utter.pitch=1.02;
      const voices=window.speechSynthesis.getVoices();const ko=voices.find(v=>/^ko/i.test(v.lang));if(ko)utter.voice=ko;
      window.speechSynthesis.speak(utter);
    }

    async function sendToAI(text,meta={}){
      const id=await ensureStudySession();
      const result=await TTAI.sendMessage(id,text,meta);
      const payload=parseCoachPayload(result.assistant_message.content);
      addMessage('coach',payload.text,[],{step:payload.step});
      if(['FIRST_ENCOUNTER','COLLISION','AHA','TEACH','CHECK','APPLY'].includes(payload.step))showLearningVisual(payload);
      speakTeaching(payload);
      if(['FIRST_ENCOUNTER','TEACH'].includes(payload.step))TTAI.growthEvent('hint_request',1).catch(()=>{});
      return payload;
    }

    async function beginConversation(kind){
      openingState.hidden=true;conversationState.hidden=false;
      try{
        if(kind==='unknown'){
          addMessage('student','잘 모르겠어.');
          await TTAI.growthEvent('hint_request',1).catch(()=>{});
          await sendToAI('잘 모르겠어.',{opening:'unknown',learning_state:'first_encounter'});
        }else if(kind==='idea'){
          addMessage('coach','좋아. 정답 맞히기보다 처음 떠오른 생각부터 한 문장으로 말해줘.',[],{step:'THOUGHT'});setTimeout(()=>thoughtInput.focus(),50);
        }else{
          addMessage('coach','좋아. 편하게 말해봐. 네 생각을 먼저 들어볼게.',[],{step:'THOUGHT'});setTimeout(()=>voiceButton.click(),80);
        }
      }catch(e){addMessage('coach',`서버 연결에 문제가 있어. ${e.message}`)}
    }
    document.querySelectorAll('[data-opening]').forEach(b=>b.onclick=()=>beginConversation(b.dataset.opening));

    function addFiles(files){[...files].forEach(file=>attachments.push({file,url:file.type.startsWith('image/')?URL.createObjectURL(file):''}));renderPreview()}
    function renderPreview(){pastePreview.innerHTML='';pastePreview.hidden=!attachments.length;attachments.forEach((item,index)=>{const card=document.createElement('div');card.className='pasted-image-card';let media;if(item.file.type.startsWith('image/')){media=document.createElement('img');media.src=item.url;media.alt=item.file.name||'첨부 이미지'}else{media=document.createElement('div');media.className='file-chip';media.textContent='📎'}const meta=document.createElement('div');meta.className='paste-meta';meta.innerHTML=`<strong>${escapeHtml(item.file.name||'붙여넣은 이미지')}</strong><span>${Math.round(item.file.size/1024)} KB</span>`;const remove=document.createElement('button');remove.className='paste-remove';remove.type='button';remove.textContent='×';remove.onclick=()=>{if(item.url)URL.revokeObjectURL(item.url);attachments.splice(index,1);renderPreview();thoughtInput.focus()};card.append(media,meta,remove);pastePreview.appendChild(card)})}
    thoughtInput.addEventListener('paste',e=>{const items=[...(e.clipboardData?.items||[])],images=items.filter(i=>i.type.startsWith('image/'));if(!images.length)return;e.preventDefault();images.forEach(i=>{const file=i.getAsFile();if(file)addFiles([file])});const text=e.clipboardData.getData('text/plain');if(text){const s=thoughtInput.selectionStart,n=thoughtInput.selectionEnd;thoughtInput.value=thoughtInput.value.slice(0,s)+text+thoughtInput.value.slice(n)}autoSize()});
    attachButton.onclick=e=>{e.stopPropagation();attachMenu.hidden=!attachMenu.hidden;attachButton.setAttribute('aria-expanded',String(!attachMenu.hidden))};
    document.querySelectorAll('[data-attach]').forEach(b=>b.onclick=()=>{const type=b.dataset.attach;attachMenu.hidden=true;attachButton.setAttribute('aria-expanded','false');if(type==='image')imageInput.click();else if(type==='file')fileInput.click();else alert('카메라 기능은 다음 미디어 단계에서 연결합니다.')});
    imageInput.onchange=()=>{addFiles(imageInput.files);imageInput.value=''};fileInput.onchange=()=>{addFiles(fileInput.files);fileInput.value=''};

    setupSpeechRecognition();
    function setupSpeechRecognition(){
      const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SpeechRecognition){voiceButton.onclick=()=>alert('이 브라우저에서는 실시간 음성 받아쓰기를 지원하지 않습니다. Chrome 최신 버전에서 사용해 주세요.');return}
      const recognition=new SpeechRecognition();recognition.lang='ko-KR';recognition.interimResults=true;recognition.continuous=true;recognition.maxAlternatives=1;
      let listening=false,baseText='',finalText='';
      function setListening(on){listening=on;voiceButton.classList.toggle('listening',on);voiceButton.dataset.active=on?'1':'0';voiceButton.textContent=on?'■ 듣는 중':'🎤 말하기';voiceButton.setAttribute('aria-pressed',String(on))}
      recognition.onstart=()=>setListening(true);
      recognition.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const transcript=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=(finalText?' ':'')+transcript.trim();else interim+=transcript}thoughtInput.value=[baseText,finalText,interim].filter(Boolean).join(' ').replace(/\s+/g,' ').trimStart();autoSize();thoughtInput.focus()};
      recognition.onerror=e=>{setListening(false);if(e.error==='not-allowed'||e.error==='service-not-allowed')alert('마이크 권한이 꺼져 있습니다. 주소창의 마이크 권한을 허용해 주세요.');else if(!['no-speech','aborted'].includes(e.error))addMessage('coach','마이크 입력이 잠깐 끊겼어. 다시 눌러서 이어 말해도 좋아.')};
      recognition.onend=()=>setListening(false);
      voiceButton.onclick=()=>{if(listening){recognition.stop();return}baseText=thoughtInput.value.trim();finalText='';try{recognition.start()}catch(_){setListening(false)}};
    }

    async function sendCurrent(){
      const text=thoughtInput.value.trim();if(!text&&!attachments.length){thoughtInput.focus();return}
      if(!text&&attachments.length){alert('현재 실제 API 단계에서는 이미지와 함께 간단한 설명을 입력해 주세요.');return}
      const sentAttachments=[...attachments];addMessage('student',text,sentAttachments);thoughtInput.value='';attachments=[];renderPreview();autoSize();thoughtInput.disabled=true;
      try{await sendToAI(text,{attachment_count:sentAttachments.length})}catch(e){addMessage('coach',`답변을 가져오지 못했어. ${e.message}`)}finally{thoughtInput.disabled=false;thoughtInput.focus()}
    }
    function autoSize(){thoughtInput.style.height='auto';thoughtInput.style.height=Math.min(thoughtInput.scrollHeight,120)+'px'}
    thoughtInput.addEventListener('input',autoSize);thoughtInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCurrent()}});
  }
})();
