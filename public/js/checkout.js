console.log("✅ checkout.js loaded");

// =======================
// STRIPE INIT
// =======================
const stripe = Stripe("pk_test_51RlDSnAwiQXA8rArN1XBgh1V3E2gQR8yG1WkChVpaPwWr5hi2E0nMrGmBCAEamvX9flDIo6BoItg3jCEYkUbaosi00fVHDWx90");

// =======================
// CATEGORY WEIGHTS (oz)
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
// TAX RATES
// =======================
const taxEl = document.getElementById("tax-amount");
const TAX_RATES = {
  "CA": 0.075,
  "NY": 0.04,
  "TX": 0.0625,
  "FL": 0.06,
  "default": 0.05
};

function calculateTax(subtotal, state) {
  const rate = TAX_RATES[state] ?? TAX_RATES.default;
  return subtotal * rate;
}

// =======================
// LOAD CART & ELEMENTS
// =======================
const cart = JSON.parse(localStorage.getItem("cart")) || [];
const itemsEl = document.getElementById("order-items");
const totalEl = document.getElementById("order-total");
const shippingEl = document.getElementById("shipping-cost");
const countrySelect = document.getElementById("country");
const stateInput = document.querySelector('input[placeholder="State"]');
const discountInput = document.getElementById("discount-input");

let subtotal = 0;
let totalWeight = 0;
let shipping = 0;
let shippingType = "FLAT_MAIL";
let selectedCountry = "US";
let state = "";
let discountAmount = 0;

// =======================
// RENDER CART ITEMS & CALCULATE SUBTOTAL + WEIGHT
// =======================
function renderCart() {
  itemsEl.innerHTML = "";
  subtotal = 0;
  totalWeight = 0;

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
}

// =======================
// SHIPPING LOGIC
// =======================
function getShippingType(cart) {
  const bulkyCategories = ["crochet-keychain","crochet-plush","keychain","phone-charm"];
  return cart.some(item => bulkyCategories.includes(item.category)) ? "GROUND" : "FLAT_MAIL";
}

function qualifiesForFreeShipping(cart, weightOz) {
  const stickerOnly = cart.every(item => item.category && item.category.includes("sticker"));
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

function getShippingLabel(shippingType, country) {
  if (country !== "US") return "USPS International";
  return shippingType === "FLAT_MAIL" ? "USPS First-Class" : "USPS Ground";
}

function updateShipping() {
  shippingType = getShippingType(cart);

  if (qualifiesForFreeShipping(cart, totalWeight)) {
    shipping = 0;
  } else if (selectedCountry === "US") {
    shipping = calculateUSPSDomestic(totalWeight, shippingType);
  } else {
    shipping = calculateUSPSInternational(totalWeight);
  }

  shippingEl.textContent =
    shipping === 0
      ? "FREE 💕"
      : `${getShippingLabel(shippingType, selectedCountry)} - $${shipping.toFixed(2)}`;
}



// =======================
// DISCOUNTS
// =======================
const DISCOUNTS = { "WELCOME10": 0.10, "LILTHINGS": 5.00 };
function applyDiscount(code) {
  if (!DISCOUNTS[code]) return 0;
  return DISCOUNTS[code] < 1 ? subtotal * DISCOUNTS[code] : DISCOUNTS[code];
}

// =======================
// TOTAL CALCULATION
// =======================
function updateTotal() {
  renderCart();
  updateShipping();

  const tax = selectedCountry === "US" ? calculateTax(subtotal, state) : 0;
   // Display tax
  taxEl.textContent =
    tax > 0 ? `$${tax.toFixed(2)}` : "$0.00";
  
  const total = Math.max(subtotal + shipping + tax - discountAmount, 0);

  totalEl.textContent = `$${total.toFixed(2)}`;
  localStorage.setItem("cartTotal", Math.round(total * 100));
}

// =======================
// EVENT LISTENERS
// =======================
countrySelect?.addEventListener("change", () => {
  selectedCountry = countrySelect.value || "US";
  updateTotal();
});

stateInput?.addEventListener("input", () => {
  state = stateInput.value.toUpperCase();
  updateTotal();
});

document.getElementById("apply-discount")?.addEventListener("click", () => {
  const code = discountInput?.value.trim().toUpperCase() || "";
  discountAmount = applyDiscount(code);
  if (!discountAmount) {
    alert("Invalid discount code 💔");
  }
  updateTotal();
});

// =======================
// SAVE ORDER SUMMARY FOR SUCCESS PAGE
// =======================
function saveOrderSummary() {
  const orderSummary = {
    items: cart,
    subtotal,
    shipping,
    discount: discountAmount,
    total: subtotal + shipping - discountAmount + (selectedCountry === "US" ? calculateTax(subtotal, state) : 0),
    country: selectedCountry,
    state,
    shippingType: getShippingLabel(shippingType, selectedCountry)
  };
  localStorage.setItem("lastOrder", JSON.stringify(orderSummary));
}

// =======================
// STRIPE PAYMENT
// =======================
async function initCheckout() {
  const amount = JSON.parse(localStorage.getItem("cartTotal"));
  if (!amount) return;

  const payload = {
  amount,
  cart,
  shipping,
  tax: selectedCountry === "US" ? calculateTax(subtotal, state) : 0,
  address: getAddressData()
};


  const res = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  const data = await res.json();

  const elements = stripe.elements({ clientSecret: data.clientSecret });
  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");

  const form = document.getElementById("payment-form");
form.addEventListener("submit", async e => {
  e.preventDefault();

  if (!isAddressComplete()) {
    document.getElementById("error-message").textContent =
      "Please complete your delivery address before paying 💕";
    return;
  }

  document.getElementById("error-message").textContent = "";

  updateTotal();
  saveOrderSummary();

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/success.html`
    }
  });

  if (error) {
    document.getElementById("error-message").textContent = error.message;
  }
});
}
// =======================
// ADDRESS
// =======================
function isAddressComplete() {
  const fields = [
    document.getElementById("first-name"),
    document.getElementById("last-name"),
    document.getElementById("address-line1"),
    document.getElementById("city"),
    document.getElementById("state"),
    document.getElementById("zip"),
    document.getElementById("country")
  ];

  const missing = fields.filter(
    field => !field || !field.value || !field.value.trim()
  );

  console.log("❌ Missing address fields:", missing);

  return missing.length === 0;
}
// =======================
// INIT
// =======================
updateTotal();
initCheckout();
