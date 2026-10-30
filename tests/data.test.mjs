import test from 'node:test';
import assert from 'node:assert/strict';
import {memberships,setMemberships,renameMembership,sharedPlaces,receivedShares,copyReceived} from '../data.js';

test('legacy memberships migrate without losing other collection links',()=>{
 const place={category:'Paris'};assert.deepEqual(memberships(place),['Paris']);
 setMemberships(place,['Paris','Restaurants','Paris']);assert.deepEqual(memberships(place),['Paris','Restaurants']);
 renameMembership(place,'Paris','Week-ends');assert.deepEqual(memberships(place),['Week-ends','Restaurants']);
 renameMembership(place,'Week-ends','');assert.deepEqual(memberships(place),['Restaurants']);
 setMemberships(place,[]);assert.deepEqual(memberships(place),[]);assert.equal(place.category,'');
});
const share={id:'grant',sourceId:'collection:source',title:'Paris',collection:{icon:'🍕',color:'#ff5500'},places:[{id:'one',name:'Cafe',category:'Paris',lat:48,lng:2},{id:'two',name:'Museum',category:'Paris',lat:49,lng:2}]};
test('received places appear without modifying personal data and disappear on dismissal',()=>{
 const state={places:[],categories:[]};const projected=sharedPlaces(state,[share,share]);assert.equal(projected.length,2);assert.equal(state.places.length,0);assert.equal(projected[0]._shareId,share.id);
 state.dismissedSharedPlaces=[projected[0].id];assert.equal(sharedPlaces(state,[share]).length,1);
 state.dismissedShareIds=[share.id];assert.equal(receivedShares(state,[share]).length,0);assert.equal(sharedPlaces(state,[share]).length,0);assert.equal(share.places.length,2);
});
test('copying a collection includes metadata and linked places, resolves collisions and prevents repeated copies',()=>{
 const state={places:[],categories:['Paris']};assert.equal(copyReceived(state,share),true);assert.deepEqual(state.categories,['Paris','Paris (copie)']);assert.equal(state.categoryStyles['Paris (copie)'].icon,'🍕');assert.equal(state.categoryStyles['Paris (copie)'].color,'#ff5500');assert.equal(state.places.length,2);assert.deepEqual(memberships(state.places[0]),['Paris (copie)']);assert.notEqual(state.places[0].id,'one');assert.equal(copyReceived(state,share),false);assert.equal(state.places.length,2);assert.equal(share.places[0].category,'Paris');
});
test('copying a shared place does not create a collection or leak received state',()=>{
 const state={places:[],categories:[]};const place=sharedPlaces(state,[share])[0];copyReceived(state,share,place);assert.equal(state.places.length,1);assert.equal(state.categories.length,0);assert.equal(state.places[0]._shareId,undefined);assert.deepEqual(memberships(state.places[0]),[]);
});

test('invalid shared coordinates cannot break map rendering',()=>{
 const invalid={...share,places:[{id:'broken',lat:null,lng:2},{id:'out',lat:95,lng:2},...share.places]};
 assert.equal(sharedPlaces({places:[],categories:[]},[invalid]).length,2);
});
