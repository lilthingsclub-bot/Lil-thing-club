import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const rawBody = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => resolve(data));
    });

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ HANDLE SUCCESSFUL PAYMENT
if (event.type === "payment_intent.succeeded") {
  const paymentIntent = event.data.object;

  let items = [];
  try {
    items = JSON.parse(paymentIntent.metadata.items || "[]");
  } catch (err) {
    console.error("❌ Failed to parse items:", err);
  }

  const { error } = await supabase.from("orders").insert([
    {
      stripe_payment_id: paymentIntent.id,
      customer_email: paymentIntent.metadata.email || null,
      items: items,
      subtotal: Number(paymentIntent.metadata.subtotal || 0),
      shipping: Number(paymentIntent.metadata.shipping || 0),
      tax: Number(paymentIntent.metadata.tax || 0),
      discount: Number(paymentIntent.metadata.discount || 0),
      total: paymentIntent.amount / 100
    }
  ]);

  if (error) {
    console.error("❌ Supabase insert error:", error);
    return res.status(500).json({ error });
  }

  console.log("✅ Order saved to database");
}

res.status(200).json({ received: true });
