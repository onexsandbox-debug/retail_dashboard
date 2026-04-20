async function uploadPDF() {

  const fileInput = document.getElementById("pdfFile");
  const file = fileInput.files[0];

  if (!file) {
    showError("Please select a file");
    return;
  }

  // ✅ Fix: robust PDF validation
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

  try {

    const res = await fetch('/api/uploadPDF', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!data.success) {
      showError(data.message || "Upload failed");
      return;
    }

    // ✅ Success UI
    document.getElementById("result").innerHTML =
      `<b>Uploaded:</b><br>
       <a href="${data.url}" target="_blank">${data.url}</a>`;

  } catch (err) {
    showError("Server error. Please try again.");
  }
}
