import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(new URL('../staff-web/package.json',import.meta.url));
const ts=require('typescript');
const compiled=ts.transpileModule(readFileSync('staff-web/src/app/admin/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
function harness(){
 const slots=[],effects=[],requests=[];let index=0,pendingEffects=[];
 const react={useState(initial){const i=index++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(initial){const i=index++;return slots[i]??=( {current:initial});},useCallback(fn){index++;return fn;},useEffect(fn,deps){const i=index++;if(!effects[i]||deps.some((v,j)=>v!==effects[i].deps[j])){pendingEffects.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}}};
 // useCallback must preserve identity until its dependencies change.
 react.useCallback=(fn,deps)=>{const i=index++;if(!slots[i]||deps.some((v,j)=>v!==slots[i].deps[j]))slots[i]={fn,deps};return slots[i].fn;};
 const jsx=(type,props)=>({type,props:props||{}});
 const exports={};vm.runInNewContext(compiled,{exports,require:name=>name==='react'?react:{jsx,jsxs:jsx,Fragment:'fragment'},fetch:(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve:body=>resolve({ok:true,json:async()=>({data:body})}),reject})),console,Date,encodeURIComponent});
 return {requests,render(){index=0;const tree=exports.default();const pending=pendingEffects;pendingEffects=[];pending.forEach(fn=>fn());return tree;}};
}
function nodes(tree){if(!tree||typeof tree!=='object')return [];return [tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];}
function text(tree){if(tree==null||typeof tree==='boolean')return '';if(typeof tree!=='object')return String(tree);return [tree.props?.children].flat(Infinity).map(text).join(' ');}
function filter(tree){return nodes(tree).find(n=>n.type==='select'&&n.props.value==='all'||n.type==='select'&&['submitted','declined'].includes(n.props.value));}
const row=(id,status)=>({id,status,opportunity:{title:id},user:{firstName:id,lastName:'Synthetic'}});
const data=(status,id,cursor=null)=>({applicationPage:{status,nextCursor:cursor,limit:25},organization:{name:'Synthetic'},role:'admin',counts:{},construction:[],venues:[],prayers:[],announcements:[],events:[],applications:[row(id,status)]});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('older queue responses, errors and page completions cannot replace a new filter',async()=>{
 const h=harness();h.render();h.requests[0].resolve(data('all','Initial'));await tick();let tree=h.render();
 filter(tree).props.onChange({target:{value:'submitted'}});tree=h.render();
 assert.ok(!text(tree).includes('Initial'),'filter change clears prior applications immediately');
 filter(tree).props.onChange({target:{value:'declined'}});tree=h.render();
 h.requests[2].resolve(data('declined','Current','declined-page'));await tick();tree=h.render();
 h.requests[1].resolve(data('submitted','Stale'));await tick();tree=h.render();
 assert.ok(text(tree).includes('Current'));assert.ok(!text(tree).includes('Stale'));
 const more=nodes(tree).find(n=>n.type==='button'&&text(n).includes('Load more applications'));
 const loading=more.props.onClick();
 const refresh=nodes(h.render()).find(n=>n.type==='button'&&text(n)==='Refresh');refresh.props.onClick();h.render();
 h.requests[3].resolve(data('declined','StalePage'));await tick();tree=h.render();
 assert.ok(text(tree).includes('Loading applications'),'obsolete page finally cannot finish the newer refresh');
 assert.ok(!text(tree).includes('StalePage'),'refresh invalidates in-flight older pages');
 h.requests[4].resolve(data('declined','Fresh'));await tick();tree=h.render();
 assert.ok(text(tree).includes('Fresh'));
 filter(tree).props.onChange({target:{value:'submitted'}});h.render();
 filter(h.render()).props.onChange({target:{value:'declined'}});h.render();
 h.requests[6].resolve(data('declined','Latest'));await tick();h.render();
 h.requests[5].reject(new Error('Obsolete error'));await tick();tree=h.render();
 assert.ok(!text(tree).includes('Obsolete error'));assert.ok(text(tree).includes('Latest'));
 await loading;
});
test('a retained decision handler cannot act on an application from an older filter',async()=>{
 const h=harness();h.render();const initial=data('all','Pending');initial.applications[0].status='submitted';
 h.requests[0].resolve(initial);await tick();let tree=h.render();
 nodes(tree).find(n=>n.type==='textarea'&&n.props.minLength===5).props.onChange({target:{value:'Synthetic coordinator review'}});
 tree=h.render();const oldApprove=nodes(tree).find(n=>n.type==='button'&&text(n)==='Approve / قبول');
 filter(tree).props.onChange({target:{value:'declined'}});
 oldApprove.props.onClick();await tick();
 assert.equal(h.requests.length,2,'only initial list and new filtered list may be requested');
 assert.ok(h.requests.every(r=>!r.options?.method||r.options.method==='GET'),'stale handler never submits a decision');
});
