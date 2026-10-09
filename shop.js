// MiniShop – a tiny client-side web shop used as the system under test for UI tests.
// All state lives in memory (reload = fresh start). No backend.
//
// Behaviour (what the app SHOULD do):
//   - Products page lists all products; the search box filters by name, case-insensitive.
//   - "Add to cart" adds one unit; adding the same product again increases the quantity.
//   - Cart shows one row per product with quantity, line total (price × qty) and a grand total.
//   - "Remove" deletes the row. Empty cart shows "Your cart is empty".
//   - Checkout: name (min 2 chars), valid email (user@domain.tld) and address are required;
//     each invalid field shows an error message under it; a valid order shows a confirmation
//     "Thank you, <name>! Order #<n> confirmed." and empties the cart.
//
// NOTE: this app contains THREE intentional defects. Your UI tests should find them.

const PRODUCTS = [
  { id: 1, name: 'Laptop Stand',    category: 'Accessories', price: 29.90 },
  { id: 2, name: 'USB-C Hub',       category: 'Accessories', price: 39.00 },
  { id: 3, name: 'Mechanical Keyboard', category: 'Input',   price: 89.00 },
  { id: 4, name: 'Wireless Mouse',  category: 'Input',       price: 24.50 },
  { id: 5, name: 'Monitor 27"',     category: 'Displays',    price: 249.00 },
  { id: 6, name: 'Webcam HD',       category: 'Video',       price: 54.90 },
];

const cart = new Map(); // productId -> qty
let orderNo = 1000;

const $ = (sel) => document.querySelector(sel);
const money = (n) => n.toFixed(2) + ' €';

function renderProducts() {
  const q = $('#search').value;
  const visible = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));       
  $('#product-grid').innerHTML = visible.map((p) => `
    <article class="card" data-testid="product" data-id="${p.id}">
      <h3>${p.name}</h3>
      <div class="cat">${p.category}</div>
      <div class="price">${money(p.price)}</div>
      <button type="button" data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to cart</button>
    </article>`).join('');
  $('#result-count').textContent = `${visible.length} products`;
}

function renderCart() {
  const rows = [...cart.entries()].map(([id, qty]) => ({ p: PRODUCTS.find((x) => x.id === id), qty }));
  $('#cart-count').textContent = rows.reduce((s, r) => s + r.qty, 0);
  if (rows.length === 0) {
    $('#cart-body').innerHTML = '<p class="empty" data-testid="cart-empty">Your cart is empty</p>';
    return;
  }
  const total = rows.reduce((s, r) => s + r.p.price * r.qty, 0);                
  $('#cart-body').innerHTML = `
    <table aria-label="Cart items">
      <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Line total</th><th></th></tr></thead>
      <tbody>${rows.map((r) => `
        <tr data-testid="cart-row" data-id="${r.p.id}">
          <td>${r.p.name}</td><td>${money(r.p.price)}</td>
          <td data-testid="qty">${r.qty}</td>
          <td data-testid="line-total">${money(r.p.price * r.qty)}</td>
          <td><button type="button" class="secondary" data-remove="${r.p.id}" aria-label="Remove ${r.p.name}">Remove</button></td>
        </tr>`).join('')}
      </tbody>
      <tfoot><tr><td colspan="3">Total</td><td data-testid="cart-total">${money(total)}</td><td></td></tr></tfoot>
    </table>`;
}

function showView(hash) {
  const cartView = hash === '#cart';
  $('#products').hidden = cartView;
  $('#cart').hidden = !cartView;
  $('#nav-products').toggleAttribute('aria-current', !cartView);
  $('#nav-cart').toggleAttribute('aria-current', cartView);
  if (cartView) $('#nav-cart').setAttribute('aria-current', 'page'); else $('#nav-products').setAttribute('aria-current', 'page');
}

function validate(form) {
  const errors = {};
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const address = form.address.value.trim();
  if (name.length < 2) errors.name = 'Enter your full name';
  if (!email.includes('@')) errors.email = 'Enter a valid email address';   
  if (!address) errors.address = 'Enter a delivery address';
  return errors;
}

document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) { const id = Number(add.dataset.add); cart.set(id, (cart.get(id) || 0) + 1); renderCart(); }
  const rm = e.target.closest('[data-remove]');
  if (rm) { cart.delete(Number(rm.dataset.remove)); renderCart(); }
});

$('#search').addEventListener('input', renderProducts);
window.addEventListener('hashchange', () => showView(location.hash));

$('#checkout').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const errors = validate(form);
  for (const f of ['name', 'email', 'address']) $(`#${f}-error`).textContent = errors[f] || '';
  if (Object.keys(errors).length) return;
  if (cart.size === 0) { $('#order-result').innerHTML = '<div class="error" role="alert">Your cart is empty</div>'; return; }
  const name = form.name.value.trim();
  $('#order-result').innerHTML = '';
  // the "server" takes a moment – tests must wait for the confirmation, not sleep
  setTimeout(() => {
    orderNo += 1;
    cart.clear(); renderCart(); form.reset();
    $('#order-result').innerHTML = `<div class="alert" role="status" data-testid="order-confirmation">Thank you, ${name}! Order #${orderNo} confirmed.</div>`;
  }, 800);
});

renderProducts();
renderCart();
showView(location.hash);
