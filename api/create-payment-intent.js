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

    // ✅ 1. Calculate subtotal safely
    let subtotal = 0;

    cart.forEach((item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      subtotal += price * qty;
    });

    const shippingNum = Number(shipping) || 0;
    const taxNum = Number(tax) || 0;
    const discountNum = Number(discount) || 0;

    // ✅ 2. Calculate final total
    const finalTotal = subtotal + shippingNum + taxNum - discountNum;

    if (!finalTotal || finalTotal <= 0) {
      return res.status(400).json({ error: "Invalid total amount" });
    }

    const amountInCents = Math.round(finalTotal * 100);

    // ✅ 3. Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      receipt_email: customerEmail || undefined,
      metadata: {
        items: JSON.stringify(cart),
        subtotal: String(subtotal),
        shipping: String(shippingNum),
        tax: String(taxNum),
        discount: String(discountNum)
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
