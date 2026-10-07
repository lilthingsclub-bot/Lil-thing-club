const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

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

const resend = new Resend(
  process.env.RESEND_API_KEY
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

    // ==================================================
// SEND ORDER CONFIRMATION EMAIL
// ==================================================

if (paymentIntent.receipt_email) {

  try {

    await resend.emails.send({

      from:
        "Lil Things Club <orders@lilthingsclubs.com>",

      to: [
        paymentIntent.receipt_email
      ],

      subject:
        "💗 Your Lil Things Club order is confirmed!",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          color: #5c3f35;
        ">

          <h1 style="text-align:center;">
            💗 Thank you for your order!
          </h1>

          <p>
            Hi ${paymentIntent.metadata.first_name || "there"}!
          </p>

          <p>
            Your Lil Things Club order has been confirmed.
            We're so excited to pack your goodies with love! 🥰
          </p>

          <div style="
            background:#fff5f9;
            border-radius:12px;
            padding:20px;
            margin:20px 0;
          ">

            <h2>Order Details</h2>

            <p>
              <strong>Order total:</strong>
              $${(paymentIntent.amount / 100).toFixed(2)}
            </p>

            <p>
              <strong>Payment:</strong>
              Paid 💗
            </p>

          </div>

          <p>
            We'll let you know when your order ships!
          </p>

          <p>
            Handmade and packed with love to comfort your inner child. 🌷
          </p>

          <p>
            — Lil Things Club 💕
          </p>

        </div>
      `

    });

    console.log(
      "📧 Order confirmation email sent:",
      paymentIntent.receipt_email
    );

  } catch (emailError) {

    console.error(
      "❌ Failed to send order confirmation email:",
      emailError
    );

  }

}

  }


  // ==================================================
  // STRIPE RECEIVED
  // ==================================================

  return res.status(200).json({
    received: true
  });

};
