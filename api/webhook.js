const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


module.exports = async function handler(req, res) {

  // ==================================================
  // ONLY ACCEPT POST
  // ==================================================

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }


  const sig =
    req.headers["stripe-signature"];

  let event;


  // ==================================================
  // VERIFY STRIPE WEBHOOK
  // ==================================================

  try {

    const rawBody =
      await new Promise((resolve, reject) => {

        let data = "";

        req.on(
          "data",
          chunk => {
            data += chunk;
          }
        );

        req.on(
          "end",
          () => resolve(data)
        );

        req.on(
          "error",
          reject
        );

      });


    event =
      stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );


  } catch (err) {

    console.error(
      "❌ Webhook signature verification failed:",
      err.message
    );

    return res
      .status(400)
      .send(
        `Webhook Error: ${err.message}`
      );

  }


  // ==================================================
  // PAYMENT SUCCESS
  // ==================================================

  if (
    event.type ===
    "payment_intent.succeeded"
  ) {

    const paymentIntent =
      event.data.object;


    console.log(
      "💳 Payment succeeded:",
      paymentIntent.id
    );


    // ==================================================
    // GET INVENTORY ITEMS
    // ==================================================

    let inventoryItems = [];


    try {

      inventoryItems =
        JSON.parse(
          paymentIntent.metadata
            .inventory_items || "[]"
        );


    } catch (err) {

      console.error(
        "❌ Failed to parse inventory items:",
        err
      );

      return res.status(400).json({
        error:
          "Invalid inventory data"
      });

    }


    // ==================================================
    // PROCESS ORDER + INVENTORY ATOMICALLY
    // ==================================================

    const {
      data,
      error
    } = await supabase.rpc(
      "process_paid_order",
      {

        p_stripe_payment_id:
          paymentIntent.id,

        p_customer_email:
          paymentIntent.receipt_email ||
          null,

        p_first_name:
          paymentIntent.metadata
            .first_name || null,

        p_last_name:
          paymentIntent.metadata
            .last_name || null,

        p_address:
          paymentIntent.metadata
            .address || null,

        p_apartment:
          paymentIntent.metadata
            .apartment || null,

        p_city:
          paymentIntent.metadata
            .city || null,

        p_state:
          paymentIntent.metadata
            .state || null,

        p_zip:
          paymentIntent.metadata
            .zip || null,

        p_country:
          paymentIntent.metadata
            .country || null,

        p_items:
          inventoryItems,

        p_subtotal:
          Number(
            paymentIntent.metadata
              .subtotal || 0
          ),

        p_shipping:
          Number(
            paymentIntent.metadata
              .shipping || 0
          ),

        p_tax:
          Number(
            paymentIntent.metadata
              .tax || 0
          ),

        p_discount:
          Number(
            paymentIntent.metadata
              .discount || 0
          ),

        p_total:
          paymentIntent.amount / 100

      }
    );


    // ==================================================
    // DATABASE ERROR
    // ==================================================

    if (error) {

      console.error(
        "❌ Order/inventory processing failed:",
        error
      );

      return res.status(500).json({
        error:
          "Order processing failed"
      });

    }


    // ==================================================
    // DUPLICATE WEBHOOK
    // ==================================================

    if (
      data &&
      data.already_processed === true
    ) {

      console.log(
        "ℹ️ Payment already processed:",
        paymentIntent.id
      );

      return res.status(200).json({
        received: true,
        already_processed: true
      });

    }


    // ==================================================
    // SUCCESS
    // ==================================================

    console.log(
      "✅ Order saved and inventory updated:",
      data
    );

  }


  // ==================================================
  // STRIPE RECEIVED
  // ==================================================

  return res.status(200).json({
    received: true
  });

};
