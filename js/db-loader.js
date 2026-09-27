const SUPABASE_URL="https://alzzxqfszlytdqinpvdv.supabase.co";
const SUPABASE_KEY="sb_publishable_Vl_IN3k48Bt65p5xlrpD4w_b9E48Krz";
async function loadSavedPlan(publicId){
  const headers={apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY};
  const planResponse=await fetch(SUPABASE_URL+"/rest/v1/plans?public_id=eq."+encodeURIComponent(publicId)+"&select=id,event_name,event_date&limit=1",{headers});
  if(!planResponse.ok)throw new Error(await planResponse.text());
  const plans=await planResponse.json(),plan=plans[0];
  if(!plan)return null;
  const itemResponse=await fetch(SUPABASE_URL+"/rest/v1/plan_items?plan_id=eq."+encodeURIComponent(plan.id)+"&select=equipment_id,category_id,item_name,note,icon,quantity,sort_order&order=sort_order.asc",{headers});
  if(!itemResponse.ok)throw new Error(await itemResponse.text());
  const items=await itemResponse.json();
  return {event:plan.event_name,date:plan.event_date,items:items.map((item,index)=>({
    id:item.equipment_id||("custom-"+index),name:item.item_name,note:item.note,icon:item.icon,
    qty:item.quantity,group:item.category_id||"custom"
  }))};
}
(async function () {
  const planId=new URLSearchParams(location.search).get("plan");
  if(planId){
    try{
      window.DATABASE_PLAN=await loadSavedPlan(planId);
      if(!window.DATABASE_PLAN)throw new Error("plan not found");
    }catch(error){
      console.error(error);
      const message=document.createElement("div");
      message.className="plan-notice";
      message.innerHTML="<strong>撮影計画を読み込めませんでした</strong><span>URLまたはデータベース設定を確認してください。</span>";
      document.getElementById("checkView")?.prepend(message);
    }
  }
  const script=document.createElement("script");
  script.src="js/app.js?v=20260927-7";
  document.body.appendChild(script);
})();