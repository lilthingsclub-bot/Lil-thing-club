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

