const supabase = window.supabase.createClient(
  "YOUR_URL",
  "YOUR_ANON_KEY"
);

let PRODUCTS_LIST = [];
let PRODUCTS = {};

async function loadProductsFromSupabase() {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  // Grid page structure
  PRODUCTS_LIST = data.map(p => ({
    slug: p.slug,
    name: p.name,
    price: `$${p.price.toFixed(2)}`,
    image: p.image,
    categories: p.categories || ["all"]
  }));

  // Product page structure
  PRODUCTS = {};

  data.forEach(p => {
    PRODUCTS[p.slug] = {
      slug: p.slug,
      name: p.name,
      brand: "Lil Things Club",
      category: p.categories?.[0] || "general",
      images: p.images || [p.image],
      description: p.description || "",
      features: p.features || [],
      variants: p.variants || [
        {
          id: "default",
          label: "Standard",
          price: p.price,
          stock: 10
        }
      ]
    };
  });
}
