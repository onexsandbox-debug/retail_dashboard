// ===============================
// ✅ GLOBAL VARIABLES
// ===============================
let currentPage = 1;
let pageSize = 10;
let fullData = [];


// ===============================
// ✅ ERROR POPUP
// ===============================
function showError(msg) {
  alert(msg);
}


// ===============================
// ✅ PDF UPLOAD WITH PROGRESS
// ===============================
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

  const formData = new FormData();
  formData.append("file", file);

  // UI Progress Start
  document.getElementById("uploadProgressContainer").style.display = "block";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").innerText = "0%";

  btn.disabled = true;
  btn.innerText = "Uploading...";

  try {

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploadPDF", true);

    // PROGRESS
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

      // Hide progress after 1.5 sec
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
// ✅ LOAD DATA FROM API
// ===============================
async function loadData(type) {

  let api = "";

  if (type === "offer") api = "/api/getOfferVisit";
  if (type === "store") api = "/api/getStoreVisit";
  if (type === "loyalty") api = "/api/getLoyaltyVisit";

  try {
    const res = await fetch(api);
    const data = await res.json();

    fullData = data.data || [];
    currentPage = 1;

    document.getElementById("dynamicContent").style.display = "block";

    renderTable();

  } catch (err) {
    console.log("❌ FETCH ERROR:", err);
  }
}


// ===============================
// ✅ TABLE RENDER
// ===============================
function renderTable() {

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  const pageData = fullData.slice(start, end);

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  pageData.forEach((item, index) => {

    const dateObj = new Date(item.created_at);

    const date = dateObj.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata"
    });

    const time = dateObj.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata"
    });

    tbody.innerHTML += `
      <tr style="border-bottom:1px solid #eee;">
        <td>${start + index + 1}</td>
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
// ✅ PAGINATION
// ===============================
function updatePageInfo() {
  const totalPages = Math.ceil(fullData.length / pageSize);
  document.getElementById("pageInfo").innerText =
    `Page ${currentPage} of ${totalPages}`;
}

function nextPage() {
  const totalPages = Math.ceil(fullData.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
}

function changePageSize() {
  pageSize = parseInt(document.getElementById("pageSize").value);
  currentPage = 1;
  renderTable();
}


// ===============================
// ✅ SEARCH FILTER
// ===============================
function filterData() {

  const query = document.querySelector('.filters input').value.toLowerCase();

  if (!query) {
    renderTable();
    return;
  }

  const filtered = fullData.filter(item =>
    item.mobile_number.includes(query) ||
    item.waba_number.includes(query) ||
    item.module_name.toLowerCase().includes(query)
  );

  currentPage = 1;
  renderFiltered(filtered);
}


// ===============================
// ✅ RENDER FILTERED DATA
// ===============================
function renderFiltered(data) {

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  data.forEach((item, index) => {

    const dateObj = new Date(item.created_at);

    const date = dateObj.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata"
    });

    const time = dateObj.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata"
    });

    tbody.innerHTML += `
      <tr style="border-bottom:1px solid #eee;">
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
    `Filtered ${data.length} results`;
}
