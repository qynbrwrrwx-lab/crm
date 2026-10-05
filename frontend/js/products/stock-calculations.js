// Produits : validation et projection du réassort.

function getRestockProjection(product, quantity) {
  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return { valid: false, message: "Saisissez une quantité entière positive." };
  }
  return { valid: true, quantity: parsedQuantity, nextStock: Number(product.stock || 0) + parsedQuantity };
}
