const stripe = Stripe("pk_test_51RlDSnAwiQXA8rArN1XBgh1V3E2gQR8yG1WkChVpaPwWr5hi2E0nMrGmBCAEamvX9flDIo6BoItg3jCEYkUbaosi00fVHDWx90");

async function initCheckout() {
  const total = JSON.parse(localStorage.getItem("cartTotal")) || 500;

  const res = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: total }),
  });

  const { clientSecret } = await res.json();

  const elements = stripe.elements({ clientSecret });
  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");

  document
    .getElementById("payment-form")
    .addEventListener("submit", async e => {
      e.preventDefault();

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: "/success.html",
        },
      });

      if (error) {
        document.getElementById("error-message").textContent =
          error.message;
      }
    });
}

initCheckout();
