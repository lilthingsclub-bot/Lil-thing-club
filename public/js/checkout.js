console.log("✅ checkout.js loaded");

let stripe;
let elements;
let paymentElement;
let paymentIntentId = null;

let subtotal = 0;
let shipping = 0;
let tax = 0;
let discount = 0;
let totalWeight = 0;

const cart = JSON.parse(localStorage.getItem("cart")) || [];

// =======================
// STRIPE INIT
// =======================

stripe = Stripe(
  "pk_live_51RlDSnAwiQXA8rArpM7tGeciUvTB9eCuTXQsSARiDt8d0vDE96AfxEAoyQZFnCNVJ67c2IBBH9R0DBRZRCxm7AMr00BulSGmwF"
);

// =======================
// DOM ELEMENTS
// =======================

const itemsEl = document.getElementById("order-items");
const totalEl = document.getElementById("order-total");
const shippingEl = document.getElementById("shipping-cost");
const taxEl = document.getElementById("tax-amount");
const errorEl = document.getElementById("error-message");
const form = document.getElementById("payment-form");

const emailInput = document.getElementById("email");

const firstName = document.getElementById("first-name");
const lastName = document.getElementById("last-name");
const address1 = document.getElementById("address-line1");
const apartment = document.getElementById("apartment");
const city = document.getElementById("city");
const stateInput = document.getElementById("state");
const zip = document.getElementById("zip");
const country = document.getElementById("country");

const discountInput = document.getElementById("discount-input");
const applyDiscountBtn = document.getElementById("apply-discount");
const continuePaymentBtn =
  document.getElementById("continue-to-payment");

// =======================
// CATEGORY WEIGHTS
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


// =======================
// WEIGHT
// =======================

function resolveWeight(item) {
  return Number(
    item.weight ||
    CATEGORY_WEIGHTS[item.category] ||
    1
  );
}


// =======================
// CALCULATE CART
// =======================

function calculateTotals() {

  subtotal = 0;
  totalWeight = 0;

  cart.forEach(item => {

    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;

    subtotal += price * qty;

    totalWeight += resolveWeight(item) * qty;
  });

}


// =======================
// RENDER ORDER ITEMS
// =======================

function renderOrderItems() {

  if (!itemsEl) return;

  itemsEl.innerHTML = "";

  cart.forEach(item => {

    const itemTotal =
      (Number(item.price) || 0) *
      (Number(item.qty) || 0);

    const row = document.createElement("div");

    row.className = "checkout-order-item";

    row.innerHTML = `
      <div class="checkout-item-info">
        <img
          src="${item.image}"
          alt="${item.name}"
          class="checkout-item-image"
        >

        <div>
          <strong>${item.name}</strong>
          <small>
            ${item.option || "Standard"} × ${item.qty}
          </small>
        </div>
      </div>

      <span>$${itemTotal.toFixed(2)}</span>
    `;

    itemsEl.appendChild(row);
  });
}


// =======================
// SHIPPING
// =======================

function calculateShipping(countryCode) {

  if (subtotal >= 30) {
    return 0;
  }

  if (countryCode !== "US") {
    return 15;
  }

  if (totalWeight <= 1) {
    return 0.95;
  }

  if (totalWeight <= 2) {
    return 1.95;
  }

  if (totalWeight <= 4) {
    return 7.95;
  }

  return 9.55;
}


// =======================
// DISCOUNTS
// =======================

const DISCOUNTS = {
  WELCOME10: {
    type: "percent",
    value: 0.10
  },

  LIL5: {
    type: "fixed",
    value: 5
  }
};

function applyDiscount(code) {

  const rule = DISCOUNTS[code];

  if (!rule) {
    errorEl.textContent = "Invalid discount code 💔";
    return;
  }

  if (rule.type === "percent") {
    discount = subtotal * rule.value;
  } else {
    discount = Math.min(rule.value, subtotal);
  }

  updateTotals();

  rebuildStripe();
}


// =======================
// DISCOUNT BUTTON
// =======================

applyDiscountBtn.addEventListener("click", () => {

  const code = discountInput.value
    .trim()
    .toUpperCase();

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
// ADDRESS VALIDATION
// =======================

function isAddressComplete() {

  const fields = [
    emailInput,
    firstName,
    lastName,
    address1,
    city,
    stateInput,
    zip,
    country
  ];

  return fields.every(
    field =>
      field &&
      field.value.trim() !== ""
  );
}


// =======================
// TAX
// =======================

function calculateTax() {

  // Keep your current 5% tax logic.
  return subtotal * 0.05;
}


// =======================
// UPDATE TOTALS
// =======================

function updateTotals() {

  const countryCode =
    country.value || "US";

  shipping =
    calculateShipping(countryCode);

  tax =
    calculateTax();

  const total =
    subtotal -
    discount +
    shipping +
    tax;

  localStorage.setItem(
    "cartTotal",
    Math.round(total * 100)
  );

  totalEl.textContent =
    `$${total.toFixed(2)}`;

  shippingEl.textContent =
    `$${shipping.toFixed(2)}`;

  taxEl.textContent =
    `$${tax.toFixed(2)}`;

  const discountRow =
    document.getElementById("discount-row");

  const discountAmount =
    document.getElementById("discount-amount");

  if (discount > 0) {

    if (discountRow) {
      discountRow.style.display = "flex";
    }

    if (discountAmount) {
      discountAmount.textContent =
        `-$${discount.toFixed(2)}`;
    }

  } else {

    if (discountRow) {
      discountRow.style.display = "none";
    }
  }
}


// =======================
// CREATE PAYMENT INTENT
// =======================

async function createPaymentIntent() {

  const customerEmail =
    emailInput.value.trim();

  const res = await fetch(
    "/api/create-payment-intent",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        cart,

        shipping,
        tax,
        discount,

        customerEmail,

        firstName: firstName.value,
        lastName: lastName.value,

        address: address1.value,

        apartment:
          apartment?.value || "",

        city: city.value,
        state: stateInput.value,
        zip: zip.value,
        country: country.value

      })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error ||
      "Unable to create payment."
    );
  }

  paymentIntentId =
    data.paymentIntentId;

  return data.clientSecret;
}


// =======================
// MOUNT STRIPE
// =======================

async function mountStripe() {

  if (!isAddressComplete()) {

    errorEl.textContent =
      "Please complete your contact and delivery information first 💕";

    return false;
  }

  calculateTotals();
  updateTotals();

  const clientSecret =
    await createPaymentIntent();

  if (!clientSecret) {
    throw new Error(
      "Stripe did not return a payment client secret."
    );
  }

  const container =
    document.getElementById("payment-element");

  if (!container) {
    throw new Error(
      "Payment element container was not found."
    );
  }

  container.innerHTML = "";

  elements =
    stripe.elements({
      clientSecret
    });

  paymentElement =
    elements.create("payment");

  paymentElement.mount(
    "#payment-element"
  );

  errorEl.textContent = "";

  return true;
}

// =======================
// REBUILD STRIPE
// =======================

async function rebuildStripe() {

  if (!isAddressComplete()) {
    return;
  }

  await mountStripe();
}


// =======================
// CONTINUE TO PAYMENT
// =======================

continuePaymentBtn.addEventListener("click", async () => {

  errorEl.textContent = "";

  // Make sure customer information is complete
  if (!isAddressComplete()) {

    errorEl.textContent =
      "Please complete your contact and delivery information 💕";

    return;
  }

  continuePaymentBtn.disabled = true;
  continuePaymentBtn.textContent =
    "Loading payment... 💕";

  try {

    calculateTotals();
    updateTotals();

    const mounted =
  await mountStripe();

// Only show payment if Stripe mounted successfully
if (mounted && elements) {

      continuePaymentBtn.style.display = "none";

      form.classList.remove("hidden-payment");

      form.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  } catch (error) {

    console.error(
      "❌ Payment setup error:",
      error
    );

    errorEl.textContent =
      error.message ||
      "Unable to load payment. Please try again.";

    continuePaymentBtn.disabled = false;

    continuePaymentBtn.textContent =
      "Continue to Payment 💕";
  }

});

// =======================
// SUBMIT PAYMENT
// =======================

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    errorEl.textContent = "";

    // Make sure Stripe has been mounted
    if (!elements) {

      errorEl.textContent =
        "Please continue to payment first 💕";

      return;
    }

    // Recalculate everything before payment
    calculateTotals();
    updateTotals();

    const finalTotal =
      subtotal -
      discount +
      shipping +
      tax;

    const finalShippingType =
      shipping === 0
        ? "Free Shipping"
        : country.value !== "US"
          ? "USPS International"
          : "USPS First-Class";


    // =======================
    // SAVE ORDER INFO
    // =======================

    const orderData = {

      items: cart,

      subtotal,

      shipping,

      discount,

      tax,

      total: finalTotal,

      shippingType:
        finalShippingType,

      email:
        emailInput.value,

      firstName:
        firstName.value,

      lastName:
        lastName.value,

      address:
        address1.value,

      apartment:
        apartment?.value || "",

      city:
        city.value,

      state:
        stateInput.value,

      zip:
        zip.value,

      country:
        country.value
    };

    localStorage.setItem(
      "lastOrder",
      JSON.stringify(orderData)
    );

    console.log(
      "💾 saved lastOrder:",
      orderData
    );


    // =======================
    // CONFIRM STRIPE PAYMENT
    // =======================

    const { error } =
      await stripe.confirmPayment({

        elements,

        confirmParams: {

          return_url:
            `${window.location.origin}/success.html`

        }

      });

    if (error) {

      errorEl.textContent =
        error.message;

      console.error(
        "❌ Stripe payment error:",
        error
      );
    }

  }
);


// =======================
// COUNTRY / ADDRESS CHANGES
// =======================

[
  country,
  stateInput
].forEach(field => {

  field.addEventListener(
    "change",
    () => {

      calculateTotals();
      updateTotals();

    }
  );

});


// =======================
// INITIALIZE
// =======================

calculateTotals();

renderOrderItems();

updateTotals();

console.log(
  "🛒 Cart:",
  cart
);

console.log(
  "💰 Subtotal:",
  subtotal
);

console.log(
  "⚖️ Weight:",
  totalWeight
);
