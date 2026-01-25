const stripe = Stripe("pk_test_51RlDSnAwiQXA8rArN1XBgh1V3E2gQR8yG1WkChVpaPwWr5hi2E0nMrGmBCAEamvX9flDIo6BoItg3jCEYkUbaosi00fVHDWx90");

let total = 0;
const cart = JSON.parse(localStorage.getItem("cart")) || [];

cart.forEach(item => {
  total += item.price * item.qty;
});

document.getElementById("total").textContent = `$${total.toFixed(2)}`;

const elements = stripe.elements();
const card = elements.create("card", {
  style: {
    base: {
      fontFamily: "Poppins, sans-serif",
      fontSize: "16px",
      color: "#444"
    }
  }
});
card.mount("#card-element");

const form = document.getElementById("payment-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch("/.netlify/functions/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: total })
  });

  const { clientSecret } = await res.json();

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card }
  });

  if (result.error) {
    document.getElementById("error-message").textContent = result.error.message;
  } else {
    window.location.href = "success.html";
  }
});
