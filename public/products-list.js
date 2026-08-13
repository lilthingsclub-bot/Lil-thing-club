document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") || "all";

  const CATEGORY_INFO = {
    "vinyl-sticker": ["Vinyl Stickers", "Cute vinyl stickers for laptops, water bottles, notebooks, and more!"],
    "sticker-sheet": ["Sticker Sheets", "Cute sticker sheets in fun designs — collect them all!"],
    "sticker-pack": ["Sticker Packs", "A little bundle of cute stickers, packed with love."],
    "postcard": ["Postcards", "Cute postcards in fun designs — collect them all!"],
    "art-print": ["Art Prints", "Cute art prints made to brighten up your space."],
    "sticker": ["Stickers", "Our adorable stickers come in many fun designs — collect them all!"],
    "crochet": ["Crochet Cuties", "Handmade crochet treasures — soft, adorable, and full of personality."],
    "crochet-keychain": ["Crochet Keychains", "Handmade crochet keychains — soft, adorable, and full of personality."],
    "phone-charm": ["Phone Charms", "Decorate your phone with unique handmade charms."],
    "stationery": ["Stationery", "Shop all of our cute stationery items."],
    "momo-pad": ["Memo Pads", "Cute memo pads in fun designs — collect them all!"],
    "washi-tape": ["Washi Tape", "Cute washi tape for decorating your journals, letters, and crafts."],
    "new": ["New Products", "Browse all our newest handmade items, packed with love!"],
    "all": ["All Products", "Browse all our handmade items — stickers, crochet keychains, stationery, and more!"]
  };

  const title = document.querySelector(".category-title");
  const desc = document.querySelector(".category-desc");
  const info = CATEGORY_INFO[category] || CATEGORY_INFO.all;
  if (title) title.textContent = info[0];
  if (desc) desc.textContent = info[1];

  const container = document.getElementById("product-list");
  if (!container) return;

  container.innerHTML = `<p>Loading products…</p>`;

  const { data, error } = await supabaseClient
    .from("products")
    .select(`
      id, slug, name, brand, categories, tags, images, active,
      product_variants (id, name, label, price, weight, sort_order)
    `)
    .eq("active", true);

  if (error) {
    console.error(error);
    container.innerHTML = `<p>We couldn't load the products right now. Please try again soon.</p>`;
    return;
  }

  let filteredProducts = (data || []).filter(p =>
    Array.isArray(p.categories) && p.categories.includes(category)
  );

  function priceText(product) {
    const prices = (product.product_variants || [])
      .map(v => Number(v.price))
      .filter(Number.isFinite);

    if (!prices.length) return "";
    const min = Math.min(...prices);
    return `$${min.toFixed(2)}${prices.length > 1 ? "＋" : ""}`;
  }

  function renderProducts(products) {
    container.innerHTML = "";

    if (!products.length) {
      container.innerHTML = `<p class="no-products">No products found in this category yet 💕</p>`;
      return;
    }

    products.forEach(product => {
      const div = document.createElement("div");
      div.className = "product-card1";
      const image = product.images?.[0] || "";
      div.innerHTML = `
        <a href="product.html?slug=${encodeURIComponent(product.slug)}">
          <img src="${image}" alt="${product.name}">
          <p class="product-name1">${product.name}</p>
          <p class="product-price1">${priceText(product)}</p>
        </a>
      `;
      container.appendChild(div);
    });
  }

  renderProducts(filteredProducts);

  const sortDropdown = document.getElementById("sortDropdown");
  if (!sortDropdown) return;

  sortDropdown.querySelectorAll("[data-sort]").forEach(item => {
    item.addEventListener("click", () => {
      const sortType = item.dataset.sort;

      filteredProducts.sort((a, b) => {
        switch (sortType) {
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "price-asc":
            return getMinPrice(a) - getMinPrice(b);
          case "price-desc":
            return getMinPrice(b) - getMinPrice(a);
          default:
            return 0;
        }
      });

      renderProducts(filteredProducts);
      sortDropdown.classList.remove("show");
    });
  });

  function getMinPrice(product) {
    const prices = (product.product_variants || [])
      .map(v => Number(v.price))
      .filter(Number.isFinite);
    return prices.length ? Math.min(...prices) : Infinity;
  }

  window.toggleDropdown = function () {
    sortDropdown.classList.toggle("show");
  };
});
