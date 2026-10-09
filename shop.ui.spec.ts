import { test, expect } from '@playwright/test';
import { ShopPage } from './shop.page';
test('UI-01 products page shows 6 products', async ({ page }) => {
await page.goto('/');
await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
await expect(page.getByTestId('product')).toHaveCount(6);
await expect(page.getByTestId('result-count')).toHaveText('6 products');
});

test('UI-02 search finds Wireless Mouse', async ({ page }) => {
await page.goto('/');
await page.getByRole('searchbox', { name: 'Search products' }).fill('Mouse');
await expect(page.getByTestId('product')).toContainText('Wireless Mouse');
});

test('UI-03 lowercase search finds Wireless Mouse', async ({ page }) => {
await page.goto('/');
await page.getByRole('searchbox', { name: 'Search products' }).fill('mouse');
await expect(page.getByTestId('product')).toHaveCount(1);
await expect(page.getByTestId('product')).toContainText('Wireless Mouse');
});

test('UI-04 adding Laptop Stand updates cart count', async ({ page }) => {
await page.goto('/');
await page.getByRole('button', { name: 'Add Laptop Stand to cart' }).click();
await expect(page.getByTestId('cart-count')).toHaveText('1');
});

test('UI-05 cart shows correct USB-C Hub total', async ({ page }) => {
await page.goto('/');
await page.getByRole('button', { name: 'Add USB-C Hub to cart' }).click();
await page.getByRole('link', { name: /Cart/ }).click();
await expect(page.getByTestId('cart-row')).toHaveCount(1);
await expect(page.getByTestId('cart-total')).toHaveText('39.00 €');
});

test('UI-06 adding the same product twice gives qty 2 and total 78.00 €', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.open(); 
  await shop.add('USB-C Hub');
  await shop.add('USB-C Hub');
  await shop.openCart();
  await expect(page.getByTestId('qty')).toHaveText('2');
  await expect(page.getByTestId('line-total')).toHaveText('78.00 €');
  await expect(shop.cartTotal()).toHaveText('78.00 €');
});

test('UI-07 removing Webcam HD empties cart', async ({ page }) => {
await page.goto('/');
await page.getByRole('button', { name: 'Add Webcam HD to cart' }).click();
await page.getByRole('link', { name: /Cart/ }).click();
await page.getByRole('button', { name: 'Remove Webcam HD' }).click();
await expect(page.getByTestId('cart-empty')).toBeVisible();
await expect(page.getByTestId('cart-count')).toHaveText('0');
});

test('UI-08 empty checkout shows three validation errors', async ({ page }) => {
await page.goto('/');
await page.getByRole('link', { name: /Cart/ }).click();
await page.getByRole('button', { name: 'Place order' }).click();
await expect(page.locator('#name-error')).toBeVisible();
await expect(page.locator('#email-error')).toBeVisible();
await expect(page.locator('#address-error')).toBeVisible();
});

test('UI-09 invalid email is rejected', async ({ page }) => {
await page.goto('/');
await page.getByRole('button', { name: 'Add USB-C Hub to cart' }).click();
await page.getByRole('link', { name: /Cart/ }).click();
await page.getByLabel('Full name').fill('Mari Maasikas');
await page.getByLabel('Email').fill('mari@');
await page.getByLabel('Delivery address').fill('Pikk 1, Tallinn');
await page.getByRole('button', { name: 'Place order' }).click();
await expect(page.locator('#email-error')).toContainText('Enter a valid email address');
});

test('UI-10 valid order shows confirmation and empties the cart', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.open(); 
  await shop.add('Wireless Mouse');
  await shop.openCart();
  await shop.checkout('Mari Maasikas', 'mari@example.com', 'Pikk 1, Tallinn');
  await expect(shop.confirmation()).toContainText('Thank you, Mari Maasikas!');
  await expect(shop.cartCount()).toHaveText('0');
});