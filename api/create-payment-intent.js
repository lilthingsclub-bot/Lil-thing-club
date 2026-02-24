import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    const {
      amount,
      cart,
      subtotal = 0,
      shipping = 0,
      tax = 0,
      discount = 0,
      customerEmail   // ✅ ADD THIS
    } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        items: JSON.stringify(cart || []),
        subtotal: String(subtotal),
        shipping: String(shipping),
        tax: String(tax),
        discount: String(discount),
        email: customerEmail || ""   // ✅ SAFE
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error("❌ Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
}
