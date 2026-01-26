document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ product-page.js loaded");

  if (typeof PRODUCTS === "undefined") {
    console.error("❌ PRODUCTS not loaded");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug || !PRODUCTS[slug]) {
    document.body.innerHTML = "<h2>Product not found</h2>";
    return;
  }

  const product = PRODUCTS[slug];

if (!slug || !product) {
  document.body.innerHTML = "<h2>Product not found</h2>";
  console.error("Slug:", slug);
  console.error("Available products:", Object.keys(PRODUCTS));
  return;
}



  // ===== ELEMENTS =====
  const productNameEl = document.getElementById("productName");
  const mainImage = document.getElementById("mainImage");
  const thumbsContainer = document.querySelector(".thumbs");
  const priceEl = document.getElementById("price");
  const variantContainer = document.getElementById("variantOptions");
  const descEl = document.querySelector(".desc p");
  const featuresEl = document.querySelector(".features ul");

  const minusBtn = document.getElementById("minus");
  const plusBtn = document.getElementById("plus");
  const qtyEl = document.getElementById("qty");
  const addBtn = document.querySelector(".add");

  // ===== BASIC INFO =====
  productNameEl.textContent = product.name;
  descEl.textContent = product.description || "";

  // ===== FEATURES =====
  featuresEl.innerHTML = "";
  product.features?.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f;
    featuresEl.appendChild(li);
  });

  // ===== IMAGES =====
  thumbsContainer.innerHTML = "";
  if (product.images?.length) {
    mainImage.src = product.images[0];

    product.images.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      if (i === 0) img.classList.add("active");

      img.addEventListener("click", () => {
        mainImage.src = src;
        document.querySelectorAll(".thumbs img").forEach(x => x.classList.remove("active"));
        img.classList.add("active");
      });

      thumbsContainer.appendChild(img);
    });
  }

  // ===== VARIANTS =====
  let selectedVariant = product.variants?.[0] || null;
  variantContainer.innerHTML = "";

  if (selectedVariant) {
    priceEl.textContent = `$${selectedVariant.price.toFixed(2)}`;
  }

  product.variants?.forEach((variant, i) => {
    const btn = document.createElement("button");
    btn.textContent = variant.label;
    if (i === 0) btn.classList.add("active");

    btn.addEventListener("click", () => {
      document.querySelectorAll("#variantOptions button")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      selectedVariant = variant;
      priceEl.textContent = `$${variant.price.toFixed(2)}`;
    });

    variantContainer.appendChild(btn);
  });

  // ===== QUANTITY =====
  let qty = 1;
  qtyEl.textContent = qty;

  plusBtn.addEventListener("click", () => {
    qty++;
    qtyEl.textContent = qty;
  });

  minusBtn.addEventListener("click", () => {
    if (qty > 1) {
      qty--;
      qtyEl.textContent = qty;
    }
  });

  // ===== ADD TO CART =====
  addBtn.addEventListener("click", () => {
    if (!selectedVariant) {
      alert("Please select an option 💕");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const key = `${slug}-${selectedVariant.id}`;

    const existing = cart.find(i => i.key === key);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        key,
        name: product.name,
        price: selectedVariant.price,
        qty,
        image: product.images?.[0] || "",
        option: selectedVariant.label,
        category: product.category,
       weight: product.weight
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.href = "cart.html";
  });

  console.log("✅ Product page fully working:", product.name);
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  // find the current product in PRODUCTS_LIST
  const product = PRODUCTS_LIST.find(p => p.slug === slug);
  if (!product) return;

  const recContainer = document.getElementById("recommendations");
  if (!recContainer || !product.tags?.length) return;

  // generate recommendations
  const recommendations = PRODUCTS_LIST
    .filter(p => p.slug !== slug && p.tags?.length) // exclude current product
    .map(p => {
      // ensure images array exists
      const images = p.images?.length ? p.images : [p.image];

      // count shared tags
      const sharedTags = p.tags.filter(tag => product.tags.includes(tag));

      return { ...p, score: sharedTags.length, images };
    })
    .filter(p => p.score > 0)       // must share at least one tag
    .sort((a, b) => b.score - a.score) // most relevant first
    .slice(0, 6);                   // max 6 recommendations

  // render recommendations
  recommendations.forEach(p => {
    const card = document.createElement("div");
    card.className = "card1";

    card.innerHTML = `
      <a href="product.html?slug=${p.slug}">
        <img src="${p.images[0]}" alt="${p.name}">
        <p>${p.name}</p>
        <small>${p.price}</small>
      </a>
    `;

    recContainer.appendChild(card);
  });
});
