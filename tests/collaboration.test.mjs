import test from 'node:test';
import assert from 'node:assert/strict';
import {resourceDiff,applyResourcePatch,hydrateOwned,resourcePayload,canEditShare} from '../collaboration-model.js';
const place={id:'p',name:'Cafe',address:'Paris',lat:48,lng:2,status:'todo',notes:''};
const resource={id:'r',ownerId:'owner',sourceId:'collection:c',title:'Tables',collection:{icon:'🍕',color:'#ff5500'},places:[place],archived:false,revision:1};
const personal={categories:['Tables','Private'],categoryIds:{Tables:'c',Private:'secret'},categoryStyles:{Tables:{icon:'🍕',color:'#ff5500'},Private:{icon:'🔒',color:'#ffffff'}},places:[{...place,category:'Tables',categories:['Tables','Private']},{...place,id:'private',name:'Secret',categories:['Private'],category:'Private'}]};
test('concurrent field edits and new places merge without losing unrelated changes',()=>{
 const a=resourceDiff(resource,{...resource,places:[{...place,name:'New cafe'}]});
 const b=resourceDiff(resource,{...resource,places:[{...place,status:'done'},{...place,id:'new'}]});
 const merged=applyResourcePatch(applyResourcePatch(resource,b),a);assert.equal(merged.places.length,2);assert.equal(merged.places[0].name,'New cafe');assert.equal(merged.places[0].status,'done');
});
test('deletion is not undone by a stale field update',()=>{
 const edit=resourceDiff(resource,{...resource,places:[{...place,notes:'Changed'}]});
 const removed=applyResourcePatch(resource,resourceDiff(resource,{...resource,places:[]}));
 assert.equal(applyResourcePatch(removed,edit).places.length,0);
});
test('owner hydration preserves private places and memberships during collaborative edits',()=>{
 const hydrated=hydrateOwned(personal,[{...resource,title:'Week-ends',places:[{...place,status:'done'},{...place,id:'new'}]}]);assert(hydrated.categories.includes('Private'));assert(hydrated.categories.includes('Week-ends'));assert.equal(hydrated.categoryIds['Week-ends'],'c');assert.equal(hydrated.places.find(p=>p.id==='private').name,'Secret');assert.deepEqual(hydrated.places.find(p=>p.id==='p').categories,['Week-ends','Private']);assert.equal(hydrated.places.find(p=>p.id==='p').status,'done');assert.equal(hydrated.places.find(p=>p.id==='new').category,'Week-ends');assert.equal(personal.places[0].status,'todo');
});
test('shared payload contains only selected collection and omits private memberships',()=>{
 const payload=resourcePayload(personal,resource);assert.equal(payload.places.length,1);assert.equal(payload.places[0].categories,undefined);assert.equal(payload.places[0].category,undefined);assert.equal(payload.places[0].name,'Cafe');
});
test('removing a collaborative place keeps the owner private membership',()=>{
 const hydrated=hydrateOwned(personal,[{...resource,places:[]}]);assert.deepEqual(hydrated.places.find(p=>p.id==='p').categories,['Private']);
});
test('only active collaborative collection edit grants enable editing',()=>{
 assert.equal(canEditShare({...resource,resourceId:'r',role:'read'}),false);assert.equal(canEditShare({...resource,resourceId:'r',role:'edit'}),true);assert.equal(canEditShare({...resource,resourceId:'r',role:'edit',sourceId:'place:p'}),false);assert.equal(canEditShare({...resource,resourceId:'r',role:'edit',archived:true}),false);
});

test('concurrent collection color and name changes merge',()=>{
 const a=resourceDiff(resource,{...resource,collection:{...resource.collection,color:'#00ff00'}});
 const b=resourceDiff(resource,{...resource,title:'Trips',collection:{...resource.collection,icon:'🚲'}});
 const next=applyResourcePatch(applyResourcePatch(resource,b),a);assert.equal(next.title,'Trips');assert.equal(next.collection.color,'#00ff00');assert.equal(next.collection.icon,'🚲');
});

test('malformed collaborative records cannot break owner hydration',()=>{
 const invalid={...place,id:'invalid',name:{toString:'untrusted'}};const next=hydrateOwned(personal,[{...resource,places:[place,invalid]}]);assert.equal(next.places.some(p=>p.id==='invalid'),false);assert.equal(next.places.find(p=>p.id==='p').name,'Cafe');
});
