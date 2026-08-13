document.addEventListener("DOMContentLoaded", async () => {
  const $ = (id) => document.getElementById(id);
  let editingId = null;
  let products = [];
  let selectedImages = [];

  const categoryDefaults = [
    "all", "new", "featured", "popular",
    "sticker", "vinyl-sticker", "sticker-sheet", "sticker-pack",
    "postcard", "art-print", "stationery", "momo-pad", "washi-tape",
    "crochet", "crochet-keychain", "phone-charm", "surprise-pack"
  ];

  function slugify(value) {
    return value.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  async function requireAdmin() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      location.href = "login.html";
      return false;
    }

    const { data, error } = await supabaseClient.rpc("is_lil_things_admin");
    if (error || data !== true) {
      await supabaseClient.auth.signOut();
      location.href = "login.html";
      return false;
    }
    return true;
  }

  if (!(await requireAdmin())) return;

  // ---------- Chips ----------
  function addChip(listEl, value, inputEl) {
    value = value.trim().toLowerCase();
    if (!value) return;

    const exists = [...listEl.querySelectorAll(".chip")]
      .some(chip => chip.dataset.value === value);

    if (exists) {
      inputEl.value = "";
      return;
    }

    const chip = document.createElement("span");
    chip.className = "chip";
    chip.dataset.value = value;
    chip.innerHTML = `${escapeHtml(value)} <button type="button" aria-label="Remove">×</button>`;
    chip.querySelector("button").onclick = () => chip.remove();
    listEl.appendChild(chip);
    inputEl.value = "";
  }

  $("categoryInput").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip($("categoryList"), e.target.value, e.target);
    }
  });

  $("tagInput").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip($("tagList"), e.target.value, e.target);
    }
  });

  function getChips(id) {
    return [...$(id).querySelectorAll(".chip")].map(x => x.dataset.value);
  }

  function setChips(id, values = []) {
    $(id).innerHTML = "";
    values.forEach(value => {
      addChip($(id), value, { value: "", });
    });
  }

  // ---------- Features ----------
  function addFeature(value = "") {
    const row = document.createElement("div");
    row.className = "dynamic-row";
    row.innerHTML = `
      <input class="feature-input" value="${escapeHtml(value)}" placeholder="Printed on thick cardstock">
      <button type="button" class="remove-btn">×</button>
    `;
    row.querySelector(".remove-btn").onclick = () => row.remove();
    $("featuresList").appendChild(row);
  }

  $("addFeatureBtn").onclick = () => addFeature();

  // ---------- Variants ----------
  function addVariant(variant = {}) {
    const row = document.createElement("div");
    row.className = "variant-row";
    row.innerHTML = `
      <input class="variant-name" placeholder="Name" value="${escapeHtml(variant.name || "")}" required>
      <input class="variant-label" placeholder="Label shown to customer" value="${escapeHtml(variant.label || "")}" required>
      <input class="variant-price" type="number" min="0" step="0.01" placeholder="Price" value="${variant.price ?? ""}" required>
      <input class="variant-weight" type="number" min="0" step="0.01" placeholder="Weight (g)" value="${variant.weight ?? ""}">
      <button type="button" class="remove-btn">×</button>
    `;
    row.querySelector(".remove-btn").onclick = () => row.remove();
    $("variantsList").appendChild(row);
  }

  $("addVariantBtn").onclick = () => addVariant();

  // ---------- Images ----------
  function renderImages() {
    $("imagePreview").innerHTML = "";
    selectedImages.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "image-card";
      card.innerHTML = `
        <img src="${escapeHtml(item.url)}" alt="">
        <button type="button" class="remove-image">×</button>
        <small>${index === 0 ? "Main image" : `Image ${index + 1}`}</small>
      `;
      card.querySelector(".remove-image").onclick = () => {
        if (item.file) URL.revokeObjectURL(item.url);
        selectedImages.splice(index, 1);
        renderImages();
      };
      $("imagePreview").appendChild(card);
    });
  }

  $("imageFiles").addEventListener("change", e => {
    for (const file of e.target.files) {
      if (!file.type.startsWith("image/")) continue;
      selectedImages.push({
        file,
        url: URL.createObjectURL(file),
        existing: false
      });
    }
    e.target.value = "";
    renderImages();
  });

  async function uploadImage(file, slug) {
    const safeName = file.name.toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-");
    const path = `products/${slug}/${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabaseClient.storage
      .from("product-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) throw error;

    const { data } = supabaseClient.storage
      .from("product-images")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function resolveImages(slug) {
    const urls = [];
    for (const item of selectedImages) {
      if (item.existing) {
        urls.push(item.url);
      } else if (item.file) {
        urls.push(await uploadImage(item.file, slug));
      }
    }
    return urls;
  }

  // ---------- Load ----------
  async function loadProducts() {
    const { data, error } = await supabaseClient
      .from("products")
      .select(`
        *,
        product_variants (
          id, name, label, price, weight, sort_order
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      showMessage(error.message, true);
      return;
    }

    products = data || [];
    renderProducts();
  }

  function renderProducts() {
    const query = $("searchProducts").value.trim().toLowerCase();
    const visible = products.filter(p =>
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.slug.toLowerCase().includes(query)
    );

    if (!visible.length) {
      $("productsTable").innerHTML = `<p class="empty">No products found.</p>`;
      return;
    }

    $("productsTable").innerHTML = visible.map(p => {
      const firstImage = p.images?.[0] || "";
      const variantPrices = (p.product_variants || [])
        .map(v => Number(v.price))
        .filter(Number.isFinite);

      const minPrice = variantPrices.length ? Math.min(...variantPrices) : null;
      const priceText = minPrice === null ? "No price" : `$${minPrice.toFixed(2)}${variantPrices.length > 1 ? "+" : ""}`;

      return `
        <article class="product-row-admin">
          <div class="admin-product-image">
            ${firstImage ? `<img src="${escapeHtml(firstImage)}" alt="">` : "♡"}
          </div>
          <div class="admin-product-info">
            <strong>${escapeHtml(p.name)}</strong>
            <span>${escapeHtml(priceText)} · ${escapeHtml((p.categories || []).join(", "))}</span>
            <small>${p.active ? "Visible" : "Hidden"}${p.featured ? " · Featured" : ""}${p.is_new ? " · New" : ""}</small>
          </div>
          <div class="admin-row-actions">
            <a href="../product.html?slug=${encodeURIComponent(p.slug)}" target="_blank">View</a>
            <button data-edit="${p.id}" class="small-btn">Edit</button>
            <button data-delete="${p.id}" class="remove-btn">Delete</button>
          </div>
        </article>
      `;
    }).join("");

    $("productsTable").querySelectorAll("[data-edit]").forEach(btn => {
      btn.onclick = () => editProduct(btn.dataset.edit);
    });

    $("productsTable").querySelectorAll("[data-delete]").forEach(btn => {
      btn.onclick = () => deleteProduct(btn.dataset.delete);
    });
  }

  $("searchProducts").addEventListener("input", renderProducts);

  // ---------- Edit ----------
  function resetForm() {
    editingId = null;
    $("productId").value = "";
    $("formTitle").textContent = "Add New Product";
    $("productForm").reset();
    $("brand").value = "Lil Things Club";
    $("active").checked = true;
    $("categoryList").innerHTML = "";
    $("tagList").innerHTML = "";
    $("featuresList").innerHTML = "";
    $("variantsList").innerHTML = "";
    $("imagePreview").innerHTML = "";
    selectedImages = [];
    $("cancelEditBtn").classList.add("hidden");
    $("formMessage").textContent = "";
    $("saveBtn").textContent = "Save Product";
  }

  function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    editingId = id;
    $("productId").value = id;
    $("formTitle").textContent = "Edit Product";
    $("name").value = p.name || "";
    $("brand").value = p.brand || "Lil Things Club";
    $("description").value = p.description || "";
    $("active").checked = p.active;
    $("isNew").checked = p.is_new;
    $("featured").checked = p.featured;

    $("categoryList").innerHTML = "";
    $("tagList").innerHTML = "";
    (p.categories || []).forEach(v => addChip($("categoryList"), v, $("categoryInput")));
    (p.tags || []).forEach(v => addChip($("tagList"), v, $("tagInput")));

    $("featuresList").innerHTML = "";
    (p.features || []).forEach(addFeature);

    $("variantsList").innerHTML = "";
    [...(p.product_variants || [])]
      .sort((a,b) => a.sort_order - b.sort_order)
      .forEach(addVariant);

    selectedImages = (p.images || []).map(url => ({
      url,
      existing: true,
      file: null
    }));
    renderImages();

    $("cancelEditBtn").classList.remove("hidden");
    $("saveBtn").textContent = "Update Product";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $("cancelEditBtn").onclick = resetForm;

  // ---------- Save ----------
  $("productForm").addEventListener("submit", async e => {
    e.preventDefault();

    const name = $("name").value.trim();
    const brand = $("brand").value.trim() || "Lil Things Club";
    const categories = getChips("categoryList");
    const tags = getChips("tagList");
    const features = [...document.querySelectorAll(".feature-input")]
      .map(x => x.value.trim()).filter(Boolean);

    const variants = [...document.querySelectorAll(".variant-row")].map((row, i) => ({
      name: row.querySelector(".variant-name").value.trim(),
      label: row.querySelector(".variant-label").value.trim(),
      price: Number(row.querySelector(".variant-price").value),
      weight: row.querySelector(".variant-weight").value === ""
        ? null
        : Number(row.querySelector(".variant-weight").value),
      sort_order: i
    }));

    if (!name) return showMessage("Please enter a product name.", true);
    if (!categories.length) return showMessage("Add at least one category.", true);
    if (!variants.length) return showMessage("Add at least one variant.", true);
    if (variants.some(v => !v.name || !v.label || !Number.isFinite(v.price))) {
      return showMessage("Please complete every variant.", true);
    }

    const slugBase = slugify(name);
    let slug = slugBase;

    // Avoid changing an existing product's slug.
    if (!editingId) {
      let suffix = 2;
      while (products.some(p => p.slug === slug)) {
        slug = `${slugBase}-${suffix++}`;
      }
    }

    setSaving(true);

    try {
      const images = await resolveImages(slug);

      if (!images.length) {
        throw new Error("Please add at least one product image.");
      }

      const productData = {
        slug,
        name,
        brand,
        description: $("description").value.trim(),
        categories,
        tags,
        images,
        features,
        active: $("active").checked,
        is_new: $("isNew").checked,
        featured: $("featured").checked
      };

      let productId = editingId;

      if (editingId) {
        const { error } = await supabaseClient
          .from("products")
          .update(productData)
          .eq("id", editingId);

        if (error) throw error;

        const { error: deleteError } = await supabaseClient
          .from("product_variants")
          .delete()
          .eq("product_id", editingId);

        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabaseClient
          .from("products")
          .insert(productData)
          .select("id")
          .single();

        if (error) throw error;
        productId = data.id;
      }

      const variantRows = variants.map(v => ({
        product_id: productId,
        name: v.name,
        label: v.label,
        price: v.price,
        weight: v.weight,
        sort_order: v.sort_order
      }));

      const { error: variantError } = await supabaseClient
        .from("product_variants")
        .insert(variantRows);

      if (variantError) throw variantError;

      showMessage(editingId ? "Product updated! 💕" : "Product saved! 💕");
      resetForm();
      await loadProducts();

    } catch (error) {
      console.error(error);
      showMessage(error.message || "Something went wrong.", true);
    } finally {
      setSaving(false);
    }
  });

  function setSaving(saving) {
    $("saveBtn").disabled = saving;
    $("saveBtn").textContent = saving
      ? "Saving…"
      : editingId ? "Update Product" : "Save Product";
  }

  function showMessage(text, error = false) {
    $("formMessage").textContent = text;
    $("formMessage").className = `message ${error ? "error" : "success"}`;
  }

  // ---------- Delete ----------
  async function deleteProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;

    const { error } = await supabaseClient
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      showMessage(error.message, true);
      return;
    }

    await loadProducts();
  }

  $("logoutBtn").onclick = async () => {
    await supabaseClient.auth.signOut();
    location.href = "login.html";
  };

  // Start with one variant so the form isn't empty.
  addVariant();
  await loadProducts();
});
