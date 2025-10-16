import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import CommandQueue from '@/models/CommandQueue';

export async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id).populate('items.product', 'name slug commands');

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const order = await Order.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('items.product', 'name slug');

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { action } = await request.json();

    if (action === 'process') {
      const order = await Order.findById(id).populate('items.product');

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      if (order.status !== 'pending' && order.status !== 'failed') {
        return NextResponse.json(
          { success: false, message: 'Order cannot be processed' },
          { status: 400 }
        );
      }

      const commands = [];
      for (const item of order.items) {
        const product: any = item.product;
        const hasOption = typeof (item as any).optionIndex === 'number' && Array.isArray(product.options) && product.options[(item as any).optionIndex]
        const commandsSource = hasOption ? product.options[(item as any).optionIndex].commands : product.commands

        if (commandsSource && commandsSource.length > 0) {
          for (let i = 0; i < item.quantity; i++) {
            for (const cmd of commandsSource) {
              // Replace placeholders in command
              const processedCommand = cmd.command
                .replace('{player}', order.customer.username)
                .replace('{product}', product.name)
                .replace('{order}', order.orderNumber);

              commands.push({
                order: order._id,
                orderNumber: order.orderNumber,
                product: product.name,
                optionLabel: hasOption ? item.optionLabel : undefined,
                player: order.customer.username,
                command: processedCommand,
                delay: cmd.delay || 0,
                scheduledFor: new Date(Date.now() + (cmd.delay || 0) * 1000),
                status: 'pending',
              });
            }
          }
        }
      }

      // Create command queue entries
      if (commands.length > 0) {
        await CommandQueue.insertMany(commands);
      }

      // Update order status
      order.status = 'processing';
      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Order processed successfully',
        commandsQueued: commands.length,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}