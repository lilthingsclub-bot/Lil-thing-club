document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    document.body.innerHTML = "<h2>Product not found</h2>";
    return;
  }

  const { data: product, error } = await supabaseClient
    .from("products")
    .select(`
      id, slug, name, brand, description, categories, tags, images, features, active,
      product_variants (id, name, label, price, weight, sort_order)
    `)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !product) {
    console.error(error);
    document.body.innerHTML = "<h2>Product not found</h2>";
    return;
  }

  const $ = id => document.getElementById(id);

  const productNameEl = $("productName");
  const mainImage = $("mainImage");
  const thumbsContainer = document.querySelector(".thumbs");
  const priceEl = $("price");
  const variantContainer = $("variantOptions");
  const descEl = document.querySelector(".desc p");
  const featuresEl = document.querySelector(".features ul");

  productNameEl.textContent = product.name;
  const brandEl = document.querySelector(".brand");
  if (brandEl) brandEl.textContent = product.brand || "Lil Things Club";
  descEl.textContent = product.description || "";

  featuresEl.innerHTML = "";
  (product.features || []).forEach(feature => {
    const li = document.createElement("li");
    li.textContent = feature;
    featuresEl.appendChild(li);
  });

  // Images
  thumbsContainer.innerHTML = "";
  const images = product.images || [];

  if (images.length) {
    mainImage.src = images[0];

    images.forEach((src, index) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${product.name} image ${index + 1}`;
      if (index === 0) img.classList.add("active");

      img.addEventListener("click", () => {
        mainImage.src = src;
        thumbsContainer.querySelectorAll("img")
          .forEach(x => x.classList.remove("active"));
        img.classList.add("active");
      });

      thumbsContainer.appendChild(img);
    });
  }

  // Variants
  const variants = [...(product.product_variants || [])]
    .sort((a, b) => a.sort_order - b.sort_order);

  let selectedVariant = variants[0] || null;
  variantContainer.innerHTML = "";

  function showPrice() {
    if (selectedVariant) {
      priceEl.textContent = `$${Number(selectedVariant.price).toFixed(2)}`;
    } else {
      priceEl.textContent = "";
    }
  }

  variants.forEach((variant, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = variant.label || variant.name;
    if (index === 0) btn.classList.add("active");

    btn.addEventListener("click", () => {
      variantContainer.querySelectorAll("button")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      selectedVariant = variant;
      showPrice();
    });

    variantContainer.appendChild(btn);
  });

  showPrice();

  // Quantity
  let qty = 1;
  const qtyEl = $("qty");
  qtyEl.textContent = qty;

  $("plus").addEventListener("click", () => {
    qty++;
    qtyEl.textContent = qty;
  });

  $("minus").addEventListener("click", () => {
    if (qty > 1) {
      qty--;
      qtyEl.textContent = qty;
    }
  });

  // Cart
  document.querySelector(".add").addEventListener("click", () => {
    if (!selectedVariant) {
      alert("Please select an option 💕");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const key = `${slug}-${selectedVariant.id}`;

    const existing = cart.find(item => item.key === key);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        key,
        name: product.name,
        price: Number(selectedVariant.price),
        qty,
        image: images[0] || "",
        option: selectedVariant.label || selectedVariant.name,
        category: product.categories?.[0] || "",
        weight: selectedVariant.weight ?? null
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.href = "cart.html";
  });

  // Recommendations
  const recContainer = $("recommendations");
  if (!recContainer) return;

  const tags = product.tags || [];

  if (!tags.length) return;

  const { data: allProducts } = await supabaseClient
    .from("products")
    .select("slug,name,images,tags,product_variants")
    .eq("active", true)
    .neq("slug", slug);

  const recommendations = (allProducts || [])
    .map(p => {
      const shared = (p.tags || []).filter(tag => tags.includes(tag));
      const prices = (p.product_variants || []).map(v => Number(v.price)).filter(Number.isFinite);
      return {
        ...p,
        score: shared.length,
        price: prices.length ? Math.min(...prices) : null
      };
    })
    .filter(p => p.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 6);

  recContainer.innerHTML = "";

  recommendations.forEach(p => {
    const card = document.createElement("div");
    card.className = "card1";
    card.innerHTML = `
      <a href="product.html?slug=${encodeURIComponent(p.slug)}">
        <img src="${p.images?.[0] || ""}" alt="${p.name}">
        <p>${p.name}</p>
        <small>${p.price === null ? "" : `$${p.price.toFixed(2)}`}</small>
      </a>
    `;
    recContainer.appendChild(card);
  });
});
