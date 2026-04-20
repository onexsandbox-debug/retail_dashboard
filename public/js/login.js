async function login() {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("error");

  errorBox.innerText = "";

  // ✅ Validation
  if (!email || !password) {
    errorBox.innerText = "All fields required";
    return;
  }

  if (!email.includes("@")) {
    errorBox.innerText = "Invalid email format";
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

    // ✅ Store session
    localStorage.setItem("user", JSON.stringify(data.user));

    // ✅ Redirect to dashboard
    window.location.href = "/index.html";

  } catch (err) {
    errorBox.innerText = "Server error. Try again.";
  }
}
