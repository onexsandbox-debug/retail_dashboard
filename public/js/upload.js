// =============================
// 📤 UPLOAD PDF FUNCTION
// =============================
async function uploadPDF() {

  const fileInput = document.getElementById("pdfFile");
  const file = fileInput.files[0];
  const btn = document.querySelector(".btn-upload");

  if (!file) {
    showError("Please select a file");
    return;
  }

  const isPDF =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPDF) {
    showError("Only PDF files allowed");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showError("Max file size is 10MB");
    return;
  }

  console.log("📄 FILE:", file.name, file.size);

  const formData = new FormData();
  formData.append("file", file);

  // UI START
  document.getElementById("uploadProgressContainer").style.display = "block";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").innerText = "0%";

  btn.disabled = true;
  btn.innerText = "Uploading...";

  try {

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploadPDF", true);

    // =============================
    // 📊 PROGRESS BAR
    // =============================
    xhr.upload.onprogress = function (event) {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        document.getElementById("progressBar").style.width = percent + "%";
        document.getElementById("progressText").innerText = percent + "%";
      }
    };

    xhr.onload = function () {

      console.log("📥 RESPONSE:", xhr.responseText);

      btn.disabled = false;
      btn.innerText = "Upload";

      if (xhr.status === 200) {

        const data = JSON.parse(xhr.responseText);

        if (data.success && data.url) {

          document.getElementById("result").innerHTML =
            `<b>Uploaded:</b><br><a href="${data.url}" target="_blank">${data.url}</a>`;

        } else {
          showError(data.message || "Upload failed");
        }

      } else {
        showError("Upload failed");
      }

      setTimeout(() => {
        document.getElementById("uploadProgressContainer").style.display = "none";
      }, 1500);
    };

    xhr.onerror = function () {
      console.log("❌ NETWORK ERROR");
      btn.disabled = false;
      btn.innerText = "Upload";
      showError("Network error");
    };

    xhr.send(formData);

  } catch (err) {
    console.log("❌ ERROR:", err);
    btn.disabled = false;
    btn.innerText = "Upload";
    showError("Server error");
  }
}


// =============================
// 🕒 IST DATE FORMAT
// =============================
function formatIST(dateString) {

  const date = new Date(dateString);

  const d = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);

  const t = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);

  return `${d} ${t}`;
}


// =============================
// 📡 GLOBAL STORE
// =============================
let globalData = [];


// =============================
// 📡 LOAD DATA FROM API
// =============================
async function loadData(type) {

  console.log("📊 Loading:", type);

  let api = "";

  if (type === "offer") api = "/api/getOfferVisit";
  if (type === "store") api = "/api/getStoreVisit";
  if (type === "loyalty") api = "/api/getLoyaltyVisit";

  try {

    const res = await fetch(api);
    const data = await res.json();

    console.log("📥 API DATA:", data);

    globalData = data.data || [];

    renderDynamic(type, globalData);

  } catch (err) {
    console.log("❌ FETCH ERROR:", err);
    document.getElementById("dynamicContent").innerHTML = "Error loading data";
  }
}


// =============================
// 🎯 RENDER DATA
// =============================
function renderDynamic(type, data) {

  const el = document.getElementById("dynamicContent");

  if (!data || data.length === 0) {
    el.innerHTML = "No data available";
    return;
  }

  let title = "";

  if (type === "offer") title = "📦 Offer Activity";
  if (type === "store") title = "📍 Store Visits";
  if (type === "loyalty") title = "🎁 Loyalty Activity";

  document.getElementById("sectionTitle").innerText = title;

  let html = "";

  data.forEach(item => {
    html += `
      <div style="padding:8px 0; border-bottom:1px solid #eee;">
        📱 <b>${item.mobile_number}</b> |
        📡 ${item.waba_number} |
        🧩 ${item.module_name}<br>
        ⏱ ${formatIST(item.created_at)} IST
      </div>
    `;
  });

  el.innerHTML = html;
}


// =============================
// 🔍 SEARCH FILTER (NEW)
// =============================
function filterData() {

  const query = document.querySelector('.filters input[type="text"]').value.toLowerCase();

  console.log("🔍 SEARCH:", query);

  if (!query) {
    renderDynamic(currentTab, globalData);
    return;
  }

  const filtered = globalData.filter(item =>
    item.mobile_number.toLowerCase().includes(query) ||
    item.waba_number.toLowerCase().includes(query) ||
    item.module_name.toLowerCase().includes(query)
  );

  renderDynamic(currentTab, filtered);
}


// =============================
// 📂 TAB HANDLING
// =============================
let currentTab = "upload";

function switchTab(tab) {

  currentTab = tab;

  document.querySelectorAll(".menu div").forEach(el => el.classList.remove("active"));
  event.target.classList.add("active");

  document.getElementById("dynamicContent").innerHTML = "Loading...";

  if (tab === "upload") {
    document.getElementById("sectionTitle").innerText = "Upload Center";
    document.getElementById("dynamicContent").innerHTML = "Upload section above";
    return;
  }

  loadData(tab);
}


// =============================
// 🔁 REFRESH
// =============================
function refreshData() {

  console.log("🔄 REFRESH");

  if (currentTab === "upload") {
    document.getElementById("fileName").innerText = "";
    document.getElementById("pdfFile").value = "";
    document.getElementById("result").innerText = "";
  } else {
    loadData(currentTab);
  }
}


// =============================
// 🔍 AUTO SEARCH BIND
// =============================
document.addEventListener("DOMContentLoaded", () => {

  const searchBox = document.querySelector('.filters input[type="text"]');

  if (searchBox) {
    searchBox.addEventListener("input", filterData);
  }

});
