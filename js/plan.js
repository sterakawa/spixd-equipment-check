const catalog=window.EQUIPMENT_CATALOG;
let planCustom=[];
const $=id=>document.getElementById(id);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function planRow(item,group,index,checked){
  return `<article class="plan-item" data-plan-item data-id="${item.id}" data-group="${group}">
    <label class="plan-select">
      <input type="checkbox" ${checked?"checked":""}>
      <span class="plan-check">✓</span>
      <span class="item-icon"><svg><use href="images/equipment-icons.svg#${item.icon}"></use></svg></span>
      <span class="plan-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.note)}</small></span>
    </label>
    <label class="quantity-control"><span>数量</span><button type="button" data-minus>−</button><input type="number" min="1" max="99" value="${item.qty}" aria-label="${escapeHtml(item.name)}の数量"><button type="button" data-plus>＋</button></label>
  </article>`;
}
function renderCatalog(){
  $("planBasic").innerHTML=catalog.basic.map((x,i)=>planRow(x,"basic",i,true)).join("");
  $("planSpecial").innerHTML=catalog.special.map((x,i)=>planRow(x,"special",i,false)).join("");
  bindQuantity();
}
function renderCustom(){
  $("planCustomList").innerHTML=planCustom.map((x,i)=>`<div class="custom-plan-row"><span>${escapeHtml(x.name)}</span><b>×${x.qty}</b><button type="button" data-custom-remove="${i}">削除</button></div>`).join("");
  document.querySelectorAll("[data-custom-remove]").forEach(btn=>btn.addEventListener("click",()=>{planCustom.splice(Number(btn.dataset.customRemove),1);renderCustom()}));
}
function bindQuantity(){
  document.querySelectorAll("[data-plan-item]").forEach(row=>{
    const input=row.querySelector('input[type="number"]');
    row.querySelector("[data-minus]").addEventListener("click",()=>input.value=Math.max(1,Number(input.value)-1));
    row.querySelector("[data-plus]").addEventListener("click",()=>input.value=Math.min(99,Number(input.value)+1));
  });
}
$("planAddCustom").addEventListener("click",()=>{
  const name=$("planCustomName").value.trim(),qty=Math.max(1,Number($("planCustomQty").value)||1);
  if(!name)return;
  planCustom.push({id:"custom-"+Date.now(),name,qty,note:"今回だけの追加機材",icon:"plus",group:"custom"});
  $("planCustomName").value="";$("planCustomQty").value=1;renderCustom();
});
$("planCustomName").addEventListener("keydown",e=>{if(e.key==="Enter")$("planAddCustom").click()});
function encodePlan(data){
  const bytes=new TextEncoder().encode(JSON.stringify(data));
  let binary="";bytes.forEach(b=>binary+=String.fromCharCode(b));
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
$("createChecklist").addEventListener("click",()=>{
  const event=$("planEvent").value.trim(),date=$("planDate").value;
  if(!event||!date){$("planMessage").textContent="イベント名と実施日を入力してください。";return}
  const selected=[...document.querySelectorAll("[data-plan-item]")].filter(row=>row.querySelector('input[type="checkbox"]').checked).map(row=>{
    const group=row.dataset.group;
    const item=catalog[group].find(x=>x.id===row.dataset.id);
    return {...item,qty:Math.max(1,Number(row.querySelector('input[type="number"]').value)||1),group};
  });
  const items=[...selected,...planCustom];
  if(!items.length){$("planMessage").textContent="機材を1点以上選択してください。";return}
  const payload={
    v:2,
    e:event,
    d:date,
    i:selected.map(x=>[x.id,x.qty]),
    c:planCustom.map(x=>[x.name,x.qty]),
    t:Math.floor(Date.now()/60000)
  };
  const base=new URL("index.html",location.href);
  base.hash="plan="+encodePlan(payload);
  $("openChecklist").href=base.href;
  $("generatedPlan").hidden=false;
  $("planMessage").textContent=`${items.length}種類の機材を選択しました。`;
  $("generatedPlan").scrollIntoView({behavior:"smooth",block:"center"});
});
$("copyChecklist").addEventListener("click",async()=>{
  const url=$("openChecklist").href;
  try{await navigator.clipboard.writeText(url);$("copyChecklist").textContent="コピーしました"}
  catch{$("copyChecklist").textContent="URLを長押ししてコピーしてください"}
});
$("planDate").value=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"});
renderCatalog();renderCustom();