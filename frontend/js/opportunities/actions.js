// opportunities : actions.

function createOpportunityFollowUp(item){showSection("tasksSection");resetTaskForm();const select=document.getElementById("taskContact");if(select)select.value=item.contactId._id||item.contactId;document.getElementById("taskTitle").value=`Relancer : ${item.title}`;document.getElementById("taskPriority").value=item.stage==="proposal"?"high":"normal";document.getElementById("taskDueDate").value=new Date().toISOString().slice(0,10);document.getElementById("taskForm").scrollIntoView({behavior:"smooth",block:"start"});showToast("Relance préparée dans l’Agenda.");}

async function moveOpportunity(id,stage){if(!stage)return;try{await apiFetch(`/api/opportunities/${id}/stage`,{method:"PUT",body:JSON.stringify({stage})});showToast("Étape mise à jour");loadOpportunities();}catch(error){showToast(error.message);}}

async function createQuoteFromOpportunity(id){const item=allOpportunities.find(entry=>entry._id===id);if(!item?.contactId){showToast("Associez d’abord un client à cette opportunité.");return;}showSection("quotesSection");const modal=document.getElementById("quoteModal");if(modal?.style.display==="none")await toggleQuoteForm();const select=document.getElementById("quoteContact");if(select){select.value=item.contactId._id||item.contactId;if(typeof updateQuoteClientContext==="function")updateQuoteClientContext();}showToast("Client repris dans le nouveau devis.");}

async function deleteOpportunity(id){if(!await confirmAppAction({title:"Supprimer l’opportunité",message:"Cette action est définitive.",actionLabel:"Supprimer",danger:true}))return;try{await apiFetch(`/api/opportunities/${id}`,{method:"DELETE"});loadOpportunities();}catch(error){showToast(error.message);}}
