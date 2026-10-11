const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const frontend=path.resolve(__dirname,'../../frontend'),html=fs.readFileSync(path.join(frontend,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(m=>m[1]);
const modules=scripts.filter(s=>s==='/js/company.js'||s.startsWith('/js/company/'));
function browser(){
 const elements=new Map(),listeners=[],calls=[],toasts=[];
 for(const [,id] of html.matchAll(/\bid="([^"]+)"/g)) {
  const classes=new Set(),attrs=new Map();
  elements.set(id,{value:'',textContent:'',style:{},disabled:false,hidden:false,tagName:'INPUT',
   setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),hasAttribute:k=>attrs.has(k),
   classList:{toggle:(c,on)=>on?classes.add(c):classes.delete(c),contains:c=>classes.has(c)},
   addEventListener:(event,callback)=>listeners.push({id,event,callback})});
 }
 const fields=['companyName','companyAddress','quantityUnit'].map(id=>elements.get(id)); fields[2].tagName='SELECT';
 const controls=[elements.get('eInvoiceEnabled')];
 const context=vm.createContext({document:{getElementById:id=>elements.get(id)||null,querySelectorAll:s=>s==='.company-field'?fields:controls},
  console:{warn(){},error(){}},apiFetch:async(...args)=>{calls.push(args);throw new Error('offline');},
  showToast:m=>toasts.push(m),loadOnboardingChecklist:async()=>{},
  FileReader:function(){this.readAsDataURL=file=>this.onload({target:{result:file.data}});}});
 for(const s of modules) vm.runInContext(fs.readFileSync(path.join(frontend,s),'utf8'),context,{filename:s});
 return {context,elements,listeners,calls,toasts,fields,controls,node:id=>elements.get(id),read:s=>vm.runInContext(s,context)};
}
const company={companyName:'Entreprise',siret:'123',email:'contact@example.test',address:'Rue',postalCode:'75000',city:'Paris',paymentDueDays:0,electronicInvoicing:{enabled:true,providerName:'Plateforme'}};
test('company modules load once with one listener per element and event and no requests',()=>{
 const b=browser();assert.equal(modules.length,8);assert.equal(new Set(modules).size,8);assert.equal(modules[0],'/js/company.js');
 assert.deepEqual(modules.slice(1).map(s=>path.basename(s)).sort(),fs.readdirSync(path.join(frontend,'js/company')).filter(s=>s.endsWith('.js')).sort());
 assert.equal(b.listeners.length,18);assert.equal(new Set(b.listeners.map(l=>l.id+':'+l.event)).size,18);assert.equal(b.calls.length,0);
});
test('email preview uses reply address, company email and default in that order as text',()=>{
 const b=browser();b.node('companyName').value='<Entreprise>';b.node('companyEmail').value=' main@example.test ';b.node('companyReplyToEmail').value=' reply@example.test ';
 b.context.updateEmailSendingPreview();assert.equal(b.node('emailSenderPreview').textContent,'My Prospect — <Entreprise>');assert.equal(b.node('emailReplyPreview').textContent,'reply@example.test');
 b.node('companyReplyToEmail').value='';b.context.updateEmailSendingPreview();assert.equal(b.node('emailReplyPreview').textContent,'main@example.test');
 b.node('companyEmail').value='';b.context.updateEmailSendingPreview();assert.equal(b.node('emailReplyPreview').textContent,'adresse de votre compte');
});
test('email preview presentation centralizes sender and reply address fallbacks',()=>{
 const b=browser();const presentation=b.context.getEmailSendingPresentation({companyName:' Entreprise ',replyToEmail:'',companyEmail:' contact@example.test '});
 assert.deepEqual(JSON.parse(JSON.stringify(presentation)),{senderLabel:'My Prospect — Entreprise',replyTo:'contact@example.test'});
 assert.equal(b.context.getEmailSendingPresentation({companyName:'',replyToEmail:'',companyEmail:''}).senderLabel,'My Prospect — votre entreprise');
});
test('profile load computes electronic readiness after filling all identity fields',async()=>{
 const b=browser();b.context.apiFetch=async url=>url==='/api/company'?company:{preparedDocuments:2};
 await b.context.loadCompany();assert.equal(b.node('companyAddress').value,'Rue');assert.equal(b.node('companyPaymentDueDays').value,0);
 assert.equal(b.node('eInvoiceReadiness').textContent,'Préparation en cours');assert.equal(b.node('eInvoiceIdentityStatus').textContent,'Identité entreprise prête');
 await b.context.loadElectronicInvoicingStatus();
 assert.equal(b.node('eInvoiceDocumentsStatus').textContent,'2 documents prêts à transmettre');
});
test('company setup notice detects missing data and API failure',async()=>{
 const b=browser();b.context.apiFetch=async()=>company;await b.context.loadCompanySetupStatus();assert.equal(b.node('companySetupNotice').hidden,true);
 b.context.apiFetch=async()=>({...company,city:' '});await b.context.loadCompanySetupStatus();assert.equal(b.node('companySetupNotice').hidden,false);
 b.context.apiFetch=async()=>{throw new Error('offline');};await b.context.loadCompanySetupStatus();assert.equal(b.node('companySetupNotice').hidden,false);
});
test('saving preserves mail settings, numeric terms, electronic settings and logo in PUT payload',async()=>{
 const b=browser();b.node('companyName').value='A';b.node('companyReplyToEmail').value='reply@example.test';b.node('documentEmailIntro').value='Bonjour';b.node('documentEmailClosing').value='Merci';
 b.node('companyPaymentDueDays').value='0';b.node('quoteValidity').value='15';b.node('eInvoiceEnabled').value='true';b.node('eInvoiceProviderName').value=' Provider ';b.node('eInvoiceFormat').value='factur-x';b.read('companyLogoBase64="data:image/png;base64,AA"');
 b.context.loadElectronicInvoicingStatus=async()=>{};b.context.loadCompanySetupStatus=async()=>{};
 b.context.apiFetch=async(...args)=>{b.calls.push(args);return {};};b.context.enableCompanyEdit();await b.context.saveCompany();
 assert.equal(b.calls.length,1);assert.equal(b.calls[0][0],'/api/company');assert.equal(b.calls[0][1].method,'PUT');
 const payload=JSON.parse(b.calls[0][1].body);assert.equal(payload.replyToEmail,'reply@example.test');assert.equal(payload.documentEmailIntro,'Bonjour');assert.equal(payload.documentEmailClosing,'Merci');assert.equal(payload.paymentDueDays,0);assert.equal(payload.quoteValidity,15);assert.equal(payload.logo,'data:image/png;base64,AA');
 assert.deepEqual(payload.electronicInvoicing,{enabled:true,providerName:'Provider',preferredFormat:'factur-x'});
 assert.equal(b.fields[2].disabled,true);assert.equal(b.controls[0].disabled,true);assert.equal(b.node('saveCompanyBtn').style.display,'none');
});
test('failed save keeps edited values and controls open',async()=>{
 const b=browser();b.context.enableCompanyEdit();b.node('companyName').value='Conserver';await b.context.saveCompany();
 assert.equal(b.node('companyName').value,'Conserver');assert.equal(b.node('saveCompanyBtn').style.display,'inline-flex');assert.equal(b.controls[0].disabled,false);assert.equal(b.toasts[0],'offline');
});
test('logo change retains state for saving and refreshes header; empty selection is ignored',()=>{
 const b=browser(),change=b.listeners.find(l=>l.id==='companyLogo').callback;change({target:{files:[]}});assert.equal(b.read('companyLogoBase64'),'');
 change({target:{files:[{data:'data:image/png;base64,AA'}]}});assert.equal(b.read('companyLogoBase64'),'data:image/png;base64,AA');assert.equal(b.node('headerLogo').src,'data:image/png;base64,AA');
});
test('electronic preview clears ready state when identity becomes incomplete',()=>{
 const b=browser();for(const id of ['companyName','companySiret','companyAddress','companyPostalCode','companyCity'])b.node(id).value='x';b.node('eInvoiceEnabled').value='true';
 b.context.updateElectronicInvoicingPreview();assert.equal(b.node('eInvoiceReadiness').classList.contains('is-ready'),true);
 b.node('companyCity').value='';b.context.updateElectronicInvoicingPreview();assert.equal(b.node('eInvoiceReadiness').classList.contains('is-ready'),false);
});
test('electronic preview presentation centralizes identity, provider and readiness states',()=>{
 const b=browser();const ready=b.context.getElectronicInvoicingPreviewPresentation({enabled:true,providerName:'Plateforme',identityFields:['A','B','C','D','E']});
 assert.deepEqual(JSON.parse(JSON.stringify(ready)),{identityLabel:'Identité entreprise prête',providerLabel:'Plateforme envisagée : Plateforme',readinessLabel:'Préparation en cours',isReady:true});
 assert.equal(b.context.getElectronicInvoicingPreviewPresentation({enabled:true,providerName:'',identityFields:['A','','C','D','E']}).readinessLabel,'À configurer');
});
