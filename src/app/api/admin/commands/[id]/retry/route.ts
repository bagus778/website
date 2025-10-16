import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommandQueue from '@/models/CommandQueue';
import { checkAuth } from '@/lib/auth-check';

export async function POST(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authenticated || auth.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    const command = await CommandQueue.findById(id);

    if (!command) {
      return NextResponse.json(
        { success: false, message: 'Command not found' },
        { status: 404 }
      );
    }

    if (command.status !== 'failed') {
      return NextResponse.json(
        { success: false, message: 'Can only retry failed commands' },
        { status: 400 }
      );
    }

    if (command.attempts >= command.maxAttempts) {
      return NextResponse.json(
        { success: false, message: 'Maximum retry attempts reached' },
        { status: 400 }
      );
    }

    command.status = 'pending';
    command.scheduledFor = new Date(Date.now() + 1000);
    command.error = undefined;

    await command.save();

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