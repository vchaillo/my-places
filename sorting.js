// Use the same pointer and touch sorting behavior for both card grids.
export const dragIcon='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="8" cy="4" r="2.3"/><circle cx="16" cy="4" r="2.3"/><circle cx="8" cy="12" r="2.3"/><circle cx="16" cy="12" r="2.3"/><circle cx="8" cy="20" r="2.3"/><circle cx="16" cy="20" r="2.3"/></svg>';
export async function enableSorting(grid,onChange,notify){
 if(!grid||grid.sortableReady)return;grid.sortableReady=true;
 try{const {default:Sortable}=await import('https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/modular/sortable.complete.esm.js');if(!grid.isConnected)return;
 Sortable.create(grid,{draggable:'.panelcard:not(.create-card)',handle:'.collection-drag',animation:220,forceFallback:true,fallbackOnBody:true,fallbackTolerance:5,ghostClass:'collection-ghost',chosenClass:'collection-chosen',dragClass:'collection-floating',onEnd(event){if(event.oldDraggableIndex!==event.newDraggableIndex)onChange()}});
 }catch{grid.sortableReady=false;notify('Déplacement indisponible. Rechargez la page.')}
}
