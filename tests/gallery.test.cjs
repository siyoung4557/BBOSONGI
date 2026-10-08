const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup({failed=[],mobile=false,reduced=false}={}) {
  function element(extra={}) {return Object.assign({events:{},attrs:{},addEventListener(type,fn){(this.events[type]??=[]).push(fn)},emit(type,event={}){for(const fn of this.events[type]??[])fn(event)},setAttribute(k,v){this.attrs[k]=v},firstElementChild:{textContent:''}},extra)}
  const slide=i=>{const img={complete:true,naturalWidth:failed.includes(i)?0:941};const s=element({img,active:i===0});s.classList={toggle:(name,value)=>s.active=value};s.querySelector=()=>img;return s};
  const front=[0,1,2].map(slide),rear=[0,1,2].map(slide);
  const gallery=element({contains:()=>true});const toggle=element(),next=element(),controls={hidden:true},caption={};
  const purchase=element(),purchaseDialog=element({open:false});
  const desktop=element({matches:!mobile});const motion=element({matches:reduced});
  const document=element({hidden:false,activeElement:toggle,querySelector:s=>s==='.visual'?gallery:controls,querySelectorAll:s=>s.startsWith('.front')?front:rear,getElementById:id=>({'photo-toggle':toggle,'photo-next':next,'photo-caption':caption})[id]});
  const window=element();let id=0;const timers=new Map();
  const source=fs.readFileSync('app.js','utf8');
  vm.runInNewContext(source.slice(source.indexOf('const gallery =')), {document,window,purchase,purchaseDialog,matchMedia:q=>q.includes('reduced')?motion:desktop,setTimeout:(fn,ms)=>{assert.equal(ms,5000);timers.set(++id,fn);return id},clearTimeout:id=>timers.delete(id)});
  const tick=()=>{assert.equal(timers.size,1);const [id,fn]=timers.entries().next().value;timers.delete(id);fn()};
  return {front,rear,gallery,toggle,next,controls,document,window,purchase,purchaseDialog,desktop,timers,tick,index:()=>front.findIndex(s=>s.active)};
}
test('autoplay cycles suit, woman, fridge while pointer and focus stay in gallery',()=>{const g=setup();assert.equal(g.index(),0);g.gallery.emit('pointerenter',{pointerType:'mouse'});g.gallery.emit('focusin');g.tick();assert.equal(g.index(),1);g.tick();assert.equal(g.index(),2);g.tick();assert.equal(g.index(),0)});
test('explicit resume works without moving focus away from play button',()=>{const g=setup();g.toggle.emit('click');assert.equal(g.timers.size,0);assert.equal(g.toggle.attrs['aria-label'],'사진 자동 전환 시작');g.toggle.emit('click');g.tick();assert.equal(g.index(),1);g.next.emit('click');assert.equal(g.index(),2);g.tick();assert.equal(g.index(),0)});
test('mobile starts at suit and autoplays, including reduced-motion setting',()=>{const g=setup({mobile:true,reduced:true});assert.equal(g.index(),0);assert.equal(g.controls.hidden,false);g.tick();assert.equal(g.index(),1);g.desktop.emit('change');assert.equal(g.index(),0);g.tick();assert.equal(g.index(),1)});
test('a failed image is skipped and does not disable autoplay',()=>{const g=setup({failed:[1]});g.tick();assert.equal(g.index(),2);assert.notEqual(g.rear.findIndex(s=>s.active),1);g.tick();assert.equal(g.index(),0)});
test('background tabs and purchase dialog suspend and then resume autoplay',()=>{const g=setup();g.document.hidden=true;g.document.emit('visibilitychange');assert.equal(g.timers.size,0);g.document.hidden=false;g.document.emit('visibilitychange');g.tick();assert.equal(g.index(),1);g.purchaseDialog.open=true;g.purchase.emit('click');assert.equal(g.timers.size,0);g.purchaseDialog.open=false;g.purchaseDialog.emit('close');g.tick();assert.equal(g.index(),2);g.window.emit('pageshow');assert.equal(g.timers.size,1)});
