console.log("✅ checkout.js loaded");

// =======================
// STRIPE INIT
// =======================
const stripe = Stripe("pk_test_51RlDSnAwiQXA8rArN1XBgh1V3E2gQR8yG1WkChVpaPwWr5hi2E0nMrGmBCAEamvX9flDIo6BoItg3jCEYkUbaosi00fVHDWx90");

// =======================
// NORMALIZED CATEGORY WEIGHTS (oz)
// =======================
const CATEGORY_WEIGHTS = {
  "sticker": 0.2,
  "sticker-sheet": 0.3,
  "art-print": 1.0,
  "phone-charm": 1.5,
  "keychain": 2.0,
  "crochet-keychain": 4.0,
  "crochet-plush": 10.0
};

function resolveWeight(item) {
  return item.weight || CATEGORY_WEIGHTS[item.category] || 1;
}

// =======================
// LOAD CART
// =======================
const cart = JSON.parse(localStorage.getItem("cart")) || [];

const itemsEl = document.getElementById("order-items");
const totalEl = document.getElementById("order-total");
const shippingEl = document.getElementById("shipping-cost");

// =======================
// CALCULATIONS
// =======================
let subtotal = 0;
let totalWeight = 0;

// Render items + calculate weight
cart.forEach(item => {
  subtotal += item.price * item.qty;
  totalWeight += resolveWeight(item) * item.qty;

  const div = document.createElement("div");
  div.className = "summary-item";
  div.innerHTML = `
    <span>${item.name} × ${item.qty}</span>
    <span>$${(item.price * item.qty).toFixed(2)}</span>
  `;
  itemsEl.appendChild(div);
});

// =======================
// SHIPPING LOGIC
// =======================
function getShippingType(cart) {
  const bulkyCategories = [
    "crochet-keychain",
    "crochet-plush",
    "keychain",
    "phone-charm"
  ];

  return cart.some(item => bulkyCategories.includes(item.category))
    ? "GROUND"
    : "FLAT_MAIL";
}

function qualifiesForFreeShipping(cart, weightOz) {
  const stickerOnly = cart.every(item =>
    item.category && item.category.includes("sticker")
  );

  return stickerOnly && weightOz <= 3;
}

function calculateUSPSDomestic(weightOz, shippingType) {
  if (shippingType === "FLAT_MAIL") {
    if (weightOz <= 1) return 1.50;
    if (weightOz <= 3) return 2.50;
    if (weightOz <= 6) return 3.50;
  }

  if (weightOz <= 8) return 5.50;
  if (weightOz <= 12) return 6.50;
  if (weightOz <= 16) return 7.50;
  if (weightOz <= 32) return 8.50;

  return 10.50;
}

function calculateUSPSInternational(weightOz) {
  if (weightOz <= 4) return 15.00;
  if (weightOz <= 8) return 18.00;
  if (weightOz <= 16) return 22.00;
  return 28.00;
}

// =======================
// SHIPPING CALCULATION
// =======================
const shippingType = getShippingType(cart);
const country = "US"; // later connect to delivery form

let shipping = 0;

if (qualifiesForFreeShipping(cart, totalWeight)) {
  shipping = 0;
} else if (country === "US") {
  shipping = calculateUSPSDomestic(totalWeight, shippingType);
} else {
  shipping = calculateUSPSInternational(totalWeight);
}

shippingEl.textContent =
  shipping === 0 ? "FREE 💕" : `$${shipping.toFixed(2)}`;

// =======================
// DISCOUNTS
// =======================
const DISCOUNTS = {
  "WELCOME10": 0.10,
  "LILTHINGS": 5.00
};

let discountAmount = 0;

function applyDiscount(code) {
  if (!DISCOUNTS[code]) return 0;

  return DISCOUNTS[code] < 1
    ? subtotal * DISCOUNTS[code]
    : DISCOUNTS[code];
}

// =======================
// FINAL TOTAL
// =======================
function updateTotal() {
  const total = Math.max(subtotal + shipping - discountAmount, 0);
  totalEl.textContent = `$${total.toFixed(2)}`;

  // Stripe requires cents
  localStorage.setItem("cartTotal", Math.round(total * 100));
}

updateTotal();

// =======================
// DISCOUNT BUTTON
// =======================
document.getElementById("apply-discount")?.addEventListener("click", () => {
  const code = document
    .getElementById("discount-input")
    .value
    .trim()
    .toUpperCase();

  discountAmount = applyDiscount(code);

  if (!discountAmount) {
    alert("Invalid discount code 💔");
    return;
  }

  updateTotal();
});

// =======================
// STRIPE PAYMENT
// =======================
async function initCheckout() {
  const amount = JSON.parse(localStorage.getItem("cartTotal"));

  if (!amount) return;

  const res = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  const data = await res.json();

  const elements = stripe.elements({
    clientSecret: data.clientSecret
  });

  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");

  const form = document.getElementById("payment-form");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "/success.html",
      },
    });

    if (error) {
      document.getElementById("error-message").textContent = error.message;
    }
  });
}

initCheckout();
