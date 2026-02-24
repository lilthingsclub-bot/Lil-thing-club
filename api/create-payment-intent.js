import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    const {
      cart = [],
      shipping = 0,
      tax = 0,
      discount = 0,
      customerEmail
    } = req.body;

    // ✅ 1. Calculate subtotal from cart (server-side)
    let subtotal = 0;

    cart.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    // ✅ 2. Calculate final total
    const finalTotal = subtotal + shipping + tax - discount;

    if (finalTotal <= 0) {
      return res.status(400).json({ error: "Invalid total amount" });
    }

    // Stripe needs cents
    const amountInCents = Math.round(finalTotal * 100);

    // ✅ 3. Create payment intent securely
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      receipt_email: customerEmail,
      metadata: {
        items: JSON.stringify(cart),
        subtotal: String(subtotal),
        shipping: String(shipping),
        tax: String(tax),
        discount: String(discount)
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
