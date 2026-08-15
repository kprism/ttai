(() => {
  function loadApiClient() {
    if (window.TTAI) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = './api-client.js?v=260815-1';
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

    async function sendToAI(text,meta={}){
      const id=await ensureStudySession();
      const result=await TTAI.sendMessage(id,text,meta);
      addMessage('coach',result.assistant_message.content);
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
    voiceButton.onclick=()=>{const active=voiceButton.dataset.active==='1';voiceButton.dataset.active=active?'0':'1';voiceButton.textContent=active?'🎤 말하기':'■ 듣고 있어요'};

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