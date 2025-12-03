import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/stats/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Today's stats
    const todayStats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalItems: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]);
    
    // Monthly stats
    const monthlyStats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalItems: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]);
    
    // Yearly stats
    const yearlyStats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalItems: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]);
    
    // Product stats
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({ 
      stock: { $lte: 10 }, 
      isActive: true 
    });
    
    // Top selling products (this month)
    const topProducts = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      today: todayStats[0] || { totalSales: 0, totalRevenue: 0, totalItems: 0 },
      monthly: monthlyStats[0] || { totalSales: 0, totalRevenue: 0, totalItems: 0 },
      yearly: yearlyStats[0] || { totalSales: 0, totalRevenue: 0, totalItems: 0 },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts
      },
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/stats/sales-chart - Get sales data for charts
router.get('/sales-chart', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let startDate, groupBy;
    
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
    
    const salesData = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/stats/category-sales - Get sales by category
router.get('/category-sales', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const categorySales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    res.json(categorySales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/stats/low-stock - Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    
    const lowStockProducts = await Product.find({
      stock: { $lte: parseInt(threshold) },
      isActive: true
    }).sort({ stock: 1 });
    
    res.json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;