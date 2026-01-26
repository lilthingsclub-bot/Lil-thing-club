const cart = JSON.parse(localStorage.getItem("cart")) || [];

if (cart.length === 0) {
  window.location.href = "/cart.html";
}


console.log("✅ checkout.js loaded");

const stripe = Stripe("pk_test_51RlDSnAwiQXA8rArN1XBgh1V3E2gQR8yG1WkChVpaPwWr5hi2E0nMrGmBCAEamvX9flDIo6BoItg3jCEYkUbaosi00fVHDWx90"); // your PUBLIC key

async function initCheckout() {
  console.log("🚀 initCheckout running");

  const total = JSON.parse(localStorage.getItem("cartTotal")) || 500;
  console.log("💰 total:", total);

  const res = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: total }),
  });

  const data = await res.json();
  console.log("🔐 clientSecret response:", data);

  const elements = stripe.elements({ clientSecret: data.clientSecret });
  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");

  const form = document.getElementById("payment-form");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    console.log("🟢 Pay Now clicked");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "/success.html",
      },
    });

    if (error) {
      document.getElementById("error-message").textContent = error.message;
      console.error("❌ Stripe error:", error);
    }
  });
}

initCheckout();



function renderOrderSummary() {
  const container = document.getElementById("order-items");
  container.innerHTML = "";

  let subtotal = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    container.innerHTML += `
      <div class="order-item">
        <img src="${item.image}">
        <div class="info">
          <p>${item.name}</p>
          <small>Option: ${item.option || "Standard"}</small>
          <div class="qty">
            <span>Qty: ${item.qty}</span>
          </div>
        </div>
        <div class="price">$${itemTotal.toFixed(2)}</div>
      </div>
    `;
  });

  document.getElementById("summary-subtotal").textContent =
    `$${subtotal.toFixed(2)}`;

  updateTotals();
}


function getSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}


function calculateShipping(method) {
  const subtotal = getSubtotal();

  const allStickers = cart.every(item =>
    item.name.toLowerCase().includes("sticker")
  );

  if (allStickers) {
    if (method === "untracked") return 0.78;
    if (method === "standard") return 4.00;
  }

  // anything not sticker → tracked
  if (method === "standard") return 5.50;
  if (method === "expedited") return 9.50;

  return 0;
}


let tipAmount = 0;

function setTip(percent) {
  tipAmount = getSubtotal() * percent;
  updateTotals();
}

function setCustomTip(amount) {
  tipAmount = Math.max(0, amount);
  updateTotals();
}


let discount = 0;

function applyDiscount(code) {
  const subtotal = getSubtotal();

  if (code === "WELCOME10") {
    discount = subtotal * 0.10;
  } else {
    discount = 0;
  }

  updateTotals();
}


function updateTotals() {
  const subtotal = getSubtotal();
  const shipping = selectedShippingPrice || 0;

  const total = subtotal + shipping + tipAmount - discount;

  document.getElementById("summary-subtotal").textContent =
    `$${subtotal.toFixed(2)}`;

  document.getElementById("summary-shipping").textContent =
    `$${shipping.toFixed(2)}`;

  document.getElementById("summary-tip").textContent =
    `$${tipAmount.toFixed(2)}`;

  document.getElementById("summary-total").textContent =
    `$${total.toFixed(2)}`;
}


localStorage.removeItem("cart");
window.location.href = "/thank-you.html";




