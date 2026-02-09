import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { paymentIntentId, address } = req.body;

  try {
    await stripe.paymentIntents.update(paymentIntentId, {
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
        country: address.country
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
