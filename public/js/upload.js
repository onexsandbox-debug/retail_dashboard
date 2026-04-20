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

  // ✅ UI START
  document.getElementById("uploadProgressContainer").style.display = "block";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressText").innerText = "0%";

  btn.disabled = true;
  btn.innerText = "Uploading...";

  try {

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/api/uploadPDF", true);

    // ✅ PROGRESS TRACKING
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
          document.getElementById("result").innerHTML =
            `<b>Uploaded:</b><br><a href="${data.url}" target="_blank">${data.url}</a>`;
        } else {
          showError(data.message || "Upload failed");
        }

      } else {
        showError("Upload failed");
      }

      // ✅ RESET BAR AFTER SUCCESS
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
