document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("status");
  const log = document.getElementById("log");
  const btn = document.getElementById("importBtn");

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    status.textContent = "You need to log in first.";
    btn.disabled = true;
    return;
  }

  const { data: isAdmin, error: adminError } =
    await supabaseClient.rpc("is_lil_things_admin");

  if (adminError || isAdmin !== true) {
    status.textContent = "This account is not an approved admin.";
    btn.disabled = true;
    return;
  }

  btn.onclick = async () => {
    btn.disabled = true;
    log.textContent = "";

    // Existing duplicate slug in the old file is automatically removed
    // because the database uses slug as a unique key.
    const seen = new Set();
    const products = LEGACY_PRODUCTS.filter(p => {
      if (seen.has(p.slug)) return false;
      seen.add(p.slug);
      return true;
    });

    let imported = 0;
    let skipped = 0;

    for (const old of products) {
      const { data: existing, error: findError } =
        await supabaseClient
          .from("products")
          .select("id")
          .eq("slug", old.slug)
          .maybeSingle();

      if (findError) {
        log.textContent += `ERROR checking ${old.slug}: ${findError.message}\n`;
        continue;
      }

      if (existing) {
        skipped++;
        log.textContent += `SKIP: ${old.name}\n`;
        continue;
      }

      // Your old file stores one display price such as "$5.99＋".
      // The importer converts the first numeric amount into one "Standard"
      // variant. You can edit/add real variants later in the product manager.
      const numericPrice = Number(
        String(old.price || "0").replace(/[^0-9.]/g, "")
      );

      const productData = {
        slug: old.slug,
        name: old.name,
        brand: "Lil Things Club",
        description: "",
        categories: old.categories || [],
        tags: old.tags || [],
        images: old.image ? [old.image] : [],
        features: [],
        active: true,
        is_new: (old.categories || []).includes("new"),
        featured: (old.categories || []).includes("featured")
      };

      const { data: created, error: productError } =
        await supabaseClient
          .from("products")
          .insert(productData)
          .select("id")
          .single();

      if (productError) {
        log.textContent += `ERROR: ${old.name} — ${productError.message}\n`;
        continue;
      }

      const { error: variantError } =
        await supabaseClient
          .from("product_variants")
          .insert({
            product_id: created.id,
            name: "Standard",
            label: "Standard",
            price: Number.isFinite(numericPrice) ? numericPrice : 0,
            sort_order: 0
          });

      if (variantError) {
        log.textContent += `VARIANT ERROR: ${old.name} — ${variantError.message}\n`;
        // Keep the product so it can be repaired in the admin page.
        continue;
      }

      imported++;
      log.textContent += `IMPORTED: ${old.name}\n`;
    }

    status.textContent =
      `Finished! Imported ${imported} products. Skipped ${skipped} existing products.`;

    btn.textContent = "Import Finished";
  };
});
