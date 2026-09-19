import fs from 'node:fs';
import {V,T,prepare,fastValue,simulate,stateFromCards} from './storm-event-model.mjs';
const [source,output,seconds='120']=process.argv.slice(2),start=Date.now(),deadline=start+Number(seconds)*1000;
let state=stateFromCards(JSON.parse(fs.readFileSync(source)).cards),best=fastValue(prepare(state)),evaluations=0;
const copy=s=>({cards:s.cards.slice(),skills:s.skills.slice()});
function value(s){evaluations++;return fastValue(prepare(s));}
function legal(s){for(let p=0;p<5;p++){const used=new Set();for(let j=0;j<3;j++){const k=3*p+j;if(j>=V[s.cards[p]].slots){s.skills[k]=-1;continue;}if(s.skills[k]<0||used.has(s.skills[k])){let t=0;while(used.has(t))t++;s.skills[k]=t;}used.add(s.skills[k]);}}return s;}
function improveTraits(s,positions=[0,1,2,3,4]){
  let v=value(s);
  for(let pass=0;pass<4&&Date.now()<deadline;pass++){
    let changed=false;
    for(const p of positions){
      for(let j=0;j<V[s.cards[p]].slots;j++)for(let t=0;t<T.length;t++){
        if(s.skills.slice(p*3,p*3+3).includes(t))continue;
        const old=s.skills[p*3+j];s.skills[p*3+j]=t;const n=value(s);
        if(n>v+1e-7){v=n;changed=true;}else s.skills[p*3+j]=old;
      }
      // Slot order is mechanically significant at stage boundaries.
      for(let j=0;j<V[s.cards[p]].slots;j++)for(let k=j+1;k<V[s.cards[p]].slots;k++){
        const a=p*3+j,b=p*3+k;[s.skills[a],s.skills[b]]=[s.skills[b],s.skills[a]];const n=value(s);
        if(n>v+1e-7){v=n;changed=true;}else [s.skills[a],s.skills[b]]=[s.skills[b],s.skills[a]];
      }
    }
    if(!changed)break;
  }
  return v;
}
const save=(completed=false)=>fs.writeFileSync(output,JSON.stringify({mode:'storm',state,value:best,result:simulate(prepare(state)),search:{method:'all card replacements with coordinate trait/order optimization; top-24 paired replacements; repeated until budget',completed,evaluations,seconds:(Date.now()-start)/1000,globalOptimalityProven:false},cards:state.cards.map((i,p)=>({...V[i],position:p+1,traits:state.skills.slice(p*3,p*3+V[i].slots).map(t=>T[t])}))}));
for(let pass=0;Date.now()<deadline;pass++){
  const prior=best,pools=[];
  best=improveTraits(state);
  for(let p=0;p<5&&Date.now()<deadline;p++){
    const rows=[];let winner=null;
    for(let i=0;i<V.length&&Date.now()<deadline;i++){
      if(state.cards.some((v,q)=>q!==p&&V[v].id===V[i].id))continue;
      const s=copy(state);s.cards[p]=i;legal(s);const v=improveTraits(s,[p]);
      rows.push({i,skills:s.skills.slice(p*3,p*3+3),value:v});
      if(v>best+1e-7){best=v;winner=s;}
    }
    if(winner)state=winner;
    pools[p]=rows.sort((a,b)=>b.value-a.value).slice(0,24);save();
    console.log(JSON.stringify({pass,pos:p+1,best,evaluations,seconds:(Date.now()-start)/1000}));
  }
  for(let p=0;p<5&&Date.now()<deadline;p++)for(let q=p+1;q<5&&Date.now()<deadline;q++)for(const a of pools[p]||[])for(const b of pools[q]||[]){
    if(Date.now()>=deadline)break;
    const s=copy(state);s.cards[p]=a.i;s.cards[q]=b.i;if(new Set(s.cards.map(i=>V[i].id)).size!==5)continue;
    s.skills.splice(p*3,3,...a.skills);s.skills.splice(q*3,3,...b.skills);
    let v=value(s);if(v>best*.99)v=improveTraits(s);
    if(v>best+1e-7){best=v;state=s;save();}
  }
  if(best<=prior+1e-7){save(true);break;}
}
save();console.log(JSON.stringify({best,evaluations,seconds:(Date.now()-start)/1000}));
