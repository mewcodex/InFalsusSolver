import {solve,maximizeStats,solveConstrained} from './solver.js?v=conditions-20260914-1';
self.onmessage=({data})=>{try{(data.objective==='stats'?(data.minSlots||data.cardColor?solveConstrained:maximizeStats):solve)(data,m=>self.postMessage(m))}catch(e){self.postMessage({type:'error',message:e.message})}};
