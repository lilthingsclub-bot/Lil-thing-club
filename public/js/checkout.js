console.log("✅ checkout.js loaded");

let subtotal = 0;
let shipping = 0;
let tax = 0;
let discount = 0;
let totalWeight = 0;
let shippingType = "FLAT_MAIL";
let elements;


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
// CART RENDER
// =======================
function renderCart() {
  itemsEl.innerHTML = "";
  subtotal = 0;
  totalWeight = 0;

  cart.forEach(item => {
    subtotal += item.price * item.qty;
    totalWeight += resolveWeight(item) * item.qty;

    itemsEl.innerHTML += `
      <div class="summary-item">
        <span>${item.name} × ${item.qty}</span>
        <span>$${(item.price * item.qty).toFixed(2)}</span>
      </div>
    `;
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
// SHIPPING LOGIC 
// ======================= 

function getShippingType(cart) {
 const bulkyCategories = ["crochet-keychain","crochet-plush","keychain","phone-charm"]; 
return cart.some(item =>
 bulkyCategories.includes(item.category)) ? "GROUND" : 
"FLAT_MAIL";
 } 
function qualifiesForFreeShipping(cart, weightOz) {
 const stickerOnly = cart.every(item => item.category 
&& item.category.includes("sticker")); 
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
  const selectedCountry = country.value || "US";
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

  discount =
    DISCOUNTS[code] < 1
      ? subtotal * DISCOUNTS[code]
      : DISCOUNTS[code];

  updateTotals();
}


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
// TOTALS
// =======================
function updateTotals() {
  updateShipping();

  const stateCode = stateInput.value.toUpperCase();
  tax = subtotal * (TAX_RATES[stateCode] ?? TAX_RATES.default);

  taxEl.textContent = `$${tax.toFixed(2)}`;
  shippingEl.textContent =
    shipping === 0 ? "FREE 💕" : `$${shipping.toFixed(2)}`;

  const total = subtotal - discount + tax + shipping;
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
    body: JSON.stringify({
      amount,
      cart,
      shipping,
      tax,
      weight: totalWeight,
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

  const { clientSecret } = await res.json();

  if (!elements) {
    elements = stripe.elements({ clientSecret });
    elements.create("payment").mount("#payment-element");
  } else {
    elements.update({ clientSecret });
  }
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
      return_url: `${window.location.origin}/success.html`,

      shipping: {
        name: `${firstName.value} ${lastName.value}`,
        address: {
          line1: address1.value,
          city: city.value,
          state: stateInput.value,
          postal_code: zip.value,
          country: country.value
        }
      }
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
