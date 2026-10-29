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
 const emoji=form.elements.emoji,svg=form.elements.svg;const host=document.createElement('details');host.className='emoji-picker';host.innerHTML='<summary>Choisir un emoji ou une icône</summary><input type="search" placeholder="Rechercher : café, nature, culture…" aria-label="Rechercher un emoji"><div class="emoji-grid"></div>';const grid=host.querySelector('div');
 const groups=[['Manger et boire','🍽️ 🍕 🍣 🍔 🥐 🍦 ☕ 🍷 🍺 🍸 🥗 🧁','café restaurant nourriture bar'],['Nature et voyages','🌳 🌿 🌸 🏖️ ⛰️ 🌊 ☀️ 🌍 ✈️ 🚆 🚲 🏕️','nature voyage plage'],['Culture et loisirs','🏛️ 🎨 🎭 🎵 🎬 📚 📷 🎮 ⚽ 🏃 🛍️','culture musée sport'],['Repères','📍 ⭐ ❤️ 💎 🏠 🏨 🐾 🔥 ✅ 🎯','lieu maison favori']];
 function draw(q=''){grid.replaceChildren();groups.filter(([title,items,tags])=>(title+tags+items).toLowerCase().includes(q.toLowerCase())).forEach(([title,items])=>{const label=document.createElement('small');label.textContent=title;grid.append(label);items.split(' ').forEach(value=>{const b=document.createElement('button');b.type='button';b.textContent=value;b.setAttribute('aria-label','Choisir '+value);b.onclick=()=>{emoji.value=value;svg.value='';host.open=false;emoji.dispatchEvent(new Event('input',{bubbles:true}))};grid.append(b)})})}draw();host.querySelector('input').oninput=e=>draw(e.target.value);emoji.parentElement.after(host);
 const preview=document.createElement('div');preview.className='symbol-preview';const paint=()=>{preview.textContent=svg.value?'◇':emoji.value;preview.style.color=form.elements.color.value};form.prepend(preview);form.addEventListener('input',paint);paint();
}
