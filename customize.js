export const iconPaths={pin:'M12 22s7-6 7-13a7 7 0 0 0-14 0c0 7 7 13 7 13Z M12 7v4m-2-2h4',food:'M5 3v7m3-7v7M3 3v5c0 3 7 3 7 0V3M6 11v10M17 3v18m0-18c5 3 5 9 0 9',coffee:'M4 5h12v10a5 5 0 0 1-10 0V5m10 2h2a3 3 0 0 1 0 6h-2M3 22h17',leaf:'M20 3C8 2 2 8 5 16c7 6 17-1 15-13ZM5 21l10-12',museum:'m3 8 9-5 9 5H3Zm2 3v7m7-7v7m7-7v7M3 21h18',glass:'M5 3h14l-2 9a5 5 0 0 1-10 0L5 3Zm7 14v5m-4 0h8',star:'m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1 3-6Z',bag:'M4 7h16v14H4V7Zm4 0V5a4 4 0 0 1 8 0v2',home:'m2 11 10-9 10 9M5 9v13h14V9m-10 13v-8h6v8',camera:'M3 7h5l2-4h4l2 4h5v14H3V7Zm13 6a4 4 0 1 0-8 0 4 4 0 0 0 8 0',heart:'M12 21S2 15 2 8c0-6 8-7 10-2 2-5 10-4 10 2 0 7-10 13-10 13Z',music:'M10 17V4l11-2v13M10 6l11-2M10 17a4 3 0 1 1-4-3 4 3 0 0 1 4 3Zm11-2a4 3 0 1 1-4-3 4 3 0 0 1 4 3Z'};
export function categorySVG(key,color='currentColor'){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${/^#[0-9a-f]{6}$/i.test(color)?color:'currentColor'}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPaths[key]||iconPaths.pin}"/></svg>`}
// Map appearance is device-local; category metadata follows account storage.
export function setupCustomization({map, getState, save, render, notify}) {
  const $ = id => document.getElementById(id);
  let preferences;
  try { preferences = JSON.parse(localStorage.getItem('my-places-map')) || {}; } catch { preferences = {}; }
  preferences = {mode:'dark',brightness:85,saturation:40,hue:180,contrast:100,...preferences};
  const settings = document.createElement('details'); settings.className='map-settings';
  settings.innerHTML='<summary>◐ Style de carte</summary><div class="map-settings-body"><label>Fond de carte<select id="mapMode"><option value="dark">Plan sombre</option><option value="light">Plan classique</option><option value="satellite">Satellite · Esri</option></select></label><label>Luminosité <output id="brightnessValue"></output><input id="brightness" type="range" min="40" max="150"></label><label>Saturation <output id="saturationValue"></output><input id="saturation" type="range" min="0" max="200"></label><label>Teinte <output id="hueValue"></output><input id="hue" type="range" min="0" max="360"></label><label>Contraste <output id="contrastValue"></output><input id="contrast" type="range" min="50" max="160"></label><button id="resetMap">Réinitialiser ce style</button><small>Réglages visuels du fond uniquement. Vos marqueurs restent inchangés.</small><p id="tileStatus" role="status"></p></div>';
  settings.hidden=true;document.querySelector('main').append(settings);
  L.DomEvent.disableClickPropagation(settings); L.DomEvent.disableScrollPropagation(settings);
  let layer;
  function apply(replace=false) {
    if(replace){if(layer)map.removeLayer(layer);map.eachLayer(item=>{if(item instanceof L.TileLayer)map.removeLayer(item)});
      const satellite=preferences.mode==='satellite';
      layer=L.tileLayer(satellite?'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}':'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:satellite?19:19,attribution:satellite?'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community':'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
      layer.on('tileerror',()=>{$('tileStatus').textContent='Fond indisponible à cet endroit. Essayez un autre style ou dézoomez.'});$('tileStatus').textContent='';
    }
    $('mapMode').value=preferences.mode;
    for(const key of ['brightness','saturation','hue','contrast']){$(key).value=preferences[key];$(key+'Value').textContent=preferences[key]+(key==='hue'?'°':'%')}
    map.getPane('tilePane').style.filter=`${preferences.mode==='dark'?'invert(1) ':''}hue-rotate(${preferences.hue}deg) brightness(${preferences.brightness/100}) saturate(${preferences.saturation/100}) contrast(${preferences.contrast/100})`;
    localStorage.setItem('my-places-map',JSON.stringify(preferences));
  }
  function defaults(){Object.assign(preferences,preferences.mode==='dark'?{brightness:85,saturation:40,hue:180,contrast:100}:{brightness:100,saturation:100,hue:0,contrast:100})}
  $('mapMode').onchange=event=>{preferences.mode=event.target.value;defaults();apply(true)};
  for(const key of ['brightness','saturation','hue','contrast'])$(key).oninput=event=>{preferences[key]=Number(event.target.value);apply()};
  $('resetMap').onclick=()=>{defaults();apply()};apply(true);

}
