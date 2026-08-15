const studioV2Styles=document.createElement('link');
studioV2Styles.rel='stylesheet';
studioV2Styles.href='./studio-v2.css?v=260815-1';
document.head.appendChild(studioV2Styles);

const pathButton=document.getElementById('learningPathButton');
const pathDrawer=document.getElementById('pathDrawer');
const closePathButton=document.getElementById('closePathButton');
const backdrop=document.getElementById('drawerBackdrop');
const companionToggle=document.getElementById('companionToggle');
const companionPanel=document.getElementById('companionPanel');
const avatar=document.getElementById('socratesAvatar');
const voiceButton=document.getElementById('voiceButton');
const thoughtInput=document.getElementById('thoughtInput');
const pastePreview=document.getElementById('pastePreview');
const sendButton=document.getElementById('sendButton');
const dialogueScroll=document.getElementById('dialogueScroll');
const historyRail=document.querySelector('.history-rail');
let pastedImages=[];

function setDrawer(open){pathDrawer.hidden=!open;backdrop.hidden=!open;pathButton.setAttribute('aria-expanded',String(open));}
pathButton.addEventListener('click',()=>setDrawer(pathDrawer.hidden));
closePathButton.addEventListener('click',()=>setDrawer(false));
backdrop.addEventListener('click',()=>setDrawer(false));
companionToggle.addEventListener('click',()=>{const next=companionToggle.getAttribute('aria-pressed')!=='true';companionToggle.setAttribute('aria-pressed',String(next));companionPanel.hidden=!next;avatar?.classList.toggle('state-listen',next);});
voiceButton.addEventListener('click',()=>{const active=voiceButton.dataset.active==='1';voiceButton.dataset.active=active?'0':'1';voiceButton.textContent=active?'🎤 말하기':'■ 듣고 있어요';avatar?.classList.toggle('state-listen',!active);});

function renderPastePreview(){
  pastePreview.innerHTML='';
  pastePreview.hidden=pastedImages.length===0;
  pastedImages.forEach((item,index)=>{
    const card=document.createElement('div');card.className='pasted-image-card';
    const img=document.createElement('img');img.src=item.url;img.alt='붙여넣은 캡처 이미지';
    const meta=document.createElement('div');meta.className='paste-meta';meta.innerHTML=`<strong>붙여넣은 이미지</strong><span>${Math.round(item.file.size/1024)} KB</span>`;
    const remove=document.createElement('button');remove.type='button';remove.className='paste-remove';remove.setAttribute('aria-label','붙여넣은 이미지 삭제');remove.textContent='×';
    remove.addEventListener('click',()=>{URL.revokeObjectURL(item.url);pastedImages.splice(index,1);renderPastePreview();thoughtInput.focus();});
    card.append(img,meta,remove);pastePreview.appendChild(card);
  });
}

thoughtInput.addEventListener('paste',event=>{
  const items=[...(event.clipboardData?.items||[])];
  const images=items.filter(item=>item.type.startsWith('image/'));
  if(!images.length)return;
  event.preventDefault();
  images.forEach(item=>{const file=item.getAsFile();if(file)pastedImages.push({file,url:URL.createObjectURL(file)});});
  const text=event.clipboardData.getData('text/plain');
  if(text){const start=thoughtInput.selectionStart,end=thoughtInput.selectionEnd;thoughtInput.value=thoughtInput.value.slice(0,start)+text+thoughtInput.value.slice(end);}
  renderPastePreview();
});

function makeHistoryChip(label,summary,index){const chip=document.createElement('button');chip.type='button';chip.className='history-chip';chip.dataset.turn=String(index);chip.innerHTML=`<small>${label}</small><span>${summary}</span>`;historyRail.appendChild(chip);chip.addEventListener('click',()=>scrollToTurn(index));}
function bindHistoryChips(){document.querySelectorAll('.history-chip').forEach(chip=>chip.addEventListener('click',()=>scrollToTurn(Number(chip.dataset.turn))));}
function scrollToTurn(index){const turns=[...document.querySelectorAll('.turn')];turns[index]?.scrollIntoView({behavior:'smooth',block:'center'});document.querySelectorAll('.history-chip').forEach((chip,i)=>chip.classList.toggle('active',i===index));}
bindHistoryChips();

sendButton.addEventListener('click',()=>{
  const text=thoughtInput.value.trim();
  if(!text&&!pastedImages.length){thoughtInput.focus();return;}
  const turn=document.createElement('div');turn.className='turn student-turn new-turn';turn.dataset.summary=text||'이미지로 생각을 공유했어.';
  const label=document.createElement('p');label.className='turn-label';label.textContent='내 생각';turn.appendChild(label);
  if(pastedImages.length){const gallery=document.createElement('div');gallery.className='message-gallery';pastedImages.forEach(item=>{const img=document.createElement('img');img.src=item.url;img.alt='대화에 첨부한 캡처 이미지';gallery.appendChild(img);});turn.appendChild(gallery);}
  if(text){const answer=document.createElement('div');answer.className='student-answer';answer.textContent=text;turn.appendChild(answer);}
  dialogueScroll.appendChild(turn);
  const turns=[...document.querySelectorAll('.turn')];
  const summary=(text||'캡처 이미지를 보고 생각을 공유했어.').slice(0,44)+(text.length>44?'…':'');
  makeHistoryChip('내 생각',summary,turns.length-1);
  thoughtInput.value='';pastedImages=[];renderPastePreview();
  requestAnimationFrame(()=>dialogueScroll.scrollTo({top:dialogueScroll.scrollHeight,behavior:'smooth'}));
});
thoughtInput.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter')sendButton.click();});
