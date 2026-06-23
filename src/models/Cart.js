import mongoose, { Schema } from "mongoose";

const cartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  variant: {
    type: Schema.Types.ObjectId,
    ref: "ProductVariant",
    default: null,
  },

  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },

  price: {
    type: Number,
    required: true, // snapshot of price at time of adding to cart
  },
});

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user
    },

    items: [cartItemSchema],

    couponApplied: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    specialInstructions: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

// calculate total on the fly without storing it
cartSchema.virtual("total").get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
