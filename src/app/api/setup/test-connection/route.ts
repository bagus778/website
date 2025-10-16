import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  // Create a separate mongoose instance to avoid interfering with the main connection
  const testMongoose = new mongoose.Mongoose();

  try {
    const body = await request.json();
    const { mongodbUri } = body;

    if (!mongodbUri) {
      return NextResponse.json(
        { success: false, message: 'MongoDB URI is required' },
        { status: 400 }
      );
    }

    // Create a test connection using the separate instance
    await testMongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    await testMongoose.connection.db?.admin().ping();

    // Close the test connection
    await testMongoose.connection.close();

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
    });
  } catch (error: any) {
    try {
      await testMongoose.connection.close();
    } catch (closeError) {
    }

    console.error('MongoDB connection test error:', error);

    let errorMessage = 'Failed to connect to MongoDB';

    if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. Make sure MongoDB is running.';
    } else if (error.message.includes('authentication failed')) {
      errorMessage = 'Authentication failed. Check your credentials.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Connection timeout. Check your MongoDB URI and network.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}