const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { closeDatabase, getDb } = require('../alpgozluk/v1/models/db');
const inventoryService = require('../alpgozluk/v1/services/inventoryService');
const productService = require('../alpgozluk/v1/services/productService');

const database = getDb();
const marker = `inventory-smoke-${randomUUID()}`;
let variantId;
let originalStock;
let originalThreshold;
let movementFloor = 0;
let auditFloor = 0;
let productSlug;

async function cleanup() {
  if (!variantId) return;
  await database.query(
    'DELETE FROM inventory_movements WHERE variant_id = ? AND id > ? AND note = ?',
    [variantId, movementFloor, marker],
  );
  await database.query(
    `DELETE FROM audit_logs
     WHERE entity_type = 'product_variant' AND entity_id = ? AND id > ?
       AND action IN ('inventory.adjust', 'inventory.threshold_update')`,
    [variantId, auditFloor],
  );
  await database.query(
    'UPDATE product_variants SET stock_quantity = ?, low_stock_threshold = ? WHERE id = ?',
    [originalStock, originalThreshold, variantId],
  );
}

async function run() {
  const [[variantRows], [users], [movementRows], [auditRows]] = await Promise.all([
    database.query(
      `SELECT pv.id, pv.stock_quantity, pv.low_stock_threshold, pt.slug
       FROM product_variants pv
       INNER JOIN products p ON p.id = pv.product_id
       INNER JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'tr'
       WHERE pv.status = 'active' AND pv.deleted_at IS NULL
         AND p.status = 'published' AND p.deleted_at IS NULL
         AND (SELECT COUNT(*) FROM product_variants sibling
              WHERE sibling.product_id = p.id AND sibling.status = 'active' AND sibling.deleted_at IS NULL) = 1
       ORDER BY pv.id LIMIT 1`,
    ),
    database.query(
      `SELECT DISTINCT u.id
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE p.code = 'inventory.manage' AND u.deleted_at IS NULL
       ORDER BY u.id LIMIT 1`,
    ),
    database.query('SELECT COALESCE(MAX(id), 0) AS id FROM inventory_movements'),
    database.query('SELECT COALESCE(MAX(id), 0) AS id FROM audit_logs'),
  ]);
  const variant = variantRows[0];
  assert.ok(variant, 'Stok smoke testi için aktif varyant bulunamadı.');
  assert.ok(users[0], 'inventory.manage yetkili kullanıcı bulunamadı.');
  variantId = Number(variant.id);
  originalStock = Number(variant.stock_quantity);
  originalThreshold = Number(variant.low_stock_threshold);
  productSlug = variant.slug;
  movementFloor = Number(movementRows[0].id);
  auditFloor = Number(auditRows[0].id);
  const requestMeta = { userId: Number(users[0].id), requestId: randomUUID(), ip: '127.0.0.1' };

  const increased = await inventoryService.adjust(variantId, {
    direction: 'increase', quantity: 2, reasonCode: 'manual_correction', note: marker,
  }, requestMeta);
  assert.equal(increased.availableQuantity, originalStock + 2);

  const decreased = await inventoryService.adjust(variantId, {
    direction: 'decrease', quantity: 2, reasonCode: 'manual_correction', note: marker,
  }, requestMeta);
  assert.equal(decreased.availableQuantity, originalStock);

  await assert.rejects(
    inventoryService.adjust(variantId, {
      direction: 'decrease', quantity: originalStock + 1, reasonCode: 'manual_correction', note: marker,
    }, requestMeta),
    (error) => error.statusCode === 409,
  );

  const nextThreshold = originalThreshold === 100000 ? originalThreshold - 1 : originalThreshold + 1;
  const thresholdResult = await inventoryService.updateThreshold(variantId, nextThreshold, requestMeta);
  assert.equal(thresholdResult.lowStockThreshold, nextThreshold);

  const [movementResult, auditResult, variantResult] = await Promise.all([
    database.query(
      'SELECT COUNT(*) AS count FROM inventory_movements WHERE variant_id = ? AND id > ? AND note = ?',
      [variantId, movementFloor, marker],
    ),
    database.query(
      `SELECT COUNT(*) AS count FROM audit_logs
       WHERE entity_type = 'product_variant' AND entity_id = ? AND id > ?
         AND action IN ('inventory.adjust', 'inventory.threshold_update')`,
      [variantId, auditFloor],
    ),
    database.query('SELECT stock_quantity FROM product_variants WHERE id = ?', [variantId]),
  ]);
  const movementCount = movementResult[0][0];
  const auditCount = auditResult[0][0];
  const currentVariant = variantResult[0][0];
  assert.equal(Number(movementCount.count), 2);
  assert.equal(Number(auditCount.count), 3);
  assert.equal(Number(currentVariant.stock_quantity), originalStock);

  await database.query('UPDATE product_variants SET stock_quantity = 0, low_stock_threshold = 3 WHERE id = ?', [variantId]);
  const outOfStockProduct = await productService.findPublishedBySlug('tr', productSlug);
  const outOfStockVariant = outOfStockProduct.variants.find((item) => Number(item.id) === variantId);
  assert.equal(outOfStockVariant.stockStatus, 'out_of_stock');
  const outOfStockList = await productService.listPublished('tr', { page: 1, limit: 100, sort: 'featured' });
  let reachedOutOfStockProducts = false;
  for (const product of outOfStockList.products) {
    if (!product.isInStock) reachedOutOfStockProducts = true;
    else assert.equal(reachedOutOfStockProducts, false, 'Stoklu ürün tükenen üründen sonra sıralandı.');
  }

  await database.query('UPDATE product_variants SET stock_quantity = 3, low_stock_threshold = 3 WHERE id = ?', [variantId]);
  const lowStockProduct = await productService.findPublishedBySlug('tr', productSlug);
  assert.equal(lowStockProduct.variants.find((item) => Number(item.id) === variantId).stockStatus, 'low_stock');

  await database.query('UPDATE product_variants SET stock_quantity = 4, low_stock_threshold = 3 WHERE id = ?', [variantId]);
  const inStockProduct = await productService.findPublishedBySlug('tr', productSlug);
  assert.equal(inStockProduct.variants.find((item) => Number(item.id) === variantId).stockStatus, 'in_stock');
  process.stdout.write('DB stok smoke testi geçti: artırma/azaltma, negatif stok koruması, hareket ve audit kayıtları.\n');
}

run()
  .then(cleanup)
  .catch(async (error) => {
    try {
      await cleanup();
    } catch (cleanupError) {
      process.stderr.write(`Stok smoke temizleme hatası: ${cleanupError.stack || cleanupError.message}\n`);
    }
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
