// ===============================
// GLOBAL VARIABLES
// ===============================
let currentPage = 1;
let pageSize = 10;
let totalRecords = 0;
let currentType = "offer";
let fullData = [];


// ===============================
// ERROR POPUP
// ===============================
function showError(msg) {
  alert(msg);
}


// ===============================
// PDF UPLOAD (WITH PROGRESS)
// ===============================
async function uploadPDF() {

  const fileInput = document.getElementById("pdfFile");
  const file = fileInput.files[0];
  const btn = document.querySelector(".btn-upload");

  if (!file) return showError("Please select a file");

  const isPDF =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPDF) return showError("Only PDF files allowed");

  if (file.size > 10 * 1024 * 1024) {
    return showError("Max file size is 10MB");
  }

  const formData = new FormData();
  formData.append("file", file);

  // UI progress start
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
      btn.disabled = false;
      btn.innerText = "Upload";
      showError("Network error");
    };

    xhr.send(formData);

  } catch (err) {
    btn.disabled = false;
    btn.innerText = "Upload";
    showError("Server error");
  }
}


// ===============================
// LOAD DATA (SERVER PAGINATION)
// ===============================
async function loadData(type) {

  currentType = type;

  let api = "";

  if (type === "offer") api = "/api/getOfferVisit";
  if (type === "store") api = "/api/getStoreVisit";
  if (type === "loyalty") api = "/api/getLoyaltyVisit";

  try {
    console.log("🚀 Fetching:", api, "Page:", currentPage);

    const res = await fetch(`${api}?page=${currentPage}&limit=${pageSize}`);
    const data = await res.json();

    if (!data.success) {
      console.log("❌ API ERROR");
      return;
    }

    fullData = data.data || [];
    totalRecords = data.total || 0;

    document.getElementById("uploadSection").style.display = "none";
    document.getElementById("dataSection").style.display = "block";

    renderTable();

  } catch (err) {
    console.log("❌ FETCH ERROR:", err);
  }
}


// ===============================
// TABLE RENDER
// ===============================
function renderTable() {

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  fullData.forEach((item, index) => {

    const dateObj = new Date(item.created_at);

    const date = dateObj.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata"
    });

    const time = dateObj.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata"
    });

    tbody.innerHTML += `
      <tr style="border-bottom:1px solid #eee;">
        <td>${(currentPage - 1) * pageSize + index + 1}</td>
        <td>${item.mobile_number}</td>
        <td>${item.waba_number}</td>
        <td>${item.module_name}</td>
        <td>${date}</td>
        <td>${time}</td>
      </tr>
    `;
  });

  updatePageInfo();
}


// ===============================
// PAGINATION
// ===============================
function updatePageInfo() {
  const totalPages = Math.ceil(totalRecords / pageSize);
  document.getElementById("pageInfo").innerText =
    `Page ${currentPage} of ${totalPages}`;
}

function nextPage() {
  const totalPages = Math.ceil(totalRecords / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    loadData(currentType);
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadData(currentType);
  }
}

function changePageSize() {
  pageSize = parseInt(document.getElementById("pageSize").value);
  currentPage = 1;
  loadData(currentType);
}


// ===============================
// SEARCH (CURRENT PAGE)
// ===============================
function filterData() {

  const query = document.querySelector('.controls input').value.toLowerCase();

  if (!query) {
    renderTable();
    return;
  }

  const filtered = fullData.filter(item =>
    item.mobile_number.includes(query) ||
    item.waba_number.includes(query) ||
    item.module_name.toLowerCase().includes(query)
  );

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  filtered.forEach((item, index) => {

    const dateObj = new Date(item.created_at);

    const date = dateObj.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata"
    });

    const time = dateObj.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata"
    });

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.mobile_number}</td>
        <td>${item.waba_number}</td>
        <td>${item.module_name}</td>
        <td>${date}</td>
        <td>${time}</td>
      </tr>
    `;
  });

  document.getElementById("pageInfo").innerText =
    `Filtered ${filtered.length} results`;
}
