const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const frontend=path.resolve(__dirname,'../../frontend');
const sources=page=>[...fs.readFileSync(path.join(frontend,page),'utf8').matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(m=>m[1]);
function browser(admin=false){
 const elements=new Map(),events=[],calls=[],toasts=[],storage=new Map(),navigation=[];let ready=false;
 for(const page of ['index.html','admin-dashboard.html'])for(const [,id]of fs.readFileSync(path.join(frontend,page),'utf8').matchAll(/\bid="([^"]+)"/g))elements.set(id,{value:'',textContent:'',innerHTML:'',style:{},focus(){},scrollIntoView(){},classList:{toggle(){}}});
 const ctx=vm.createContext({document:{getElementById:id=>id==='adminUsers'&&!ready?null:elements.get(id)||null,querySelector:selector=>elements.get(selector.slice(1))||null,querySelectorAll:()=>[],addEventListener:(event,fn)=>events.push({event,fn}),createElement:()=>{let value='';return {set textContent(v){value=v;},get innerHTML(){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}};}},location:{origin:'https://app.example.test'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},console:{error(){}},setTimeout:fn=>fn(),fetch:async(...args)=>{calls.push(args);return {ok:true,status:200,json:async()=>({success:true})};},getToken:()=>storage.get('token'),logout:()=>storage.delete('token'),showToast:m=>toasts.push(m),showApp:()=>navigation.push('app'),showSection:s=>navigation.push(s),confirm:()=>false,alert:m=>toasts.push(m),allContacts:[],allProducts:[],allInvoices:[],allTasks:[],allOpportunities:[]});ctx.window=ctx;
 const page=admin?'admin-dashboard.html':'index.html';const modules=sources(page).filter(s=>/^\/js\/(app|admin)(\.js|\/)/.test(s));
 vm.runInContext(fs.readFileSync(path.join(frontend,'js/core/text.js'),'utf8'),ctx);
 for(const s of modules)vm.runInContext(fs.readFileSync(path.join(frontend,s),'utf8'),ctx,{filename:s});ready=true;
 return {ctx,elements,events,calls,toasts,storage,navigation,modules,node:id=>elements.get(id),read:s=>vm.runInContext(s,ctx),set:(name,value)=>{ctx.fixture=value;vm.runInContext(`${name}=fixture`,ctx);}};
}
test('app and admin modules load once on their respective pages with distinct API functions',()=>{
 const b=browser();assert.equal(new Set(b.modules).size,b.modules.length);assert.equal(b.events.length,1);assert.equal(b.calls.length,0);assert.equal(typeof b.ctx.apiFetch,'function');assert.equal(typeof b.ctx.adminApiFetch,'function');assert.notEqual(b.ctx.apiFetch,b.ctx.adminApiFetch);
 const a=browser(true);assert.equal(typeof a.ctx.apiFetch,'undefined');assert.equal(typeof a.ctx.adminApiFetch,'function');assert.equal(a.events.length,0);assert.equal(typeof a.ctx.renderSubscriptionBillingModal,'function');assert.equal(typeof a.ctx.renderSubscriptionInvoiceRows,'function');
 for(const domain of ['app','admin'])assert.deepEqual(b.modules.filter(s=>s.startsWith(`/js/${domain}/`)).map(s=>path.basename(s)).sort(),fs.readdirSync(path.join(frontend,`js/${domain}`)).filter(s=>s.endsWith('.js')).sort());
 assert.deepEqual(a.modules.filter(s=>s.startsWith('/js/admin/')).map(s=>path.basename(s)).sort(),fs.readdirSync(path.join(frontend,'js/admin')).filter(s=>s.endsWith('.js')).sort());
});
test('main API preserves bearer authorization, omits local options and logs out on expired sessions',async()=>{
 const b=browser();b.storage.set('token','fixture');await b.ctx.apiFetch('/api/tasks',{method:'GET',silent:true});assert.equal(b.calls[0][0],'https://app.example.test/api/tasks');assert.equal(b.calls[0][1].headers.Authorization,'Bearer fixture');assert.equal('silent' in b.calls[0][1],false);b.ctx.fetch=async()=>({status:401});await assert.rejects(b.ctx.apiFetch('/api/tasks'),/Session expirée/);assert.equal(b.storage.has('token'),false);
});
test('admin API refuses missing token and clears forbidden sessions',async()=>{
 const b=browser(true);await assert.rejects(b.ctx.adminApiFetch('/api/admin/users'),/Session expirée/);assert.equal(b.calls.length,0);assert.equal(b.ctx.location.href,'/admin-login');assert.equal(b.ctx.adminSessionError('fixture').sessionExpired,true);b.storage.set('token','fixture');b.ctx.fetch=async()=>({status:403});await assert.rejects(b.ctx.adminApiFetch('/api/admin/users'),/Accès administrateur requis/);assert.equal(b.storage.has('token'),false);
});
test('admin bootstrap starts the loader once and expired sessions redirect without an alert',async()=>{
 const users=fs.readFileSync(path.join(frontend,'js/admin/users.js'),'utf8'),bootstrap=fs.readFileSync(path.join(frontend,'js/admin/bootstrap.js'),'utf8');assert.doesNotMatch(users,/loadAdminUsers\(\);/);assert.match(bootstrap,/loadAdminUsers\(\);/);
 const b=browser(true);await b.ctx.loadAdminUsers();assert.equal(b.ctx.location.href,'/admin-login');assert.deepEqual(b.toasts,[]);
});
test('startup validates a session before restoring an existing saved section',async()=>{
 const b=browser();await b.ctx.onload();assert.equal(b.navigation.length,0);b.storage.set('token','fixture');b.storage.set('my-prospect-active-section','tasksSection');await b.ctx.onload();assert.deepEqual(b.navigation,['app','tasksSection']);b.ctx.apiFetch=async()=>{throw new Error('expired');};await b.ctx.onload();assert.deepEqual(b.navigation,['app','tasksSection']);b.ctx.apiFetch=async()=>({success:true});b.ctx.localStorage.getItem=()=>{throw new Error('blocked');};await b.ctx.onload();assert.equal(b.navigation.at(-1),'app');
});
test('confirmation requires a password before resolving and cancellation returns false',async()=>{
 const b=browser();const pending=b.ctx.confirmAppAction({passwordRequired:true});b.ctx.closeAppConfirmation(true);assert.equal(b.node('appConfirmModal').style.display,'flex');assert.equal(b.toasts.length,1);b.node('appConfirmPassword').value='fixture';b.ctx.closeAppConfirmation(true);assert.equal(await pending,'fixture');const cancel=b.ctx.confirmAppAction();b.ctx.closeAppConfirmation(false);assert.equal(await cancel,false);
});
test('global search includes domains, escapes text and opens the selected task',()=>{
 const b=browser();b.ctx.allContacts=[{_id:'c',companyName:'<Acme>'}];b.ctx.allTasks=[{_id:'t',title:'Acme relance',type:'task'}];b.node('globalSearchInput').value='acme';b.ctx.renderGlobalSearchResults();assert.equal(b.read('globalSearchResults.length'),2);assert.match(b.node('globalSearchResults').innerHTML,/&lt;Acme&gt;/);b.ctx.editTask=id=>b.navigation.push(id);b.ctx.openGlobalSearchResult(1);assert.deepEqual(b.navigation,['tasksSection','t']);b.node('globalSearchInput').value='a';b.ctx.renderGlobalSearchResults();assert.equal(b.read('globalSearchResults.length'),0);
});
test('keyboard shortcut opens search and Escape closes it',()=>{
 const b=browser();const key=b.events[0].fn;key({ctrlKey:true,key:'k',preventDefault(){}});assert.equal(b.node('globalSearchModal').style.display,'flex');key({key:'Escape'});assert.equal(b.node('globalSearchModal').style.display,'none');
});
test('admin user filters combine verification and subscription and escape email',()=>{
 const b=browser(true);b.set('adminUsers',[{_id:'a',email:'<acme>@example.test',role:'user',isVerified:true,subscriptionStatus:'active'},{_id:'b',email:'other@example.test',role:'user',isVerified:true,subscriptionStatus:'trial'}]);b.node('adminVerificationFilter').value='verified';b.node('adminSubscriptionFilter').value='active';b.ctx.filterAdminUsers();assert.match(b.node('adminUsers').innerHTML,/&lt;acme&gt;/);assert.match(b.node('adminUsers').innerHTML,/admin-user-status--verified/);assert.doesNotMatch(b.node('adminUsers').innerHTML,/other@example/);
});
test('admin statistics keep the total counter after rendering their cards',()=>{
 const b=browser(true);const markup=b.ctx.renderAdminStats({totalUsers:2,verifiedUsers:1,pendingVerification:1,trials:1,trialsEndingSoon:0,activeSubscriptions:0,revenue:0});assert.match(markup,/id="totalUsers"/);assert.match(markup,/admin-stat-live-value/);
});
test('admin modal templates use classes instead of embedded presentation',()=>{
 const b=browser(true);const summary=b.ctx.renderAdminUserSummary({user:{email:'admin@example.test',isVerified:true},documents:1,invoices:1},'Aujourd’hui','Demain');const billing=b.ctx.renderSubscriptionBillingModal('admin@example.test');const rows=b.ctx.renderSubscriptionInvoiceRows([{_id:'i',invoiceNumber:'F1',planName:'Pro',totalTTC:12,status:'draft'}]);for(const markup of [summary,billing,rows])assert.doesNotMatch(markup,/style=/);assert.match(summary,/admin-summary-card/);assert.match(billing,/admin-billing-card/);assert.match(rows,/admin-invoice-row/);
});
test('suspension confirmation describes the requested action and cancellation prevents writes',async()=>{
 const b=browser(true);const messages=[];b.ctx.confirm=m=>{messages.push(m);return false;};await b.ctx.toggleAdminSuspension('u',true);await b.ctx.toggleAdminSuspension('u',false);assert.deepEqual(messages,['Suspendre ce compte ?','Réactiver ce compte ?']);assert.equal(b.calls.length,0);
});
test('confirmed suspension sends the intended boolean through the isolated admin API',async()=>{
 const b=browser(true);b.ctx.confirm=()=>true;b.ctx.loadAdminUsers=async()=>{};b.ctx.adminApiFetch=async(...args)=>{b.calls.push(args);};await b.ctx.toggleAdminSuspension('u',true);assert.equal(b.calls[0][0],'/api/admin/users/u/suspension');assert.equal(b.calls[0][1].method,'PUT');assert.deepEqual(JSON.parse(b.calls[0][1].body),{suspended:true});
});
test('cancelled verification and subscription-invoice sends make no requests',async()=>{
 const b=browser(true);await b.ctx.resendAdminVerification('u');await b.ctx.sendSubscriptionInvoice('i','F1');assert.equal(b.calls.length,0);
});
