import {memberships} from './data.js?v=20261030-organize';
import {categorySVG} from './customize.js?v=20261030-organize';
export function directionsLinks(place){
 const lat=Number(place.lat),lng=Number(place.lng);
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return [];
 const destination=lat+','+lng;
 return [
  {name:'Google Maps',url:'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(destination)},
  {name:'Plans Apple',url:'https://maps.apple.com/?daddr='+encodeURIComponent(destination)+'&dirflg=d'},
  {name:'Waze',url:'https://www.waze.com/ul?ll='+encodeURIComponent(destination)+'&navigate=yes'}
 ];
}
export function collectionIcons(place,state){
 const group=document.createElement('span');group.className='place-collections';
 const names=place._shareId?(place._collectionShare?[place._shareTitle]:(place._sharedCollections||[])):memberships(place);
 for(const name of names){const meta=place._shareId?(place._collectionShare?place._style:place._collectionStyles?.[name]):state.categoryStyles?.[name];const icon=document.createElement('span');icon.className='place-collection-icon';icon.title=name;icon.setAttribute('aria-label',name);icon.setAttribute('role','img');if(meta?.svg)icon.innerHTML=categorySVG(meta.svg,meta.color);else icon.textContent=meta?.icon||'📍';group.append(icon)}
 if(place._shareId){const label=document.createElement('small');label.textContent='Partagé';group.append(label)}
 return group;
}
export function directionsControl(place){
 const menu=document.createElement('details');menu.className='directions-menu';const summary=document.createElement('summary');summary.setAttribute('aria-label','Itinéraire');summary.title='Itinéraire';summary.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 3-7 18-3-8-8-3L21 3Z"/><path d="m11 13 5-5"/></svg>' ;menu.append(summary);const options=document.createElement('div');options.className='directions-options';for(const item of directionsLinks(place)){const link=document.createElement('a');link.textContent=item.name;link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.onclick=()=>{menu.open=false};options.append(link)}menu.append(options);return menu;
}
export function profilePhotoURL(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:''}catch{return ''}}
export function userAvatar(email,photoURL){const avatar=document.createElement('span');avatar.className='user-avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=String(email||'?').slice(0,1).toUpperCase();const url=profilePhotoURL(photoURL);if(url){const img=document.createElement('img');img.src=url;img.alt='';img.referrerPolicy='no-referrer';img.loading='lazy';img.onerror=()=>img.remove();avatar.append(img)}return avatar}
