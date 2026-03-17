const ADMIN_USER = "admin";
const ADMIN_PASS = "lilthingsclub";

const loginForm = document.getElementById("login-form");

if (loginForm) {

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {

      localStorage.setItem("adminAuth", "true");
      window.location.href = "/admin/dashboard.html";

    } else {

      document.getElementById("error").textContent =
        "Invalid login";

    }

  });

}
