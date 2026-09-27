const SUPABASE_URL="https://alzzxqfszlytldqinpdv.supabase.co";
const SUPABASE_KEY="sb_publishable_Vl_IN3k48Bt65p5xlrpD4w_b9E48Krz";
module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=30, stale-while-revalidate=60");
  try{
    const response=await fetch(SUPABASE_URL+"/rest/v1/equipment_items?enabled=eq.true&select=id,name,note,icon,default_quantity,default_selected,sort_order&order=sort_order.asc",{
      headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY}
    });
    if(!response.ok)throw new Error(await response.text());
    const rows=await response.json();
    const map=row=>({id:row.id,name:row.name,qty:row.default_quantity,note:row.note||"",icon:row.icon||"plus"});
    return res.status(200).json({basic:rows.filter(x=>x.default_selected).map(map),special:rows.filter(x=>!x.default_selected).map(map)});
  }catch(error){
    console.error(error);
    return res.status(500).json({error:"equipment catalog unavailable"});
  }
};