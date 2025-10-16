import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommandQueue from '@/models/CommandQueue';
import Order from '@/models/Order';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.PLUGIN_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;
    const { status, error } = await request.json();

    if (!['processing', 'executed', 'failed'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    const command = await CommandQueue.findById(id);

    if (!command) {
      return NextResponse.json(
        { success: false, message: 'Command not found' },
        { status: 404 }
      );
    }

    command.status = status;
    if (error) command.error = error;
    if (status === 'executed') command.executedAt = new Date();
    if (status === 'failed') command.attempts += 1;

    // If max attempts reached, mark as failed permanently
    if (status === 'failed' && command.attempts >= command.maxAttempts) {
      command.status = 'failed';
    } else if (status === 'failed') {
      // Reset to pending for retry
      command.status = 'pending';
      command.scheduledFor = new Date(Date.now() + 60000);
    }

    await command.save();

    // Check if all commands for the order are executed
    if (status === 'executed') {
      const orderId = command.order;
      const pendingCommands = await CommandQueue.countDocuments({
        order: orderId,
        status: { $in: ['pending', 'processing'] },
      });

      if (pendingCommands === 0) {
        // All commands executed, mark order as completed
        await Order.findByIdAndUpdate(orderId, { status: 'completed' });
      }
    }

    return NextResponse.json({
      success: true,
      data: command,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}