import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, cart, shipping, tax, address } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },

      metadata: {
        items: JSON.stringify(
          cart.map(i => `${i.name} x${i.qty}`)
        ),
        shipping_cost: shipping?.toString() || "0",
        tax: tax?.toString() || "0",
        customer_name: address?.name || "",
        address_line1: address?.address || "",
        city: address?.city || "",
        state: address?.state || "",
        zip: address?.zip || "",
        country: address?.country || ""
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
