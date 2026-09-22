const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {

  // =========================
  // ONLY ALLOW GET
  // =========================

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      payment_intent_id
    } = req.query;


    // =========================
    // VALIDATE PAYMENT INTENT
    // =========================

    if (!payment_intent_id) {

      return res.status(400).json({
        error: "Missing payment intent ID"
      });

    }


    // =========================
    // VERIFY PAYMENT WITH STRIPE
    // =========================

    const paymentIntent =
      await stripe.paymentIntents.retrieve(
        payment_intent_id
      );


    if (
      paymentIntent.status !==
      "succeeded"
    ) {

      return res.status(400).json({
        error: "Payment has not been completed"
      });

    }


    // =========================
    // FIND ORDER IN SUPABASE
    // =========================

    const {
      data: order,
      error: orderError
    } = await supabase
      .from("orders")
      .select("*")
      .eq(
        "stripe_payment_id",
        payment_intent_id
      )
      .single();


    if (orderError) {

      console.error(
        "❌ Order lookup failed:",
        orderError
      );

      return res.status(404).json({
        error: "Order not found"
      });

    }


    // =========================
    // RETURN ORDER
    // =========================

    return res.status(200).json({

      success: true,

      order: {

        id:
          order.id,

        stripe_payment_id:
          order.stripe_payment_id,

        customer_email:
          order.customer_email,

        first_name:
          order.first_name,

        last_name:
          order.last_name,

        address:
          order.address,

        apartment:
          order.apartment,

        city:
          order.city,

        state:
          order.state,

        zip:
          order.zip,

        country:
          order.country,

        items:
          order.items,

        subtotal:
          order.subtotal,

        shipping:
          order.shipping,

        tax:
          order.tax,

        discount:
          order.discount,

        total:
          order.total,

        status:
          order.status,

        created_at:
          order.created_at

      }

    });


  } catch (error) {

    console.error(
      "❌ Get order error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to retrieve order"
    });

  }

};
