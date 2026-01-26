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



function calculateShipping(cart, method, country) {
  const totalWeight = cart.reduce((sum, item) => sum + item.weight * item.qty, 0);
  const hasNonSticker = cart.some(item => item.type !== "sticker");
  const stickerCount = cart.filter(i => i.type === "sticker")
                            .reduce((s, i) => s + i.qty, 0);

  if (country !== "US") {
    return 12.00; // placeholder international
  }

  if (!hasNonSticker && stickerCount <= 4 && totalWeight < 1) {
    if (method === "untracked") return 0.78;
  }

  // Tracked USPS-style tiers
  if (totalWeight <= 4) return method === "expedited" ? 8.50 : 4.00;
  if (totalWeight <= 8) return method === "expedited" ? 10.50 : 6.00;

  return 12.00;
}





let tipAmount = 0;

document.querySelectorAll(".tip-options button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tip-options button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    const percent = btn.innerText.replace("%", "");
    tipAmount = percent === "None" ? 0 : subtotal * (percent / 100);
    updateTotal();
  });
});



const DISCOUNTS = {
  "WELCOME10": 0.10,
  "LILTHINGS": 5.00 // flat
};

function applyDiscount(code) {
  if (!DISCOUNTS[code]) return 0;

  return DISCOUNTS[code] < 1
    ? subtotal * DISCOUNTS[code]
    : DISCOUNTS[code];
}


let subtotal = 0;
let shipping = 0;
let discount = 0;
let total = 0;

function updateTotals() {
  subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  total = subtotal - discount + shipping + tipAmount;

  document.querySelector("#subtotal").innerText = subtotal.toFixed(2);
  document.querySelector("#shipping").innerText = shipping.toFixed(2);
  document.querySelector("#total").innerText = total.toFixed(2);
}

document.querySelectorAll("input[name='shipping']").forEach(radio => {
  radio.addEventListener("change", () => {
    shipping = calculateShipping(cart, radio.value, country);
    document.querySelector(".pay-now").classList.add("enabled");
    updateTotals();
  });
});
