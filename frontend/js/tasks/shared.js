// tasks : shared.

const agendaDateOnly=v=>{const d=new Date(v);return new Date(d.getFullYear(),d.getMonth(),d.getDate());};
const agendaKey=v=>{const d=agendaDateOnly(v);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const taskDate=v=>formatDate(v,{weekday:"short",day:"numeric",month:"short",year:"numeric"})||"Sans échéance";
const taskDateTime=v=>formatDateTime(v,{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})||"Date non définie";
const taskContactLabel=t=>t.contactId?.companyName||`${t.contactId?.firstname||""} ${t.contactId?.lastname||""}`.trim()||t.freeContactName||"Sans client";
const localDateTime=v=>{if(!v)return "";const d=new Date(v);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16);};
const agendaItemDate=t=>t.type==="appointment"?(t.startDate||t.dueDate):t.dueDate;
const isSameDate=(a,b)=>agendaKey(a)===agendaKey(b);
const eventsForDate=d=>allTasks.filter(t=>{const v=agendaItemDate(t);return v&&isSameDate(v,d);}).sort((a,b)=>new Date(agendaItemDate(a))-new Date(agendaItemDate(b)));
