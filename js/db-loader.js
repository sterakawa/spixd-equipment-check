(async function () {
  const planId=new URLSearchParams(location.search).get("plan");
  if(planId){
    try{
      window.DATABASE_PLAN=await window.SupabasePlans.getPlan(planId);
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
  script.src="js/app.js?v=20260927-5";
  document.body.appendChild(script);
})();