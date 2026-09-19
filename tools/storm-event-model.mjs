// Native _wmA queues card transitions, then persistent-effect changes.
// _xMA executes transitions by appending _WmA/_xmA instant effects and
// re-sorting the unconsumed suffix. They are NOT first-pass trait events.
// End-of-phase events run after incrementing the judgement counter. Color
// checks see the next card (clamped to card 5 at the end of the chart).
import {V,T,input,prepare as basePrepare,stateFromCards,vec} from './storm-data-model.mjs';
export {V,T,stateFromCards,vec};
// Current DLL: _Ph.Compare (0x496AF0) compares the int at offset 0.
// Producers leave that zero-initialized field untouched. ArraySortHelper
// (0xAD5830) uses insertion sort through 16 elements; larger equal-key
// partitions are unstable. Array.sort() would incorrectly preserve order.
export function sortEqualEvents(a,start=0){
 const swap=(i,j)=>{[a[i],a[j]]=[a[j],a[i]];};
 function sort(lo,hi){while(hi-lo+1>16){const mid=lo+((hi-lo)>>1);swap(mid,hi-1);let l=lo,r=hi-1;for(;;){++l;--r;if(l>=r)break;swap(l,r);}swap(l,hi-1);sort(l+1,hi);hi=l-1;}}
 sort(start,a.length-1);return a;
}

const effects=t=>Array.from({length:t.EffectCount},(_,i)=>t['Effect'+i]);
const enemyCards=Array.from({length:5},(_,p)=>{const c=input.enemy['Card'+p];return {pos:p,lo:Math.max(0,p+c.BaseRangeOffsetStart),hi:Math.min(4,p+c.BaseRangeOffsetEnd),effects:c.TraitIds.filter(id=>id>=0).flatMap(id=>effects(input.enemyTraits[id]))};});
export function prepare(s,level=15,potency=999){return basePrepare(s,level,potency);}
export function simulate(pre,accuracy=1,options={}){
  const {s,power,fort,enemyPower,enemyFort}=pre;
  const cards=[];
  for(let p=0;p<5;p++){
    const v=V[s.cards[p]];
    cards.push({side:0,pos:p,lo:Math.max(0,p-v.left),hi:Math.min(4,p+v.right),effects:s.skills.slice(p*3,p*3+v.slots).flatMap(t=>T[t].effects)});
    cards.push({side:1,...enemyCards[p]});
  }
  const buffs=[new Float64Array(6),new Float64Array(6)],active=cards.map(c=>c.effects.map(()=>false));
  let dp=0,de=0,hp=0,he=0,ph=100,eh=100,pdead=false,edead=false,minHp=100,playerTrait=0,enemyTrait=0,playerNormal=0,enemyNormal=0;
  const phases=[],events=[],eventQueue=[];
  function ratio(side,current){
    const a=buffs[side],b=buffs[1-side];
    const color=side===0?V[s.cards[current]].color:input.enemy['Card'+current].CardColorType;
    const blocked=b[4]!==0&&color!==b[4];
    const attack=(side===0?power:enemyPower)*(1+a[0])/(1+b[2]);
    const defense=(side===0?enemyFort:fort)*(1+b[1])/(1+a[3]+b[5]);
    return blocked?0:attack/defense;
  }
  const hit=(side,amount,kind)=>{if(side===0){dp+=amount;eh-=amount;if(eh<=0)edead=true;if(kind==='trait')playerTrait+=amount;else playerNormal+=amount;}else{de+=amount;ph-=amount;minHp=Math.min(minHp,ph);if(ph<=0)pdead=true;if(kind==='trait')enemyTrait+=amount;else enemyNormal+=amount;}};
  const heal=(side,k)=>{if(side===0&&!pdead){const h=Math.max(0,Math.min(k,100-ph));hp+=h;ph+=h;}else if(side===1&&!edead){const h=Math.max(0,Math.min(k,100-eh));he+=h;eh+=h;}};
  const crit=[0,0];
  function tick(phase,end){
    const current=end?Math.min(4,phase+1):phase;
    // _WMA: before judgement enable+disable; after judgement disable only.
    // At each boundary both sides transition; the preceding end tick has
    // already deactivated the old card, so no extra exits at the next start.
    const pending=[{transition:true,side:0,end},{transition:true,side:1,end}];
    for(let ci=0;ci<cards.length;ci++){
      const card=cards[ci],own=phase===card.pos&&!(end&&phase===4),inside=phase>=card.lo&&phase<=card.hi&&!(end&&phase===4);
      for(let j=0;j<card.effects.length;j++){
        const e=card.effects[j],c=e.TraitActivationCondition,type=e.TraitEffect,k=e.Parameter0/100;
        if([4,5,6,7].includes(c)){
          const on=c===4?!own:c===5?!inside:c===6?own:inside;
          if(on===active[ci][j])continue;
          active[ci][j]=on;const sign=on?1:-1,col=({1:0,2:1,128:2,129:3,3:5,4:4})[type];
          pending.push({buff:true,type,col,side:card.side,delta:sign*(type===4?e.Parameter0:k)});
          continue;
        }
      }
    }
    sortEqualEvents(pending);
    for(let qi=0;qi<pending.length;qi++){
      const e=pending[qi];
      if(options.trace)eventQueue.push({phase:phase+1,end,index:qi,...e});
      if(e.transition){
        const before=pending.length;
        for(const card of cards){
          if(card.side!==e.side)continue;
          for(let j=0;j<card.effects.length;j++){
            const effect=card.effects[j],c=effect.TraitActivationCondition;
            const trigger=end?(c===1&&phase===card.pos||c===2&&phase>=card.lo&&phase<=card.hi||c===3&&phase===card.hi):(c===10&&phase===card.pos||c===9&&phase>=card.lo&&phase<=card.hi||c===8&&phase===card.lo);
            if(trigger)pending.push({type:effect.TraitEffect,side:card.side,k:effect.Parameter0/100,card:card.pos+1,j});
          }
        }
        if(pending.length>before)sortEqualEvents(pending,qi+1);
        continue;
      }
      if(e.buff){if(e.type===5)crit[e.side]+=e.delta;else if(e.col!==undefined)buffs[e.side][e.col]+=e.delta;}
      else if(e.type===8096){const amount=ratio(e.side,current)*e.k;hit(e.side,amount,'trait');if(options.trace)events.push({phase:phase+1,end,current:current+1,side:e.side,card:e.card,slotEffect:e.j,damage:amount});}
      else if(e.type===8097)heal(e.side,e.k);
    }
  }

  const total=options.phaseCounts?.reduce((a,b)=>a+b,0);
  for(let p=0;p<5;p++){
    tick(p,false);const pr=ratio(0,p),er=ratio(1,p),pc=crit[0]>0?crit[0]:5,ec=crit[1]>0?crit[1]:5;
    let playerDamage,enemyDamage;
    if(total){const n=options.phaseCounts[p],near=options.nears?.[p]||0,threshold=Math.max(1,Math.floor(4*n/5));playerDamage=100/total*pr*(Math.min(n-near,threshold)+pc*Math.max(0,n-near-threshold)+.5*near);enemyDamage=100/total*er*n;}
    else{playerDamage=20*pr*(Math.min(accuracy,.8)+pc*Math.max(0,accuracy-.8));enemyDamage=20*er*(accuracy+ec*(1-accuracy));}
    hit(0,playerDamage,'normal');hit(1,enemyDamage,'normal');tick(p,true);
    if(options.details!==false)phases.push({phase:p+1,dp,de,hp,he,playerHp:ph,enemyHp:eh,playerRatio:pr,enemyRatio:er});
  }
  const score=10000*dp/Math.max(de,1e-13)*(100+hp)/(100+he);
  return {score,success:!pdead&&edead,p:accuracy,dp,de,hp,he,minHp,phases,events,eventQueue,playerTrait,enemyTrait,playerNormal,enemyNormal,quality:Math.min(score/160000,Math.max(.001,(100+hp)/Math.max(de,1e-13)),Math.max(.001,dp/(100+he)))};
}
export function fastValue(pre,p=1){const r=simulate(pre,p,{details:false});return r.success?r.score:0;}
