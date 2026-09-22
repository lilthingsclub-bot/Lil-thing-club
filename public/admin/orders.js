console.log("✅ orders.js loaded");

let allOrders = [];


// =====================================
// ADMIN AUTH
// =====================================

async function requireAdmin() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    location.href = "login.html";
    return false;
  }

  const { data, error } =
    await supabaseClient.rpc("is_lil_things_admin");

  if (error || data !== true) {
    console.error("Admin verification failed:", error);

    await supabaseClient.auth.signOut();

    location.href = "login.html";

    return false;
  }

  return true;
}


// =====================================
// LOGOUT
// =====================================

document
  .getElementById("logoutBtn")
  .addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    location.href = "login.html";

  });


// =====================================
// LOAD ORDERS
// =====================================

async function loadOrders() {

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error("❌ Failed to load orders:", error);

    document.getElementById("ordersTable").innerHTML = `
      <p class="message">
        We couldn't load your orders.
      </p>
    `;

    return;
  }

  allOrders = data || [];

  // =====================================
  // LOAD PRODUCT / VARIANT INFORMATION
  // =====================================

  const variantIds = [
    ...new Set(
      allOrders.flatMap(order => {

        const items = Array.isArray(order.items)
          ? order.items
          : [];

        return items
          .map(item => item.variantId)
          .filter(Boolean);

      })
    )
  ];

  if (variantIds.length) {

    const {
      data: variants,
      error: variantError
    } = await supabaseClient
      .from("product_variants")
      .select(`
        id,
        product_id,
        name,
        label,
        price,
        products (
          name
        )
      `)
      .in("id", variantIds);

    if (variantError) {

      console.error(
        "❌ Failed to load product information:",
        variantError
      );

    } else {

      const variantMap = new Map(
        (variants || []).map(variant => [
          variant.id,
          variant
        ])
      );

      // Attach product information to each order item
      allOrders = allOrders.map(order => {

        const items = Array.isArray(order.items)
          ? order.items
          : [];

        return {
          ...order,

          items: items.map(item => {

            const variant =
              variantMap.get(item.variantId);

            if (!variant) {
              return item;
            }

            return {
              ...item,

              name:
                variant.products?.name ||
                "Product",

              label:
                variant.label ||
                variant.name ||
                "",

              price:
                Number(variant.price || 0)

            };

          })

        };

      });

    }

  }

  updateSummary();

  renderOrders(allOrders);
}
// =====================================
// SUMMARY
// =====================================

function updateSummary() {

  const totalOrders = allOrders.length;

  const totalRevenue = allOrders.reduce(
    (sum, order) => {

      if (
        order.status === "paid" ||
        order.status === "processing" ||
        order.status === "shipped" ||
        order.status === "delivered"
      ) {
        return sum + Number(order.total || 0);
      }

      return sum;

    },
    0
  );

  const needsFulfillment = allOrders.filter(
    order =>
      order.status === "paid" ||
      order.status === "processing"
  ).length;

  const shippedOrders = allOrders.filter(
    order =>
      order.status === "shipped" ||
      order.status === "delivered"
  ).length;


  document.getElementById("totalOrders").textContent =
    totalOrders;

  document.getElementById("totalRevenue").textContent =
    `$${totalRevenue.toFixed(2)}`;

  document.getElementById("needsFulfillment").textContent =
    needsFulfillment;

  document.getElementById("shippedOrders").textContent =
    shippedOrders;
}


// =====================================
// RENDER ORDERS
// =====================================

function renderOrders(orders) {

  const container =
    document.getElementById("ordersTable");

  if (!orders.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No orders found 💕</h3>
        <p class="muted">
          Try changing your search or status filter.
        </p>
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="orders-table-wrapper">

      <table class="orders-table">

        <thead>

          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${orders.map(order => {

            const items = Array.isArray(order.items)
              ? order.items
              : [];

            const itemCount = items.reduce(
              (sum, item) =>
                sum + Number(item.qty || 0),
              0
            );

            const customer =
              [
                order.first_name,
                order.last_name
              ]
                .filter(Boolean)
                .join(" ") ||
              order.customer_email ||
              "Guest";


            return `

              <tr>

                <td>
                  <strong>
                    #${shortOrderId(order.id)}
                  </strong>
                </td>

                <td>
                  ${formatDate(order.created_at)}
                </td>

                <td>
                  <div class="customer-cell">
                    <strong>${escapeHtml(customer)}</strong>
                    <small>
                      ${escapeHtml(order.customer_email || "")}
                    </small>
                  </div>
                </td>

                <td>
                  ${itemCount}
                  ${itemCount === 1 ? "item" : "items"}
                </td>

                <td>
                  <strong>
                    $${Number(order.total || 0).toFixed(2)}
                  </strong>
                </td>

                <td>
                  <span class="status-badge status-${escapeHtml(
                    order.status || "unknown"
                  )}">
                    ${formatStatus(order.status)}
                  </span>
                </td>

                <td>
                  <button
                    class="small-btn view-order-btn"
                    data-order-id="${order.id}"
                  >
                    View
                  </button>
                </td>

              </tr>

            `;

          }).join("")}

        </tbody>

      </table>

    </div>

  `;


  document
    .querySelectorAll(".view-order-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const order = allOrders.find(
            item =>
              item.id === button.dataset.orderId
          );

          if (order) {
            showOrderDetails(order);
          }

        }
      );

    });
}


// =====================================
// ORDER DETAILS
// =====================================

function showOrderDetails(order) {

  const card =
    document.getElementById("orderDetailsCard");

  const details =
    document.getElementById("orderDetails");

  document.getElementById(
    "orderDetailsTitle"
  ).textContent =
    `#${shortOrderId(order.id)}`;


  const items = Array.isArray(order.items)
    ? order.items
    : [];


  details.innerHTML = `

    <div class="order-detail-grid">

      <div class="detail-box">

        <h3>Customer</h3>

        <p>
          <strong>
            ${escapeHtml(
              [
                order.first_name,
                order.last_name
              ]
              .filter(Boolean)
              .join(" ") || "Guest"
            )}
          </strong>
        </p>

        <p>
          ${escapeHtml(
            order.customer_email || "No email"
          )}
        </p>

      </div>


      <div class="detail-box">

        <h3>Shipping Address</h3>

        <p>
          ${escapeHtml(order.address || "")}
          ${
            order.apartment
              ? `<br>${escapeHtml(order.apartment)}`
              : ""
          }
          <br>
          ${escapeHtml(order.city || "")},
          ${escapeHtml(order.state || "")}
          ${escapeHtml(order.zip || "")}
          <br>
          ${escapeHtml(order.country || "")}
        </p>

      </div>


      <div class="detail-box">

        <h3>Payment</h3>

        <p>
          Status:
          <strong>
            ${formatStatus(order.status)}
          </strong>
        </p>

        <p>
          Stripe:
          <br>
          <small>
            ${escapeHtml(
              order.stripe_payment_id || "—"
            )}
          </small>
        </p>

      </div>


      <div class="detail-box">

        <h3>Order Date</h3>

        <p>
          ${formatDate(order.created_at)}
        </p>

      </div>

    </div>


    <div class="detail-box order-items-box">

      <h3>Items</h3>

      <div class="order-items">

        ${
          items.length
            ? items.map(item => `

                <div class="order-item">

                  <div>

                    <strong>
                      ${escapeHtml(
                        item.name ||
                        item.label ||
                        "Product"
                      )}
                    </strong>

                    ${
                      item.option
                        ? `
                          <small>
                            ${escapeHtml(item.option)}
                          </small>
                        `
                        : ""
                    }

                  </div>

                  <div>
                    × ${Number(item.qty || 0)}
                  </div>

                  <strong>
                    $${(
                      Number(item.price || 0) *
                      Number(item.qty || 0)
                    ).toFixed(2)}
                  </strong>

                </div>

              `).join("")
            : `<p class="muted">No item details available.</p>`
        }

      </div>

    </div>


    <div class="order-totals">

      <div>
        <span>Subtotal</span>
        <strong>
          $${Number(order.subtotal || 0).toFixed(2)}
        </strong>
      </div>

      <div>
        <span>Shipping</span>
        <strong>
          $${Number(order.shipping || 0).toFixed(2)}
        </strong>
      </div>

      <div>
        <span>Discount</span>
        <strong>
          -$${Number(order.discount || 0).toFixed(2)}
        </strong>
      </div>

      <div>
        <span>Tax</span>
        <strong>
          $${Number(order.tax || 0).toFixed(2)}
        </strong>
      </div>

      <div class="order-total">

        <span>Total</span>

        <strong>
          $${Number(order.total || 0).toFixed(2)}
        </strong>

      </div>

    </div>

    <div class="detail-box">
  <h3>Shipping</h3>

  <div class="detail-row">
    <span>Status</span>
    <strong>${escapeHtml(order.status || "—")}</strong>
  </div>

  <div class="detail-row">
    <span>Tracking Number</span>
    <strong>${escapeHtml(order.tracking_number || "Not added")}</strong>
  </div>

  <div class="detail-row">
    <span>Shipped At</span>
    <strong>
      ${
        order.shipped_at
          ? new Date(order.shipped_at).toLocaleString()
          : "Not shipped"
      }
    </strong>
  </div>

  <div class="detail-row">
    <span>Delivered At</span>
    <strong>
      ${
        order.delivered_at
          ? new Date(order.delivered_at).toLocaleString()
          : "Not delivered"
      }
    </strong>
  </div>
</div>

    <div class="detail-box order-management-box">

      <h3>Order Management</h3>

      <div class="order-management-fields">

        <label for="orderStatus">
          Order Status
        </label>

        <select id="orderStatus">

          <option value="pending"
            ${order.status === "pending" ? "selected" : ""}>
            Pending
          </option>

          <option value="paid"
            ${order.status === "paid" ? "selected" : ""}>
            Paid
          </option>

          <option value="processing"
            ${order.status === "processing" ? "selected" : ""}>
            Processing
          </option>

          <option value="shipped"
            ${order.status === "shipped" ? "selected" : ""}>
            Shipped
          </option>

          <option value="delivered"
            ${order.status === "delivered" ? "selected" : ""}>
            Delivered
          </option>

          <option value="cancelled"
            ${order.status === "cancelled" ? "selected" : ""}>
            Cancelled
          </option>

          <option value="refunded"
            ${order.status === "refunded" ? "selected" : ""}>
            Refunded
          </option>

        </select>


        <label for="trackingNumber">
          Tracking Number
        </label>

        <input
          type="text"
          id="trackingNumber"
          value="${escapeHtml(order.tracking_number || "")}"
          placeholder="Enter USPS tracking number"
          autocomplete="off"
        />


        <button
          type="button"
          id="saveOrderChanges"
          class="small-btn"
        >
          Save Changes
        </button>

        <p
          id="orderSaveMessage"
          class="muted"
          style="display:none;"
        ></p>

      </div>

    </div>

  `;


  card.classList.remove("hidden");
    document
    .getElementById("saveOrderChanges")
    .addEventListener(
      "click",
      () => saveOrderChanges(order)
    );

  card.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// =====================================
// SAVE ORDER STATUS + TRACKING
// =====================================

async function saveOrderChanges(order) {

  const statusSelect =
    document.getElementById("orderStatus");

  const trackingInput =
    document.getElementById("trackingNumber");

  const saveButton =
    document.getElementById("saveOrderChanges");

  const message =
    document.getElementById("orderSaveMessage");


  if (!statusSelect || !trackingInput) {
    return;
  }


  const newStatus =
    statusSelect.value;

  const newTracking =
    trackingInput.value.trim();


  saveButton.disabled = true;
  saveButton.textContent = "Saving...";


  message.style.display = "none";


  const updateData = {
    status: newStatus,
    tracking_number:
      newTracking || null
  };


  // Automatically record shipping/delivery timestamps
  if (newStatus === "shipped") {

    updateData.shipped_at =
      order.shipped_at ||
      new Date().toISOString();

  }

  if (newStatus === "delivered") {

    updateData.delivered_at =
      order.delivered_at ||
      new Date().toISOString();

  }


  const {
    data,
    error
  } = await supabaseClient
    .from("orders")
    .update(updateData)
    .eq("id", order.id)
    .select()
    .single();


  if (error) {

    console.error(
      "❌ Failed to update order:",
      error
    );

    message.textContent =
      "Couldn't save changes. Please try again.";

    message.style.display = "block";

    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";

    return;
  }


  // Update local order data
  const index =
    allOrders.findIndex(
      item => item.id === order.id
    );


  if (index !== -1) {

    allOrders[index] = data;

  }


  // Update the object currently being displayed
  Object.assign(order, data);


  updateSummary();


  message.textContent =
    "Order updated successfully 💕";

  message.style.display = "block";


  saveButton.disabled = false;
  saveButton.textContent = "Save Changes";


  // Refresh the order list so the badge changes immediately
  renderOrders(
    getCurrentlyFilteredOrders()
  );

}


// =====================================
// CLOSE DETAILS
// =====================================

document
  .getElementById("closeOrderBtn")
  .addEventListener("click", () => {

    document
      .getElementById("orderDetailsCard")
      .classList.add("hidden");

  });


// =====================================
// SEARCH
// =====================================

document
  .getElementById("searchOrders")
  .addEventListener("input", filterOrders);


document
  .getElementById("statusFilter")
  .addEventListener("change", filterOrders);


function filterOrders() {

  const search =
    document
      .getElementById("searchOrders")
      .value
      .trim()
      .toLowerCase();

  const status =
    document
      .getElementById("statusFilter")
      .value;


  const filtered = allOrders.filter(order => {

    const customer =
      [
        order.first_name,
        order.last_name,
        order.customer_email
      ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();


    const payment =
      String(
        order.stripe_payment_id || ""
      ).toLowerCase();


    const matchesSearch =
      !search ||
      customer.includes(search) ||
      payment.includes(search) ||
      order.id.toLowerCase().includes(search);


    const matchesStatus =
      status === "all" ||
      (order.status || "").toLowerCase() === status;


    return matchesSearch && matchesStatus;

  });


  renderOrders(filtered);
}



// =====================================
// GET CURRENTLY FILTERED ORDERS
// =====================================

function getCurrentlyFilteredOrders() {

  const search =
    document
      .getElementById("searchOrders")
      .value
      .trim()
      .toLowerCase();

  const status =
    document
      .getElementById("statusFilter")
      .value;


  return allOrders.filter(order => {

    const customer =
      [
        order.first_name,
        order.last_name,
        order.customer_email
      ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();


    const payment =
      String(
        order.stripe_payment_id || ""
      ).toLowerCase();


    const matchesSearch =
      !search ||
      customer.includes(search) ||
      payment.includes(search) ||
      order.id.toLowerCase().includes(search);


    const matchesStatus =
      status === "all" ||
      (order.status || "").toLowerCase() === status;


    return matchesSearch && matchesStatus;

  });

}

// =====================================
// HELPERS
// =====================================

function shortOrderId(id) {

  if (!id) return "—";

  return id.slice(0, 8).toUpperCase();

}


function formatDate(date) {

  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


function formatStatus(status) {

  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// =====================================
// INIT
// =====================================

(async function init() {

  const isAdmin = await requireAdmin();

  if (!isAdmin) return;

  await loadOrders();

})();
