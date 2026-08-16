(() => {
  function loadApiClient() {
    if (window.TTAI) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = './api-client.js?v=260816-2';
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
    let STUDENT={name:'학생',avatar:'👦',grade:'중2'};

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
      const logout=profileMenu?.querySelector('button');if(logout)logout.onclick=()=>{TTAI.logout();location.href='./auth.html'};
    }
    applyProfile();

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

    function addHistory(label,text){historyItems.push({label,text});historyCount.textContent=historyItems.length;historyToggle.hidden=false;const b=document.createElement('button');b.className='history-chip';b.type='button';b.innerHTML=`<small>${label}</small><span>${text}</span>`;historyRail.appendChild(b)}
    historyToggle.onclick=()=>historyRail.classList.toggle('collapsed');historyClose.onclick=()=>historyRail.classList.add('collapsed');

    function addMessage(role,text,items=[]){
      const row=document.createElement('div');row.className=`message-row ${role}`;let profile;
      if(role==='student'){profile=document.createElement('div');profile.className='message-profile';profile.textContent=STUDENT.avatar||'👦'}else{profile=document.createElement('img');profile.className='message-profile coach-profile';profile.src=SOCRATES_PROFILE;profile.alt='소크라테스'}
      const stack=document.createElement('div');stack.className='message-stack';const name=document.createElement('div');name.className='message-name';name.textContent=role==='student'?(STUDENT.name||'학생'):'소크라테스';stack.appendChild(name);
      if(items.length){const gallery=document.createElement('div');gallery.className='message-gallery';items.forEach(item=>{if(item.file.type.startsWith('image/')){const img=document.createElement('img');img.src=item.url;img.alt=item.file.name||'첨부 이미지';gallery.appendChild(img)}else{const chip=document.createElement('div');chip.className='file-chip';chip.textContent=`📎 ${item.file.name}`;gallery.appendChild(chip)}});stack.appendChild(gallery)}
      if(text){const bubble=document.createElement('div');bubble.className='message-bubble';bubble.textContent=text;stack.appendChild(bubble)}
      if(role==='student')row.append(stack,profile);else row.append(profile,stack);dialogueScroll.appendChild(row);addHistory(role==='student'?'내 생각':'소크라테스',text||'파일 첨부');requestAnimationFrame(()=>dialogueScroll.scrollTo({top:dialogueScroll.scrollHeight,behavior:'smooth'}));
    }

    function parseCoachPayload(raw){
      const source=String(raw||'').trim();
      const mode=/\[MODE:TEACH\]/i.test(source)?'teach':'question';
      const visualMatch=source.match(/\[VISUAL:(.*?)\]/i);
      const visual=(visualMatch?.[1]||'').trim();
      const text=source.replace(/\[MODE:(?:TEACH|QUESTION)\]\s*/ig,'').replace(/\[VISUAL:.*?\]\s*/ig,'').trim();
      return {mode,visual,text:text||'잠깐, 여기서 핵심을 한 번 짚고 다시 가보자.'};
    }

    function installTeachingStyles(){
      if(document.getElementById('ttaiTeachingStyles'))return;
      const style=document.createElement('style');style.id='ttaiTeachingStyles';style.textContent=`
        .visual-demo{position:relative;transition:.25s ease}.visual-demo.teaching-active{box-shadow:0 0 0 3px rgba(76,110,245,.16) inset;background:linear-gradient(180deg,#f7f9ff,#eef4ff)}
        .teaching-visual{position:absolute;left:18px;right:18px;bottom:18px;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.94);border:1px solid #dce5ff;box-shadow:0 10px 30px rgba(56,86,160,.12);z-index:4}
        .teaching-visual strong{display:block;font-size:14px;color:#3156d3;margin-bottom:9px}.teaching-sketch{display:flex;align-items:center;justify-content:center;gap:12px;font-size:13px;font-weight:800;color:#26344f}.teaching-sketch span{padding:8px 11px;border-radius:12px;background:#eef3ff}.teaching-sketch b{color:#4c6ef5;font-size:18px}.problem-hint.teaching-hint{color:#3156d3;font-weight:750}
        #voiceButton.listening{background:#fff0f0!important;color:#d33!important;border-color:#ffd0d0!important;box-shadow:0 0 0 4px rgba(220,53,69,.08)}
      `;document.head.appendChild(style);
    }

    function showTeachingVisual(visualText){
      const visual=document.querySelector('.visual-demo');if(!visual)return;
      visual.classList.add('teaching-active');
      let panel=visual.querySelector('.teaching-visual');if(!panel){panel=document.createElement('div');panel.className='teaching-visual';visual.appendChild(panel)}
      panel.innerHTML=`<strong>💡 잠깐, 여기만 짚고 갈게</strong><div class="teaching-sketch"><span>엘리베이터 ↓ g</span><b>=</b><span>사람 ↓ g</span></div><div style="margin-top:8px;font-size:13px;line-height:1.45;color:#55627a">${escapeHtml(visualText||'둘이 함께 같은 가속도로 떨어질 때 바닥이 사람을 밀어야 하는지 비교해봐.')}</div>`;
      const hint=document.querySelector('.problem-hint');if(hint){hint.classList.add('teaching-hint');hint.textContent='질문을 잠깐 멈추고, 그림과 설명으로 개념을 먼저 잡는 중이야.'}
    }

    function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

    function speakTeaching(text){
      if(!('speechSynthesis' in window)||!text)return;
      window.speechSynthesis.cancel();
      const utter=new SpeechSynthesisUtterance(text);utter.lang='ko-KR';utter.rate=.96;utter.pitch=1.02;
      const voices=window.speechSynthesis.getVoices();const ko=voices.find(v=>/^ko/i.test(v.lang));if(ko)utter.voice=ko;
      window.speechSynthesis.speak(utter);
    }

    async function sendToAI(text,meta={}){
      const id=await ensureStudySession();
      const result=await TTAI.sendMessage(id,text,meta);
      const payload=parseCoachPayload(result.assistant_message.content);
      addMessage('coach',payload.text);
      if(payload.mode==='teach'){
        showTeachingVisual(payload.visual);
        speakTeaching(payload.text);
        TTAI.growthEvent('hint_request',1).catch(()=>{});
      }
      return payload;
    }

    async function beginConversation(kind){
      openingState.hidden=true;conversationState.hidden=false;
      try{
        if(kind==='unknown'){
          addMessage('student','잘 모르겠어.');
          await TTAI.growthEvent('hint_request',1).catch(()=>{});
          await sendToAI('잘 모르겠어.',{opening:'unknown'});
        }else if(kind==='idea'){
          addMessage('coach','좋아. 정답인지 걱정하지 말고, 처음 떠오른 생각을 네 말로 적어줘.');setTimeout(()=>thoughtInput.focus(),50);
        }else{
          addMessage('coach','좋아. 편하게 말해봐. 네 생각을 먼저 들어볼게.');setTimeout(()=>voiceButton.click(),80);
        }
      }catch(e){addMessage('coach',`서버 연결에 문제가 있어. ${e.message}`)}
    }
    document.querySelectorAll('[data-opening]').forEach(b=>b.onclick=()=>beginConversation(b.dataset.opening));

    function addFiles(files){[...files].forEach(file=>attachments.push({file,url:file.type.startsWith('image/')?URL.createObjectURL(file):''}));renderPreview()}
    function renderPreview(){pastePreview.innerHTML='';pastePreview.hidden=!attachments.length;attachments.forEach((item,index)=>{const card=document.createElement('div');card.className='pasted-image-card';let media;if(item.file.type.startsWith('image/')){media=document.createElement('img');media.src=item.url;media.alt=item.file.name||'첨부 이미지'}else{media=document.createElement('div');media.className='file-chip';media.textContent='📎'}const meta=document.createElement('div');meta.className='paste-meta';meta.innerHTML=`<strong>${item.file.name||'붙여넣은 이미지'}</strong><span>${Math.round(item.file.size/1024)} KB</span>`;const remove=document.createElement('button');remove.className='paste-remove';remove.type='button';remove.textContent='×';remove.onclick=()=>{if(item.url)URL.revokeObjectURL(item.url);attachments.splice(index,1);renderPreview();thoughtInput.focus()};card.append(media,meta,remove);pastePreview.appendChild(card)})}
    thoughtInput.addEventListener('paste',e=>{const items=[...(e.clipboardData?.items||[])],images=items.filter(i=>i.type.startsWith('image/'));if(!images.length)return;e.preventDefault();images.forEach(i=>{const file=i.getAsFile();if(file)addFiles([file])});const text=e.clipboardData.getData('text/plain');if(text){const s=thoughtInput.selectionStart,n=thoughtInput.selectionEnd;thoughtInput.value=thoughtInput.value.slice(0,s)+text+thoughtInput.value.slice(n)}autoSize()});
    attachButton.onclick=e=>{e.stopPropagation();attachMenu.hidden=!attachMenu.hidden;attachButton.setAttribute('aria-expanded',String(!attachMenu.hidden))};
    document.querySelectorAll('[data-attach]').forEach(b=>b.onclick=()=>{const type=b.dataset.attach;attachMenu.hidden=true;attachButton.setAttribute('aria-expanded','false');if(type==='image')imageInput.click();else if(type==='file')fileInput.click();else alert('카메라 기능은 백엔드 파일·미디어 단계에서 연결합니다.')});
    imageInput.onchange=()=>{addFiles(imageInput.files);imageInput.value=''};fileInput.onchange=()=>{addFiles(fileInput.files);fileInput.value=''};

    setupSpeechRecognition();
    function setupSpeechRecognition(){
      const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SpeechRecognition){
        voiceButton.onclick=()=>alert('이 브라우저에서는 실시간 음성 받아쓰기를 지원하지 않습니다. Chrome 최신 버전에서 사용해 주세요.');
        return;
      }
      const recognition=new SpeechRecognition();recognition.lang='ko-KR';recognition.interimResults=true;recognition.continuous=true;
      let listening=false,baseText='',finalText='';
      function setListening(on){listening=on;voiceButton.classList.toggle('listening',on);voiceButton.dataset.active=on?'1':'0';voiceButton.textContent=on?'■ 듣는 중':'🎤 말하기'}
      recognition.onstart=()=>setListening(true);
      recognition.onresult=e=>{
        let interim='';
        for(let i=e.resultIndex;i<e.results.length;i++){
          const transcript=e.results[i][0].transcript;
          if(e.results[i].isFinal)finalText+=(finalText?' ':'')+transcript.trim();else interim+=transcript;
        }
        thoughtInput.value=[baseText,finalText,interim].filter(Boolean).join(baseText||finalText?' ':'').trimStart();
        autoSize();thoughtInput.focus();
      };
      recognition.onerror=e=>{if(!['no-speech','aborted'].includes(e.error))addMessage('coach','마이크 입력을 확인해줘. 다시 눌러서 말해도 좋아.');};
      recognition.onend=()=>setListening(false);
      voiceButton.onclick=()=>{
        if(listening){recognition.stop();return}
        baseText=thoughtInput.value.trim();finalText='';
        try{recognition.start()}catch(_){setListening(false)}
      };
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
