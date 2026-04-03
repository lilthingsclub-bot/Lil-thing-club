const CATEGORY_INFO = {
  "vinyl-sticker": {
    title: "Vinyl Sheets",
    desc: "Explore our cute vinyl sticker, perfect for decorating your Laptop, Water Bottle, or any creative project!"
  },
   "sticker-sheet": {
    title: "Sticker Sheets",
    desc: "Explore our cute vinyl sticker sheets, perfect for decorating your planner, notebook, or any creative project!"
  },
  "sticker": {
    title: "Stickers",
    desc: "Our adorable stickers come in many fun designs — collect them all!"
  },
  "crochet": {
    title: "Crochet Cuties",
    desc: "Handmade crochet keychains and charms — soft, adorable, and full of personality."
  },
  "phone-charm": {
    title: "Phone Charms",
    desc: "Decorate your phone with our unique handmade charms, perfect for gifts or personal style."
  },
  "all": {
    title: "All Products",
    desc: "Browse all our handmade items — stickers, crochet keychains, and phone charms, packed with love!"
  }
};








const PRODUCTS_LIST = [
  {
    slug: "oopsie-mystery-bag-sticker-surprise-pack",
    name: "Oopsie Mystery Bag 🌱 Sticker Surprise Pack",
    price: "$4.50＋",
    image: "asset/31.jpg",
    category:["surprise-pack","sticker", "all"],
    tags: ["fun"]
  },
  {
    slug: "fairy-helper-sticker-pack",
    name: "Fairy Helper Sticker Pack",
    price: "$5.50",
    image: "asset/15.png",
    category: "sticker-pack",
    tags: ["cute", "fantasy", "fairy", "angle"]
  },


// ==================== vinyl stocker ====================
  {
    slug: "am-that-girl-sassy-vinyl-sticker",
    name: "Am That Girl, Am The Attitude Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/24.png",
    category: "vinyl-sticker",
    tags: ["cute", "meme", "cheri", "girlboss"]
  },
  {
    slug: "best-of-luck-vinyl-sticker",
    name: "Best of Luck Vinyl Sticker",
    price: "$3.29",
    image: "asset/20.png",
    category: "vinyl-sticker",
    tags: ["luck", "clover", "tofu"]
  },
  {
    slug: "i-am-chalant-sticker",
    name: "I Am Chalant- Noddle Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/25.png",
    category: "vinyl-sticker",
    tags: ["meme", "noddle"]
  },
  {
    slug: "yapping-24-7-vinyl-sticker",
    name: "Yapping 24/7 - Tofu Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/26.png",
    category: "vinyl-sticker",
    tags: ["meme", "tofu", "funny"]
  },
  {
    slug: "peace-was-never-an-option-vinyl-sticker",
    name: "Peace was never a option Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/23.png",
    category: "vinyl-sticker",
    tags: ["meme", "momo", "funny"]
  },
  {
    slug: "organic-cherries-vinyl-sticker",
    name: "Organic Cherries Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/22.png",
    category: "vinyl-sticker",
    tags: ["food", "fruit", "cherry", "cheri"]
  },
  {
    slug: "onigiri-noodle-vinyl-sticker",
    name: "Onigiri Noodle Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/16.png",
    category: "vinyl-sticker",
    tags: ["food", "noodle",]
  },
  {
    slug: "angle-frog-vinyl-sticker",
    name: "Angel Frog Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/19.png",
    category: "vinyl-sticker",
    tags: ["tofu", "cute", "angel"]
  },
  {
    slug: "dilly-dallying-vinyl-sticker",
    name: "Dilly Dallying - Chery Vinyl Sticker",
    price: "$2.19＋",
    image: "asset/21.png",
    category: "vinyl-sticker",
    tags: ["meme", "cheri", "fun"]
  },
  {
    slug: "momo-lovely-day-vinyl-sticker",
    name: "Momo Lovely Day Vinyl Sticker",
    price: "$3.99",
    image: "asset/18.png",
    category: "vinyl-sticker",
    tags: ["cute", "nice", "momo"]
  },
  {
    slug: "wishing-you-all-luck-vinyl-sticker",
    name: "Wishing You Luck Vinyl Sticker",
    price: "$3.29",
    image: "asset/17.png",
    category: "vinyl-sticker",
    tags: ["luck", "noodle", "poki"]
  },
  // ==================== post card ====================

   {
    slug: "lil-thing-spring-postcard",
    name: "Lil thing spring postcard",
    price: "$4.00",
    image: "asset/36.png",
    category: "postcard",
    tags: ["spring", "cute","momo","season","tofu","cheri","noodle"]
  },
  
// ==================== Sticker Sheet ====================
   {
    slug: "momo-spring-day-sticker-1",
    name: "Momo Spring Day 1 sticker sheet",
    price: "$5.99＋",
    image: "asset/34.png",
    category: "sticker-sheet",
    tags: ["spring", "cute","momo","season"]
  },
 {
    slug: "momo-spring-day-sticker-2",
    name: "Momo Spring Day 2 sticker sheet",
    price: "$3.00＋",
    image: "asset/35.png",
    category: "sticker-sheet",
    tags: ["spring", "cute","momo","season"]
  },
  {
    slug: "lucky-charm-sticker-sheet",
    name: "Lucky charms Sticker Sheet",
    price: "$4.79＋",
    image: "asset/31.png",
    category: "sticker-sheet",
    tags: ["wing", "cute"]
  },
  {
    slug: "lucky-day-sticker-sheet",
    name: "Lucky Day Sticker Sheet",
    price: "$5.99＋",
    image: "asset/8.png",
    category: "sticker-sheet",
    tags: ["clover", "cute", "tofu", "cheri"]
  },
  {
    slug: "apple-and-worm-sticker-sheet",
    name: "Apple and Worm Sticker Sheet",
    price: "$5.99＋",
    image: "asset/11.png",
    category: "sticker-sheet ",
    tags: ["fruit", "apple"]
  },
  {
    slug: "doodle-paradise-sticker-sheet",
    name: "Doodle Paradise Sticker Sheet",
    price: "$5.99＋",
    image: "asset/10.png",
    category: "sticker-sheet",
    tags: ["cute"]
  },
  {
    slug: "pastel-angle-dream-sticker-sheet",
    name: "Pastel Angle Dream Sticker Sheet",
    price: "$4.79＋",
    image: "asset/33.png",
    category: "sticker-sheet",
    tags: ["cute", "pastel", "angle", "wing"  ]
  },
  {
    slug: "good-luck-charm-sticker-sheet",
    name: "Good Luck Charm Sticker Sheet",
    price: "$4.79＋",
    image: "asset/5.png",
    category: "sticker-sheet",
    tags: ["luck", "wing", "cute"]
  },
  {
    slug: "cherry-cherry-sweet-sticker-sheet",
    name: "Cherry Cherry Sweet Sticker Sheet",
    price: "$4.79＋",
    image: "asset/32.png",
    category: "sticker-sheet",
    tags: ["fruit", "food", "cheri"]
  },
  {
    slug: "yummy-fry-egg-sticker-sheet",
    name: "Yummy Fry Egg Sticker Sheet",
    price: "$4.50＋",
    image: "asset/7.png",
    category: "sticker-sheet",
    tags: ["food", "egg", "cute"]
  },
  {
    slug: "sushi-bento-sticker-sheet",
    name: "Sushi 🍣, Bento 🍱 Sticker Sheet",
    price: "$4.79＋",
    image: "asset/6.png",
    category: "sticker-sheet",
    tags: ["food", "noodle", "sushi", "bento"]
  },
  {
    slug: "star-decor-sticker-sheet",
    name: "Star Sticker Decor Sticker Sheet",
    price: "$4.79＋",
    image: "asset/9.png",
    category: "sticker-sheet",
    tags: ["cute", "decor"]
  },
  {
    slug: "lil-thing-gang-sticker-sheet",
    name: "Lil Things Gang Sticker Sheet",
    price: "$5.99＋",
    image: "asset/13.png",
    category: "sticker-sheet",
    tags: ["silly", "fun", "cheri", "noodle", "tofu", "momo"]
  },
  {
    slug: "lil-thing-stamps-sticker-sheet",
    name: "Lil Things Stamps Sticker Sheet",
    price: "$5.99＋",
    image: "asset/12.png",
    category: "sticker-sheet",
    tags: ["stamp", "cheri", "noodle", "tofu", "poki", "momo"]
  },
  {
    slug: "desert-paradise-sticker-sheet",
    name: "Desert Paradise Sticker Sheet",
    price: "$5.99＋",
    image: "asset/14.png",
    category: "sticker-sheet",
    tags: ["desert", "food", "yum"]
  },
// ==================== Crochet Keychain ====================
  {
    slug: "cake-roll-crochet-keychain",
    name: "Cake Roll Crochet Keychain",
    price: "$14.49",
    image: "asset/27.png",
    category: "crochet-keychain",
    tags: ["food", "desert", "handmade"]
  },
  {
    slug: "tomato-lover-crochet-keychain",
    name: "Tomato Lover Crochet Keychain",
    price: "$14.49",
    image: "asset/28.png",
    category: "crochet-keychain",
    tags: ["tomato", "handmade"]
  },
  {
    slug: "lucky-fish-crochet-keychain",
    name: "Lucky Fish Crochet Keychain",
    price: "$14.49",
    image: "asset/29.png",
    category: "crochet-keychain",
    tags: ["sea", "food", "handmade"]
  },
  {
    slug: "clover-leaf-crochet-keychain",
    name: "Clover Leaf Crochet Keychain",
    price: "$5.00",
    image: "asset/30.png",
    category: "crochet-keychain ",
    tags: ["clover", "luck"]
  },
];

