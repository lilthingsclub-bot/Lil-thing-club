console.log("✅ checkout.js loaded");

let stripe;
let elements;
let paymentElement;
let paymentIntentId;

let subtotal = 0;
let shipping = 0;
let tax = 0;
let discount = 0;
let totalWeight = 0;

const cart = JSON.parse(localStorage.getItem("cart")) || [];

// =======================
// STRIPE INIT
// =======================
stripe = Stripe("pk_live_51RlDSnAwiQXA8rArpM7tGeciUvTB9eCuTXQsSARiDt8d0vDE96AfxEAoyQZFnCNVJ67c2IBBH9R0DBRZRCxm7AMr00BulSGmwF");

// =======================
// DOM ELEMENTS
// =======================
const itemsEl = document.getElementById("order-items");
const totalEl = document.getElementById("order-total");
const shippingEl = document.getElementById("shipping-cost");
const taxEl = document.getElementById("tax-amount");
const errorEl = document.getElementById("error-message");
const form = document.getElementById("payment-form");
const promoMessageRow = document.getElementById("promo-message");
const promoMessageText = promoMessageRow.querySelector(".note-text");
const emailInput = document.getElementById("email");


// Address fields
const firstName = document.getElementById("first-name");
const lastName = document.getElementById("last-name");
const address1 = document.getElementById("address-line1");
const city = document.getElementById("city");
const stateInput = document.getElementById("state");
const zip = document.getElementById("zip");
const country = document.getElementById("country");


// =======================
// Render Cart + Calculate Totals
// =======================

function calculateTotals() {

  subtotal = 0;
  totalWeight = 0;

  cart.forEach(item => {
    subtotal += item.price * item.qty;
    totalWeight += (item.weight || 1) * item.qty;
  });

}

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
// shipping logic
// =======================


function calculateShipping(country) {

  if (subtotal >= 20) return 0;

  if (country !== "US") {
    return 15;
  }

  if (totalWeight <= 3) return 0.75;
  if (totalWeight <= 8) return 5.50;

  return 7.50;
}


// =======================
// discounts
// =======================

const DISCOUNTS = {
  WELCOME10: { type: "percent", value: 0.10 },
  LIL5: { type: "fixed", value: 5 }
};

function applyDiscount(code) {

  const rule = DISCOUNTS[code];

  if (!rule) {
    alert("Invalid discount code");
    return;
  }

  if (rule.type === "percent") {
    discount = subtotal * rule.value;
  } else {
    discount = rule.value;
  }

  updateTotals();
  rebuildStripe();

}

// =======================
// DISCOUNT UI HANDLER
// =======================
const discountInput = document.getElementById("discount-input");
const applyDiscountBtn = document.getElementById("apply-discount");

applyDiscountBtn.addEventListener("click", () => {
  const code = discountInput.value.trim().toUpperCase();

  if (!DISCOUNTS[code]) {
    errorEl.textContent = "Invalid discount code 💔";
    return;
  }

  errorEl.textContent = "";
  applyDiscount(code);
});

discountInput.addEventListener("input", () => {
  errorEl.textContent = "";
});




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




// =======================
// ADDRESS VALIDATION
// =======================
function isAddressComplete() {
  const fields = [firstName, lastName, address1, city, stateInput, zip, country];
  return fields.every(f => f && f.value.trim() !== "");
}

["change", "blur"].forEach(evt => {
  country.addEventListener(evt, updateTotals);
  stateInput.addEventListener(evt, updateTotals);
});


// =======================
// update totals
// =======================
function updateTotals() {

  const country = document.getElementById("country").value || "US";

  shipping = calculateShipping(country);

  tax = subtotal * 0.05;

  const total = subtotal - discount + shipping + tax;

  localStorage.setItem("cartTotal", Math.round(total * 100));
totalEl.textContent = `$${total.toFixed(2)}`;
shippingEl.textContent = `$${shipping.toFixed(2)}`;
taxEl.textContent = `$${tax.toFixed(2)}`;
}



async function createPaymentIntent() {

  const res = await fetch("/api/create-payment-intent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cart,
    shipping,
    tax,
    discount,
    customerEmail,

    // ✅ SEND THESE
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    address: document.getElementById("address").value,
    apartment: document.getElementById("apartment").value,
    city: document.getElementById("city").value,
    state: document.getElementById("state").value,
    zip: document.getElementById("zip").value,
    country: document.getElementById("country").value
  })
});

  const data = await res.json();

  paymentIntentId = data.paymentIntentId;

  return data.clientSecret;

}



// =======================
// SUBMIT
// =======================

async function ensureStripeMounted() {
  if (elements) return; // already mounted
}


form.addEventListener("submit", async e => {
  e.preventDefault();
 

  if (!isAddressComplete()) {
    errorEl.textContent = "Please complete your delivery address 💕";
    return;
  }
  
  
  
  // Make sure totals are updated
  const finalShipping = shipping;
  const finalTax = tax;
  const finalDiscount = discount;
  const finalSubtotal = subtotal;
  const finalTotal = subtotal - discount + tax + shipping;
 let finalShippingType = "USPS First-Class";

if (shipping === 0) finalShippingType = "Free Shipping";
if (country.value !== "US") finalShippingType = "USPS International";

  // Build order object
  const orderData = {
    items: cart,
    subtotal: finalSubtotal,
    shipping: finalShipping,
    discount: finalDiscount,
    tax: finalTax,
    total: finalTotal,
    shippingType: finalShippingType,
    address: address1.value,
    city: city.value,
    state: stateInput.value,
    zip: zip.value,
    country: country.value
  };

  // Save order to localStorage
  localStorage.setItem("lastOrder", JSON.stringify(orderData));
  console.log("💾 saved lastOrder:", localStorage.getItem("lastOrder"));

  // Slight delay to ensure save completes
  await new Promise(resolve => setTimeout(resolve, 200));  // 200ms

  // Send shipping to Stripe 
  await fetch("/api/update-shipping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: window.paymentIntentId,
      address: {
        name: `${firstName.value} ${lastName.value}`,
        line1: address1.value,
        city: city.value,
        state: stateInput.value,
        zip: zip.value,
        country: country.value
      }
    })
  });
  

  
  // Now confirm payment and let Stripe redirect
  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/success.html`
    }
  });

  if (error) {
    errorEl.textContent = error.message;
    console.error(error);
  }
});


// =======================
// mount stripe element
// =======================



async function mountStripe() {

  const clientSecret = await createPaymentIntent();

  const container = document.getElementById("payment-element");
  container.innerHTML = "";

  elements = stripe.elements({ clientSecret });

  paymentElement = elements.create("payment");

  paymentElement.mount("#payment-element");

}


async function rebuildStripe() {
  await mountStripe();
}






calculateTotals();
updateTotals();
mountStripe();



