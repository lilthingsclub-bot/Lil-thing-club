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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcW9kaXlsZXdsd29lbXl1emZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTk2NjgsImV4cCI6MjA4NjU5NTY2OH0.nConWK9EWP35QE9J8kktoXWEP6GsAMipkyqRcsmBv4Y"
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


let images = [];
let variants = [];

// Upload
async function uploadToSupabase(file) {
  const fileName = Date.now() + "-" + file.name;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file);

  if (error) return null;

  return `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/product-images/${fileName}`;
}

// Drag drop
async function handleFiles(files) {
  for (let file of files) {
    const url = await uploadToSupabase(file);
    if (url) {
      images.push(url);
      document.getElementById("previewImages").innerHTML += `<img src="${url}" />`;
      updatePreview();
    }
  }
}

// Variants
function addVariant() {
  const label = document.getElementById("variantLabel").value;
  const price = parseFloat(document.getElementById("variantPrice").value);
  const stock = parseInt(document.getElementById("variantStock").value);

  variants.push({ id: label, label, price, stock });

  document.getElementById("variantList").innerHTML += `<li>${label} - $${price}</li>`;
}

// Save
async function saveProduct() {
  const name = document.getElementById("name").value;
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  await supabase.from("products").insert([{
    name,
    slug,
    price: variants[0]?.price || 0,
    image: images[0] || "",
    images,
    description: document.getElementById("description").value,
    variants,
    categories: document.getElementById("categories").value.split(",")
  }]);

  alert("Saved!");
}

// Preview
function updatePreview() {
  document.getElementById("previewCard").innerHTML = `
    <img src="${images[0] || ""}" width="100"/>
    <h4>${document.getElementById("name").value}</h4>
  `;
}
