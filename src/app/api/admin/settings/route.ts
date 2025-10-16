import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Store from '@/models/Store';
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

    let store = await Store.findOne();
    if (!store) {
      store = await Store.create({
        name: process.env.NEXT_PUBLIC_SITE_NAME || 'Moonchunk Store',
        description: 'A Minecraft store powered by Moonchunk',
        currency: 'USD',
        currencySymbol: '$',
        features: {
          maintenanceMode: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authenticated || auth.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      description,
      logo,
      currency,
      currencySymbol,
      primaryColor,
      secondaryColor,
      features,
      smtp,
      payment,
      minecraft,
    } = body;

    const store = await Store.findOneAndUpdate(
      {}, // Empty filter to match any document (should only be one)
      {
        name,
        description,
        logo,
        currency,
        currencySymbol,
        primaryColor,
        secondaryColor,
        features,
        smtp,
        payment,
        minecraft,
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true,
      }
    );

    return NextResponse.json({
      success: true,
      data: store,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}