import fs from 'node:fs';
import assert from 'node:assert/strict';
import {V,prepare,simulate,stateFromCards,fastValue,sortEqualEvents} from './storm-event-model.mjs';
function exactState(cards){const s=stateFromCards(cards);for(let p=0;p<5;p++)for(const k of ['id','power','fortitude','color','left','right','slots'])assert.equal(V[s.cards[p]][k],cards[p][k],`fixture must not be substituted: ${p}/${k}`);return s;}
// Freeze the real-world test loadout, independent of subsequent preset updates.
const old=JSON.parse(fs.readFileSync(new URL('../local-data/storm-before-boundary-fix.json',import.meta.url)));
const state=exactState(old.cards),pre=prepare(state,10),counts=[297,297,296,297,297];
const r=simulate(pre,1,{phaseCounts:counts,trace:true});
const scale=1312103/(r.playerNormal*3435);
assert.ok(Math.abs(r.playerTrait*3435*scale-1365171)<1);
assert.ok(Math.abs(r.enemyNormal*pre.fort/100-37098.98)<.01);
assert.ok(Math.abs(r.enemyTrait*pre.fort/100-54574.5)<.01);
assert.equal(r.hp,20);
assert.equal(r.events.filter(e=>e.side===0&&e.damage>0).length,9);
assert.equal(r.events.filter(e=>e.side===0&&e.phase>=4&&e.end&&e.damage===0).length,6);
assert.ok(Math.abs(78668.49/.2*2.08/2.27-360420)<1);
const measured={...pre,power:pre.power*scale,fort:78668.49/.2};
const m=simulate(measured,1,{phaseCounts:counts});
const actualAttack=10000*(m.playerTrait+1309273/3435)/100;
assert.equal(Math.round(actualAttack),77859);
assert.equal(Math.round(10000*(100+m.hp)/m.de),51488);
for(const p of [0,.5,.8,.9,1]){const r=simulate(pre,p);assert.equal(fastValue(pre,p),r.success?r.score:0);}
console.log('PASS: Ghost Ray attack 77859, defense 51488, all damage components, 6 blocked end events, final defense 360420');
// Independent Cryogenic fixture: attributes inferred from reported phase 2-4
// opening stats. NEAR allocation is the earlier reference assumption, not
// an observed per-phase log; do not describe it as measured event telemetry.
const cryoCards=JSON.parse(fs.readFileSync(new URL('./storm-regression-team.json',import.meta.url)));
const cryoPre={...prepare(exactState(cryoCards),9),power:588133*1.27/2.34,fort:439813*1.27/1.81};
const cryo=simulate(cryoPre,1,{phaseCounts:[196,196,196,196,196],nears:[1,1,3,0,0],trace:true});
assert.equal(Math.round(cryo.dp*100),84129);
assert.equal(Math.round(10000*(100+cryo.hp)/cryo.de),45133);
assert.equal(Math.round(cryo.score),379698);
// Native transition dispatch appends instant attacks after queued buffs.
const opening=cryo.eventQueue.filter(e=>e.phase===1&&!e.end);
assert.ok(opening.findIndex(e=>e.type===8096)>opening.findLastIndex(e=>e.buff));
// Above the insertion-sort threshold, equal-key ordering is observable.
const short=Array.from({length:16},(_,i)=>i),long=Array.from({length:17},(_,i)=>i);
assert.deepEqual(sortEqualEvents(short.slice()),short);
assert.notDeepEqual(sortEqualEvents(long.slice()),long);
const prefix=[99,...long];sortEqualEvents(prefix,1);assert.equal(prefix[0],99);
console.log('PASS: Cryogenic attack 84129, defense 45133, score 379698; delayed instant-event dispatch and suffix sort');
