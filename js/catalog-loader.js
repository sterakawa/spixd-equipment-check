(async function(){
  const current=document.currentScript;
  const target=current.dataset.target;
  try{
    const response=await fetch("/api/catalog");
    if(!response.ok)throw new Error("catalog unavailable");
    window.EQUIPMENT_CATALOG=await response.json();
  }catch(error){
    console.error(error);
  }
  const script=document.createElement("script");
  script.src=target;
  document.body.appendChild(script);
})();