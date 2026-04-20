async function login() {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("error");

  errorBox.innerText = "";

  if (!email || !password) {
    errorBox.innerText = "Email and password required";
    return;
  }

  try {
    const res = await fetch('/api/loginUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      errorBox.innerText = data.message || "Invalid credentials";
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/index.html";

  } catch (err) {
    errorBox.innerText = "Server error";
  }
}
