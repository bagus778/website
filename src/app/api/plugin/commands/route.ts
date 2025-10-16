import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommandQueue from '@/models/CommandQueue';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.PLUGIN_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '10');

    // Get pending commands that are ready to execute
    const commands = await CommandQueue.find({
      status: 'pending',
      scheduledFor: { $lte: new Date() },
    })
      .sort({ scheduledFor: 1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: commands,
      count: commands.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}