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
test('agenda day view retains appointment actions and list view clears the day detail',()=>{
 const b=browser();b.set('allTasks',[{_id:'a',type:'appointment',title:'RDV',status:'open',startDate:'2026-10-03T12:30:00Z'},{_id:'t',type:'task',title:'Relance',status:'open',dueDate:'2026-10-03'}]);b.set('agendaView','day');b.ctx.renderAgenda();assert.match(b.node('agendaCalendar').innerHTML,/agenda-duplicate-btn/);assert.match(b.node('agendaCalendar').innerHTML,/Relance/);assert.match(b.node('agendaDayDetails').innerHTML,/2 actions planifiées/);
 b.set('agendaView','list');b.ctx.renderAgenda();assert.equal(b.node('agendaCalendar').innerHTML,'');assert.equal(b.node('agendaDayDetails').innerHTML,'');assert.equal(b.node('agendaPeriodLabel').textContent,'Toutes les actions');
});
test('agenda view presentation centralizes labels and content for each calendar mode',()=>{
 const b=browser(),day=new b.ctx.Date('2026-10-03T12:00:00Z');assert.equal(b.ctx.getAgendaViewPresentation('list',day,day).label,'Toutes les actions');assert.equal(b.ctx.getAgendaViewPresentation('list',day,day).content,'');assert.match(b.ctx.getAgendaViewPresentation('month',day,day).content,/agenda-month-grid/);assert.match(b.ctx.getAgendaViewPresentation('week',day,day).label,/Semaine du/);assert.match(b.ctx.getAgendaViewPresentation('year',day,day).content,/agenda-year-grid/);assert.match(b.ctx.getAgendaViewPresentation('day',day,day).content,/agenda-day-view/);
});
test('agenda event presentation centralizes labels and duplication availability',()=>{
 const b=browser(),appointment={_id:'a',type:'appointment',status:'open',title:'RDV',startDate:'2026-10-03T12:30:00Z',contactId:{companyName:'Client'}};assert.equal(JSON.stringify(b.ctx.getAgendaEventPresentation(appointment)),JSON.stringify({id:'a',type:'appointment',status:'open',timeLabel:b.read("agendaEventTime({type:'appointment',startDate:'2026-10-03T12:30:00Z'})"),title:'RDV',contactLabel:'Client',canDuplicate:true}));assert.equal(JSON.stringify(b.ctx.getAgendaEventPresentation({_id:'t',type:'task',status:'done',title:'Relance'})),JSON.stringify({id:'t',type:'task',status:'done',timeLabel:'Tâche',title:'Relance',contactLabel:'Sans client',canDuplicate:false}));
});
test('agenda day detail presentation centralizes date, count and planning key',()=>{
 const b=browser(),day=new b.ctx.Date('2026-10-03T12:00:00Z');
 assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getAgendaDayDetailsPresentation(day,[{},{}]))),{dateLabel:b.read("new Date('2026-10-03T12:00:00Z').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})"),actionLabel:'2 actions planifiées',dateKey:'2026-10-03'});
 assert.equal(b.ctx.getAgendaDayDetailsPresentation(day,[]).actionLabel,'Journée disponible');
});
test('task list escapes text and distinguishes overdue tasks from appointments',()=>{
 const b=browser();b.set('allTasks',[{_id:'t',type:'task',title:'<Relance>',status:'open',priority:'high',dueDate:'2026-10-01'},{_id:'a',type:'appointment',title:'RDV',status:'open',priority:'normal',startDate:'2026-10-04T12:00:00Z'}]);b.ctx.renderTasks();assert.equal(b.node('tasksOverdueCount').textContent,1);assert.equal(b.node('appointmentsUpcomingCount').textContent,1);assert.match(b.node('tasksList').innerHTML,/&lt;Relance&gt;/);
 b.node('tasksFilter').value='rdv';b.ctx.renderTasks();assert.equal((b.node('tasksList').innerHTML.match(/<article/g)||[]).length,1);
});
test('task row presentation centralizes labels, dates and completion actions',()=>{
 const b=browser(),task={_id:'t',type:'task',title:'Relance',status:'open',priority:'high',dueDate:'2026-10-03',contactId:{companyName:'Client'}};assert.equal(JSON.stringify(b.ctx.getTaskRowPresentation(task)),JSON.stringify({id:'t',className:'task-row open task priority-high',statusLabel:'Priorité haute',title:'Relance',detail:`Client · ${b.read("taskDate('2026-10-03')")}`,completionLabel:'Terminer'}));const appointment=b.ctx.getTaskRowPresentation({_id:'a',type:'appointment',title:'RDV',status:'done',priority:'normal',startDate:'2026-10-03T12:00:00Z',contactId:{companyName:'Client'}});assert.equal(appointment.statusLabel,'Rendez-vous');assert.equal(appointment.completionLabel,'');assert.equal(appointment.detail,`Client · ${b.read("taskDateTime('2026-10-03T12:00:00Z')")}`);
});
test('task counters presentation centralizes task and appointment totals',()=>{
 const b=browser(),tasks=[{type:'task'},{type:'task'},{type:'appointment'}],data={open:[{type:'task'},{type:'appointment'}],overdue:[{}],high:[{},{}],upcoming:[{},{}]};
 assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getTaskCountersPresentation(tasks,data))),{totalLabel:'3 éléments',openTaskCount:1,upcomingAppointmentCount:2,highPriorityCount:2,overdueCount:1});
 assert.equal(b.ctx.getTaskCountersPresentation([{type:'task'}],{open:[],overdue:[],high:[],upcoming:[]}).totalLabel,'1 élément');
});

test('task list presentation centralizes counters, rendered rows and the empty state',()=>{
 const b=browser(),task={_id:'t',type:'task',title:'Relance',status:'open',priority:'normal',dueDate:'2026-10-03'},data={shown:[task],open:[task],overdue:[],high:[],upcoming:[]},presentation=b.ctx.getTaskListPresentation([task],data);
 assert.deepEqual(JSON.parse(JSON.stringify(presentation)),{counters:{totalLabel:'1 élément',openTaskCount:1,upcomingAppointmentCount:0,highPriorityCount:0,overdueCount:0},rows:[{id:'t',className:'task-row open task priority-normal',statusLabel:'À faire',title:'Relance',detail:`Sans client · ${b.read("taskDate('2026-10-03')")}`,completionLabel:'Terminer'}],emptyMessage:'Aucune action à afficher.'});
 assert.match(b.ctx.renderTaskRowPresentation(presentation.rows[0]),/completeTask\('t'\)/);
});
test('task loading refreshes agenda data and starts only one reminder timer',async()=>{
 const b=browser(),steps=[];b.ctx.apiFetch=async(...args)=>{b.calls.push(args);return [];};b.ctx.taskContacts=()=>steps.push('contacts');b.ctx.renderTasks=()=>steps.push('render');b.ctx.showAppointmentConfirmationStatus=()=>steps.push('confirmation');b.ctx.updateUpcomingAppointmentAlert=()=>steps.push('alert');b.ctx.checkAgendaReminders=()=>steps.push('reminder');
 await b.ctx.loadTasks();await b.ctx.loadTasks();assert.deepEqual(b.calls.map(([url])=>url),['/api/tasks','/api/tasks']);assert.deepEqual(steps,['contacts','render','confirmation','alert','reminder','contacts','render','confirmation','alert','reminder']);assert.equal(b.timers(),1);assert.equal(b.read('allTasks.length'),0);
});
test('appointment duplication prepares a week later without writing to the API',()=>{
 const b=browser();b.set('allTasks',[{_id:'a',type:'appointment',title:'RDV',startDate:'2026-10-03T12:00:00Z',endDate:'2026-10-03T13:00:00Z',contactId:{_id:'c'}}]);b.ctx.duplicateAppointment('a');assert.equal(b.node('taskEditId').value,'');assert.equal(b.node('taskContact').value,'c');assert.equal(b.node('taskStartDate').value,b.read('localDateTime("2026-10-10T12:00:00Z")'));assert.equal(b.calls.length,0);
});
test('task edit preserves recurrence and contact fields through PUT',async()=>{
 const b=browser();b.ctx.loadTasks=async()=>{};b.node('taskEditId').value='t';b.node('taskTitle').value=' RDV ';b.node('taskType').value='appointment';b.node('taskRecurrenceFrequency').value='weekly';b.node('taskRecurrenceCount').value='3';b.node('taskReminderMinutes').value='15';b.node('taskFreeContactEmail').value=' client@example.test ';await b.ctx.saveTask({preventDefault(){}});
 assert.equal(b.calls[0][0],'/api/tasks/t');assert.equal(b.calls[0][1].method,'PUT');const payload=JSON.parse(b.calls[0][1].body);assert.equal(payload.title,'RDV');assert.equal(payload.recurrenceFrequency,'weekly');assert.equal(payload.recurrenceCount,3);assert.equal(payload.reminderMinutes,15);assert.equal(payload.freeContactEmail,'client@example.test');
});
test('task completion refreshes after success and retains the failure feedback',async()=>{
 const b=browser(),refreshes=[];b.ctx.loadTasks=async()=>refreshes.push('tasks');await b.ctx.completeTask('t');assert.equal(b.calls[0][0],'/api/tasks/t/done');assert.equal(b.calls[0][1].method,'PUT');assert.deepEqual(refreshes,['tasks']);assert.equal(b.toasts.at(-1),'Action marquée comme réalisée');
 b.ctx.apiFetch=async()=>{throw new Error('offline');};await b.ctx.completeTask('t');assert.deepEqual(refreshes,['tasks']);assert.equal(b.toasts.at(-1),'offline');
});
test('task action presentation centralizes completion and deletion feedback',()=>{
 const b=browser();assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getTaskActionPresentation())),{completionSuccessMessage:'Action marquée comme réalisée',deletion:{confirmation:{title:'Supprimer l’action',message:'Cette suppression est définitive.',actionLabel:'Supprimer',danger:true}}});
});
test('reminders emit only once per appointment trigger',()=>{
 const b=browser();b.set('allTasks',[{_id:'a',title:'RDV',type:'appointment',status:'open',startDate:'2026-10-03T12:10:00Z',reminderMinutes:15}]);b.ctx.checkAgendaReminders();b.ctx.checkAgendaReminders();assert.equal(b.toasts.filter(m=>m.startsWith('Rappel')).length,1);
});
test('upcoming appointment alert chooses the closest open appointment and opens it',()=>{
 const b=browser(),appointments=[{_id:'later',title:'Plus tard',type:'appointment',status:'open',startDate:'2026-10-03T14:00:00Z'},{_id:'next',title:'Le plus proche',type:'appointment',status:'open',startDate:'2026-10-03T12:10:00Z'},{_id:'done',title:'Terminé',type:'appointment',status:'done',startDate:'2026-10-03T12:05:00Z'}];let edited;
 b.set('allTasks',appointments);b.ctx.editTask=id=>{edited=id;};b.ctx.updateUpcomingAppointmentAlert();assert.equal(b.node('dashboardTaskAlertLabel').textContent,'Rendez-vous imminent : Le plus proche');b.node('dashboardTaskAlertButton').onclick();assert.deepEqual(b.navigation,['tasksSection']);assert.equal(edited,'next');
});
test('cancelled task, recurring series and opportunity deletions make no request',async()=>{
 const b=browser();b.ctx.confirmAppAction=async()=>false;await b.ctx.deleteTask('t');await b.ctx.deleteFutureRecurringAppointments({_id:'a'});await b.ctx.deleteOpportunity('o');assert.equal(b.calls.length,0);
});
test('appointment confirmations and recurring deletions use their endpoints then refresh the agenda',async()=>{
 const b=browser(),refreshes=[];b.ctx.loadTasks=async()=>refreshes.push('tasks');b.ctx.apiFetch=async(...args)=>{b.calls.push(args);return {deletedCount:2};};
 await b.ctx.sendAppointmentConfirmation({_id:'a',type:'appointment'});await b.ctx.deleteFutureRecurringAppointments({_id:'a'});
 assert.deepEqual(b.calls.map(([url,options])=>[url,options.method]),[['/api/tasks/a/send-confirmation','POST'],['/api/tasks/a/future-recurrences','DELETE']]);assert.deepEqual(refreshes,['tasks','tasks']);assert.deepEqual(b.toasts,['Confirmation de rendez-vous envoyée.','2 rendez-vous à venir supprimé(s).']);
});
test('appointment confirmation and series deletion presentations centralize feedback',()=>{
 const b=browser(),item={type:'appointment',contactId:{companyName:'Client'}};assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getAppointmentConfirmationPresentation(item))),{confirmation:{title:'Envoyer la confirmation',message:'Envoyer la confirmation du rendez-vous à Client ?',actionLabel:'Envoyer'},successMessage:'Confirmation de rendez-vous envoyée.'});assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getFutureAppointmentDeletionPresentation(2))),{confirmation:{title:'Supprimer les rendez-vous à venir',message:'Cette occurrence et toutes les suivantes seront supprimées. Les rendez-vous déjà réalisés resteront dans l’historique.',actionLabel:'Supprimer la série',danger:true},successMessage:'2 rendez-vous à venir supprimé(s).'});
});
test('day agenda adds each applicable appointment action once',()=>{
 const b=browser(),actions=[],item={_id:'a',type:'appointment',startDate:'2026-10-03T12:00:00Z',contactId:{email:'client@example.test'},recurrenceGroup:'series'};const card={querySelector:selector=>actions.find(action=>action.className.includes(selector.slice(1)))||null,appendChild:action=>actions.push(action)};
 b.set('allTasks',[item]);b.set('agendaView','day');b.ctx.document.querySelectorAll=selector=>{assert.equal(selector,'.agenda-day-event.appointment');return [card];};b.ctx.document.createElement=tag=>{assert.equal(tag,'button');return {};};let exported,confirmed,deleted;b.ctx.exportAppointmentToCalendar=value=>{exported=value;};b.ctx.sendAppointmentConfirmation=value=>{confirmed=value;};b.ctx.deleteFutureRecurringAppointments=value=>{deleted=value;};
 b.ctx.addAgendaExportButtons();assert.deepEqual(actions.map(action=>action.textContent),['Ajouter au calendrier','Envoyer la confirmation','Supprimer cette série']);actions.forEach(action=>action.onclick());assert.equal(exported,item);assert.equal(confirmed,item);assert.equal(deleted,item);b.ctx.addAgendaExportButtons();assert.equal(actions.length,3);
});
test('appointment action presentation centralizes export, confirmation and series deletion',()=>{
 const b=browser();
 assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getAgendaAppointmentActionsPresentation({type:'appointment',contactId:{email:'client@example.test'},recurrenceGroup:'series'}))),[{key:'export',className:'secondary-btn agenda-export-btn',label:'Ajouter au calendrier'},{key:'confirmation',className:'secondary-btn agenda-confirmation-btn',label:'Envoyer la confirmation'},{key:'deleteSeries',className:'expense-text-action danger agenda-series-delete-btn',label:'Supprimer cette série'}]);
 assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getAgendaAppointmentActionsPresentation({type:'appointment'}))),[{key:'export',className:'secondary-btn agenda-export-btn',label:'Ajouter au calendrier'}]);
});
test('pipeline totals exclude closed opportunities from weighted forecasts and escape names',()=>{
 const b=browser();b.set('allOpportunities',[{_id:'a',title:'<Projet>',stage:'lead',amount:100,probability:20,contactId:{companyName:'<Client>'},expectedCloseDate:'2026-10-20'},{_id:'b',title:'Proposition',stage:'proposal',amount:200,probability:70},{_id:'c',stage:'won',amount:500,probability:100},{_id:'d',title:'Tardif',stage:'qualified',amount:25,probability:40,expectedCloseDate:'2026-11-10'}]);b.ctx.renderOpportunities();assert.equal(b.node('opportunitiesPipelineTotal').textContent,b.read('opportunityCurrency(325)'));assert.equal(b.node('opportunitiesForecastTotal').textContent,b.read('opportunityCurrency(170)'));assert.equal(b.node('opportunitiesWonTotal').textContent,b.read('opportunityCurrency(500)'));assert.equal(b.node('dashboardClosingOpportunities').textContent,1);assert.match(b.node('opportunityBoard').innerHTML,/&lt;Projet&gt;/);assert.match(b.node('opportunityBoard').innerHTML,/&lt;Client&gt;/);
});
test('opportunity metrics presentation centralizes counters and formatted amounts',()=>{
 const b=browser();
 assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getOpportunityMetricsPresentation({count:2,pipeline:325,forecast:170,proposal:200,won:500,closingSoon:1}))),{countLabel:'2 opportunités',pipelineLabel:b.read('opportunityCurrency(325)'),forecastLabel:b.read('opportunityCurrency(170)'),proposalLabel:b.read('opportunityCurrency(200)'),wonLabel:b.read('opportunityCurrency(500)'),closingSoonCount:1});
 assert.equal(b.ctx.getOpportunityMetricsPresentation({count:1,pipeline:0,forecast:0,proposal:0,won:0,closingSoon:0}).countLabel,'1 opportunité');
});
test('opportunity card presentation keeps its display values and allowed actions together',()=>{
 const b=browser(),item={_id:'o',title:'Projet',stage:'proposal',amount:250,probability:70,contactId:{companyName:'Client'},expectedCloseDate:'2026-10-20'};assert.equal(JSON.stringify(b.ctx.getOpportunityCardPresentation(item,'proposal')),JSON.stringify({id:'o',contactName:'Client',title:'Projet',amountLabel:b.read('opportunityCurrency(250)'),probabilityLabel:'70 % de probabilité',closeDateLabel:` · Prévu le ${b.read("new Date('2026-10-20').toLocaleDateString('fr-FR')")}`,canCreateQuote:true,canMove:true}));assert.equal(JSON.stringify(b.ctx.getOpportunityCardPresentation({...item,contactId:null},'won')),JSON.stringify({id:'o',contactName:'Sans contact',title:'Projet',amountLabel:b.read('opportunityCurrency(250)'),probabilityLabel:'70 % de probabilité',closeDateLabel:` · Prévu le ${b.read("new Date('2026-10-20').toLocaleDateString('fr-FR')")}`,canCreateQuote:false,canMove:false}));
});

test('opportunity board presentation centralizes columns, totals and empty states',()=>{
 const b=browser(),opportunities=[{_id:'lead',title:'Projet',stage:'lead',amount:120,probability:20,contactId:{companyName:'Acme'}},{_id:'won',title:'Signé',stage:'won',amount:80,probability:100}],presentation=b.ctx.getOpportunityBoardPresentation(opportunities,new b.ctx.Date('2026-10-03T12:00:00Z'));
 assert.equal(presentation.metrics.pipeline,120);assert.deepEqual(JSON.parse(JSON.stringify(presentation.columns.find(column=>column.stage==='lead'))),{stage:'lead',label:'Nouveaux prospects',totalLabel:b.read('opportunityCurrency(120)'),count:1,cards:[{id:'lead',contactName:'Acme',title:'Projet',amountLabel:b.read('opportunityCurrency(120)'),probabilityLabel:'20 % de probabilité',closeDateLabel:'',canCreateQuote:true,canMove:true}],emptyMessage:'Aucune opportunité'});
 const lost=presentation.columns.find(column=>column.stage==='lost');assert.equal(lost.count,0);assert.equal(lost.emptyMessage,'Aucune opportunité');assert.match(b.ctx.renderOpportunityColumnPresentation(lost),/opportunity-empty/);
});
test('pipeline insights compute performance, sources, losses and stale opportunities',()=>{
 const b=browser(),opportunities=[{stage:'won',amount:300,source:'website'},{stage:'lost',amount:100,lostReason:'price'},{stage:'lost',amount:50},{stage:'lead',amount:200,source:'website',updatedAt:'2026-09-01'},{stage:'proposal',amount:80,source:'referral',updatedAt:'2026-10-01'}];b.set('allOpportunities',opportunities);assert.equal(JSON.stringify(b.ctx.getOpportunityPerformanceMetrics(opportunities)),JSON.stringify({conversion:33,averageWon:300}));assert.equal(JSON.stringify(b.ctx.getOpportunitySourceInsights(opportunities).map(([source,data])=>[source,data.count,data.amount])),JSON.stringify([['website',2,500],['manual',2,150],['referral',1,80]]));assert.equal(JSON.stringify(b.ctx.getOpportunityLossInsights(opportunities)),JSON.stringify({total:2,entries:[['price',1],['unreported',1]]}));assert.equal(b.ctx.getStaleOpportunityCount(opportunities),1);b.ctx.updatePipelineDashboardDetails();assert.equal(b.node('dashboardPipelineDetail').textContent,'1 opportunité à relancer');
});
test('pipeline insight presentations format sources and loss rates before rendering',()=>{
 const b=browser(),opportunities=[{stage:'lost',amount:100,lostReason:'price',source:'website'},{stage:'lost',amount:50,source:'website'},{stage:'lead',amount:20,source:'referral'}];
 assert.equal(JSON.stringify(b.ctx.getOpportunitySourcePresentation(opportunities)),JSON.stringify([{label:'Site internet',countLabel:'2 opportunités',amountLabel:b.read('opportunityCurrency(150)')},{label:'Recommandation',countLabel:'1 opportunité',amountLabel:b.read('opportunityCurrency(20)')} ]));assert.equal(JSON.stringify(b.ctx.getOpportunityLossPresentation(opportunities)),JSON.stringify([{label:'Budget / prix',countLabel:'1 opportunité',rate:50},{label:'Non renseigné',countLabel:'1 opportunité',rate:50}]));
});
test('opportunity card helpers centralize follow-up, loss and stale states',()=>{
 const b=browser(),now=new Date('2026-10-10').getTime();assert.equal(b.ctx.canCreateOpportunityFollowUp({stage:'proposal',contactId:'client'}),true);assert.equal(b.ctx.canCreateOpportunityFollowUp({stage:'won',contactId:'client'}),false);assert.equal(b.ctx.getOpportunityLossReasonLabel({stage:'lost',lostReason:'price'}),'Motif : Budget / prix');assert.equal(b.ctx.getOpportunityLossReasonLabel({stage:'lead',lostReason:'price'}),'');assert.equal(b.ctx.isOpportunityStale({stage:'lead',updatedAt:'2026-09-20'},now),true);assert.equal(b.ctx.isOpportunityStale({stage:'proposal',updatedAt:'2026-10-01'},now),false);assert.equal(b.ctx.isOpportunityStale({stage:'lost',updatedAt:'2026-09-01'},now),false);
});
test('stage changes propose probability and reveal loss reason without network writes',()=>{
 const b=browser();b.node('opportunityStage').value='lost';b.events[0].callback();assert.equal(b.node('opportunityProbability').value,0);assert.equal(b.node('opportunityLostReasonField').hidden,false);b.node('opportunityStage').value='proposal';b.events[0].callback();assert.equal(b.node('opportunityProbability').value,70);assert.equal(b.node('opportunityLostReasonField').hidden,true);assert.equal(b.calls.length,0);
});
test('opportunity form presentation centralizes modes, sources and loss reasons',()=>{
 const b=browser();assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getOpportunityFormModePresentation(false))),{title:'Ajouter une opportunité',submitLabel:'Ajouter au pipeline',cancelHidden:true});assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getOpportunityFormModePresentation(true))),{title:'Modifier l’opportunité',submitLabel:'Enregistrer les modifications',cancelHidden:false});const options=b.ctx.getOpportunityFormOptionsPresentation();assert.deepEqual(JSON.parse(JSON.stringify(options.sourceOptions[1])),{value:'website',label:'Site internet'});assert.deepEqual(JSON.parse(JSON.stringify(options.lostReasonOptions[0])),{value:'price',label:'Budget / prix'});
});
test('opportunity save retains zero probability and loss reason in the PUT payload',async()=>{
 const b=browser();b.ctx.loadOpportunities=async()=>{};b.node('opportunityEditId').value='o';b.node('opportunityTitle').value=' Projet ';b.node('opportunityProbability').value='0';b.node('opportunityStage').value='lost';b.node('opportunityLostReason').value='price';b.node('opportunitySource').value='website';await b.ctx.saveOpportunity({preventDefault(){}});assert.equal(b.calls[0][0],'/api/opportunities/o');assert.equal(b.calls[0][1].method,'PUT');const payload=JSON.parse(b.calls[0][1].body);assert.equal(payload.probability,'0');assert.equal(payload.lostReason,'price');assert.equal(payload.source,'website');assert.equal(payload.title,'Projet');
});
test('opportunity editing retains a string contact identifier',()=>{
 const b=browser();b.set('allOpportunities',[{_id:'o',title:'Projet',contactId:'contact-1',amount:500,stage:'lead'}]);b.ctx.editOpportunity('o');assert.equal(b.node('opportunityEditId').value,'o');assert.equal(b.node('opportunityContact').value,'contact-1');assert.equal(b.node('opportunityFormTitle').textContent,'Modifier l’opportunité');assert.equal(b.node('opportunityCancelEdit').hidden,false);
});
test('follow-up and quote actions carry the contact into the correct form',async()=>{
 const b=browser();b.ctx.createOpportunityFollowUp({title:'Projet',stage:'proposal',contactId:{_id:'c'}});assert.equal(b.node('taskContact').value,'c');assert.equal(b.node('taskPriority').value,'high');assert.equal(b.node('taskTitle').value,'Relancer : Projet');b.ctx.createOpportunityFollowUp({title:'Projet B',stage:'lead',contactId:'c-string'});assert.equal(b.node('taskContact').value,'c-string');assert.equal(b.node('taskPriority').value,'normal');b.set('allOpportunities',[{_id:'o',contactId:{_id:'c'}}]);await b.ctx.createQuoteFromOpportunity('o');assert.equal(b.node('quoteContact').value,'c');assert.deepEqual(b.navigation,['tasksSection','tasksSection','quotesSection']);assert.equal(b.calls.length,0);
});
test('moving an opportunity preserves the stage endpoint and failure message',async()=>{
 const b=browser();b.ctx.loadOpportunities=async()=>{};await b.ctx.moveOpportunity('o','qualified');assert.equal(b.calls[0][0],'/api/opportunities/o/stage');assert.deepEqual(JSON.parse(b.calls[0][1].body),{stage:'qualified'});b.ctx.apiFetch=async()=>{throw new Error('offline');};await b.ctx.moveOpportunity('o','won');assert.equal(b.toasts.at(-1),'offline');
});
test('opportunity action presentations centralize movement and deletion feedback',()=>{
 const b=browser();assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getOpportunityMovePresentation())),{successMessage:'Étape mise à jour'});assert.deepEqual(JSON.parse(JSON.stringify(b.ctx.getOpportunityDeletionPresentation())),{confirmation:{title:'Supprimer l’opportunité',message:'Cette action est définitive.',actionLabel:'Supprimer',danger:true}});
});
test('pipeline drag and drop moves an opportunity only to a different stage',()=>{
 const b=browser(),cardEvents={},leadEvents={},qualifiedEvents={},cardClasses=[],columnClasses=[],card={dataset:{},classList:{add:value=>cardClasses.push(value),remove(){}},addEventListener:(type,callback)=>{cardEvents[type]=callback;}},leadColumn={classList:{add:value=>columnClasses.push(value),remove(){}},addEventListener:(type,callback)=>{leadEvents[type]=callback;}},qualifiedColumn={classList:{add(){},remove(){}},addEventListener:(type,callback)=>{qualifiedEvents[type]=callback;}};let moved;
 b.set('allOpportunities',[{_id:'o',stage:'lead'}]);b.ctx.document.querySelectorAll=selector=>selector==='.opportunity-card'?[card]:selector==='.opportunity-column'?[leadColumn,qualifiedColumn]:[];b.ctx.moveOpportunity=(id,stage)=>{moved=[id,stage];};b.ctx.enableOpportunityDragAndDrop();assert.equal(card.draggable,true);assert.equal(card.dataset.opportunityId,'o');const transfer={setData:(type,value)=>{transfer.type=type;transfer.value=value;},getData:()=>transfer.value};cardEvents.dragstart({dataTransfer:transfer});assert.equal(transfer.effectAllowed,'move');assert.deepEqual([transfer.type,transfer.value],['text/plain','o']);assert.deepEqual(cardClasses,['is-dragging']);leadEvents.dragover({preventDefault(){},dataTransfer:transfer});assert.equal(transfer.dropEffect,'move');leadEvents.drop({preventDefault(){},dataTransfer:transfer});assert.equal(moved,undefined);qualifiedEvents.drop({preventDefault(){},dataTransfer:transfer});assert.deepEqual(moved,['o','qualified']);assert.deepEqual(columnClasses,['is-drop-target']);
});
test('pipeline CSV export preserves headers, financial values and download label',()=>{
 const b=browser(),opportunity={title:'Projet',contactId:{companyName:'Client'},source:'website',stage:'proposal',amount:'120.5',probability:'70',notes:'Suivi'};const rows=b.ctx.getOpportunityCsvRows([opportunity]);assert.equal(rows.length,2);assert.equal(rows[0][0],'Opportunité');assert.equal(rows[1][1],'Client');assert.equal(rows[1][3],'Propositions');assert.equal(rows[1][4],120.5);assert.equal(rows[1][5],'70 %');assert.equal(rows[1][6],84.35);let exported;b.ctx.downloadCsvFile=(lines,label)=>{exported={lines,label};};b.set('allOpportunities',[opportunity]);b.ctx.exportOpportunitiesCsv();assert.equal(exported.label,'pipeline-commercial');assert.equal(exported.lines.length,2);
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
