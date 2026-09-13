export function attachCamera(svg,onCell){
 let bounds=null,view=null,dirty=false,gesture=null;
 const pointers=new Map();
 const apply=()=>{if(view)svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`)};
 const at=(x,y)=>new DOMPoint(x,y).matrixTransform(svg.getScreenCTM().inverse());
 function zoom(factor,x,y){if(!view||!bounds)return;const anchor=at(x,y),w=Math.max(bounds.w/12,Math.min(bounds.w*3,view.w*factor)),f=w/view.w;view={x:anchor.x+(view.x-anchor.x)*f,y:anchor.y+(view.y-anchor.y)*f,w,h:view.h*f};dirty=true;apply()}
 function pan(dx,dy){const m=svg.getScreenCTM();view.x-=dx/m.a;view.y-=dy/m.d;dirty=true;apply()}
 svg.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(Math.max(-1,Math.min(1,e.deltaY*.0015))),e.clientX,e.clientY)},{passive:false});
 svg.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0&&e.button!==1)return;if(!view)return;e.preventDefault();svg.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,cell:e.target.closest('[data-cell]')?.dataset.cell,moved:false};else if(gesture)gesture.moved=true;svg.classList.add('dragging')});
 svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;const before=[...pointers.values()],old=pointers.get(e.pointerId),next={x:e.clientX,y:e.clientY};pointers.set(e.pointerId,next);
  if(pointers.size>=2){const after=[...pointers.values()],a=before.slice(0,2),b=after.slice(0,2),mid=p=>({x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2}),m=mid(a),n=mid(b),distance=p=>Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);if(distance(b)>2&&distance(a)>2)zoom(distance(a)/distance(b),m.x,m.y);pan(n.x-m.x,n.y-m.y);gesture.moved=true;
  }else if(gesture.moved||Math.hypot(next.x-gesture.x,next.y-gesture.y)>5){if(!gesture.moved)pan(next.x-gesture.x,next.y-gesture.y);else pan(next.x-old.x,next.y-old.y);gesture.moved=true}
 });
 const end=(e,cancel)=>{if(!pointers.has(e.pointerId))return;const click=!cancel&&pointers.size===1&&gesture&&!gesture.moved&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<=5,cell=gesture?.cell;pointers.delete(e.pointerId);if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(!pointers.size){gesture=null;svg.classList.remove('dragging')}else if(gesture)gesture.moved=true;if(click&&cell)onCell(cell)};
 svg.addEventListener('pointerup',e=>end(e,false));svg.addEventListener('pointercancel',e=>end(e,true));
 return {setBounds(b){bounds=b;if(!view||!dirty){view={...b};apply()}},reset(){dirty=false;if(bounds){view={...bounds};apply()}},newRecipe(){dirty=false;view=null},zoom(f){const r=svg.getBoundingClientRect();zoom(f,r.left+r.width/2,r.top+r.height/2)}};
}
