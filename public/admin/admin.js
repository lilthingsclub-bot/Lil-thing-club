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

      document.getElementById("error").textContent =
        "Invalid login";

    }

  });

}





async function loadDashboard(){

const { data } = await supabase
.from("orders")
.select("*")
.order("created_at",{ascending:false});

let revenue = 0;
let pending = 0;

data.forEach(order=>{
 revenue += order.total;

 if(order.status === "pending"){
  pending++;
 }

});

document.getElementById("total-orders").textContent = data.length;

document.getElementById("total-revenue").textContent =
"$" + revenue.toFixed(2);

document.getElementById("pending-orders").textContent =
pending;

}

const supabase = window.supabase.createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY"
);


const tbody = document.getElementById("recent-orders");

data.slice(0,5).forEach(order=>{

const row = document.createElement("tr");

row.innerHTML = `
<td>${order.id}</td>
<td>${order.customer_email}</td>
<td>$${order.total}</td>
<td>${order.status}</td>
`;

tbody.appendChild(row);

});
