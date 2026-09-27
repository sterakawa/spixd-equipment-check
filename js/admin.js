const $=id=>document.getElementById(id);
const urlToken=new URLSearchParams(location.hash.slice(1)).get("access")||"";
let adminPassword=urlToken||sessionStorage.getItem("spixd-admin-token")||"";
if(urlToken)sessionStorage.setItem("spixd-admin-token",urlToken);
let categories=[],items=[];

const ICONS=[
  ["laptop","ノートPC"],["receipt-printer","レシートプリンター"],["qr-reader","QRリーダー"],["photo-printer","写真用プリンター"],
  ["usb","USBケーブル"],["usbc","USB-C"],["router","Wi-Fiルーター"],["starlink","Starlink"],["lan","LAN"],["long-lan","長尺LAN"],
  ["power","電源"],["roll","予備レシート"],["mouse","マウス"],["cable-ramp","ケーブルモール"],["stool","椅子"],["booster","USBブースター"],["monitor","モニター"],
  ["camera-body","カメラボディー"],["tripod","三脚"],["lens","レンズ"],["s-stand","Sスタンド"],["c-stand","Cスタンド"],
  ["reflector","レフ板"],["pole","ポール"],["super-clamp","スーパークランプ"],["small-clamp","スモールクランプ"],
  ["strobe","ストロボ"],["softbox","ソフトボックス"],["tent","テント"],["weight","ウエイト"],["table","テーブル"],
  ["wood-platform","すのこ"],["cube","サイコロ台"],["backdrop","背景布"],["plus","その他"]
];

async function api(method,body){
  const response=await fetch("/api/admin",{method,headers:{"Content-Type":"application/json",Authorization:"Bearer "+adminPassword},body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"管理APIに接続できません。");
  return data;
}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function categoryOptions(selected){
  return categories.map(c=>`<option value="${escapeHtml(c.id)}" ${c.id===selected?"selected":""}>${escapeHtml(c.name)}</option>`).join("");
}
function iconPickerHtml(selected){
  return `<div class="icon-picker" role="radiogroup" aria-label="アイコンを選択">${ICONS.map(([id,name])=>`<button type="button" class="icon-choice ${id===selected?"is-selected":""}" data-icon-choice="${id}" role="radio" aria-checked="${id===selected}" title="${escapeHtml(name)}"><svg aria-hidden="true"><use href="images/equipment-icons.svg#${id}"></use></svg><span>${escapeHtml(name)}</span></button>`).join("")}</div>`;
}
function setupIconPicker(container,input){
  container.innerHTML=iconPickerHtml(input.value||"plus");
  container.addEventListener("click",event=>{
    const button=event.target.closest("[data-icon-choice]");
    if(!button)return;
    input.value=button.dataset.iconChoice;
    container.querySelectorAll("[data-icon-choice]").forEach(choice=>{
      const selected=choice===button;
      choice.classList.toggle("is-selected",selected);
      choice.setAttribute("aria-checked",selected);
    });
  });
}
function render(){
  $("newCategory").innerHTML=categoryOptions(categories[0]?.id);
  $("itemCount").textContent=`${items.length}件`;
  setupIconPicker($("newIconPicker"),$("newIcon"));
  $("equipmentAdminList").innerHTML=items.map(item=>`<article class="admin-item" data-admin-item="${escapeHtml(item.id)}">
    <div class="admin-item-head"><div class="admin-item-title"><span class="current-icon"><svg aria-hidden="true"><use href="images/equipment-icons.svg#${escapeHtml(item.icon||"plus")}"></use></svg></span><strong>${escapeHtml(item.name)}</strong></div><code>${escapeHtml(item.id)}</code></div>
    <div class="admin-grid">
      <label>カテゴリー<select data-field="category_id">${categoryOptions(item.category_id)}</select></label>
      <label>機材名<input data-field="name" value="${escapeHtml(item.name)}"></label>
      <label class="wide">確認メモ<input data-field="note" value="${escapeHtml(item.note||"")}"></label>
      <label>標準数量<input data-field="default_quantity" type="number" min="1" max="99" value="${item.default_quantity}"></label>
      <label>表示順<input data-field="sort_order" type="number" value="${item.sort_order}"></label>
      <label class="check-label"><input data-field="default_selected" type="checkbox" ${item.default_selected?"checked":""}> 初期選択</label>
      <label class="check-label"><input data-field="enabled" type="checkbox" ${item.enabled?"checked":""}> 有効</label>
      <div class="wide icon-field"><span class="field-label">アイコン</span><div data-icon-picker></div><input data-field="icon" type="hidden" value="${escapeHtml(item.icon||"plus")}"></div>
    </div>
    <div class="admin-save-row"><span data-status></span><button type="button" class="secondary-button" data-save>この機材を保存</button></div>
  </article>`).join("");
  document.querySelectorAll("[data-admin-item]").forEach(row=>setupIconPicker(row.querySelector("[data-icon-picker]"),row.querySelector('[data-field="icon"]')));
  document.querySelectorAll("[data-save]").forEach(button=>button.addEventListener("click",()=>saveItem(button.closest("[data-admin-item]"))));
}
async function load(){
  const data=await api("GET");
  categories=data.categories||[];items=data.items||[];
  $("loginPanel").hidden=true;$("adminPanel").hidden=false;render();
}
function valuesFrom(row){
  const value=name=>row.querySelector(`[data-field="${name}"]`);
  return {category_id:value("category_id").value,name:value("name").value.trim(),note:value("note").value.trim(),icon:value("icon").value.trim()||"plus",default_quantity:Number(value("default_quantity").value)||1,sort_order:Number(value("sort_order").value)||0,default_selected:value("default_selected").checked,enabled:value("enabled").checked};
}
async function saveItem(row){
  const status=row.querySelector("[data-status]"),button=row.querySelector("[data-save]");
  button.disabled=true;status.textContent="保存中…";
  try{const updated=await api("PATCH",{id:row.dataset.adminItem,item:valuesFrom(row)});const index=items.findIndex(x=>x.id===updated.id);if(index>=0)items[index]=updated;status.textContent="保存しました";render()}
  catch(error){status.textContent=error.message}finally{button.disabled=false}
}
$("logoutButton").addEventListener("click",()=>{sessionStorage.removeItem("spixd-admin-token");location.href="admin.html"});
$("addEquipment").addEventListener("click",async()=>{
  const item={category_id:$("newCategory").value,name:$("newName").value.trim(),note:$("newNote").value.trim(),icon:$("newIcon").value.trim()||"plus",default_quantity:Number($("newQty").value)||1,sort_order:Number($("newOrder").value)||0,default_selected:$("newSelected").checked,enabled:true};
  if(!item.name){$("formMessage").textContent="機材名を入力してください。";return}
  $("formMessage").textContent="追加しています…";
  try{const created=await api("POST",{item});items.push(created);items.sort((a,b)=>a.sort_order-b.sort_order);$("newName").value="";$("newNote").value="";$("newIcon").value="plus";render();$("formMessage").textContent="機材を追加しました。"}catch(error){$("formMessage").textContent=error.message}
});
$("addCategory").addEventListener("click",async()=>{
  const category={id:$("categoryId").value,name:$("categoryName").value,description:$("categoryDescription").value,sort_order:Number($("categoryOrder").value)||0};
  try{const created=await api("POST",{action:"createCategory",category});categories.push({...created,...category,enabled:true});categories.sort((a,b)=>a.sort_order-b.sort_order);render();$("formMessage").textContent="カテゴリーを追加しました。"}catch(error){$("formMessage").textContent=error.message}
});
if(adminPassword){load().catch(error=>{$("loginMessage").textContent=error.message;sessionStorage.removeItem("spixd-admin-token")})}else{$("loginMessage").textContent="専用URLからアクセスしてください。"}
