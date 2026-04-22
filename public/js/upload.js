// ================================
// 🚀 FILE UPLOAD
// ================================
async function uploadPDF() {

  const fileInput = document.getElementById("pdfFile");
  const file = fileInput.files[0];
  const btn = document.querySelector(".btn-upload");

  if (!file) {
    alert("Please select a file");
    return;
  }

  const isPDF =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPDF) {
    alert("Only PDF files allowed");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("Max file size is 10MB");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  // Progress UI
  document.getElementById("uploadProgressContainer").style.display = "block";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").innerText = "0%";

  btn.disabled = true;
  btn.innerText = "Uploading...";

  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploadPDF", true);

    xhr.upload.onprogress = function (event) {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        document.getElementById("progressBar").style.width = percent + "%";
        document.getElementById("progressText").innerText = percent + "%";
      }
    };

    xhr.onload = function () {

  btn.disabled = false;
  btn.innerText = "Upload";

  if (xhr.status === 200) {

    const data = JSON.parse(xhr.responseText);

    if (data.success) {

      // ✅ FIX: KEEP FILE NAME AFTER UPLOAD
      const fileInput = document.getElementById("pdfFile");

      if (fileInput.files && fileInput.files.length > 0) {
        document.getElementById("fileName").innerText =
          fileInput.files[0].name;
      }

      // ✅ Optional success message
      document.getElementById("result").innerHTML =
        `<span style="color:green;">✔ Upload successful</span>`;

    } else {
      showError(data.message || "Upload failed");
    }

  } else {
    showError("Upload failed");
  }

  // ✅ RESET PROGRESS BAR (keep UI clean)
  setTimeout(() => {
    document.getElementById("uploadProgressContainer").style.display = "none";
  }, 1500);
};

    xhr.onerror = function () {
      btn.disabled = false;
      btn.innerText = "Upload";
      alert("Network error");
    };

    xhr.send(formData);

  } catch (err) {
    btn.disabled = false;
    btn.innerText = "Upload";
    alert("Server error");
  }
}

// ================================
// 📅 DATE FORMAT (IST)
// ================================
function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata"
  });
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false
  });
}

// ================================
// 📊 GLOBAL STATE
// ================================
let currentAPI = "";
let currentPage = 1;
let currentLimit = 10;

// ================================
// 📡 LOAD DATA
// ================================
async function loadData(api, page = 1, limit = 10) {

  currentAPI = api;
  currentPage = page;
  currentLimit = limit;

  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";

  try {
    const res = await fetch(`/api/${api}?page=${page}&limit=${limit}`);
    const json = await res.json();

    console.log("API RESPONSE:", json); // 🔥 debug

    if (!json.success || !json.data) {
      tableBody.innerHTML = "<tr><td colspan='6'>No data</td></tr>";
      return;
    }

    let html = "";

    json.data.forEach((row, i) => {
      html += `
        <tr>
          <td>${(page - 1) * limit + i + 1}</td>
          <td>${row.mobile_number || "-"}</td>
          <td>${row.waba_number || "-"}</td>
          <td>${formatDate(row.created_at)}</td>
          <td>${formatTime(row.created_at)}</td>
          <td><span class="status-badge">Captured</span></td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

  } catch (err) {
    console.error("❌ Frontend error:", err);
    tableBody.innerHTML = "<tr><td colspan='6'>Error loading</td></tr>";
  }
}

// ================================
// 🔁 PAGINATION
// ================================
function nextPage() {
  currentPage++;
  loadData(currentAPI, currentPage, currentLimit);
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadData(currentAPI, currentPage, currentLimit);
  }
}

function changeLimit(val) {
  currentLimit = parseInt(val);
  currentPage = 1;
  loadData(currentAPI, currentPage, currentLimit);
}

// ================================
// 🔍 FILTER
// ================================
async function applyFilter() {

  const search = document.getElementById("searchInput").value;
  const date = document.getElementById("dateInput").value;

  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";

  try {
    const res = await fetch(
      `/api/${currentAPI}?search=${search}&date=${date}&page=1&limit=${currentLimit}`
    );

    const json = await res.json();

    if (!json.success || !json.data) {
      tableBody.innerHTML = "<tr><td colspan='6'>No results</td></tr>";
      return;
    }

    let html = "";

    json.data.forEach((row, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${row.mobile_number}</td>
          <td>${row.waba_number}</td>
          <td>${formatDate(row.created_at)}</td>
          <td>${formatTime(row.created_at)}</td>
          <td><span class="status-badge">Filtered</span></td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

  } catch (err) {
    tableBody.innerHTML = "<tr><td colspan='6'>Filter error</td></tr>";
  }
}

// ================================
// 📂 TAB BINDING (🔥 MAIN FIX)
// ================================
document.addEventListener("DOMContentLoaded", () => {

  const offerTab = document.getElementById("offerTab");
  const storeTab = document.getElementById("storeTab");
  const loyaltyTab = document.getElementById("loyaltyTab");

  if (offerTab) {
    offerTab.addEventListener("click", () => {
      console.log("👉 Offer clicked");
      loadData("getOfferVisit");
    });
  }

  if (storeTab) {
    storeTab.addEventListener("click", () => {
      console.log("👉 Store clicked");
      loadData("getStoreVisit");
    });
  }

  if (loyaltyTab) {
    loyaltyTab.addEventListener("click", () => {
      console.log("👉 Loyalty clicked");
      loadData("getLoyaltyVisit");
    });
  }

  // ✅ DEFAULT LOAD
  loadData("getStoreVisit");

});
