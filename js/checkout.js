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

const cart = JSON.parse(localStorage.getItem("cart")) || [];
const itemsEl = document.getElementById("order-items");
const totalEl = document.getElementById("order-total");
const shippingEl = document.getElementById("shipping-cost");

let subtotal = 0;

cart.forEach(item => {
  subtotal += item.price * item.qty;

  const div = document.createElement("div");
  div.className = "summary-item";
  div.innerHTML = `
    <span>${item.name} × ${item.qty}</span>
    <span>$${(item.price * item.qty).toFixed(2)}</span>
  `;
  itemsEl.appendChild(div);
});




const hasCrochet = cart.some(item =>
  item.category?.includes("crochet")
);

const shipping = hasCrochet ? 6.0 : 1.5;
shippingEl.textContent = `$${shipping.toFixed(2)}`;

const total = subtotal + shipping;
totalEl.textContent = `$${total.toFixed(2)}`;






const appearance = {
  theme: "flat",
  variables: {
    colorPrimary: "#ff66c4",
    colorBackground: "#fff7fb",
    colorText: "#5a2a42",
    borderRadius: "12px",
    fontFamily: "Nunito, sans-serif"
  }
};

elements = stripe.elements({ appearance, clientSecret });





function getCartWeight(cart) {
  return cart.reduce((sum, item) => {
    return sum + (item.weight * item.qty);
  }, 0);
}


function getTrackedShippingByWeight(weightOz) {
  if (weightOz <= 4) return 4.5;
  if (weightOz <= 8) return 5.5;
  if (weightOz <= 12) return 6.5;
  return 8.5;
}


const STICKER_CATEGORIES = ["sticker-sheet", "vinyl-sticker"];

const isStickerOnly = cart.every(item =>
  STICKER_CATEGORIES.includes(item.category)
);

const totalStickerQty = cart
  .filter(item => STICKER_CATEGORIES.includes(item.category))
  .reduce((sum, item) => sum + item.qty, 0);

const totalWeight = getCartWeight(cart);

let shippingOptions = [];
let shippingCost = null;

// Sticker-only logic
if (isStickerOnly && totalStickerQty <= 4 && totalWeight <= 1) {
  shippingOptions = [
    { type: "untracked", label: "Untracked Letter (3–7 days)", cost: 0.78 },
    { type: "tracked", label: "Tracked USPS First Class", cost: 4.5 }
  ];
} else {
  shippingOptions = [
    {
      type: "tracked",
      label: "Tracked USPS First Class",
      cost: getTrackedShippingByWeight(totalWeight)
    }
  ];
}


const shippingContainer = document.getElementById("shipping-options");
const payBtn = document.getElementById("payBtn");

shippingOptions.forEach(option => {
  const label = document.createElement("label");

  label.innerHTML = `
    <input type="radio" name="shipping" value="${option.cost}">
    ${option.label} — $${option.cost.toFixed(2)}
  `;

  shippingContainer.appendChild(label);
});


document.querySelectorAll('input[name="shipping"]').forEach(radio => {
  radio.addEventListener("change", e => {
    shippingCost = parseFloat(e.target.value);

    updateTotal();
    payBtn.disabled = false;
    document.querySelector(".checkout-note").style.display = "none";
  });
});


function updateTotal() {
  const total = subtotal + shippingCost;
  totalEl.textContent = `$${total.toFixed(2)}`;
}

