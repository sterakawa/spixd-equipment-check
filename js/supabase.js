(function () {
  const runtimeConfig = window.SUPABASE_CONFIG || {};
  const config = {
    url: runtimeConfig.url || "https://alzzxqfszlytdqinpvdv.supabase.co",
    key: runtimeConfig.key || "sb_publishable_Vl_IN3k48Bt65p5xlrpD4w_b9E48Krz"
  };

  function ready() {
    return Boolean(config.url && config.key);
  }

  async function request(path, options = {}) {
    if (!ready()) throw new Error("Supabaseの接続設定がありません。");
    const response = await fetch(config.url.replace(/\/$/, "") + "/rest/v1/" + path, {
      ...options,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Supabase error: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  async function createPlan({ eventName, eventDate, items }) {
    const plans = await request("plans?select=id,public_id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ event_name: eventName, event_date: eventDate, status: "issued" })
    });
    const plan = plans && plans[0];
    if (!plan) throw new Error("計画IDを取得できませんでした。");

    const rows = items.map((item, index) => ({
      plan_id: plan.id,
      equipment_id: item.group === "custom" ? null : item.id,
      category_id: item.group,
      category_name: item.group === "basic" ? "基本機材" : item.group === "special" ? "特別機材" : "今回だけの追加機材",
      item_name: item.name,
      note: item.note || "",
      icon: item.icon || "plus",
      quantity: item.qty || 1,
      sort_order: index + 1
    }));
    try {
      await request("plan_items", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(rows)
      });
    } catch (error) {
      throw new Error("機材の保存に失敗しました。計画を作り直してください。");
    }
    return plan.public_id;
  }

  async function getPlan(publicId) {
    const plans = await request(`plans?public_id=eq.${encodeURIComponent(publicId)}&select=id,event_name,event_date&limit=1`);
    const plan = plans && plans[0];
    if (!plan) return null;
    const items = await request(`plan_items?plan_id=eq.${encodeURIComponent(plan.id)}&select=equipment_id,category_id,item_name,note,icon,quantity,sort_order&order=sort_order.asc`);
    return {
      event: plan.event_name,
      date: plan.event_date,
      items: (items || []).map((item, index) => ({
        id: item.equipment_id || `custom-${index}`,
        name: item.item_name,
        note: item.note,
        icon: item.icon,
        qty: item.quantity,
        group: item.category_id || "custom"
      }))
    };
  }

  window.SupabasePlans = { ready, createPlan, getPlan };
})();
