const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    name: { type: String, required: true }  
});

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: [cartItemSchema],
    total: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponApplied: { type: Boolean, default: false }
});

module.exports = mongoose.model('Cart', cartSchema);