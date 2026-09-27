const $=id=>document.getElementById(id);
let adminPassword=sessionStorage.getItem("spixd-admin-password")||"";
let categories=[],items=[];

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
function render(){
  $("newCategory").innerHTML=categoryOptions(categories[0]?.id);
  $("itemCount").textContent=`${items.length}件`;
  $("equipmentAdminList").innerHTML=items.map(item=>`<article class="admin-item" data-admin-item="${escapeHtml(item.id)}">
    <div class="admin-item-head"><strong>${escapeHtml(item.name)}</strong><code>${escapeHtml(item.id)}</code></div>
    <div class="admin-grid">
      <label>カテゴリー<select data-field="category_id">${categoryOptions(item.category_id)}</select></label>
      <label>機材名<input data-field="name" value="${escapeHtml(item.name)}"></label>
      <label class="wide">確認メモ<input data-field="note" value="${escapeHtml(item.note||"")}"></label>
      <label>標準数量<input data-field="default_quantity" type="number" min="1" max="99" value="${item.default_quantity}"></label>
      <label>表示順<input data-field="sort_order" type="number" value="${item.sort_order}"></label>
      <label>アイコンID<input data-field="icon" value="${escapeHtml(item.icon||"plus")}"></label>
      <label class="check-label"><input data-field="default_selected" type="checkbox" ${item.default_selected?"checked":""}> 初期選択</label>
      <label class="check-label"><input data-field="enabled" type="checkbox" ${item.enabled?"checked":""}> 有効</label>
    </div>
    <div class="admin-save-row"><span data-status></span><button type="button" class="secondary-button" data-save>この機材を保存</button></div>
  </article>`).join("");
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
  try{const updated=await api("PATCH",{id:row.dataset.adminItem,item:valuesFrom(row)});const index=items.findIndex(x=>x.id===updated.id);if(index>=0)items[index]=updated;status.textContent="保存しました"}
  catch(error){status.textContent=error.message}finally{button.disabled=false}
}
$("loginButton").addEventListener("click",async()=>{adminPassword=$("adminPassword").value;$("loginMessage").textContent="確認しています…";try{await load();sessionStorage.setItem("spixd-admin-password",adminPassword);$("loginMessage").textContent=""}catch(error){$("loginMessage").textContent=error.message}});
$("adminPassword").addEventListener("keydown",e=>{if(e.key==="Enter")$("loginButton").click()});
$("logoutButton").addEventListener("click",()=>{sessionStorage.removeItem("spixd-admin-password");location.reload()});
$("addEquipment").addEventListener("click",async()=>{
  const item={category_id:$("newCategory").value,name:$("newName").value.trim(),note:$("newNote").value.trim(),icon:$("newIcon").value.trim()||"plus",default_quantity:Number($("newQty").value)||1,sort_order:Number($("newOrder").value)||0,default_selected:$("newSelected").checked,enabled:true};
  if(!item.name){$("formMessage").textContent="機材名を入力してください。";return}
  $("formMessage").textContent="追加しています…";
  try{const created=await api("POST",{item});items.push(created);items.sort((a,b)=>a.sort_order-b.sort_order);render();$("newName").value="";$("newNote").value="";$("formMessage").textContent="機材を追加しました。"}catch(error){$("formMessage").textContent=error.message}
});
$("addCategory").addEventListener("click",async()=>{
  const category={id:$("categoryId").value,name:$("categoryName").value,description:$("categoryDescription").value,sort_order:Number($("categoryOrder").value)||0};
  try{const created=await api("POST",{action:"createCategory",category});categories.push({...created,...category,enabled:true});categories.sort((a,b)=>a.sort_order-b.sort_order);render();$("formMessage").textContent="カテゴリーを追加しました。"}catch(error){$("formMessage").textContent=error.message}
});
if(adminPassword){load().catch(()=>sessionStorage.removeItem("spixd-admin-password"))}
