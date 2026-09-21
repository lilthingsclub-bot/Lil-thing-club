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
  stock_quantity,
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
// VARIANTS + INVENTORY
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


  
  // ----------------------------------------------------
  // Create inventory message if it doesn't exist
  // ----------------------------------------------------

  let stockElement =
    document.getElementById("stockStatus");


  if (!stockElement) {

    stockElement =
      document.createElement("div");

    stockElement.id =
      "stockStatus";

    stockElement.style.marginTop =
      "10px";

    stockElement.style.fontSize =
      "14px";

    stockElement.style.fontWeight =
      "600";

    // Put it underneath the price
    if (priceElement) {

      priceElement.parentNode
        .insertBefore(
          stockElement,
          priceElement.nextSibling
        );

    } else {

      variantContainer.parentNode
        .insertBefore(
          stockElement,
          variantContainer
        );

    }

  }





  
 // ----------------------------------------------------
  // No variants
  // ----------------------------------------------------

  if (!variants.length) {

    if (priceElement) {
      priceElement.textContent = "";
    }

    stockElement.textContent = "";

    return;
  }



 // ----------------------------------------------------
  // First variant
  // ----------------------------------------------------

  let selectedVariant =
    variants[0];


  window.SELECTED_VARIANT =
    selectedVariant;








  // ----------------------------------------------------
  // Update price + stock
  // ----------------------------------------------------

  function updateVariantInfo() {

    // PRICE
    if (priceElement) {

      priceElement.textContent =
        `$${Number(
          selectedVariant.price
        ).toFixed(2)}`;

    }


    // STOCK
    const stock =
      Number(
        selectedVariant.stock_quantity || 0
      );


    if (stock <= 0) {

      stockElement.textContent =
        "Sold out";

      stockElement.style.color =
        "#d9534f";

    }

    else if (stock <= 3) {

      stockElement.textContent =
        `Only ${stock} left`;

      stockElement.style.color =
        "#d98b00";

    }

    else {

      stockElement.textContent =
        `${stock} in stock`;

      stockElement.style.color =
        "#4f8a5b";

    }


    // Tell quantity system about
    // the newly selected variant
    if (
      typeof window.updateQuantityStock ===
      "function"
    ) {

      window.updateQuantityStock(
        stock
      );

    }


    // Update add-to-cart button
    const addButton =
      document.querySelector(".add");


    if (addButton) {

      if (stock <= 0) {

        addButton.disabled = true;

        addButton.textContent =
          "Sold Out";

      }

      else {

        addButton.disabled = false;

        addButton.textContent =
          "Add to Cart";

      }

    }

  }




  

// ----------------------------------------------------
  // Create variant buttons
  // ----------------------------------------------------

  variants.forEach(
    (variant, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.type = "button";


      button.className =
        "variant-button";


      button.textContent =
        variant.label ||
        variant.name ||
        "Option";


      // Disable sold-out variant
      if (
        Number(
          variant.stock_quantity || 0
        ) <= 0
      ) {

        button.disabled = true;

        button.title =
          "Sold out";

      }


      // First available variant
      if (
        index === 0 &&
        Number(
          variant.stock_quantity || 0
        ) > 0
      ) {

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


          variantContainer
            .querySelectorAll(
              "button"
            )
            .forEach(btn => {

              btn.classList.remove(
                "selected"
              );

            });


          button.classList.add(
            "selected"
          );


          updateVariantInfo();

        }
      );


      variantContainer.appendChild(
        button
      );

    }
  );


  // ----------------------------------------------------
  // If first variant is sold out,
  // find the first available one.
  // ----------------------------------------------------

  const firstAvailable =
    variants.find(
      variant =>
        Number(
          variant.stock_quantity || 0
        ) > 0
    );


  if (firstAvailable) {

    selectedVariant =
      firstAvailable;


    window.SELECTED_VARIANT =
      firstAvailable;


    const firstButton =
      [...variantContainer.children]
        .find(
          button =>
            !button.disabled
        );


    if (firstButton) {

      firstButton.classList.add(
        "selected"
      );

    }

  }


  updateVariantInfo();

}






// ======================================================
// QUANTITY + INVENTORY LIMIT
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

  let maxStock = Infinity;


  // ----------------------------------------------------
  // Update quantity display
  // ----------------------------------------------------

  function updateQuantityDisplay() {

    qtyElement.textContent =
      quantity;


    // Disable minus at 1
    minus.disabled =
      quantity <= 1;


    // Disable plus at stock limit
    plus.disabled =
      quantity >= maxStock;

  }


  // ----------------------------------------------------
  // Update maximum stock
  // ----------------------------------------------------

  window.updateQuantityStock =
    function(stock) {

      maxStock =
        Number(stock);


      // If current quantity is higher
      // than the new stock, reduce it.
      if (
        maxStock <= 0
      ) {

        quantity = 1;

      }

      else if (
        quantity > maxStock
      ) {

        quantity =
          maxStock;

      }


      updateQuantityDisplay();

    };



  // ----------------------------------------------------
  // MINUS
  // ----------------------------------------------------

  minus.addEventListener(
    "click",
    () => {

      if (
        quantity > 1
      ) {

        quantity--;

        updateQuantityDisplay();

      }

    }
  );


  // ----------------------------------------------------
  // PLUS
  // ----------------------------------------------------

  plus.addEventListener(
    "click",
    () => {

      if (
        quantity < maxStock
      ) {

        quantity++;

        updateQuantityDisplay();

      }

    }
  );

 // ----------------------------------------------------
  // Return quantity
  // ----------------------------------------------------

  window.getProductQuantity =
    () => quantity;


  updateQuantityDisplay();

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


// ==================================================
// CHECK INVENTORY
// ==================================================

const availableStock =
  Number(
    selectedVariant.stock_quantity || 0
  );


if (availableStock <= 0) {

  alert(
    "Sorry, this option is sold out 💕"
  );

  return;

}


if (
  quantity > availableStock
) {

  alert(
    `Sorry, only ${availableStock} available.`
  );

  return;

}

      


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

  existingItem.qty =
    (existingItem.qty || 0) +
    quantity;

}

      else {

        cart.push({

  cartKey,

  slug:
    product.slug,

  name:
    product.name,

  image:
    product.images?.[0] || "",

  // Keep price as a number
  price:
    Number(
      selectedVariant.price
    ),

  // IMPORTANT:
  // cart.js uses "qty"
  qty:
    quantity,

  // IMPORTANT:
  // cart.js uses "option"
  option:
    selectedVariant.label ||
    selectedVariant.name ||
    "Standard",

  // Keep the Supabase variant ID
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
          item.qty || 0
        ),
    0
  );

  cartCount.textContent =
    total;

}


// ======================================================
// RECOMMENDATIONS
// ======================================================

async function loadRecommendations(currentProduct) {
  const container = document.getElementById("recommendations");

  if (!container) return;

  container.innerHTML = "";

  try {
    /*
      Get active products other than the current product.
      We include tags + categories so we can score
      how relevant each product is.
    */
    const { data, error } = await supabaseClient
      .from("products")
      .select(`
        id,
        slug,
        name,
        tags,
        categories,
        images,
        is_new,
        featured,
        product_variants (
          price,
          stock_quantity,
          sort_order
        )
      `)
      .eq("active", true)
      .neq("id", currentProduct.id);

    if (error) {
      console.error("Recommendation error:", error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    /* -----------------------------------------
       CURRENT PRODUCT TAGS / CATEGORIES
    ----------------------------------------- */

    const currentTags = Array.isArray(currentProduct.tags)
      ? currentProduct.tags.map(tag => String(tag).toLowerCase().trim())
      : [];

    const currentCategories = Array.isArray(currentProduct.categories)
      ? currentProduct.categories.map(category =>
          String(category).toLowerCase().trim()
        )
      : [];


    /* -----------------------------------------
       SCORE PRODUCTS
    ----------------------------------------- */

    const scoredProducts = data.map(product => {

      const productTags = Array.isArray(product.tags)
        ? product.tags.map(tag =>
            String(tag).toLowerCase().trim()
          )
        : [];

      const productCategories = Array.isArray(product.categories)
        ? product.categories.map(category =>
            String(category).toLowerCase().trim()
          )
        : [];


      /* Find matching tags */
      const matchingTags = productTags.filter(tag =>
        currentTags.includes(tag)
      );

      /* Find matching categories */
      const matchingCategories = productCategories.filter(category =>
        currentCategories.includes(category)
      );


      /*
        TAGS are the strongest signal.

        +10 points for every matching tag
        +4 points for every matching category
      */
      let score =
        matchingTags.length * 10 +
        matchingCategories.length * 4;


      /* Small bonuses */
      if (product.featured) {
        score += 2;
      }

      if (product.is_new) {
        score += 1;
      }


      return {
        ...product,
        score,
        matchingTags,
        matchingCategories
      };
    });


    /* -----------------------------------------
       SORT BY RELEVANCE
    ----------------------------------------- */

    scoredProducts.sort((a, b) => {

      /* Higher score first */
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      /*
        If products have the same score,
        randomize them slightly so customers
        don't always see the exact same order.
      */
      return Math.random() - 0.5;
    });


    /* -----------------------------------------
       PICK PRODUCTS
    ----------------------------------------- */

    const selectedProducts = [];
    const usedCategories = new Set();


    /*
      First pass:
      prioritize relevant products while
      trying not to show six products from
      the exact same category.
    */

    for (const product of scoredProducts) {

      if (selectedProducts.length >= 6) {
        break;
      }

      const mainCategory =
        productCategoriesForRecommendation(product)[0] || null;

      /*
        If this product has no meaningful
        relationship to the current product,
        save it for the fallback pass.
      */
      if (product.score <= 0) {
        continue;
      }

      /*
        Try to keep the recommendation row varied.
      */
      if (
        mainCategory &&
        usedCategories.has(mainCategory) &&
        selectedProducts.length < 4
      ) {
        continue;
      }

      selectedProducts.push(product);

      if (mainCategory) {
        usedCategories.add(mainCategory);
      }
    }


    /* -----------------------------------------
       FALLBACK
    ----------------------------------------- */

    /*
      If we don't have six relevant products,
      fill the remaining spaces with the
      highest-scoring products we haven't used.
    */

    if (selectedProducts.length < 6) {

      for (const product of scoredProducts) {

        if (selectedProducts.length >= 6) {
          break;
        }

        if (selectedProducts.includes(product)) {
          continue;
        }

        selectedProducts.push(product);
      }
    }


    /* -----------------------------------------
       CREATE CARDS
    ----------------------------------------- */

    selectedProducts.forEach(product => {

      const card = document.createElement("div");

      card.className = "card1";

      const firstVariant = [...(product.product_variants || [])]
        .sort(
          (a, b) =>
            Number(a.sort_order || 0) -
            Number(b.sort_order || 0)
        )[0];

      const price = firstVariant
        ? Number(firstVariant.price || 0).toFixed(2)
        : "0.00";

      const image =
        Array.isArray(product.images) && product.images.length
          ? product.images[0]
          : "";

      card.innerHTML = `
        <a href="product.html?slug=${product.slug}">

          <img
            src="${image}"
            alt="${product.name}"
            loading="lazy"
          >

          <p class="recommendation-name">
            ${product.name}
          </p>

          <p class="recommendation-price">
            $${price}
          </p>

        </a>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Failed to load recommendations:", err);
  }
}


/* -----------------------------------------
   CATEGORY HELPER
----------------------------------------- */

function productCategoriesForRecommendation(product) {

  if (!Array.isArray(product.categories)) {
    return [];
  }

  return product.categories
    .map(category =>
      String(category).toLowerCase().trim()
    )
    .filter(category => category !== "all");
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
