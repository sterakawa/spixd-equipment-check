const basicItems=[
  {name:"SPIXDノートPC",qty:2,note:"本体を2台確認",icon:"laptop"},
  {name:"PC用ACアダプター",qty:2,note:"PC本体とは別に確認",icon:"power"},
  {name:"レシートプリンター",qty:2,note:"本体を2台確認",icon:"receipt-printer"},
  {name:"レシートプリンター ACアダプター",qty:2,note:"プリンター本体とは別に確認",icon:"power"},
  {name:"ポケットWi-Fi",qty:2,note:"本体・充電状態を確認",icon:"router"},
  {name:"プリンター USBケーブル",qty:1,note:"プリンター接続用",icon:"usb"},
  {name:"カメラ USBケーブル",qty:1,note:"テザー撮影用",icon:"usb"},
  {name:"AC電源コンセント",qty:1,note:"延長・電源タップ類",icon:"power"},
  {name:"Wi-Fiルーター",qty:1,note:"電源・設定を確認",icon:"router"},
  {name:"予備レシート",qty:1,note:"ロール紙の残量も確認",icon:"roll"},
  {name:"マウスセット",qty:1,note:"マウス・予備電池",icon:"mouse"}
];
const specialItems=[
  {name:"QRリーダー",qty:1,note:"必要な案件のみ",icon:"qr-reader"},
  {name:"Starlink",qty:1,note:"会場回線がない場合",icon:"starlink"},
  {name:"45m LANケーブル",qty:1,note:"Starlink離隔設置用",icon:"long-lan"},
  {name:"ケーブル保護モール",qty:1,note:"通路を横切る場合",icon:"cable-ramp"},
  {name:"丸椅子",qty:1,note:"オペレーター用",icon:"stool"},
  {name:"長距離USB・ブースター",qty:1,note:"撮影距離が5mを超える場合",icon:"booster"},
  {name:"サイネージPC・モニター",qty:1,note:"写真表示案件",icon:"monitor"},
  {name:"プリント用プリンター",qty:1,note:"写真プリント案件",icon:"photo-printer"},
  {name:"予備PC",qty:1,note:"長時間・重要案件",icon:"laptop"}
];
let customItems=[];
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
$("eventDate").value=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"});
render();