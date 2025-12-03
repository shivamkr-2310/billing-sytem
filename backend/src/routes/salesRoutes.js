import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/sales - Get all sales
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const skip = (page - 1) * limit;
    const sales = await Sale.find(query)
      .populate('items.product', 'name sku')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    const total = await Sale.countDocuments(query);
    
    res.json({
      sales,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/sales/:id - Get single sale
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product', 'name sku description');
      
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/sales - Create new sale
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { items, customerName, customerPhone, paymentMethod, discount = 0, tax = 0, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Sale must have at least one item' });
    }
    
    let subtotal = 0;
    const saleItems = [];
    
    // Process each item and update stock
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      if (!product.isActive) {
        throw new Error(`Product is not active: ${product.name}`);
      }
      
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }
      
      const itemTotal = item.quantity * product.price;
      subtotal += itemTotal;
      
      // Update product stock
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { session }
      );
      
      saleItems.push({
        product: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }
    
    const total = subtotal + tax - discount;
    
    const sale = new Sale({
      items: saleItems,
      subtotal,
      tax,
      discount,
      total,
      customerName,
      customerPhone,
      paymentMethod,
      notes
    });
    
    const savedSale = await sale.save({ session });
    await session.commitTransaction();
    
    // Populate the saved sale before sending response
    const populatedSale = await Sale.findById(savedSale._id)
      .populate('items.product', 'name sku description');
    
    res.status(201).json(populatedSale);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// PUT /api/sales/:id - Update sale status
router.put('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    ).populate('items.product', 'name sku description');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/sales/:id - Cancel sale (and restore stock)
router.delete('/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const sale = await Sale.findById(req.params.id).session(session);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    if (sale.status === 'cancelled') {
      return res.status(400).json({ message: 'Sale is already cancelled' });
    }
    
    // Restore stock for each item
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }
    
    // Update sale status to cancelled
    sale.status = 'cancelled';
    await sale.save({ session });
    
    await session.commitTransaction();
    
    res.json({ message: 'Sale cancelled and stock restored' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// GET /api/sales/search/:saleNumber - Search by sale number
router.get('/search/:saleNumber', async (req, res) => {
  try {
    const sale = await Sale.findOne({ saleNumber: req.params.saleNumber })
      .populate('items.product', 'name sku description');
      
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;