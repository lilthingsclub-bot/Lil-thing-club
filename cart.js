const cartItemsEl = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartPage = document.getElementById("cartPage");
const subTotalEl = document.getElementById("subTotal");
const grandTotalEl = document.getElementById("grandTotal");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const bubble = document.getElementById("cartCount");
  if (bubble) bubble.textContent = count;
}

function renderCart() {
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    cartEmpty.classList.remove("hidden");
    cartPage.classList.add("hidden");
    return;
  }

  cartEmpty.classList.add("hidden");
  cartPage.classList.remove("hidden");

  let subtotal = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    cartItemsEl.innerHTML += `
      <div class="cart-item">
        <div class="product">
          <img src="${item.image}">
          <div>
            <p>${item.name}</p>
<small>Option: ${item.option || "Standard"}</small>

          </div>
        </div>

        <div class="qty">
          <button onclick="changeQty(${index}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${index}, 1)">+</button>
        </div>

        <div>$${itemTotal.toFixed(2)}</div>

        <div class="delete" onclick="removeItem(${index})">🗑️</div>
      </div>
    `;
  });

  subTotalEl.textContent = `$${subtotal.toFixed(2)}`;
  grandTotalEl.textContent = `$${subtotal.toFixed(2)}`;
}

function changeQty(index, amount) {
  cart[index].qty += amount;
  if (cart[index].qty < 1) cart.splice(index, 1);
  saveCart();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

renderCart();
updateCartCount();



