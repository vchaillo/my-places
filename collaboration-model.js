import {memberships,setMemberships,isValidPlace} from './data.js?v=20261030-live';
const validPlace=isValidPlace;
const clone=value=>JSON.parse(JSON.stringify(value));
export function cleanPlace(place){const result={id:String(place.id),name:String(place.name||''),address:String(place.address||''),lat:Number(place.lat),lng:Number(place.lng),status:place.status==='done'?'done':'todo',notes:String(place.notes||'')};if(!Number.isFinite(result.lat)||!Number.isFinite(result.lng)||Math.abs(result.lat)>90||Math.abs(result.lng)>180)throw Error('invalid-place');return result}
export function resourcePayload(data,resource){
 if(resource.sourceId.startsWith('collection:')){const id=resource.sourceId.slice(11);const name=Object.keys(data.categoryIds||{}).find(name=>data.categoryIds[name]===id);if(!name||!data.categories.includes(name))return {archived:true};return {archived:false,title:name,collection:data.categoryStyles?.[name]||{},places:data.places.filter(place=>memberships(place).includes(name)).map(cleanPlace)}}
 const place=data.places.find(place=>place.id===resource.sourceId.slice(6));return place?{archived:false,title:place.name,collection:resource.collection||{},places:[cleanPlace(place)]}:{archived:true};
}
export function hydrateOwned(data,resources){
 const result=clone(data);result.places??=[];result.categories??=[];result.categoryIds??={};result.categoryStyles??={};
 for(const resource of [...resources].sort((a,b)=>(a.updatedAt?.toMillis?.()||a.updatedAt||0)-(b.updatedAt?.toMillis?.()||b.updatedAt||0))){if(resource.archived)continue;
 if(resource.sourceId.startsWith('place:')){const remote=resource.places?.find(validPlace);const place=result.places.find(place=>place.id===resource.sourceId.slice(6));if(place&&remote)Object.assign(place,cleanPlace(remote));continue}
 const id=resource.sourceId.slice(11);let previous=Object.keys(result.categoryIds).find(name=>result.categoryIds[name]===id);if(!previous&&result.categories.includes(resource.title))previous=resource.title;if(!previous)continue;
 const name=resource.title;const collision=result.categories.some(category=>category!==previous&&category===name);const actual=collision?name+' (partagée)':name;
 result.categories=result.categories.map(category=>category===previous?actual:category);delete result.categoryIds[previous];result.categoryIds[actual]=id;delete result.categoryStyles[previous];result.categoryStyles[actual]=resource.collection||{};
 const remoteIds=new Set((resource.places||[]).filter(validPlace).map(place=>place.id));for(const place of result.places){const names=memberships(place).map(value=>value===previous?actual:value);setMemberships(place,remoteIds.has(place.id)?names:names.filter(value=>value!==actual))}
 for(const remote of (resource.places||[]).filter(validPlace)){const existing=result.places.find(place=>place.id===remote.id);if(existing){Object.assign(existing,cleanPlace(remote));setMemberships(existing,[...memberships(existing),actual])}else result.places.push(setMemberships(cleanPlace(remote),[actual]))}
 }
 return result;
}
function fieldChanges(before,after){return Object.fromEntries(Object.entries(after).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(before?.[key])))}
export function resourceDiff(before,after){const fields=fieldChanges(before,after);delete fields.places;if(fields.collection)fields.collection=fieldChanges(before.collection,after.collection);const old=new Map((before.places||[]).map(place=>[place.id,place])),next=new Map((after.places||[]).map(place=>[place.id,place]));return {fields,remove:[...old.keys()].filter(id=>!next.has(id)),upsert:[...next.values()].map(place=>({id:place.id,fields:fieldChanges(old.get(place.id),place)})).filter(change=>Object.keys(change.fields).length)}}
export function hasChanges(patch){return Object.keys(patch.fields).length>0||patch.remove.length>0||patch.upsert.length>0}
export function applyResourcePatch(current,patch){const next={...current,...patch.fields};if(patch.fields.collection)next.collection={...current.collection,...patch.fields.collection};const removed=new Set(patch.remove);next.places=(current.places||[]).filter(place=>!removed.has(place.id)).map(place=>({...place}));for(const change of patch.upsert){const place=next.places.find(place=>place.id===change.id);if(place)Object.assign(place,change.fields);else if(change.fields.name!==undefined&&change.fields.lat!==undefined)next.places.push({...change.fields,id:change.id})}if(next.places.length>200)throw Error('too-many-places');return next}
export function canEditShare(share){return !!share?.resourceId&&share.role==='edit'&&share.sourceId?.startsWith('collection:')&&!share.archived}
