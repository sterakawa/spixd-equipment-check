const basicItems=[
  {name:"運用ノートPC",note:"本体・ACアダプター",icon:"▣"},
  {name:"レシートプリンター",note:"本体・電源ケーブル",icon:"▤"},
  {name:"QRリーダー",note:"USB接続を確認",icon:"⌗"},
  {name:"カメラ接続USB",note:"テザー撮影用",icon:"⌁"},
  {name:"ルーター",note:"電源・設定済み",icon:"◉"},
  {name:"LANケーブル",note:"必要な長さを確認",icon:"↔"},
  {name:"AC延長・電源タップ",note:"会場電源用",icon:"ϟ"},
  {name:"予備レジロール",note:"残量も確認",icon:"◎"},
  {name:"USB-Cケーブル",note:"充電・周辺機器用",icon:"C"},
  {name:"マウス・予備電池",note:"小物ケースを確認",icon:"●"}
];
const specialItems=[
  {name:"Starlink",note:"会場回線がない場合",icon:"◌"},
  {name:"45m LANケーブル",note:"Starlink離隔設置用",icon:"↝"},
  {name:"ケーブル保護モール",note:"通路を横切る場合",icon:"▰"},
  {name:"丸椅子",note:"オペレーター用",icon:"⌑"},
  {name:"長距離USB・ブースター",note:"撮影距離が5mを超える場合",icon:"⇢"},
  {name:"サイネージPC・モニター",note:"写真表示案件",icon:"▱"},
  {name:"プリント用プリンター",note:"写真プリント案件",icon:"▥"},
  {name:"予備PC",note:"長時間・重要案件",icon:"□"}
];
let customItems=[];
const statusLabels={bring:"持参",client:"先方用意",skip:"今回は不要"};
const $=id=>document.getElementById(id);
function itemId(group,index){return `${group}-${index}`}
function renderItem(item,group,index,isCustom=false){
  const id=itemId(group,index);
  return `<article class="equipment-item" data-item data-group="${group}" data-name="${escapeHtml(item.name)}">
    <div class="item-top"><div class="item-icon" aria-hidden="true">${item.icon||"+"}</div>
      <div class="item-copy"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.note||"今回追加した機材")}</p></div>
      ${isCustom?`<button class="remove-button" type="button" data-remove="${index}">削除</button>`:""}
    </div>
    <div class="choices" role="radiogroup" aria-label="${escapeHtml(item.name)}">
      ${choice(id,"bring","持参")}
      ${choice(id,"client","先方用意")}
      ${choice(id,"skip","今回は不要")}
    </div>
  </article>`;
}
function choice(id,value,label){return `<label class="choice ${value}"><input type="radio" name="${id}" value="${value}"><span>${label}</span></label>`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){
  $("basicList").innerHTML=basicItems.map((x,i)=>renderItem(x,"basic",i)).join("");
  $("specialList").innerHTML=specialItems.map((x,i)=>renderItem(x,"special",i)).join("")+
    customItems.map((x,i)=>renderItem(x,"custom",i,true)).join("");
  bindInputs();updateProgress();
}
function bindInputs(){
  document.querySelectorAll("[data-item] input").forEach(input=>input.addEventListener("change",updateProgress));
  document.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>{
    customItems.splice(Number(btn.dataset.remove),1);render();
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
  customItems.push({name,note:"今回追加した機材",icon:"+"});
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
  const records=items.map(item=>({name:item.dataset.name,group:item.dataset.group,status:item.querySelector("input:checked").value}));
  $("resultEvent").textContent=job.eventName;$("resultStaff").textContent=job.staff;
  $("resultDate").textContent=new Intl.DateTimeFormat("ja-JP",{dateStyle:"long"}).format(new Date(job.date+"T00:00:00"));
  $("completedAt").textContent=new Intl.DateTimeFormat("ja-JP",{dateStyle:"long",timeStyle:"short"}).format(new Date());
  ["bring","client","skip"].forEach(s=>$(s+"Count").textContent=records.filter(r=>r.status===s).length);
  const groups=[["基本機材","basic"],["特別機材","special"],["今回だけの追加機材","custom"]];
  $("resultLists").innerHTML=groups.map(([title,key])=>{
    const rows=records.filter(r=>r.group===key);if(!rows.length)return "";
    return `<section class="result-section"><h2>${title}</h2>${rows.map(r=>`<div class="result-row"><span>${escapeHtml(r.name)}</span><span class="status status-${r.status}">${statusLabels[r.status]}</span></div>`).join("")}</section>`;
  }).join("");
  $("checkView").hidden=true;$("resultView").hidden=false;scrollTo({top:0,behavior:"smooth"});
}
$("backButton").addEventListener("click",()=>{$("resultView").hidden=true;$("checkView").hidden=false;scrollTo({top:0,behavior:"smooth"})});
$("eventDate").value=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"});
render();