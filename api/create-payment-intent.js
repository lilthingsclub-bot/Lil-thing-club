const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency: "usd",
  metadata: {
    items: cart.map(i => `${i.name} x${i.qty}`).join(", "),
    shipping_cost: shipping,
    tax
  }
});

res.status(200).json({
  clientSecret: paymentIntent.client_secret,
  paymentIntentId: paymentIntent.id
});
