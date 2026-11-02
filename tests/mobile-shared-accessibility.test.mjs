import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';

// Execute the actual component functions and inspect the props sent to native
// primitives. This covers component wiring, not VoiceOver/TalkBack rendering.
const require=createRequire(new URL('../masjid-mobile/package.json',import.meta.url));
const ts=require('typescript');
function components({platform='android',isRTL=false}={}){
 const jsx=(type,props)=>({type,props:props||{}});
 const native=Object.fromEntries(['ActivityIndicator','Pressable','ScrollView','Text','TextInput','View'].map(v=>[v,v]));
 native.Platform={OS:platform,select:values=>values[platform]??values.default};
 native.StyleSheet={create:value=>value};
 const mocks={react:{useId:()=>':field:',default:{useId:()=>':field:'}},'react/jsx-runtime':{jsx,jsxs:jsx},'react-native':native,
  'expo-linear-gradient':{LinearGradient:'LinearGradient'},'react-native-safe-area-context':{SafeAreaView:'SafeAreaView'},
  '@expo/vector-icons':{MaterialCommunityIcons:'Icon'},'./i18n':{useLanguage:()=>({isRTL,t:key=>key})}};
 function execute(path){
  const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module={exports:{}};
  vm.runInNewContext(code,{exports:module.exports,module,require:name=>{if(name in mocks)return mocks[name];throw Error(name);}});
  return module.exports;
 }
 mocks['./theme']=execute('masjid-mobile/src/theme.ts');
 return {...execute('masjid-mobile/src/ui.tsx'),styles:mocks['./theme'].S};
}
function nodes(node){return !node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
function find(node,type){return nodes(node).find(n=>n.type===type);}
function style(value){return Object.assign({},...[value].flat(Infinity).filter(Boolean));}

test('native shared press targets meet Android/iOS minimum height and width',()=>{
 for(const [platform,min] of [['android',48],['ios',44]]){
  const ui=components({platform});
  for(const node of [ui.Action({label:'Continue',onPress(){}}),ui.Action({label:'Back',onPress(){},secondary:true}),ui.PressRow({title:'Account',icon:'account',onPress(){}})]){
   const target=style(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style);
   assert.ok(target.minHeight>=min,`${platform}: height`);
   assert.ok(target.minWidth>=min,`${platform}: width`);
  }
 }
});

test('both action variants expose busy/disabled state and a nonspoken spinner',()=>{
 const ui=components();
 for(const secondary of [true,false]){
  const node=ui.Action({label:'Save',onPress(){},secondary,loading:true});
  assert.equal(node.props.disabled,true);
  assert.equal(node.props.accessibilityState.busy,true);
  assert.equal(node.props.accessibilityState.disabled,true);
  assert.equal(node.props.accessibilityLabel,'Save');
  assert.equal(find(node,'ActivityIndicator')?.props.accessible,false);
 }
});

test('rows include descriptive subtitles and disabled/busy state without truncating details',()=>{
 const node=components().PressRow({title:'Export',subtitle:'Limited account export',icon:'account',onPress(){},loading:true});
 assert.equal(node.props.accessibilityLabel,'Export. Limited account export');
 assert.equal(node.props.accessibilityRole,'button');
 assert.equal(node.props.disabled,true);
 assert.equal(node.props.accessibilityState.busy,true);
 assert.ok(nodes(node).filter(n=>n.type==='Text').every(n=>n.props.numberOfLines===undefined));
});

test('password fields prevent capitalization, correction and spelling suggestions',()=>{
 const ui=components();
 for(const keyboardType of [undefined,'default','email-address']){
  const input=find(ui.Field({label:'Password',value:'',onChange(){},secure:true,keyboardType}),'TextInput');
  assert.equal(input.props.secureTextEntry,true);
  assert.equal(input.props.keyboardType,'default');
  assert.equal(input.props.autoCapitalize,'none');
  assert.equal(input.props.multiline,false);
  assert.equal(input.props.autoCorrect,false);
  assert.equal(input.props.spellCheck,false);
 }
});

test('field errors remain visible, announced and included on refocus; disabled inputs are noneditable',()=>{
 const node=components().Field({label:'Email',value:'',onChange(){},error:'Enter an email',hint:'Use your account email',disabled:true});
 const input=find(node,'TextInput');
 assert.equal(input.props.accessibilityLabel,'Email');
 assert.equal(input.props.accessibilityHint,'Use your account email. Enter an email');
 assert.equal(input.props.accessibilityState.disabled,true);
 assert.equal(input.props.editable,false);
 assert.equal(input.props.accessibilityLabelledBy,nodes(node).find(n=>n.props.children==='Email').props.nativeID);
 const error=nodes(node).find(n=>n.type==='Text'&&n.props.children==='Enter an email');
 assert.equal(error?.props.accessibilityRole,'alert');
 assert.equal(error?.props.accessibilityLiveRegion,'polite');
});

test('RTL mirrors semantic navigation arrows while preserving compass and physical-direction icons',()=>{
 for(const isRTL of [false,true]){
  const ui=components({isRTL});
  const icon=name=>find(ui.Action({label:'Back',onPress(){},icon:name}),'Icon').props.name;
  assert.equal(icon('arrow-left'),isRTL?'arrow-right':'arrow-left');
  assert.equal(icon('compass-outline'),'compass-outline');
  assert.equal(icon('arrow-up'),'arrow-up');
  assert.equal(find(ui.Action({label:'West',onPress(){},icon:'arrow-left',iconDirection:'physical'}),'Icon').props.name,'arrow-left');
 }
});

test('screen shell avoids keyboard covered inputs and exposes a scalable heading',()=>{
 const ui=components();
 assert.equal(find(ui.Shell({children:'body'}),'ScrollView').props.automaticallyAdjustKeyboardInsets,true);
 assert.equal(nodes(ui.Head({eyebrow:'Account',title:'Settings'})).find(n=>n.props.children==='Settings').props.accessibilityRole,'header');
 assert.doesNotMatch(readFileSync('masjid-mobile/src/ui.tsx','utf8'),/allowFontScaling=\{false\}|maxFontSizeMultiplier=\{1\}/);
});
