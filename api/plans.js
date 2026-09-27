const SUPABASE_URL=process.env.VITE_SUPABASE_URL||"https://alzzxqfszlytdqinpvdv.supabase.co";
const SUPABASE_KEY=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_Vl_IN3k48Bt65p5xlrpD4w_b9E48Krz";
const headers={apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"};

async function db(path,options={}){
  const response=await fetch(SUPABASE_URL+"/rest/v1/"+path,{...options,headers:{...headers,...(options.headers||{})}});
  const text=await response.text();
  if(!response.ok)throw new Error(text||("Supabase error: "+response.status));
  return text?JSON.parse(text):null;
}

module.exports=async function handler(req,res){
  try{
    if(req.method==="POST"){
      const {eventName,eventDate,items}=req.body||{};
      if(!eventName||!eventDate||!Array.isArray(items)||!items.length)return res.status(400).json({error:"invalid plan"});
      const plans=await db("plans?select=id,public_id",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({event_name:eventName,event_date:eventDate,status:"issued"})});
      const plan=plans&&plans[0];
      const rows=items.map((item,index)=>({
        plan_id:plan.id,equipment_id:item.group==="custom"?null:item.id,category_id:item.group,
        category_name:item.group==="basic"?"基本機材":item.group==="special"?"特別機材":"今回だけの追加機材",
        item_name:item.name,note:item.note||"",icon:item.icon||"plus",quantity:item.qty||1,sort_order:index+1
      }));
      await db("plan_items",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(rows)});
      return res.status(201).json({publicId:plan.public_id});
    }
    if(req.method==="GET"){
      const publicId=String(req.query.plan||"");
      if(!publicId)return res.status(400).json({error:"plan id required"});
      const plans=await db("plans?public_id=eq."+encodeURIComponent(publicId)+"&select=id,event_name,event_date&limit=1");
      const plan=plans&&plans[0];
      if(!plan)return res.status(404).json({error:"plan not found"});
      const items=await db("plan_items?plan_id=eq."+encodeURIComponent(plan.id)+"&select=equipment_id,category_id,item_name,note,icon,quantity,sort_order&order=sort_order.asc");
      return res.status(200).json({event:plan.event_name,date:plan.event_date,items:items.map((item,index)=>({
        id:item.equipment_id||("custom-"+index),name:item.item_name,note:item.note,icon:item.icon,
        qty:item.quantity,group:item.category_id||"custom"
      }))});
    }
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({error:"method not allowed"});
  }catch(error){
    console.error(error);
    return res.status(500).json({error:"database request failed",detail:error.message});
  }
};