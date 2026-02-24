
console.log("✅ checkout.js loaded");
document.addEventListener("DOMContentLoaded", () => {
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
const stripe = Stripe("pk_live_51RlDSnAwiQXA8rArpM7tGeciUvTB9eCuTXQsSARiDt8d0vDE96AfxEAoyQZFnCNVJ67c2IBBH9R0DBRZRCxm7AMr00BulSGmwF");

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

function isDigitalOnly(cart) {
  return cart.every(item => item.type === "digital");
}

function isStickerOnly(cart) {
  return cart.every(item =>
    item.category &&
    (item.category.includes("sticker") || item.category.includes("sticker sheet"))
  );
}

function hasBulkyItem(cart) {
  const bulkyCategories = [
    "crochet-keychain",
    "crochet-plush",
    "keychain",
    "phone-charm"
  ];
  return cart.some(item => bulkyCategories.includes(item.category));
}


function getShippingType(cart, weightOz) {
  if (isDigitalOnly(cart)) return "DIGITAL";

  if (isStickerOnly(cart) && weightOz <= 3) {
    return "UNTRACKED";
  }

  if (hasBulkyItem(cart)) {
    return "GROUND";
  }

  return "FIRST_CLASS";
}


function qualifiesForFreeShipping(cart, subtotal) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (subtotal >= 20) return true;
  if (itemCount >= 6) return true;

  return false;
}


function calculateUSPSDomestic(weightOz, shippingType) {
  if (shippingType === "UNTRACKED") {
    if (weightOz < 1) return 0.75;
    if (weightOz <= 1) return 1.50;
    if (weightOz <= 3) return 2.50;
    if (weightOz <= 6) return 3.50;
  }

  // Tracked
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


function calculateShipping(cart, weightOz, subtotal, country) {
  if (isDigitalOnly(cart)) return 0;

  if (qualifiesForFreeShipping(cart, subtotal)) return 0;

  const shippingType = getShippingType(cart, weightOz);

  if (country !== "US") {
    return calculateUSPSInternational(weightOz);
  }

  return calculateUSPSDomestic(weightOz, shippingType);
}



function getShippingLabel(cart, weightOz, subtotal, country) {
  if (isDigitalOnly(cart)) return "Digital delivery";

  if (qualifiesForFreeShipping(cart, subtotal)) {
    return "Free shipping 💕";
  }

  if (country !== "US") return "USPS International";

  const type = getShippingType(cart, weightOz);

  switch (type) {
    case "UNTRACKED":
      return "Untracked mail";
    case "GROUND":
      return "USPS Ground";
    default:
      return "USPS First-Class";
  }
}


function updateShipping() {
  const selectedCountry = country.value || "US";

  shipping = calculateShipping(cart, totalWeight, subtotal, selectedCountry);

  shippingEl.textContent =
    shipping === 0
      ? "FREE 💕"
      : `${getShippingLabel(cart, totalWeight, subtotal, selectedCountry)} – $${shipping.toFixed(2)}`;
}

function hasPromoFreeShipping(cart, subtotal) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  return subtotal >= 20 || itemCount >= 6;
}


function getFreeShippingMessage(cart, subtotal) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (subtotal >= 20 || itemCount >= 6) return null;

  const dollarsLeft = Math.max(0, 20 - subtotal).toFixed(2);
  const itemsLeft = Math.max(0, 6 - itemCount);

  if (dollarsLeft > 0 && itemsLeft > 0) {
    return `Only $${dollarsLeft} or ${itemsLeft} item(s) away from free shipping 💕`;
  }

  if (dollarsLeft > 0) {
    return `Only $${dollarsLeft} more for free shipping 💕`;
  }

  if (itemsLeft > 0) {
    return `Add ${itemsLeft} more item(s) for free shipping 💕`;
  }

  return null;
}




// ======================= 
// DISCOUNTS 
// ======================= 
const DISCOUNTS = {
  WELCOME10: { type: "percent", value: 0.10 },
  LIL5: { type: "fixed", value: 5.00 }
};
function applyDiscount(code) {
  if (hasPromoFreeShipping(cart, subtotal)) {
  promoMessageText.textContent =
  "Free shipping applied -- discounts unavailable ";
promoMessageRow.style.display = "flex";

discount = 0;
updateTotals();
return;
  }

  const rule = DISCOUNTS[code];
  if (!rule) {
    errorEl.textContent = "Invalid discount code 💔";
    return;
  }

  errorEl.textContent = "";

  if (rule.type === "percent") {
    discount = subtotal * rule.value;
  } else {
    discount = rule.value;
  }

  updateTotals();
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

  // DISCOUNT DISPLAY
  const discountRow = document.getElementById("discount-row");
  const discountAmountEl = document.getElementById("discount-amount");

  if (discount > 0) {
    discountRow.style.display = "flex";
    discountAmountEl.textContent = `-$${discount.toFixed(2)}`;
  } else {
    discountRow.style.display = "none";
  }


  const total = subtotal - discount + tax + shipping;
  totalEl.textContent = `$${total.toFixed(2)}`;

  localStorage.setItem("cartTotal", Math.round(total * 100));
}

  



// =======================
// STRIPE SETUP (ONE ONLY)
// =======================
async function setupStripe() {
  const amount = Number(localStorage.getItem("cartTotal"));
  console.log("🧠 setupStripe() amount:", amount);

  if (!amount || amount <= 0) {
    console.error("❌ Invalid amount, Stripe not mounted");
    return;
  }

  const res = await fetch("/api/create-payment-intent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cart,
    shipping,
    tax,
    discount,
    customerEmail: emailInput.value,
    firstName: firstName.value,
    lastName: lastName.value,
    address: address1.value,
    apartment: "", // optional for now (add input later if you want)
    city: city.value,
    state: stateInput.value,
    zip: zip.value,
    country: country.value
  })
});

  const data = await res.json();
  console.log("💳 PaymentIntent response:", data);

  if (!data.clientSecret) {
    console.error("❌ No clientSecret returned");
    return;
  }

  // ✅ SAVE THIS
  window.paymentIntentId = data.paymentIntentId;

  if (!elements) {
    elements = stripe.elements({ clientSecret: data.clientSecret });
    elements.create("payment").mount("#payment-element");
    console.log("✅ Stripe mounted");
  }
}




// =======================
// SUBMIT
// =======================

async function ensureStripeMounted() {
  if (elements) return; // already mounted

  await setupStripe();
}


form.addEventListener("submit", async e => {
  e.preventDefault();
  await setupStripe();

  if (!isAddressComplete()) {
    errorEl.textContent = "Please complete your delivery address 💕";
    return;
  }

  errorEl.textContent = "";

  // Make sure totals are updated
  const finalShipping = shipping;
  const finalTax = tax;
  const finalDiscount = discount;
  const finalSubtotal = subtotal;
  const finalTotal = subtotal - discount + tax + shipping;
  const finalShippingType = getShippingLabel(cart, totalWeight, subtotal, country.value);

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
// INIT
// =======================
renderCart();
updateTotals();


});

