// Shared dialog guards compare actual form values rather than input events.
export function protectDialog(dialog){
 const snapshot=()=>JSON.stringify([...dialog.querySelectorAll('input,select,textarea')].map(el=>[el.name||el.id,el.type==='checkbox'?el.checked:el.value]));let baseline='';
 const observer=new MutationObserver(()=>{if(dialog.open)baseline=snapshot()});observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 dialog.requestCloseSafely=()=>{if(snapshot()!==baseline&&!confirm('Des modifications ne sont pas enregistrées. Quitter sans enregistrer ?'))return;dialog.close()};
 dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.requestCloseSafely()});
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.requestCloseSafely()});
 return dialog;
}
export function symbolPicker(form){
 const input=form.elements.emoji;const box=document.createElement('div');box.className='emoji-dropdown';box.hidden=true;input.parentElement.style.position='relative';input.parentElement.append(box);input.setAttribute('aria-expanded','false');let loaded=false;
 input.onclick=async()=>{box.hidden=!box.hidden;input.setAttribute('aria-expanded',String(!box.hidden));if(box.hidden||loaded)return;box.textContent='Chargement des emojis…';try{const [{Picker},{default:fr}]=await Promise.all([import('https://cdn.jsdelivr.net/npm/emoji-picker-element@1/index.js'),import('https://cdn.jsdelivr.net/npm/emoji-picker-element@1/i18n/fr.js')]);const picker=new Picker({locale:'fr',i18n:fr,dataSource:'https://cdn.jsdelivr.net/npm/emoji-picker-element-data@1/fr/emojibase/data.json'});box.replaceChildren(picker);picker.addEventListener('emoji-click',event=>{input.value=event.detail.unicode;input.dispatchEvent(new Event('input',{bubbles:true}));box.hidden=true;input.setAttribute('aria-expanded','false')});loaded=true}catch{box.textContent='Chargement impossible. Réessayez.'}};
 document.addEventListener('click',event=>{if(!input.parentElement.contains(event.target)){box.hidden=true;input.setAttribute('aria-expanded','false')}});form.closest('dialog').addEventListener('close',()=>{box.hidden=true;input.setAttribute('aria-expanded','false')});
}
