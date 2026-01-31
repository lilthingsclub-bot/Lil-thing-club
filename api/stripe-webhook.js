import Stripe from "stripe";
import fetch from "node-fetch";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;

    await fetch(process.env.GOOGLE_SHEET_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
  orderId: pi.id,
  email: pi.receipt_email || "",
  items: pi.metadata.items,
  subtotal: pi.metadata.subtotal,
  shipping: pi.metadata.shipping,
  tax: pi.metadata.tax,
  discount: pi.metadata.discount,
  total: pi.amount_received / 100,
  country: pi.metadata.country,
  state: pi.metadata.state,
  address: pi.metadata.address,
  city: pi.metadata.city,
  zip: pi.metadata.zip
})

    });
  }

  res.json({ received: true });
}
