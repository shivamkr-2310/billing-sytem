import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online'],
    required: true
  },
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate sale number automatically
saleSchema.pre('save', async function(next) {
  if (!this.saleNumber) {
    const count = await mongoose.model('Sale').countDocuments();
    this.saleNumber = `SALE-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for better performance
saleSchema.index({ createdAt: -1 });
saleSchema.index({ customerPhone: 1 });
// Note: saleNumber index is automatically created due to unique: true

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;