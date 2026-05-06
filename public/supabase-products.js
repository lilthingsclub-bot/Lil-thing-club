const supabase = window.supabase.createClient(
  "https://yqqodiylewlwoemyuzfd.supabase.co/Products",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcW9kaXlsZXdsd29lbXl1emZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTk2NjgsImV4cCI6MjA4NjU5NTY2OH0.nConWK9EWP35QE9J8kktoXWEP6GsAMipkyqRcsmBv4Y"
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
