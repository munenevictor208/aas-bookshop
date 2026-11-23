import test from "node:test";
import assert from "node:assert/strict";
import {
  CART_STORAGE_KEY,
  addToCart,
  getCartDetails,
  getCartTotals,
  loadCart,
  parseCart,
  persistCart,
  removeFromCart,
  updateCartQuantity,
} from "../app/data/cart.ts";
import { formatPrice, products } from "../app/data/products.ts";
import {
  buildOrder,
  parseOrders,
  readOrders,
  saveOrder,
} from "../app/data/orders.ts";

function makeStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

const customer = {
  name: "Amina",
  phone: "0712345678",
  email: "amina@example.com",
  address: "Kisumu, CBD",
  payment: "M-Pesa",
};

test("catalogue uses numeric KSh prices", () => {
  assert.equal(products.length, 8);
  for (const product of products) {
    assert.equal(typeof product.price, "number");
    assert.ok(product.price > 0);
  }
  assert.equal(formatPrice(50), "KSh 50");
  assert.equal(formatPrice(1200), "KSh 1,200");
});

test("adding products increases quantity and ignores unknown products", () => {
  let cart = addToCart([], 1);
  assert.deepEqual(cart, [{ productId: 1, quantity: 1 }]);

  cart = addToCart(cart, 1);
  assert.deepEqual(cart, [{ productId: 1, quantity: 2 }]);

  cart = addToCart(cart, 6, 3);
  assert.deepEqual(cart, [
    { productId: 1, quantity: 2 },
    { productId: 6, quantity: 3 },
  ]);

  assert.deepEqual(addToCart(cart, 999), cart);
});

test("removing products leaves other items untouched", () => {
  const cart = [
    { productId: 1, quantity: 2 },
    { productId: 6, quantity: 3 },
  ];
  assert.deepEqual(removeFromCart(cart, 1), [{ productId: 6, quantity: 3 }]);
  assert.deepEqual(removeFromCart(cart, 999), cart);
});

test("changing quantities updates, increases, and removes at zero", () => {
  let cart = addToCart([], 2);
  cart = updateCartQuantity(cart, 2, 4);
  assert.deepEqual(cart, [{ productId: 2, quantity: 4 }]);

  cart = updateCartQuantity(cart, 2, 1);
  assert.deepEqual(cart, [{ productId: 2, quantity: 1 }]);

  cart = updateCartQuantity(cart, 2, 0);
  assert.deepEqual(cart, []);

  cart = addToCart([], 3);
  assert.deepEqual(updateCartQuantity(cart, 3, -5), []);
});

test("line totals and cart subtotal are calculated in KSh", () => {
  let cart = addToCart([], 1, 2);
  cart = addToCart(cart, 4);

  const details = getCartDetails(cart);
  assert.equal(details[0].lineTotal, 100);
  assert.equal(details[1].lineTotal, 1200);

  const totals = getCartTotals(details);
  assert.deepEqual(totals, { itemCount: 3, subtotal: 1300 });
  assert.equal(formatPrice(totals.subtotal), "KSh 1,300");
});

test("cart contents survive a refresh through localStorage", () => {
  const storage = makeStorage();
  let cart = addToCart([], 2, 2);
  cart = addToCart(cart, 4);

  assert.equal(persistCart(storage, cart), true);

  const reloaded = loadCart(storage);
  assert.deepEqual(reloaded, cart);
  assert.deepEqual(getCartTotals(getCartDetails(reloaded)), {
    itemCount: 3,
    subtotal: 1240,
  });
});

test("clearing the cart empties it after reload", () => {
  const storage = makeStorage();
  persistCart(storage, addToCart([], 5));
  assert.equal(loadCart(storage).length, 1);

  persistCart(storage, []);
  assert.equal(loadCart(storage).length, 0);
});

test("corrupt or outdated stored cart data is ignored", () => {
  assert.deepEqual(parseCart(null), []);
  assert.deepEqual(parseCart("not json"), []);
  assert.deepEqual(parseCart('{"productId":1}'), []);
  assert.deepEqual(
    parseCart(
      JSON.stringify([
        { productId: 999, quantity: 2 },
        { productId: 1, quantity: 0 },
      ])
    ),
    []
  );
  assert.deepEqual(
    loadCart(makeStorage({ [CART_STORAGE_KEY]: "broken" })),
    []
  );
});

test("checkout builds a complete order with customer and KSh total", () => {
  let cart = addToCart([], 1, 2);
  cart = addToCart(cart, 3);
  const details = getCartDetails(cart);
  const { subtotal, itemCount } = getCartTotals(details);

  const order = buildOrder({
    customer,
    items: details.map(({ product, quantity, lineTotal }) => ({
      name: product.name,
      quantity,
      lineTotal,
    })),
    total: subtotal,
    now: 1760000000000,
  });

  assert.match(order.orderNumber, /^AAS-\d{6}-\d{3}$/);
  assert.equal(order.customer.name, "Amina");
  assert.equal(order.customer.phone, "0712345678");
  assert.equal(order.customer.address, "Kisumu, CBD");
  assert.equal(order.customer.payment, "M-Pesa");
  assert.equal(order.items.length, 2);
  assert.equal(itemCount, 3);
  assert.equal(order.total, 250);
  assert.equal(formatPrice(order.total), "KSh 250");
});

test("submitted orders are saved and listed newest first", () => {
  const storage = makeStorage();
  const first = buildOrder({
    customer,
    items: [{ name: "Pencils", quantity: 2, lineTotal: 30 }],
    total: 30,
    now: 1760000000000,
  });
  const second = buildOrder({
    customer,
    items: [{ name: "School Bags", quantity: 1, lineTotal: 1200 }],
    total: 1200,
    now: 1760000000001,
  });

  assert.equal(saveOrder(first, storage), true);
  assert.equal(saveOrder(second, storage), true);
  assert.deepEqual(readOrders(storage).map((order) => order.orderNumber), [
    second.orderNumber,
    first.orderNumber,
  ]);
  assert.equal(readOrders(storage)[0].total, 1200);
});

test("malformed saved orders are ignored", () => {
  assert.deepEqual(parseOrders("oops"), []);
  assert.deepEqual(
    parseOrders(JSON.stringify([{ orderNumber: "AAS-1" }, { total: 5 }])),
    []
  );
});
