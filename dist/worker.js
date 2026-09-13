import {solve,maximizeStats} from './solver.js';
self.onmessage=({data})=>{try{(data.objective==='stats'?maximizeStats:solve)(data,m=>self.postMessage(m))}catch(e){self.postMessage({type:'error',message:e.message})}};
