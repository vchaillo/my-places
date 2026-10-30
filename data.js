export function isValidPlace(place){return !!place&&typeof place.id==='string'&&typeof place.name==='string'&&(place.address===undefined||typeof place.address==='string')&&(place.notes===undefined||typeof place.notes==='string')&&Number.isFinite(place.lat)&&Number.isFinite(place.lng)&&Math.abs(place.lat)<=90&&Math.abs(place.lng)<=180}
// Preserve legacy single-collection records while supporting multiple memberships.
export function memberships(place){return [...new Set((Array.isArray(place.categories)?place.categories:[place.category]).filter(name=>typeof name==='string'&&name))]}
export function setMemberships(place,names){place.categories=[...new Set(names.filter(Boolean))];place.category=place.categories[0]||'';return place}
export function renameMembership(place,previous,next){return setMemberships(place,memberships(place).map(name=>name===previous?next:name).filter(Boolean))}
export function isCollectionShare(share){return share.sourceId?share.sourceId.startsWith('collection:'):share.places?.length!==1||share.places?.[0]?.category===share.title}
export function receivedShares(state,inbox){return [...new Map(inbox.map(share=>[share.id,share])).values()].filter(share=>!state.dismissedShareIds?.includes(share.id))}
export function sharedPlaces(state,inbox){return receivedShares(state,inbox).flatMap(share=>(share.places||[]).filter(isValidPlace).map((place,index)=>({...place,id:'shared:'+share.id+':'+(place.id||index),_originalId:place.id,_shareId:share.id,_role:share.role||'read',_resourceId:share.resourceId||'',_shareTitle:share.title,_collectionShare:isCollectionShare(share),_style:share.collection||Object.values(place.collectionStyles||{})[0]||{},_sharedCollections:memberships(place),_collectionStyles:place.collectionStyles||{},categories:[],category:''}))).filter(place=>!state.dismissedSharedPlaces?.includes(place.id))}
export function copyReceived(state,share,onlyPlace=null){
 state.copiedShares??={};const key=share.id+(onlyPlace?':'+onlyPlace.id:'');if(state.copiedShares[key])return false;
 const collection=isCollectionShare(share)&&!onlyPlace;let name='';
 if(collection){const base=share.title||'Collection partagée';name=base;let suffix=1;while(state.categories.some(item=>item.toLowerCase()===name.toLowerCase()))name=base+' (copie'+(suffix++>1?' '+(suffix-1):'')+')';state.categories.push(name);state.categoryIds??={};state.categoryIds[name]=crypto.randomUUID();state.categoryStyles??={};state.categoryStyles[name]={icon:share.collection?.icon||'📍',color:share.collection?.color||'#b0ed80',svg:share.collection?.svg||null}}
 const places=(onlyPlace?[onlyPlace]:share.places||[]).filter(isValidPlace);for(const place of places){const {_shareId,_role,_resourceId,_originalId,_shareTitle,_collectionShare,_style,_sharedCollections,_collectionStyles,collectionStyles,...data}=place;state.places.push(setMemberships({...data,id:crypto.randomUUID()},name?[name]:[]))}
 state.copiedShares[key]=true;return true;
}
