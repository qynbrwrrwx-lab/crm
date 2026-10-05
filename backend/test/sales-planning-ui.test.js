const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const frontend=path.resolve(__dirname,'../../frontend'),html=fs.readFileSync(path.join(frontend,'index.html'),'utf8'),scripts=[...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(m=>m[1]);
const modules=scripts.filter(s=>/^\/js\/(tasks|opportunities)(\.js|\/)/.test(s));
function browser(){
 const elements=new Map(),calls=[],toasts=[],events=[],navigation=[],storage=new Map();let timers=0;
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).concat(['taskRecurrenceFrequency','taskRecurrenceCount','opportunitySource','opportunityLostReason','opportunityLostReasonField']);
 for(const id of ids)elements.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,style:{},reset(){},focus(){},scrollIntoView(){},closest:()=>null,addEventListener:(event,callback)=>events.push({id,event,callback}),classList:{add(){},remove(){}}});
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-10-03T12:00:00Z']));}static now(){return new Date('2026-10-03T12:00:00Z').getTime();}}
 const ctx=vm.createContext({Date:FixedDate,document:{getElementById:id=>elements.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[]},console:{error(){}},allContacts:[],apiFetch:async(...args)=>{calls.push(args);return {};},showToast:m=>toasts.push(m),confirmAppAction:async()=>true,showSection:s=>navigation.push(s),setInterval:()=>{timers++;return 1;},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});ctx.window=ctx;
 for(const s of ['/js/core/text.js','/js/core/formatters.js',...modules])vm.runInContext(fs.readFileSync(path.join(frontend,s),'utf8'),ctx,{filename:s});
 return {ctx,calls,toasts,events,navigation,node:id=>elements.get(id),timers:()=>timers,read:s=>vm.runInContext(s,ctx),set:(name,value)=>{ctx.fixture=value;vm.runInContext(`${name}=fixture`,ctx);}};
}
test('agenda and pipeline modules load once with one stage listener and no requests or timers',()=>{
 const b=browser();assert.equal(modules.length,23);assert.equal(new Set(modules).size,23);assert.equal(b.events.length,1);assert.equal(b.events[0].id,'opportunityStage');assert.equal(b.calls.length,0);assert.equal(b.timers(),0);
 for(const domain of ['tasks','opportunities']){const entries=modules.filter(s=>s.startsWith(`/js/${domain}/`));assert.deepEqual(entries.map(s=>path.basename(s)).sort(),fs.readdirSync(path.join(frontend,`js/${domain}`)).filter(s=>s.endsWith('.js')).sort());for(const s of entries)assert.ok(scripts.indexOf(s)>scripts.indexOf(`/js/${domain}.js`));}
});
test('agenda month week and year views retain their calendar dimensions',()=>{
 const b=browser();b.ctx.renderAgenda();assert.equal((b.node('agendaCalendar').innerHTML.match(/class="agenda-day /g)||[]).length,42);
 b.set('agendaView','week');b.ctx.renderAgenda();assert.equal((b.node('agendaCalendar').innerHTML.match(/class="agenda-week-day /g)||[]).length,7);
 b.set('agendaView','year');b.ctx.renderAgenda();assert.equal((b.node('agendaCalendar').innerHTML.match(/<button/g)||[]).length,12);
});
test('task list escapes text and distinguishes overdue tasks from appointments',()=>{
 const b=browser();b.set('allTasks',[{_id:'t',type:'task',title:'<Relance>',status:'open',priority:'high',dueDate:'2026-10-01'},{_id:'a',type:'appointment',title:'RDV',status:'open',priority:'normal',startDate:'2026-10-04T12:00:00Z'}]);b.ctx.renderTasks();assert.equal(b.node('tasksOverdueCount').textContent,1);assert.equal(b.node('appointmentsUpcomingCount').textContent,1);assert.match(b.node('tasksList').innerHTML,/&lt;Relance&gt;/);
 b.node('tasksFilter').value='rdv';b.ctx.renderTasks();assert.equal((b.node('tasksList').innerHTML.match(/<article/g)||[]).length,1);
});
test('appointment duplication prepares a week later without writing to the API',()=>{
 const b=browser();b.set('allTasks',[{_id:'a',type:'appointment',title:'RDV',startDate:'2026-10-03T12:00:00Z',endDate:'2026-10-03T13:00:00Z',contactId:{_id:'c'}}]);b.ctx.duplicateAppointment('a');assert.equal(b.node('taskEditId').value,'');assert.equal(b.node('taskContact').value,'c');assert.equal(b.node('taskStartDate').value,b.read('localDateTime("2026-10-10T12:00:00Z")'));assert.equal(b.calls.length,0);
});
test('task edit preserves recurrence and contact fields through PUT',async()=>{
 const b=browser();b.ctx.loadTasks=async()=>{};b.node('taskEditId').value='t';b.node('taskTitle').value=' RDV ';b.node('taskType').value='appointment';b.node('taskRecurrenceFrequency').value='weekly';b.node('taskRecurrenceCount').value='3';b.node('taskReminderMinutes').value='15';b.node('taskFreeContactEmail').value=' client@example.test ';await b.ctx.saveTask({preventDefault(){}});
 assert.equal(b.calls[0][0],'/api/tasks/t');assert.equal(b.calls[0][1].method,'PUT');const payload=JSON.parse(b.calls[0][1].body);assert.equal(payload.title,'RDV');assert.equal(payload.recurrenceFrequency,'weekly');assert.equal(payload.recurrenceCount,3);assert.equal(payload.reminderMinutes,15);assert.equal(payload.freeContactEmail,'client@example.test');
});
test('reminders emit only once per appointment trigger',()=>{
 const b=browser();b.set('allTasks',[{_id:'a',title:'RDV',type:'appointment',status:'open',startDate:'2026-10-03T12:10:00Z',reminderMinutes:15}]);b.ctx.checkAgendaReminders();b.ctx.checkAgendaReminders();assert.equal(b.toasts.filter(m=>m.startsWith('Rappel')).length,1);
});
test('cancelled task, recurring series and opportunity deletions make no request',async()=>{
 const b=browser();b.ctx.confirmAppAction=async()=>false;await b.ctx.deleteTask('t');await b.ctx.deleteFutureRecurringAppointments({_id:'a'});await b.ctx.deleteOpportunity('o');assert.equal(b.calls.length,0);
});
test('pipeline totals exclude closed opportunities from weighted forecasts and escape names',()=>{
 const b=browser();b.set('allOpportunities',[{_id:'a',title:'<Projet>',stage:'lead',amount:100,probability:20,contactId:{companyName:'<Client>'}},{_id:'b',title:'Proposition',stage:'proposal',amount:200,probability:70},{_id:'c',stage:'won',amount:500,probability:100}]);b.ctx.renderOpportunities();assert.equal(b.node('opportunitiesPipelineTotal').textContent,b.read('opportunityCurrency(300)'));assert.equal(b.node('opportunitiesForecastTotal').textContent,b.read('opportunityCurrency(160)'));assert.equal(b.node('opportunitiesWonTotal').textContent,b.read('opportunityCurrency(500)'));assert.match(b.node('opportunityBoard').innerHTML,/&lt;Projet&gt;/);assert.match(b.node('opportunityBoard').innerHTML,/&lt;Client&gt;/);
});
test('stage changes propose probability and reveal loss reason without network writes',()=>{
 const b=browser();b.node('opportunityStage').value='lost';b.events[0].callback();assert.equal(b.node('opportunityProbability').value,0);assert.equal(b.node('opportunityLostReasonField').hidden,false);b.node('opportunityStage').value='proposal';b.events[0].callback();assert.equal(b.node('opportunityProbability').value,70);assert.equal(b.node('opportunityLostReasonField').hidden,true);assert.equal(b.calls.length,0);
});
test('opportunity save retains zero probability and loss reason in the PUT payload',async()=>{
 const b=browser();b.ctx.loadOpportunities=async()=>{};b.node('opportunityEditId').value='o';b.node('opportunityTitle').value=' Projet ';b.node('opportunityProbability').value='0';b.node('opportunityStage').value='lost';b.node('opportunityLostReason').value='price';b.node('opportunitySource').value='website';await b.ctx.saveOpportunity({preventDefault(){}});assert.equal(b.calls[0][0],'/api/opportunities/o');assert.equal(b.calls[0][1].method,'PUT');const payload=JSON.parse(b.calls[0][1].body);assert.equal(payload.probability,'0');assert.equal(payload.lostReason,'price');assert.equal(payload.source,'website');assert.equal(payload.title,'Projet');
});
test('follow-up and quote actions carry the contact into the correct form',async()=>{
 const b=browser();b.ctx.createOpportunityFollowUp({title:'Projet',stage:'proposal',contactId:{_id:'c'}});assert.equal(b.node('taskContact').value,'c');assert.equal(b.node('taskPriority').value,'high');assert.equal(b.node('taskTitle').value,'Relancer : Projet');b.ctx.createOpportunityFollowUp({title:'Projet B',stage:'lead',contactId:'c-string'});assert.equal(b.node('taskContact').value,'c-string');assert.equal(b.node('taskPriority').value,'normal');b.set('allOpportunities',[{_id:'o',contactId:{_id:'c'}}]);await b.ctx.createQuoteFromOpportunity('o');assert.equal(b.node('quoteContact').value,'c');assert.deepEqual(b.navigation,['tasksSection','tasksSection','quotesSection']);assert.equal(b.calls.length,0);
});
test('moving an opportunity preserves the stage endpoint and failure message',async()=>{
 const b=browser();b.ctx.loadOpportunities=async()=>{};await b.ctx.moveOpportunity('o','qualified');assert.equal(b.calls[0][0],'/api/opportunities/o/stage');assert.deepEqual(JSON.parse(b.calls[0][1].body),{stage:'qualified'});b.ctx.apiFetch=async()=>{throw new Error('offline');};await b.ctx.moveOpportunity('o','won');assert.equal(b.toasts.at(-1),'offline');
});



test('calendar export preserves ICS content and download lifecycle', () => {
 const b = browser();
 const item = {_id:'a',title:'RDV, test; client',startDate:'2026-10-04T12:00:00Z',notes:'Ligne 1\nLigne 2\\fin',location:'Paris; bureau',freeContactEmail:'client@example.test'};
 const data = b.ctx.getAppointmentCalendarData(item, new Date('2026-10-01T08:00:00Z'));
 assert.equal(data.filename, 'rendez-vous-RDV-test-client.ics');
 assert.ok(data.content.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'));
 assert.ok(data.content.endsWith('\r\nEND:VEVENT\r\nEND:VCALENDAR'));
 assert.ok(data.content.includes('DTSTAMP:20261001T080000Z\r\n'));
 assert.ok(data.content.includes('DTSTART:20261004T120000Z\r\nDTEND:20261004T130000Z\r\n'));
 assert.ok(data.content.includes('SUMMARY:RDV\\, test\\; client\r\n'));
 assert.ok(data.content.includes('Ligne 1\\nLigne 2\\\\fin'));
 assert.ok(data.content.includes('LOCATION:Paris\\; bureau\r\n'));
 assert.ok(data.content.includes('E-mail : client@example.test'));
 const explicit = b.ctx.getAppointmentCalendarData({...item,title:'!!!',endDate:'2026-10-04T14:30:00Z',location:''});
 assert.equal(explicit.filename,'rendez-vous-my-prospect.ics');
 assert.ok(explicit.content.includes('DTEND:20261004T143000Z'));
 assert.ok(!explicit.content.includes('LOCATION:'));
 assert.equal(b.ctx.getAppointmentCalendarData({}),null);
 const actions = [];
 let blob;
 const link = {click(){actions.push('click');},remove(){actions.push('remove');}};
 b.ctx.document.createElement = tag => {assert.equal(tag,'a');return link;};
 b.ctx.document.body = {appendChild(node){assert.equal(node,link);actions.push('append');}};
 b.ctx.Blob = class {constructor(parts,options){blob={parts,options};}};
 b.ctx.URL = {createObjectURL(){actions.push('create');return 'blob:test';},revokeObjectURL(url){assert.equal(url,'blob:test');actions.push('revoke');}};
 b.ctx.exportAppointmentToCalendar({});
 assert.deepEqual(actions,[]);
 b.ctx.exportAppointmentToCalendar(item);
 assert.deepEqual(actions,['create','append','click','remove','revoke']);
 assert.equal(link.download,data.filename);
 assert.equal(blob.options.type,'text/calendar;charset=utf-8');
 assert.ok(blob.parts[0].includes('UID:a@my-prospect'));
 assert.equal(b.toasts.at(-1),'Rendez-vous exporté vers votre calendrier.');
 assert.equal(b.calls.length,0);
});
