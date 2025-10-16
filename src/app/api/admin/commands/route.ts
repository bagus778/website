import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommandQueue from '@/models/CommandQueue';
import { checkAuth } from '@/lib/auth-check';

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authenticated || auth.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderIds = searchParams.get('orderIds');
    const status = searchParams.get('status');
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '50');

    const filter: any = {};
    if (orderId) filter.order = orderId;
    if (orderIds) {
      filter.order = { $in: orderIds.split(',').map(id => id.trim()) };
    }
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [commands, total] = await Promise.all([
      CommandQueue.find(filter)
        .populate('order', 'orderNumber customer items')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CommandQueue.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: commands,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}