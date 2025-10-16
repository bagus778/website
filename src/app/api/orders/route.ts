import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '20');

    const filter: any = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
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

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { customer, items, paymentProvider, metadata } = body;

    if (!customer?.username || !customer?.email || !items?.length) {
      return NextResponse.json(
        { success: false, message: `Missing ${!customer?.username ? 'username' : ''} ${!customer?.email ? 'email' : ''} ${!items?.length ? 'items' : ''}` },
        { status: 400 }
      );
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product: any = await Product.findById(item.productId).populate('category', 'isActive name');

      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (!product.isActive) {
        return NextResponse.json(
          { success: false, message: `Product ${product.name} is not available` },
          { status: 400 }
        );
      }

      // Category must be active if present
      const categoryActive = (product as any).category?.isActive !== false;
      if (!categoryActive) {
        return NextResponse.json(
          { success: false, message: `Category for ${product.name} is inactive` },
          { status: 400 }
        );
      }

      if (!product.isUnlimited) {
        if (!product.stock || product.stock < item.quantity) {
          return NextResponse.json(
            { success: false, message: `Insufficient stock for ${product.name}` },
            { status: 400 }
          );
        }
      }

      let price = product.price;
      let optionLabel: string | undefined;
      let optionIndex: number | undefined = undefined;
      if (typeof item.optionIndex === 'number' && Array.isArray(product.options) && product.options[item.optionIndex]) {
        const opt = product.options[item.optionIndex];
        price = opt.price;
        optionLabel = opt.label;
        optionIndex = item.optionIndex;
      }

      orderItems.push({
        product: product._id,
        productName: product.name,
        price,
        quantity: item.quantity,
        optionIndex,
        optionLabel,
      });

      totalAmount += price * item.quantity;

      // Update stock if not unlimited
      if (!product.isUnlimited) {
        product.stock! -= item.quantity;
        await product.save();
      }
    }

    const order = await Order.create({
      customer,
      items: orderItems,
      totalAmount,
      paymentProvider: paymentProvider || 'stripe',
      status: 'pending',
      paymentStatus: 'pending',
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}