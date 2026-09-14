import {solve,maximizeStats,solveConstrained} from './solver.js?v=search-20260914-2';
self.onmessage=({data})=>{try{(data.objective==='stats'?(data.minSlots||data.cardColor||data.minRange>1?solveConstrained:maximizeStats):solve)(data,m=>self.postMessage(m))}catch(e){self.postMessage({type:'error',message:e.message})}};
