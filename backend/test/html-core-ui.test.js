const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const frontend=path.resolve(__dirname,'../../frontend');
function run(file,globals){const ctx=vm.createContext(globals);ctx.window=ctx;vm.runInContext(fs.readFileSync(path.join(frontend,'js',file),'utf8'),ctx);return ctx;}
test('HTML pages load existing external scripts and retain no inline script blocks',()=>{
 for(const page of fs.readdirSync(frontend).filter(p=>p.endsWith('.html'))){const html=fs.readFileSync(path.join(frontend,page),'utf8');assert.doesNotMatch(html,/<script>[\s\S]*?<\/script>/,page);for(const [,src]of html.matchAll(/<script src="(\/js\/[^"]+)"/g))assert.ok(fs.existsSync(path.join(frontend,src)),`${page}: ${src}`);for(const [,href]of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(\/[^"]+)"/g))assert.ok(fs.existsSync(path.join(frontend,href)),`${page}: ${href}`);}
});
test('shared stylesheet imports each visual module in cascade order',()=>{
 const expected=['base.css','orders.css','auth.css','business.css','commerce.css','app-shell.css'];
 const css=fs.readFileSync(path.join(frontend,'style.css'),'utf8');
 const imports=[...css.matchAll(/@import url\("\/styles\/([^"]+)"\);/g)].map(([,name])=>name);
 assert.deepEqual(imports,expected);
 for(const name of expected)assert.ok(fs.existsSync(path.join(frontend,'styles',name)),name);
});
test('main page loads every domain module once after its shared state',()=>{
 const html=fs.readFileSync(path.join(frontend,'index.html'),'utf8');
 const scripts=[...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(([,src])=>src);
 for(const domain of ['ui','admin','dashboard','contacts','opportunities','tasks','products','suppliers','expenses','treasury','invoices','company','app','auth']){
  const root=`/js/${domain}.js`,directory=path.join(frontend,'js',domain);
  assert.equal(scripts.filter(src=>src===root).length,1,root);
  for(const file of fs.readdirSync(directory).filter(file=>file.endsWith('.js'))){
   const module=`/js/${domain}/${file}`;
   assert.equal(scripts.filter(src=>src===module).length,1,module);
   assert.ok(scripts.indexOf(module)>scripts.indexOf(root),module);
  }
 }
});
test('early session preview tolerates blocked storage and adds restoring class only with a token',()=>{
 const classes=[];const globals={document:{documentElement:{classList:{add:c=>classes.push(c)}}},localStorage:{getItem:()=>null}};run('core/session-preview.js',globals);assert.equal(classes.length,0);globals.localStorage.getItem=()=> 'fixture';run('core/session-preview.js',globals);assert.deepEqual(classes,['session-restoring']);globals.localStorage.getItem=()=>{throw new Error('blocked');};assert.doesNotThrow(()=>run('core/session-preview.js',globals));
});
test('assistance validates missing email and retains both POST contracts',async()=>{
 const calls=[],messages=[],input={value:''};const ctx=run('auth/assistance.js',{document:{getElementById:()=>input},apiFetch:async(...args)=>calls.push(args),showToast:m=>messages.push(m)});await ctx.requestReset();await ctx.resendEmail();assert.equal(calls.length,0);input.value='client@example.test';await ctx.requestReset();await ctx.resendEmail();assert.deepEqual(calls.map(c=>c[0]),['/api/auth/request-reset','/api/auth/resend-verification']);for(const [,options]of calls){assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{email:'client@example.test'});}
});
test('standalone reset refuses mismatched passwords and sends matching password with encoded token',async()=>{
 const nodes=new Map(),calls=[],listeners={};for(const id of ['passwordForm','password','confirmation','matchStatus','status','submitButton'])nodes.set(id,{value:'',textContent:'',classList:{add(){}},checkValidity:()=>true,reportValidity(){},focus(){},querySelector:()=>({textContent:''}),addEventListener:(e,fn)=>{listeners[id+':'+e]=fn;}});
 nodes.get('password').value='a-strong-password';nodes.get('confirmation').value='different';run('pages/reset-password.js',{document:{getElementById:id=>nodes.get(id)},location:{pathname:'/reset-password/token+test',assign(){}},setTimeout(){},fetch:async(...args)=>{calls.push(args);return {ok:true,json:async()=>({})};}});
 await listeners['passwordForm:submit']({preventDefault(){}});assert.equal(calls.length,0);nodes.get('confirmation').value='a-strong-password';await listeners['passwordForm:submit']({preventDefault(){}});assert.equal(calls[0][0],'/api/auth/reset-password/token%2Btest');assert.deepEqual(JSON.parse(calls[0][1].body),{password:'a-strong-password'});assert.equal(nodes.get('submitButton').disabled,false);
});
test('admin login keeps the session contract on its standalone page',async()=>{
 const calls=[],messages=[],storage=new Map(),nodes=new Map([['adminEmail',{value:'admin@example.test'}],['adminPassword',{value:'secret'}]]);
 const context=run('pages/admin-login.js',{document:{getElementById:id=>nodes.get(id)},fetch:async(...args)=>{calls.push(args);return {ok:true,json:async()=>({token:'fixture'})};},localStorage:{setItem:(key,value)=>storage.set(key,value)},location:{},alert:message=>messages.push(message),console:{error(){}}});
 await context.adminLogin();assert.equal(calls[0][0],'/api/auth/login');assert.equal(calls[0][1].method,'POST');assert.deepEqual(JSON.parse(calls[0][1].body),{email:'admin@example.test',password:'secret'});assert.equal(storage.get('token'),'fixture');assert.equal(context.location.href,'/admin');assert.deepEqual(messages,[]);
});
test('success page keeps its delayed redirect',()=>{
 let callback,delay;const location={href:'/success'};run('pages/success.js',{location,setTimeout:(fn,ms)=>{callback=fn;delay=ms;}});assert.equal(delay,3500);assert.equal(location.href,'/success');callback();assert.equal(location.href,'/');
});
test('expense and treasury CSV exports share quoting while keeping amounts and signs',()=>{
 const blobs=[],ctx=vm.createContext({Blob:function(parts){blobs.push(parts.join(''));},URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},document:{createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}},showToast(){}});
 for(const file of ['core/csv.js','expenses.js','expenses/csv.js','treasury.js','treasury/csv.js'])vm.runInContext(fs.readFileSync(path.join(frontend,'js',file),'utf8'),ctx);
 ctx.fixture={supplier:'A;B',label:'Une "ligne"\nsuite',amountTTC:12.5,status:'paid'};vm.runInContext('allExpenses=[fixture]',ctx);ctx.exportExpensesCsv();assert.ok(blobs[0].startsWith('\uFEFF'));assert.ok(blobs[0].includes('"Une ""ligne""\nsuite"'));assert.ok(blobs[0].includes('"12,50"'));
 ctx.fixture={date:'2026-10-03',label:'Une "ligne"',type:'expense',amount:12.5};vm.runInContext('treasuryEntries=[fixture]',ctx);ctx.exportTreasuryCsv();assert.ok(blobs[1].includes('"Une ""ligne"""'));assert.ok(blobs[1].includes('"-12,50"'));
});
