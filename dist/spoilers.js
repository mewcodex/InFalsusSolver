const storageKey='infalsus-hide-card-names';
let hidden=true;
try{hidden=localStorage.getItem(storageKey)!=='0'}catch{}
export function cardName(recipe){
 if(!hidden)return recipe.name;
 return new TextDecoder('gbk').decode(new TextEncoder().encode(recipe.name));
}
const control=document.getElementById('hide-card-names');control.checked=hidden;
function sync(){control.checked=hidden;window.dispatchEvent(new Event('card-name-visibility'))}
control.addEventListener('change',()=>{hidden=control.checked;try{localStorage.setItem(storageKey,hidden?'1':'0')}catch{}sync()});
window.addEventListener('storage',e=>{if(e.key===storageKey||e.key===null){hidden=e.newValue!=='0';sync()}});
