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
    // GET ORDER ITEMS
    // =========================

    const orderItems =
      Array.isArray(order.items)
        ? order.items
        : [];


    // Get all variant IDs from the order

    const variantIds =
      orderItems
        .map(item => item.variantId)
        .filter(Boolean);


    let enrichedItems = [];


    if (variantIds.length > 0) {

      // =========================
      // LOOK UP VARIANTS + PRODUCTS
      // =========================

      const {
        data: variants,
        error: variantsError
      } = await supabase
        .from("product_variants")
        .select(`
          id,
          product_id,
          name,
          label,
          price,
          products (
            name,
            images
          )
        `)
        .in("id", variantIds);


      if (variantsError) {

        console.error(
          "❌ Product lookup failed:",
          variantsError
        );

        return res.status(500).json({
          error: "Unable to load product information"
        });

      }


      // =========================
      // COMBINE ORDER + PRODUCT DATA
      // =========================

      enrichedItems =
        orderItems.map(item => {

          const variant =
            variants.find(
              v =>
                v.id === item.variantId
            );


          if (!variant) {

            return {
              variantId:
                item.variantId,

              qty:
                item.qty,

              name:
                "Product",

              image:
                null,

              price:
                0
            };

          }


          const product =
            Array.isArray(variant.products)
              ? variant.products[0]
              : variant.products;


          return {

            variantId:
              item.variantId,

            qty:
              item.qty,

            name:
              product?.name ||
              "Product",

            image:
              Array.isArray(product?.images)
                ? product.images[0]
                : product?.images || null,

            variant:
              variant.label ||
              variant.name ||
              "",

            price:
              Number(variant.price || 0)

          };

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
          enrichedItems,

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
