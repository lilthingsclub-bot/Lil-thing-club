// =======================
// LOGIN
// =======================

const ADMIN_USER = "oakin";
const ADMIN_PASS = "gloverluck12";

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
      document.getElementById("error").textContent = "Invalid login";
    }
  });
}

// =======================
// SUPABASE INIT
// =======================

const { createClient } = supabase;

const supabaseClient = createClient(
  "https://yqqodiylewlwoemyuzfd.supabase.co",
 "YOUR_ANON_KEY"
);

// =======================
// DASHBOARD
// =======================

async function loadDashboard() {

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  let revenue = 0;
  let pending = 0;

  data.forEach(order => {
    revenue += order.total;

    if (order.status === "pending") {
      pending++;
    }
  });

  document.getElementById("total-orders").textContent = data.length;
  document.getElementById("total-revenue").textContent = "$" + revenue.toFixed(2);
  document.getElementById("pending-orders").textContent = pending;
}
