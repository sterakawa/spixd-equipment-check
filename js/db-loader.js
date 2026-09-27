async function loadSavedPlan(publicId){
  const response=await fetch("/api/plans?plan="+encodeURIComponent(publicId));
  if(!response.ok)throw new Error(await response.text()||("API error: "+response.status));
  return response.json();
}
(async function () {
  const planId=new URLSearchParams(location.search).get("plan");
  if(planId){
    try{
      window.DATABASE_PLAN=await loadSavedPlan(planId);
    }catch(error){
      console.error(error);
      const message=document.createElement("div");
      message.className="plan-notice";
      message.innerHTML="<strong>撮影計画を読み込めませんでした</strong><span>URLまたはデータベース設定を確認してください。</span>";
      document.getElementById("checkView")?.prepend(message);
    }
  }
  const script=document.createElement("script");
  script.src="js/app.js?v=20260927-9";
  document.body.appendChild(script);
})();