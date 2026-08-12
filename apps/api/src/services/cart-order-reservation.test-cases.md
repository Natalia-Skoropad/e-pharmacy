# Cart / Checkout / Order stock lifecycle test cases

The cart stores **expiring purchase intent only**. Adding, updating, removing, clearing, or expiring cart items must not change `availableQuantity`, `reservedQuantity`, or `totalQuantity`.

Stock reservation starts only when checkout creates an Order.

Use these cases after seeding at least one product offer with predictable quantities, for example `totalQuantity: 10`, `availableQuantity: 10`, `reservedQuantity: 0`.

## 1. Add item to cart does not reserve stock

1. Add product from pharmacy A with quantity 2.
2. Check cart response contains the item with quantity 2.
3. Check product offer is unchanged:
   - `availableQuantity` remains 10;
   - `reservedQuantity` remains 0;
   - `totalQuantity` remains 10.

## 2. Cart quantity changes do not mutate stock

1. Start with cart quantity 2.
2. Update the cart item quantity to 5, then to 1.
3. Check product offer after both operations:
   - `availableQuantity` remains 10;
   - `reservedQuantity` remains 0;
   - `totalQuantity` remains 10.

## 3. Removing or clearing cart does not release order stock

1. Add one or more cart items.
2. Remove one item, remove a pharmacy group, or clear the cart.
3. Check product offers are unchanged because no stock reservation existed yet.

## 4. Expired cart items are cleanup-only

1. Create or edit a cart item so `expiresAt` is in the past.
2. Request the cart or run the cleanup job.
3. Check expired items are removed from the cart.
4. Check product offer quantities are unchanged.

## 5. Checkout reserves only the selected pharmacy group

1. Add items from pharmacy A and pharmacy B to the same cart.
2. Checkout only pharmacy A.
3. Check the order contains only pharmacy A items.
4. Check cart still contains pharmacy B items.
5. Check pharmacy A product offers:
   - `availableQuantity` decreased by ordered quantity;
   - `reservedQuantity` increased by ordered quantity;
   - `totalQuantity` is unchanged.
6. Check pharmacy B product offers are unchanged.

## 6. Successful order commits reservation

1. Checkout an order with quantity 2.
2. Mark the order successful.
3. Check product offer:
   - `reservedQuantity` decreased by 2;
   - `totalQuantity` decreased by 2;
   - `availableQuantity` is unchanged from the post-checkout value.

## 7. Rejected order releases reservation

1. Checkout an order with quantity 2.
2. Reject the order.
3. Check product offer:
   - `availableQuantity` increased by 2;
   - `reservedQuantity` decreased by 2;
   - `totalQuantity` is unchanged.

## 8. Unavailable stock blocks checkout reservation

1. Set product offer `availableQuantity` below the cart quantity.
2. Try checkout.
3. Check API returns a controlled conflict.
4. Check no order is created and all stock quantities stay unchanged.
