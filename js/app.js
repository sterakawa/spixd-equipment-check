const catalog=window.EQUIPMENT_CATALOG;
function decodePlan(){
  const value=new URLSearchParams(location.hash.slice(1)).get("plan");
  if(!value)return null;
  try{
    let normalized=value.replace(/-/g,"+").replace(/_/g,"/");
    normalized+="=".repeat((4-normalized.length%4)%4);
    const binary=atob(normalized);
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch{return null}
}
const activePlan=decodePlan();
const basicItems=activePlan?activePlan.items.filter(x=>x.group==="basic"):catalog.basic;
const specialItems=activePlan?activePlan.items.filter(x=>x.group==="special"):catalog.special;
let customItems=activePlan?activePlan.items.filter(x=>x.group==="custom"):[];
const selections={};
const statusLabels={bring:"持参",client:"先方用意",skip:"今回は不要"};
const $=id=>document.getElementById(id);
function itemId(group,index){return `${group}-${index}`}
function renderItem(item,group,index,isCustom=false){
  const id=itemId(group,index);
  return `<article class="equipment-item" data-item data-group="${group}" data-name="${escapeHtml(item.name)}" data-qty="${item.qty||1}">
    <div class="item-top"><div class="item-icon" aria-hidden="true"><svg><use href="images/equipment-icons.svg#${item.icon||"plus"}"></use></svg></div>
      <div class="item-copy"><h3>${escapeHtml(item.name)} <span class="qty-badge">×${item.qty||1}</span></h3><p>${escapeHtml(item.note||"今回追加した機材")}</p></div>
      ${isCustom?`<button class="remove-button" type="button" data-remove="${index}">削除</button>`:""}
    </div>
    <div class="choices" role="radiogroup" aria-label="${escapeHtml(item.name)}">
      ${choice(id,"bring","持参",selections[id])}
      ${choice(id,"client","先方用意",selections[id])}
      ${choice(id,"skip","今回は不要",selections[id])}
    </div>
  </article>`;
}
function choice(id,value,label,selected){return `<label class="choice ${value}"><input type="radio" name="${id}" value="${value}" ${selected===value?"checked":""}><span>${label}</span></label>`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){
  $("basicList").innerHTML=basicItems.map((x,i)=>renderItem(x,"basic",i)).join("");
  $("specialList").innerHTML=specialItems.map((x,i)=>renderItem(x,"special",i)).join("")+
    customItems.map((x,i)=>renderItem(x,"custom",i,true)).join("");
  bindInputs();updateProgress();
}
function bindInputs(){
  document.querySelectorAll("[data-item] input").forEach(input=>input.addEventListener("change",()=>{selections[input.name]=input.value;updateProgress()}));
  document.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>{
    const removed=Number(btn.dataset.remove);customItems.splice(removed,1);Object.keys(selections).filter(k=>k.startsWith("custom-")).forEach(k=>delete selections[k]);render();
  }));
}
function updateProgress(){
  const items=[...document.querySelectorAll("[data-item]")];
  const done=items.filter(item=>item.querySelector("input:checked")).length;
  $("progressText").textContent=`${done} / ${items.length}`;
  $("progressBar").max=Math.max(items.length,1);$("progressBar").value=done;
  if(done===items.length)$("validationMessage").textContent="全機材の判断が完了しています。";
  else $("validationMessage").textContent=`残り${items.length-done}項目を確認してください。`;
}
$("addItem").addEventListener("click",()=>{
  const name=$("customItem").value.trim();
  if(!name)return;
  customItems.push({name,qty:1,note:"今回追加した機材",icon:"plus"});
  $("customItem").value="";render();
  document.querySelectorAll("[data-group=custom]")[customItems.length-1]?.scrollIntoView({behavior:"smooth",block:"center"});
});
$("customItem").addEventListener("keydown",e=>{if(e.key==="Enter")$("addItem").click()});
$("submitButton").addEventListener("click",()=>{
  const items=[...document.querySelectorAll("[data-item]")];
  const missing=items.filter(item=>!item.querySelector("input:checked"));
  const eventName=$("eventName").value.trim(),staff=$("staffName").value.trim(),date=$("eventDate").value;
  if(!eventName||!staff||!date){$("validationMessage").textContent="案件情報をすべて入力してください。";document.querySelector(".job-card").scrollIntoView({behavior:"smooth"});return}
  if(missing.length){$("validationMessage").textContent=`未確認の機材が${missing.length}点あります。`;missing[0].scrollIntoView({behavior:"smooth",block:"center"});return}
  showResult(items,{eventName,staff,date});
});
function showResult(items,job){
  const records=items.map(item=>({name:item.dataset.name,qty:Number(item.dataset.qty||1),group:item.dataset.group,status:item.querySelector("input:checked").value}));
  $("resultEvent").textContent=job.eventName;$("resultStaff").textContent=job.staff;
  $("resultDate").textContent=new Intl.DateTimeFormat("ja-JP",{dateStyle:"long"}).format(new Date(job.date+"T00:00:00"));
  $("completedAt").textContent=new Intl.DateTimeFormat("ja-JP",{dateStyle:"long",timeStyle:"short"}).format(new Date());
  ["bring","client","skip"].forEach(s=>$(s+"Count").textContent=records.filter(r=>r.status===s).length);
  const groups=[["基本機材","basic"],["特別機材","special"],["今回だけの追加機材","custom"]];
  $("resultLists").innerHTML=groups.map(([title,key])=>{
    const rows=records.filter(r=>r.group===key);if(!rows.length)return "";
    return `<section class="result-section"><h2>${title}</h2>${rows.map(r=>`<div class="result-row"><span>${escapeHtml(r.name)} <b class="result-qty">×${r.qty}</b></span><span class="status status-${r.status}">${statusLabels[r.status]}</span></div>`).join("")}</section>`;
  }).join("");
  $("checkView").hidden=true;$("resultView").hidden=false;scrollTo({top:0,behavior:"smooth"});
}
$("backButton").addEventListener("click",()=>{$("resultView").hidden=true;$("checkView").hidden=false;scrollTo({top:0,behavior:"smooth"})});
if(activePlan){
  $("eventName").value=activePlan.event||"";
  $("eventDate").value=activePlan.date||"";
  document.body.classList.add("planned-checklist");
  const notice=document.createElement("div");
  notice.className="plan-notice";
  notice.innerHTML="<strong>撮影計画から作成されたチェックリスト</strong><span>"+escapeHtml(activePlan.event||"")+"</span>";
  $("checkView").prepend(notice);
}else{
  $("eventDate").value=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"});
}
render();