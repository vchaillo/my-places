import test from 'node:test';
import assert from 'node:assert/strict';
import {directionsLinks,profilePhotoURL} from '../place-ui.js';

test('navigation links pass destination coordinates to all three providers',()=>{
 const links=directionsLinks({lat:48.8566,lng:2.3522});assert.equal(links.length,3);
 const google=new URL(links[0].url);assert.equal(google.protocol,'https:');assert.equal(google.searchParams.get('api'),'1');assert.equal(google.searchParams.get('destination'),'48.8566,2.3522');
 assert.equal(new URL(links[1].url).searchParams.get('daddr'),'48.8566,2.3522');assert.equal(new URL(links[2].url).searchParams.get('ll'),'48.8566,2.3522');assert.equal(new URL(links[2].url).searchParams.get('navigate'),'yes');
 assert.deepEqual(directionsLinks({lat:91,lng:2}),[]);assert.deepEqual(directionsLinks({lat:'bad',lng:2}),[]);
});
test('profile images only use HTTPS URLs',()=>{
 assert.equal(profilePhotoURL('https://lh3.googleusercontent.com/a/profile'),'https://lh3.googleusercontent.com/a/profile');assert.equal(profilePhotoURL('javascript:alert(1)'),'');assert.equal(profilePhotoURL('http://example.com/image.png'),'');assert.equal(profilePhotoURL(null),'');
});
