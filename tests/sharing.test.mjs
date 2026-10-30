import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// In-memory SDK test double exercises the real adapter, including snapshot delivery.
// Authorization is defined separately by firestore.rules and must also be emulator-tested.
function database(){
 const records=new Map(),listeners=new Set();let time=0;
 const snapshot=(path)=>({exists:()=>records.has(path),data:()=>structuredClone(records.get(path))});
 const matches=(query,path,data)=>path.startsWith(query.path+'/')&&path.split('/').length===query.path.split('/').length+1&&query.filters.every(filter=>filter.kind!=='where'||data[filter.key]===filter.value)&&query.filters.every(filter=>filter.kind!=='start'||data.email>=filter.value)&&query.filters.every(filter=>filter.kind!=='end'||data.email<=filter.value);
 const result=query=>({docs:[...records].filter(([path,data])=>matches(query,path,data)).slice(0,query.filters.find(f=>f.kind==='limit')?.value||1000).map(([path])=>({id:path.split('/').at(-1),...snapshot(path)}))});
 const notify=()=>{for(const item of listeners)queueMicrotask(()=>{if(listeners.has(item))item.callback(typeof item.ref==='string'?snapshot(item.ref):result(item.ref))})};
 const db={records,getFirestore:()=>({}),collection:(base,...parts)=>[...(typeof base==='string'?[base]:[]),...parts].join('/'),doc:(base,...parts)=>[...(typeof base==='string'?[base]:[]),...parts].join('/'),where:(key,op,value)=>({kind:'where',key,value}),orderBy:key=>({kind:'order',key}),startAt:value=>({kind:'start',value}),endAt:value=>({kind:'end',value}),limit:value=>({kind:'limit',value}),query:(path,...filters)=>({path,filters}),serverTimestamp:()=>++time,
  getDoc:async path=>snapshot(path),getDocs:async query=>result(query),setDoc:async(path,data)=>{records.set(path,structuredClone(data));notify()},
  onSnapshot(ref,callback){const item={ref,callback};listeners.add(item);queueMicrotask(()=>{if(listeners.has(item))callback(typeof ref==='string'?snapshot(ref):result(ref))});return ()=>listeners.delete(item)},
  async runTransaction(_,callback){const writes=[];await callback({get:async path=>snapshot(path),set:(path,data)=>writes.push([path,data])});for(const [path,data]of writes)records.set(path,structuredClone(data));notify()},
  writeBatch(){const actions=[];return {set:(path,data)=>actions.push(()=>records.set(path,structuredClone(data))),delete:path=>actions.push(()=>records.delete(path)),async commit(){actions.forEach(action=>action());notify()}}}
 };return db;
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function client(db,uid,email){
 const key=uid+Math.random();globalThis.__firebaseTests??={};let signOut;
 globalThis.__firebaseTests[key]={app:{initializeApp:()=>({})},auth:{getAuth:()=>({}),GoogleAuthProvider:class{},onAuthStateChanged(_,callback){signOut=()=>callback(null);callback({uid,email,emailVerified:true})}},db};
 globalThis.window={firebaseConfig:{apiKey:'test'}};globalThis.document={getElementById:()=>({textContent:''})};
 let source=await readFile(new URL('../firebase.js',import.meta.url),'utf8');source=source.replace("'./collaboration-model.js?v=20261030-live'",JSON.stringify(new URL('../collaboration-model.js',import.meta.url).href));
 for(const [file,name]of [['app','app'],['auth','auth'],['firestore','db']])source=source.replace(new RegExp("import\\('https://www.gstatic.com/firebasejs/[^']+firebase-"+file+".js'\\)"),`Promise.resolve(globalThis.__firebaseTests[${JSON.stringify(key)}].${name})`);
 const {cloud}=await import('data:text/javascript;base64,'+Buffer.from(source+'\n//'+key).toString('base64'));let state,inbox=[];
 await cloud.start((user,data)=>{state=data},items=>{inbox=items});await settle();return {cloud,get state(){return state},get inbox(){return inbox},signOut:()=>signOut()};
}
const place={id:'p',name:'Cafe',address:'Paris',lat:48,lng:2,status:'todo',notes:''};
const payload={sourceId:'collection:c',title:'Tables',collection:{color:'#ff5500',icon:'🍕'},places:[place]};
test('live grants synchronize across clients, change roles, revoke, and preserve owner privacy',async()=>{
 const db=database();db.records.set('apps/my-places/users/owner',{categories:['Tables','Private'],categoryIds:{Tables:'c'},categoryStyles:{Tables:payload.collection},places:[{...place,category:'Tables'},{...place,id:'secret',name:'Private cafe',category:'Private'}]});
 const owner=await client(db,'owner','owner@example.com'),friend=await client(db,'friend','friend@example.com');
 assert.equal(await owner.cloud.share('friend@example.com',payload,'edit'),true);await settle();assert.equal(friend.inbox.length,1);assert.equal(friend.inbox[0].role,'edit');assert.equal(friend.inbox[0].places.length,1);
 assert.equal(await owner.cloud.share('friend@example.com',payload,'edit'),false);
 await friend.cloud.updateShared(friend.inbox[0],{place:{...place,status:'done'},basePlace:place});await settle();assert.equal(friend.inbox[0].places[0].status,'done');assert.equal(owner.state.places.find(p=>p.id==='p').status,'done');assert.equal(owner.state.places.find(p=>p.id==='secret').name,'Private cafe');
 const updated=structuredClone(owner.state);updated.places.find(p=>p.id==='p').name='Renamed';await owner.cloud.save(updated);await settle();assert.equal(friend.inbox[0].places[0].name,'Renamed');assert.equal(friend.inbox[0].places[0].status,'done');
 const grants=await owner.cloud.listShares(payload);await owner.cloud.changeRole(grants,'read',payload);await settle();assert.equal(friend.inbox[0].role,'read');await assert.rejects(()=>friend.cloud.updateShared(friend.inbox[0],{title:'Denied'}),/read-only/);
 await owner.cloud.revokeShares(await owner.cloud.listShares(payload));await settle();assert.equal(friend.inbox.length,0);assert.equal([...db.records.keys()].filter(path=>path.includes('/members/')).length,0);
 owner.signOut();friend.signOut();await settle();
});
test('simultaneous repeat sharing has one deterministic grant and migration removes snapshots',async()=>{
 const db=database();db.records.set('apps/my-places/users/owner',{categories:['Tables'],categoryIds:{Tables:'c'},categoryStyles:{Tables:payload.collection},places:[{...place,category:'Tables'}]});
 const owner=await client(db,'owner','owner@example.com'),friend=await client(db,'friend','friend@example.com');
 for(const id of ['old-a','old-b'])db.records.set('apps/my-places/shares/'+id,{ownerId:'owner',recipientEmail:'friend@example.com',sourceId:'collection:c',title:'Tables',places:[place]});
 await owner.cloud.upgradeShares(payload);await settle();assert.equal((await owner.cloud.listShares(payload)).length,1);assert.equal(friend.inbox.length,1);assert(friend.inbox[0].resourceId);
 await Promise.all([owner.cloud.share('friend@example.com',payload),owner.cloud.share('friend@example.com',payload)]);assert.equal((await owner.cloud.listShares(payload)).length,1);owner.signOut();friend.signOut();await settle();
});
