


document.addEventListener("DOMContentLoaded", () => {

  // ==================== MOBILE MENU ====================
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeMenu = document.getElementById("closeMenu");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      mobileMenu.style.left = "0";
    });
  }

  if (closeMenu) {
    closeMenu.addEventListener("click", () => {
      mobileMenu.style.left = "-260px";
    });
  }

  // ==================== CART COUNT ====================
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  document.getElementById("cartCount").textContent = cart.length;

  // ==================== FILTER & SORT ====================
  const availabilityBtn = document.getElementById("availabilityBtn");
  const availabilityMenu = document.getElementById("availabilityMenu");
  const sortBtn = document.getElementById("sortBtn");
  const sortMenu = document.getElementById("sortMenu");
  const products = document.querySelectorAll(".product-card1");

  availabilityBtn.addEventListener("click", e => {
    e.stopPropagation();
    availabilityMenu.classList.toggle("show");
    sortMenu.classList.remove("show");
  });

  sortBtn.addEventListener("click", e => {
    e.stopPropagation();
    sortMenu.classList.toggle("show");
    availabilityMenu.classList.remove("show");
  });

  document.addEventListener("click", () => {
    availabilityMenu.classList.remove("show");
    sortMenu.classList.remove("show");
  });

  const sortMap = {
    "all": "",
    "sticker-sheet": "Sticker Sheet",
    "vinyl-sticker": "Vinyl Sticker",
    "sticker-pack": "Sticker Pack",
    "crochet-keychain": "Crochet Keychain",
    "crochet-phone-charm": "Phone Charm",
    "crochet-pouch": "Pouch"
  };

  document.querySelectorAll("[data-sort]").forEach(option => {
    option.addEventListener("click", () => {
      const type = option.dataset.sort;
      const text = sortMap[type];

      products.forEach(card => {
        const name = card.querySelector(".product-name1").innerText;
        card.style.display =
          type === "all" || name.includes(text) ? "block" : "none";
      });

      sortBtn.textContent = `Sort by : ${option.innerText} ▼`;
      sortMenu.classList.remove("show");
    });
  });

  document.querySelectorAll("[data-filter]").forEach(option => {
    option.addEventListener("click", () => {
      const type = option.dataset.filter;

      products.forEach(card => {
        const status = card.dataset.status;
        card.style.display =
          type === "all" || status === "in" ? "block" : "none";
      });

      availabilityBtn.textContent = `Filter: ${option.innerText} ▼`;
      availabilityMenu.classList.remove("show");
});
  });

}); 




  document.querySelectorAll(".character-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".character-item");

      // close others
      document.querySelectorAll(".character-item").forEach(i => {
        if (i !== item) i.classList.remove("active");
      });

      // toggle current
      item.classList.toggle("active");
    });
  });




function doPost(e) {
  const sheet = SpreadsheetApp.openById("AKfycbyR-mewcnW7KcqBczJuoqypvDXNGfwNyTSfxkRZ1icQIayegBk75AQIm6XOp7vA-QX-")
    .getSheetByName("Newsletter");

  sheet.appendRow([
    new Date(),
    e.parameter.email,
    "Homepage signup"
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

document.getElementById("signup-form").addEventListener("submit", function(e) {
  e.preventDefault();

  fetch(this.action, {
    method: "POST",
    body: new FormData(this)
  }).then(() => {
    this.style.display = "none";
    document.getElementById("thanks-message").style.display = "block";
  });
});

document.getElementById("contact-form").addEventListener("submit", function(e) {
  e.preventDefault();

  fetch(this.action, {
    method: "POST",
    body: new FormData(this)
  }).then(() => {
    this.style.display = "none";
    document.getElementById("thanks-message").style.display = "block";
  });
});

