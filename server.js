// server.js
const express = require("express");
const app = express();
const path = require("path");
const stripe = require("stripe")("sk_test_51RlDSnAwiQXA8rArDnlBifCi8xnjLsQIcUE4QJfP6gpJa094CM7PDG6JdITJJ0jeZdXCto5M0eXodijU4wIVcG1a00D3Pui4Jt"); // <-- Replace with your Stripe TEST secret key

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =======================
// CREATE PAYMENT INTENT
// =======================
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
