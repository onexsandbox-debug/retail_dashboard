async function uploadPDF() {

  const fileInput = document.getElementById("pdfFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a file");
    return;
  }

  if (file.type !== "application/pdf") {
    alert("Only PDF allowed");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("Max size 10MB");
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

    if (data.success) {
      document.getElementById("result").innerHTML =
        `<a href="${data.url}" target="_blank">${data.url}</a>`;
    } else {
      alert(data.message || "Upload failed");
    }

  } catch (err) {
    alert("Server error");
  }
}
