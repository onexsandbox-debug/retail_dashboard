// ================================
// 📊 ANALYTICS MODULE (ISOLATED)
// ================================

async function loadAnalyticsDashboard() {

  try {

    console.log("📊 Loading analytics...");

    const [storeRes, offerRes, loyaltyRes] = await Promise.all([
      fetch("/api/getStoreVisit?limit=1000"),
      fetch("/api/getOfferVisit?limit=1000"),
      fetch("/api/getLoyaltyVisit?limit=1000")
    ]);

    const storeData = (await storeRes.json()).data || [];
    const offerData = (await offerRes.json()).data || [];
    const loyaltyData = (await loyaltyRes.json()).data || [];

    // ============================
    // 📈 GROUP DATA BY DATE
    // ============================
    function groupByDate(data) {
      const map = {};
      data.forEach(d => {
        const date = new Date(d.created_at).toLocaleDateString("en-GB");
        map[date] = (map[date] || 0) + 1;
      });
      return map;
    }

    const storeMap = groupByDate(storeData);
    const offerMap = groupByDate(offerData);
    const loyaltyMap = groupByDate(loyaltyData);

    const allDates = [...new Set([
      ...Object.keys(storeMap),
      ...Object.keys(offerMap),
      ...Object.keys(loyaltyMap)
    ])].sort((a,b)=>new Date(a)-new Date(b));

    const storeCounts = allDates.map(d => storeMap[d] || 0);
    const offerCounts = allDates.map(d => offerMap[d] || 0);
    const loyaltyCounts = allDates.map(d => loyaltyMap[d] || 0);

    // ============================
    // 📈 LINE CHART
    // ============================
    if (window.lineChartInstance) {
      window.lineChartInstance.destroy();
    }

    const ctx = document.getElementById("lineChart");

    window.lineChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: allDates,
        datasets: [
          { label: "Store", data: storeCounts },
          { label: "Offer", data: offerCounts },
          { label: "Loyalty", data: loyaltyCounts }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

    // ============================
    // 🥧 PIE CHART
    // ============================
    if (window.pieChartInstance) {
      window.pieChartInstance.destroy();
    }

    const pieCtx = document.getElementById("pieChart");

    // ============================
// 🥧 PIE CHART (WITH %)
// ============================

// prevent divide by zero
const total =
  storeData.length +
  offerData.length +
  loyaltyData.length || 1;

// calculate %
const storePct = ((storeData.length / total) * 100).toFixed(1);
const offerPct = ((offerData.length / total) * 100).toFixed(1);
const loyaltyPct = ((loyaltyData.length / total) * 100).toFixed(1);

// destroy old chart if exists
if (window.pieChartInstance) {
  window.pieChartInstance.destroy();
}

// ✅ SAFETY CHECK (important)
if (!pieCtx) {
  console.error("❌ pieChart canvas not found");
} else {

  // create chart
  window.pieChartInstance = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: [
        `Store (${storePct}%)`,
        `Offer (${offerPct}%)`,
        `Loyalty (${loyaltyPct}%)`
      ],
      datasets: [{
        data: [
          storeData.length,
          offerData.length,
          loyaltyData.length
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

    console.log("✅ Analytics loaded");

  } catch (err) {
    console.error("❌ Analytics error:", err);
  }
}
