const crypto=require("crypto");
const SUPABASE_URL="https://alzzxqfszlytldqinpdv.supabase.co";

function authorized(req){
  const expected=process.env.ADMIN_PASSWORD||"";
  const supplied=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!expected||!supplied)return false;
  const a=Buffer.from(expected),b=Buffer.from(supplied);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
async function db(path,options={}){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  const response=await fetch(SUPABASE_URL+"/rest/v1/"+path,{
    ...options,
    headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...(options.headers||{})}
  });
  const text=await response.text();
  if(!response.ok)throw new Error(text||("Supabase error: "+response.status));
  return text?JSON.parse(text):null;
}
function cleanItem(input){
  return {
    category_id:String(input.category_id||"").slice(0,50),
    name:String(input.name||"").trim().slice(0,100),
    note:String(input.note||"").trim().slice(0,200),
    icon:String(input.icon||"plus").trim().slice(0,50),
    default_quantity:Math.max(1,Math.min(99,Number(input.default_quantity)||1)),
    default_selected:Boolean(input.default_selected),
    sort_order:Number(input.sort_order)||0,
    enabled:input.enabled!==false
  };
}
module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(!process.env.ADMIN_PASSWORD||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:"管理画面の環境変数が未設定です。"});
  if(!authorized(req))return res.status(401).json({error:"パスワードが違います。"});
  try{
    if(req.method==="GET"){
      const [categories,items]=await Promise.all([
        db("equipment_categories?select=id,name,description,sort_order,enabled&order=sort_order.asc"),
        db("equipment_items?select=id,category_id,name,note,icon,default_quantity,default_selected,sort_order,enabled&order=sort_order.asc")
      ]);
      return res.status(200).json({categories,items});
    }
    if(req.method==="POST"){
      const body=req.body||{};
      if(body.action==="createCategory"){
        const row={
          id:String(body.category?.id||"").trim().toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,50),
          name:String(body.category?.name||"").trim().slice(0,100),
          description:String(body.category?.description||"").trim().slice(0,200),
          sort_order:Number(body.category?.sort_order)||0,
          enabled:true
        };
        if(!row.id||!row.name)return res.status(400).json({error:"カテゴリーIDと名称が必要です。"});
        const result=await db("equipment_categories?select=id",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify(row)});
        return res.status(201).json(result[0]);
      }
      const item=cleanItem(body.item||{});
      if(!item.category_id||!item.name)return res.status(400).json({error:"カテゴリーと機材名が必要です。"});
      const id=String(body.item?.id||("item-"+Date.now())).trim().toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,80);
      const result=await db("equipment_items?select=*",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({id,...item})});
      return res.status(201).json(result[0]);
    }
    if(req.method==="PATCH"){
      const id=String(req.body?.id||"").trim();
      const item=cleanItem(req.body?.item||{});
      if(!id||!item.category_id||!item.name)return res.status(400).json({error:"更新内容が不足しています。"});
      const result=await db("equipment_items?id=eq."+encodeURIComponent(id)+"&select=*",{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify(item)});
      return res.status(200).json(result[0]);
    }
    res.setHeader("Allow","GET, POST, PATCH");
    return res.status(405).json({error:"method not allowed"});
  }catch(error){
    console.error(error);
    return res.status(500).json({error:"データベース処理に失敗しました。"});
  }
};