const PRODUCTS_LIST = [
   {
    slug: "spring-memo-pad",
    name: "Spring Memo pad",
    price: "$3.00",
    image: "asset/39.png",
    categories:["momo-pad", "stationery", "all", "new"],
    tags: ["spring", "cute","fun"]
  },
{
    slug: "tamagotchi-memo-pad",
    name: "Tamagotchi Memo pad",
    price: "$3.00",
    image: "asset/38.png",
    categories:["momo-pad", "stationery", "all", "new"],
    tags: ["game", "cute","tofu"]
  },
 {
    slug: "under-the-sea-memo-pad",
    name: "Under the sea Memo pad",
    price: "$3.00",
    image: "asset/37.png",
    categories:["momo-pad", "stationery", "all", "new"],
    tags: ["sea", "cute","fish","tofu"]
  },
   {
    slug: "momo-spring-day-sticker-1",
    name: "Momo Spring Day 1 sticker sheet",
    price: "$5.99＋",
    image: "asset/34.png",
    categories:["sticker-sheet", "sticker","featured", "all", "new"],
    tags: ["spring", "cute","momo","season"]
  },
   {
    slug: "lil-thing-spring-postcard",
    name: "Lil thing spring postcard",
    price: "$4.00",
    image: "asset/36.png",
    categories: ["postcard", "print","featured", "all", "new"],
    tags: ["spring", "cute","momo","season","tofu","cheri","noodle"]
  },
  {
    slug: "momo-spring-day-sticker-2",
    name: "Momo Spring Day 2 sticker sheet",
    price: "$3.00＋",
    image: "asset/35.png",
    categories: ["sticker-sheet", "sticker", "all", "new"],
    tags: ["spring", "cute","momo","season"]
  },
  {
    slug: "oopsie-mystery-bag-sticker-surprise-pack",
    name: "Oopsie Mystery Bag 🌱 Sticker Surprise Pack",
    price: "$4.50＋",
    image: "asset/31.jpg",
    categories:["surprise-pack","sticker", "all"],
    tags: ["fun"]
  },
   {
    slug: "am-that-girl-sassy-vinyl-sticker",
    name: "Am That Girl, Am The Attitude Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/24.png",
    categories: ["vinyl-sticker", "sticker","featured", "all"],
    tags: ["cute", "meme", "cheri", "girlboss"]
  },
   {
    slug: "lucky-charm-sticker-sheet",
    name: "Lucky charms Sticker Sheet",
    price: "$4.79＋",
    image: "asset/31.png",
    categories:["sticker-sheet", "sticker", "all", "popular"],
    tags: ["wing", "cute"]
  },
  {
    slug: "cake-roll-crochet-keychain",
    name: "Cake Roll Crochet Keychain",
    price: "$14.49",
    image: "asset/27.png",
    categories: ["crochet-keychain", "crochet","featured", "all"],
    tags: ["food", "desert", "handmade"]
  },
{
    slug: "best-of-luck-vinyl-sticker",
    name: "Best of Luck Vinyl Sticker",
    price: "$3.29",
    image: "asset/20.png",
   categories: ["vinyl-sticker", "sticker", "all"],
    tags: ["luck", "clover", "tofu"]
  },
  {
    slug: "fairy-helper-sticker-pack",
    name: "Fairy Helper Sticker Pack",
    price: "$5.50",
    image: "asset/15.png",
    categories: ["sticker-pack","sticker","featured", "all"],
    tags: ["cute", "fantasy", "fairy", "angle"]
  },
    {
    slug: "lucky-day-sticker-sheet",
    name: "Lucky Day Sticker Sheet",
    price: "$5.99＋",
    image: "asset/8.png",
    categories:["sticker-sheet", "sticker","popular", "all"],
    tags: ["clover", "cute", "tofu", "cheri"]
  },
 {
    slug: "tomato-lover-crochet-keychain",
    name: "Tomato Lover Crochet Keychain",
    price: "$14.49",
    image: "asset/28.png",
    categories: ["crochet-keychain", "crochet", "all"],
    tags: ["tomato", "handmade"]
  },
   {
    slug: "apple-and-worm-sticker-sheet",
    name: "Apple and Worm Sticker Sheet",
    price: "$5.99＋",
    image: "asset/11.png",
    categories: ["sticker-sheet", "sticker", "all"],
    tags: ["fruit", "apple"]
  },
  {
    slug: "i-am-chalant-sticker",
    name: "I Am Chalant- Noddle Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/25.png",
    categories:["vinyl-sticker", "sticker", "all"],
    tags: ["meme", "noddle"]
  },
   {
    slug: "doodle-paradise-sticker-sheet",
    name: "Doodle Paradise Sticker Sheet",
    price: "$5.99＋",
    image: "asset/10.png",
    categories:["sticker-sheet", "sticker", "all"],
    tags: ["cute"]
  },
  {
    slug: "pastel-angle-dream-sticker-sheet",
    name: "Pastel Angle Dream Sticker Sheet",
    price: "$4.79＋",
    image: "asset/33.png",
    categories: ["sticker-sheet", "sticker", "all"],
    tags: ["cute", "pastel", "angle", "wing"  ]
  },
  {
    slug: "good-luck-charm-sticker-sheet",
    name: "Good Luck Charm Sticker Sheet",
    price: "$4.79＋",
    image: "asset/5.png",
    categories:["sticker-sheet", "sticker", "all"],
    tags: ["luck", "wing", "cute"]
  },
   {
    slug: "yapping-24-7-vinyl-sticker",
    name: "Yapping 24/7 - Tofu Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/26.png",
    categories:["vinyl-sticker", "sticker", "all"],
    tags: ["meme", "tofu", "funny"]
  },
 
  {
    slug: "peace-was-never-an-option-vinyl-sticker",
    name: "Peace was never a option Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/23.png",
    categories:["vinyl-sticker", "sticker", "all"],
    tags: ["meme", "momo", "funny"]
  },
  {
    slug: "organic-cherries-vinyl-sticker",
    name: "Organic Cherries Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/22.png",
    categories:["vinyl-sticker", "sticker", "all"],
    tags: ["food", "fruit", "cherry", "cheri"]
  },
    {
    slug: "cherry-cherry-sweet-sticker-sheet",
    name: "Cherry Cherry Sweet Sticker Sheet",
    price: "$4.79＋",
    image: "asset/32.png",
    categories: ["sticker-sheet", "sticker", "all"],
    tags: ["fruit", "food", "cheri"]
  },
   {
    slug: "yummy-fry-egg-sticker-sheet",
    name: "Yummy Fry Egg Sticker Sheet",
    price: "$4.50＋",
    image: "asset/7.png",
    categories:["sticker-sheet", "sticker", "all"],
    tags: ["food", "egg", "cute"]
  },
  {
    slug: "sushi-bento-sticker-sheet",
    name: "Sushi 🍣, Bento 🍱 Sticker Sheet",
    price: "$4.79＋",
    image: "asset/6.png",
    categories:["sticker-sheet", "sticker", "all"],
    tags: ["food", "noodle", "sushi", "bento"]
  },
  {
    slug: "onigiri-noodle-vinyl-sticker",
    name: "Onigiri Noodle Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/16.png",
    categories:["vinyl-sticker", "sticker", "all"],
    tags: ["food", "noodle",]
  },
  {
    slug: "angle-frog-vinyl-sticker",
    name: "Angel Frog Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/19.png",
    categories:["vinyl-sticker", "sticker", "all"],
    tags: ["tofu", "cute", "angel"]
  },
   {
    slug: "lucky-fish-crochet-keychain",
    name: "Lucky Fish Crochet Keychain",
    price: "$14.49",
    image: "asset/29.png",
    categories: ["crochet-keychain", "crochet", "all"],
    tags: ["sea", "food", "handmade"]
  },
   {
    slug: "star-decor-sticker-sheet",
    name: "Star Sticker Decor Sticker Sheet",
    price: "$4.79＋",
    image: "asset/9.png",
   categories: ["sticker-sheet", "sticker", "all"],
    tags: ["cute", "decor"]
  },
  {
    slug: "dilly-dallying-vinyl-sticker",
    name: "Dilly Dallying - Chery Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/21.png",
    categories: ["vinyl-sticker", "sticker", "all"],
    tags: ["meme", "cheri", "fun"]
  },
  {
    slug: "lil-thing-gang-sticker-sheet",
    name: "Lil Things Gang Sticker Sheet",
    price: "$5.99＋",
    image: "asset/13.png",
    categories:["sticker-sheet", "sticker", "all"],
    tags: ["silly", "fun", "cheri", "noodle", "tofu", "momo"]
  },
  {
    slug: "momo-lovely-day-vinyl-sticker",
    name: "Momo Lovely Day Vinyl Sticker",
    price: "$3.99",
    image: "asset/18.png",
    categories:["vinyl-sticker", "sticker", "all"],
    tags: ["cute", "nice", "momo"]
  },
   {
    slug: "desert-paradise-sticker-sheet",
    name: "Desert Paradise Sticker Sheet",
    price: "$5.99＋",
    image: "asset/14.png",
    categories: ["sticker-sheet", "sticker", "all"],
    tags: ["desert", "food", "yum"]
  },
  {
    slug: "wishing-you-all-luck-vinyl-sticker",
    name: "Wishing You Luck Vinyl Sticker",
    price: "$3.29",
    image: "asset/17.png",
    categories:["vinyl-sticker", "sticker", "all"],
    tags: ["luck", "noodle", "poki"]
  },
 

  
  
// ==================== Sticker Sheet ====================
  
 
  {
    slug: "clover-leaf-crochet-keychain",
    name: "Clover Leaf Crochet Keychain",
    price: "$5.00",
    image: "asset/30.png",
    categories: ["crochet-keychain", "crochet", "all"],
    tags: ["clover", "luck"]
  },

 
 
  

 
 
  {
    slug: "lil-thing-gang-sticker-sheet",
    name: "Lil Things Gang Sticker Sheet",
    price: "$5.99＋",
    image: "asset/13.png",
    categories:["sticker-sheet", "sticker", "all"],
    tags: ["silly", "fun", "cheri", "noodle", "tofu", "momo"]
  },
  {
    slug: "lil-thing-stamps-sticker-sheet",
    name: "Lil Things Stamps Sticker Sheet",
    price: "$5.99＋",
    image: "asset/12.png",
    categories: ["sticker-sheet", "sticker", "all"],
    tags: ["stamp", "cheri", "noodle", "tofu", "poki", "momo"]
  },
 
// ==================== Crochet Keychain ====================
 
  
 
 
];


/ Filter arrays based on the specific categories
const newproducts = PRODUCTS_LIST.filter(p => p.categories.includes("new"));
const popularProducts = PRODUCTS_LIST.filter(p => p.categories.includes("popular"));
const featuredProducts = PRODUCTS_LIST.filter(p => p.categories.includes("featured"));

// Function to generate HTML inside specific sections
function displayProducts(products, sectionId) {
  const container = document.getElementById(sectionId);
  container.innerHTML = ""; // Clear existing content

  products.forEach(product => {
    container.innerHTML += `
      <div class="product-card1">

        <a href="product.html?slug=${product.slug}">

          <img src="${product.image}" alt="${product.name}">

          <h3>${product.name}</h3>

          <p>${product.price}</p>

        </a>

      </div>
    `;
  });
}

// Render products into the respective HTML containers
displayProducts(newProducts, "new-products");
displayProducts(popularProducts, "popular-products");
displayProducts(featuredProducts, "featured-products");





