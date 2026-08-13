// ======================================================
// LIL THINGS CLUB - SUPABASE PRODUCT PAGE
// ======================================================

document.addEventListener("DOMContentLoaded", loadProduct);


// ======================================================
// LOAD PRODUCT
// ======================================================

async function loadProduct() {

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    showProductError("No product was specified.");
    return;
  }

  console.log("Loading product:", slug);


  // Get product + variants from Supabase
  const { data: product, error } = await supabaseClient
    .from("products")
    .select(`
      id,
      slug,
      name,
      brand,
      description,
      categories,
      tags,
      images,
      features,
      active,
      is_new,
      featured,

      product_variants (
        id,
        name,
        label,
        price,
        weight,
        sort_order
      )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();


  if (error) {

    console.error("Supabase product error:", error);

    showProductError(
      "We couldn't load this product."
    );

    return;
  }


  if (!product) {

    showProductError(
      "Product not found."
    );

    return;
  }


  console.log("Product loaded:", product);


  // Sort variants
  const variants =
    [...(product.product_variants || [])]
      .sort(
        (a, b) =>
          (a.sort_order || 0) -
          (b.sort_order || 0)
      );


  // Store current product globally
  window.CURRENT_PRODUCT = product;
  window.CURRENT_VARIANTS = variants;


  // ====================================================
  // PRODUCT NAME
  // ====================================================

  const productName =
    document.getElementById("productName");

  if (productName) {
    productName.textContent =
      product.name || "";
  }


  // ====================================================
  // BRAND
  // ====================================================

  const brandElement =
    document.querySelector(".brand");

  if (brandElement) {

    brandElement.textContent =
      product.brand || "Lil Things Club";

  }


  // ====================================================
  // DESCRIPTION
  // ====================================================

  const descriptionElement =
    document.querySelector(".desc p");

  if (descriptionElement) {

    descriptionElement.textContent =
      product.description || "";

  }


  // ====================================================
  // FEATURES
  // ====================================================

  const featuresList =
    document.querySelector(".features ul");

  if (featuresList) {

    featuresList.innerHTML = "";

    const productFeatures =
      Array.isArray(product.features)
        ? product.features
        : [];


    productFeatures.forEach(feature => {

      const li =
        document.createElement("li");

      li.textContent = feature;

      featuresList.appendChild(li);

    });

  }


  // ====================================================
  // IMAGES
  // ====================================================

  setupProductImages(
    product.images || []
  );


  // ====================================================
  // VARIANTS
  // ====================================================

  setupVariants(
    variants,
    product
  );


  // ====================================================
  // QUANTITY
  // ====================================================

  setupQuantity();


  // ====================================================
  // ADD TO CART
  // ====================================================

  setupAddToCart(
    product,
    variants
  );


  // ====================================================
  // RECOMMENDATIONS
  // ====================================================

  loadRecommendations(product);

}


// ======================================================
// PRODUCT IMAGES
// ======================================================

function setupProductImages(images) {

  const mainImage =
    document.getElementById("mainImage");

  const thumbsContainer =
    document.querySelector(".thumbs");


  if (!mainImage || !thumbsContainer) {
    return;
  }


  // Remove old thumbnails
  thumbsContainer.innerHTML = "";


  if (!images.length) {

    mainImage.removeAttribute("src");

    return;
  }


  // First image
  mainImage.src = images[0];

  mainImage.alt =
    window.CURRENT_PRODUCT?.name || "";


  // Create thumbnails
  images.forEach(
    (image, index) => {

      const thumb =
        document.createElement("img");


      thumb.src = image;

      thumb.alt =
        window.CURRENT_PRODUCT?.name || "";


      if (index === 0) {
        thumb.classList.add("active");
      }


      thumb.addEventListener(
        "click",
        () => {

          mainImage.src = image;


          thumbsContainer
            .querySelectorAll("img")
            .forEach(img => {

              img.classList.remove(
                "active"
              );

            });


          thumb.classList.add(
            "active"
          );

        }
      );


      thumbsContainer.appendChild(
        thumb
      );

    }
  );

}


// ======================================================
// VARIANTS
// ======================================================

function setupVariants(
  variants,
  product
) {

  const variantContainer =
    document.getElementById(
      "variantOptions"
    );

  const priceElement =
    document.getElementById("price");


  if (!variantContainer) {
    return;
  }


  variantContainer.innerHTML = "";


  // No variants
  if (!variants.length) {

    if (priceElement) {
      priceElement.textContent = "";
    }

    return;
  }


  let selectedVariant =
    variants[0];


  window.SELECTED_VARIANT =
    selectedVariant;


  function updatePrice() {

    if (!priceElement) {
      return;
    }


    priceElement.textContent =
      `$${Number(
        selectedVariant.price
      ).toFixed(2)}`;

  }


  variants.forEach(
    (variant, index) => {

      const button =
        document.createElement("button");


      button.type = "button";


      button.className =
        "variant-button";


      button.textContent =
        variant.label ||
        variant.name ||
        "Option";


      // First variant selected
      if (index === 0) {

        button.classList.add(
          "selected"
        );

      }


      button.addEventListener(
        "click",
        () => {

          selectedVariant =
            variant;


          window.SELECTED_VARIANT =
            variant;


          // Remove selected state
          variantContainer
            .querySelectorAll("button")
            .forEach(
              btn =>
                btn.classList.remove(
                  "selected"
                )
            );


          // Select clicked button
          button.classList.add(
            "selected"
          );


          updatePrice();

        }
      );


      variantContainer.appendChild(
        button
      );

    }
  );


  updatePrice();

}


// ======================================================
// QUANTITY
// ======================================================

function setupQuantity() {

  const minus =
    document.getElementById("minus");

  const plus =
    document.getElementById("plus");

  const qtyElement =
    document.getElementById("qty");


  if (
    !minus ||
    !plus ||
    !qtyElement
  ) {
    return;
  }


  let quantity = 1;


  minus.addEventListener(
    "click",
    () => {

      if (quantity > 1) {

        quantity--;

        qtyElement.textContent =
          quantity;

      }

    }
  );


  plus.addEventListener(
    "click",
    () => {

      quantity++;

      qtyElement.textContent =
        quantity;

    }
  );


  window.getProductQuantity =
    () => quantity;

}


// ======================================================
// ADD TO CART
// ======================================================

function setupAddToCart(
  product,
  variants
) {

  const addButton =
    document.querySelector(".add");


  if (!addButton) {
    return;
  }


  addButton.addEventListener(
    "click",
    () => {

      const selectedVariant =
        window.SELECTED_VARIANT ||
        variants[0];


      if (!selectedVariant) {

        alert(
          "Please select an option 💕"
        );

        return;
      }


      const quantity =
        window.getProductQuantity
          ? window.getProductQuantity()
          : 1;


      // Get existing cart
      let cart =
        JSON.parse(
          localStorage.getItem("cart")
        ) || [];


      // Unique item key
      const cartKey =
        `${product.slug}-${selectedVariant.id}`;


      // Look for same product + variant
      const existingItem =
        cart.find(
          item =>
            item.cartKey === cartKey
        );


      if (existingItem) {

        existingItem.quantity =
          (existingItem.quantity || 0) +
          quantity;

      } else {

        cart.push({

          cartKey,

          slug:
            product.slug,

          name:
            product.name,

          image:
            product.images?.[0] || "",

          price:
            Number(
              selectedVariant.price
            ),

          quantity,

          variant:
            selectedVariant.label ||
            selectedVariant.name,

          variantId:
            selectedVariant.id,

          weight:
            Number(
              selectedVariant.weight || 0
            )

        });

      }


      // Save cart
      localStorage.setItem(
        "cart",
        JSON.stringify(cart)
      );


      console.log(
        "Added to cart:",
        {
          product,
          variant: selectedVariant,
          quantity
        }
      );


      // Update cart count
      updateCartCount();


      // Go to cart
      window.location.href =
        "cart.html";

    }
  );

}


// ======================================================
// CART COUNT
// ======================================================

function updateCartCount() {

  const cartCount =
    document.getElementById(
      "cartCount"
    );


  if (!cartCount) {
    return;
  }


  const cart =
    JSON.parse(
      localStorage.getItem("cart")
    ) || [];


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );


  cartCount.textContent =
    total;

}


// ======================================================
// RECOMMENDATIONS
// ======================================================

async function loadRecommendations(
  currentProduct
) {

  const container =
    document.getElementById(
      "recommendations"
    );


  if (!container) {
    return;
  }


  const { data: products, error } =
    await supabaseClient

      .from("products")

      .select(`
        id,
        slug,
        name,
        images,

        product_variants (
          price,
          sort_order
        )
      `)

      .eq("active", true)

      .neq(
        "id",
        currentProduct.id
      )

      .limit(6);


  if (error) {

    console.error(
      "Recommendation error:",
      error
    );

    return;
  }


  container.innerHTML = "";


  products.forEach(product => {

    const card =
      document.createElement("div");


    card.className =
      "card1";


    const variants =
      [...(
        product.product_variants || []
      )]
        .sort(
          (a, b) =>
            (a.sort_order || 0) -
            (b.sort_order || 0)
        );


    const firstVariant =
      variants[0];


    card.innerHTML = `

      <a href="product.html?slug=${encodeURIComponent(
        product.slug
      )}">

        <img
          src="${product.images?.[0] || ""}"
          alt="${product.name}"
          loading="lazy"
        >

        <p>
          ${product.name}
        </p>

        ${
          firstVariant
            ? `
              <small>
                $${Number(
                  firstVariant.price
                ).toFixed(2)}
              </small>
            `
            : ""
        }

      </a>

    `;


    container.appendChild(card);

  });

}


// ======================================================
// ERROR
// ======================================================

function showProductError(
  message
) {

  const page =
    document.querySelector(
      ".page-one"
    );


  if (page) {

    page.innerHTML = `

      <div style="
        width:100%;
        text-align:center;
        padding:80px 20px;
      ">

        <h2>
          ${message}
        </h2>

        <p>
          Sorry about that 💕
        </p>

        <a
          href="products-objects.html?category=all"
        >
          Back to shop
        </a>

      </div>

    `;

  }

}
