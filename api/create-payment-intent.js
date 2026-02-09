const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency: "usd",
  metadata: {
    items: cart.map(i => `${i.name} x${i.qty}`).join(", "),
    shipping_cost: shipping,
    tax
  }
});
