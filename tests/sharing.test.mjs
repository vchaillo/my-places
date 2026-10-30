import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Exercise the Firebase adapter without sending requests to a real account.
test('sharing is idempotent and legacy duplicate grants can all be revoked',async()=>{
 const records=new Map();let activeUser;
 const database={getFirestore:()=>({}),collection:(_, ...path)=>path.join('/'),doc:(base, ...path)=>(typeof base==='string'?[base,...path]:path).join('/'),where:(...parts)=>parts,query:(collection,...filters)=>({collection,filters}),serverTimestamp:()=>123,
  async setDoc(path,data){records.set(path,data)},async deleteDoc(path){records.delete(path)},
  async getDocs(query){return {docs:[...records].filter(([path,data])=>path.startsWith(query.collection+'/')&&query.filters.every(([key,op,value])=>data[key]===value)).map(([path,data])=>({id:path.split('/').at(-1),data:()=>data}))}},onSnapshot:()=>()=>{}};
 const user={uid:'owner',email:'owner@example.com',emailVerified:true};
 globalThis.window={firebaseConfig:{apiKey:'test'},mockApp:{initializeApp:()=>({})},mockAuth:{getAuth:()=>({}),onAuthStateChanged:(_,callback)=>{activeUser=callback},GoogleAuthProvider:class{}},mockDb:database};
 const source=(await readFile(new URL('../firebase.js',import.meta.url),'utf8')).replace(/import\('https:\/\/www.gstatic.com\/firebasejs\/[^']+firebase-app.js'\)/,"Promise.resolve(window.mockApp)").replace(/import\('https:\/\/www.gstatic.com\/firebasejs\/[^']+firebase-auth.js'\)/,"Promise.resolve(window.mockAuth)").replace(/import\('https:\/\/www.gstatic.com\/firebasejs\/[^']+firebase-firestore.js'\)/,"Promise.resolve(window.mockDb)");
 const {cloud}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 await cloud.start(()=>{},()=>{});activeUser(user);
 const payload={sourceId:'place:one',title:'Place',places:[{id:'one'}]};
 assert.equal(await cloud.share('friend@example.com',payload),true);
 assert.equal(await cloud.share('friend@example.com',payload),false);
 assert.equal((await cloud.listShares(payload)).length,1);
 await cloud.revokeShares(await cloud.listShares(payload));assert.equal((await cloud.listShares(payload)).length,0);
 await Promise.all([cloud.share('friend@example.com',payload),cloud.share('friend@example.com',payload)]);
 assert.equal((await cloud.listShares(payload)).length,1);
 await cloud.revokeShares(await cloud.listShares(payload));
 for(const id of ['old-one','old-two'])records.set('apps/my-places/shares/'+id,{ownerId:'owner',recipientEmail:'friend@example.com',title:'Place',places:[{id:'one'}]});
 assert.equal((await cloud.listShares(payload)).length,2);
 await cloud.revokeShares(await cloud.listShares(payload));assert.equal((await cloud.listShares(payload)).length,0);
});
