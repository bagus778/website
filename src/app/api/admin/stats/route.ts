import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import CommandQueue from '@/models/CommandQueue';
import { checkAuth } from '@/lib/auth-check';

export async function GET() {
  try {
    const auth = await checkAuth();
    if (!auth.authenticated || auth.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      revenueResult,
      completedRevenueResult,
      orderStats,
      commandStats,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),

      Order.countDocuments(),

      User.countDocuments(),

      // Revenue
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // Alternative revenue
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // Order status breakdown
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Command status breakdown
      CommandQueue.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
    ]);

    // Calculate revenue - prefer paid orders, fallback to completed orders
    const paidRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const completedRevenue = completedRevenueResult.length > 0 ? completedRevenueResult[0].total : 0;

    // Use paid revenue if available, otherwise use completed revenue as fallback
    const revenue = paidRevenue > 0 ? paidRevenue : completedRevenue;

    // Process order stats
    const orderStatusCounts = orderStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Process command stats
    const commandStatusCounts = commandStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Get recent activity (last 10 orders)
    const recentOrders = await Order.find()
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber customer totalAmount status createdAt');

    const stats = {
      overview: {
        products: totalProducts,
        orders: totalOrders,
        revenue: revenue,
        users: totalUsers,
      },
      orderStats: {
        pending: orderStatusCounts.pending || 0,
        processing: orderStatusCounts.processing || 0,
        completed: orderStatusCounts.completed || 0,
        failed: orderStatusCounts.failed || 0,
        refunded: orderStatusCounts.refunded || 0,
      },
      commandStats: {
        pending: commandStatusCounts.pending || 0,
        processing: commandStatusCounts.processing || 0,
        executed: commandStatusCounts.executed || 0,
        failed: commandStatusCounts.failed || 0,
      },
      recentActivity: recentOrders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer.username,
        amount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      })),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Stats calculation error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}