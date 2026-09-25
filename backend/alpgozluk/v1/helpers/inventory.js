const STOCK_STATUSES = Object.freeze({
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
});

const getStockStatus = (stockQuantity, lowStockThreshold = 5) => {
  const quantity = Math.max(0, Number(stockQuantity) || 0);
  const threshold = Math.max(0, Number(lowStockThreshold) || 0);
  if (quantity === 0) return STOCK_STATUSES.OUT_OF_STOCK;
  if (quantity <= threshold) return STOCK_STATUSES.LOW_STOCK;
  return STOCK_STATUSES.IN_STOCK;
};

module.exports = { STOCK_STATUSES, getStockStatus };
