console.log("✅ checkout.js loaded");

// =======================
// STRIPE INIT
// =======================
const stripe = Stripe("pk_test_51RlDSnAwiQXA8rArN1XBgh1V3E2gQR8yG1WkChVpaPwWr5hi2E0nMrGmBCAEamvX9flDIo6BoItg3jCEYkUbaosi00fVHDWx90");

// =======================
// DOM ELEMENTS
// =======================
const itemsEl = document.getElementById("order-items");
const totalEl = document.getElementById("order-total");
const shippingEl = document.getElementById("shipping-cost");
const taxEl = document.getElementById("tax-amount");
const errorEl = document.getElementById("error-message");
const form = document.getElementById("payment-form");

// Address fields
const firstName = document.getElementById("first-name");
const lastName = document.getElementById("last-name");
const address1 = document.getElementById("address-line1");
const city = document.getElementById("city");
const stateInput = document.getElementById("state");
const zip = document.getElementById("zip");
const country = document.getElementById("country");

// =======================
// LOAD CART
// =======================
const cart = JSON.parse(localStorage.getItem("cart")) || [];

// =======================
// TAX
// =======================
const TAX_RATES = {
  CA: 0.075,
  NY: 0.04,
  TX: 0.0625,
  FL: 0.06,
  default: 0.05
};

let subtotal = 0;
let shipping = 0;
let tax = 0;
let elements;

// =======================
// CART RENDER
// =======================
function renderCart() {
  itemsEl.innerHTML = "";
  subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.qty;
    itemsEl.innerHTML += `
      <div class="summary-item">
        <span>${item.name} × ${item.qty}</span>
        <span>$${(item.price * item.qty).toFixed(2)}</span>
      </div>
    `;
  });
}

// =======================
// ADDRESS VALIDATION
// =======================
function isAddressComplete() {
  const fields = [firstName, lastName, address1, city, stateInput, zip, country];
  return fields.every(f => f && f.value.trim() !== "");
}

// =======================
// TOTALS
// =======================
function updateTotals() {
  const stateCode = stateInput.value.toUpperCase();
  tax = subtotal * (TAX_RATES[stateCode] ?? TAX_RATES.default);
  shipping = subtotal > 0 ? 3.5 : 0;

  taxEl.textContent = `$${tax.toFixed(2)}`;
  shippingEl.textContent = `$${shipping.toFixed(2)}`;

  const total = subtotal + tax + shipping;
  totalEl.textContent = `$${total.toFixed(2)}`;

  localStorage.setItem("cartTotal", Math.round(total * 100));
}

// =======================
// STRIPE SETUP
// =======================
async function setupStripe() {
  const amount = Number(localStorage.getItem("cartTotal"));
  if (!amount) return;

  const res = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount })
  });

  const { clientSecret } = await res.json();

  elements = stripe.elements({ clientSecret });
  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
}

// =======================
// SUBMIT
// =======================
form.addEventListener("submit", async e => {
  e.preventDefault();

  if (!isAddressComplete()) {
    errorEl.textContent = "Please complete your delivery address 💕";
    return;
  }

  errorEl.textContent = "";

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/success.html`
    }
  });

  if (error) errorEl.textContent = error.message;
});

// =======================
// INIT
// =======================
renderCart();
updateTotals();
setupStripe();
