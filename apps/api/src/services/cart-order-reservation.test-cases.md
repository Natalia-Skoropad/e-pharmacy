# Cart / Checkout / Orders reservation test cases

Use these cases after seeding at least one product offer with predictable quantities, for example `totalQuantity: 10`, `activeQuantity: 10`, `reservedQuantity: 0`.

## 1. Add item to cart reserves stock

1. Add product from pharmacy A with quantity 2.
2. Check cart response contains the item with quantity 2.
3. Check product offer for pharmacy A:
   - `activeQuantity` decreased by 2;
   - `reservedQuantity` increased by 2;
   - `totalQuantity` is unchanged.

## 2. Remove cart item releases reservation

1. Start with product reserved in the cart with quantity 2.
2. Remove the cart item.
3. Check the cart no longer contains the item.
4. Check product offer:
   - `activeQuantity` increased by 2;
   - `reservedQuantity` decreased by 2;
   - `totalQuantity` is unchanged.

## 3. Increase cart quantity reserves only the delta

1. Start with cart quantity 2.
2. Update the cart item quantity to 5.
3. Check product offer:
   - `activeQuantity` decreased by 3;
   - `reservedQuantity` increased by 3;
   - `totalQuantity` is unchanged.

## 4. Decrease cart quantity releases only the delta

1. Start with cart quantity 5.
2. Update the cart item quantity to 2.
3. Check product offer:
   - `activeQuantity` increased by 3;
   - `reservedQuantity` decreased by 3;
   - `totalQuantity` is unchanged.

## 5. Expired cart items return reserved stock

1. Create or edit a cart item so `expiresAt` is in the past.
2. Request the cart.
3. Check expired items are removed from cart response.
4. Check product offer reservation was released:
   - `activeQuantity` increased by the expired quantity;
   - `reservedQuantity` decreased by the expired quantity.

## 6. Checkout commits only selected pharmacy order

1. Add items from pharmacy A and pharmacy B to the same cart.
2. Checkout only pharmacy A.
3. Check the order contains only pharmacy A items.
4. Check cart still contains pharmacy B items.
5. Check pharmacy A product offers:
   - `reservedQuantity` decreased by purchased quantity;
   - `totalQuantity` decreased by purchased quantity;
   - `activeQuantity` is not increased back.
6. Check pharmacy B product offers are unchanged.

## 7. Checkout saves order snapshot and delivery details

1. Checkout with delivery method `post`, recipient data, address and comment.
2. Check order response and database record contain:
   - product snapshot;
   - pharmacy snapshot;
   - delivery details;
   - comment;
   - status;
   - total items and total price.

## 8. Unavailable stock blocks reservation

1. Set product offer `activeQuantity` to 1.
2. Try to add or increase cart quantity above 1.
3. Check API returns conflict and product quantities stay unchanged.
