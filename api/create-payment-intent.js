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

    shipping: {
  name: address.name,
  address: {
    line1: address.line1,
    city: address.city,
    state: address.state,
    postal_code: address.zip,
    country: address.country
  }
},
    
  metadata: {
    customer_name: address.name,
    address_line1: address.line1,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,

    shipping_cost: shipping,
    tax: tax,

    items: cart
      .map(item => `${item.name} x${item.qty}`)
      .join(", ")
  }
});

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
