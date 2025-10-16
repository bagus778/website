import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const filter = activeOnly ? { isActive: true } : {};
    const categories = await Category.find(filter).sort({ order: 1, name: 1 });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authenticated) {
    return auth.response!;
  }

  try {
    await connectDB();

    const body = await request.json();
    const { name, slug, description, image, order, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name,
      slug: slug.toLowerCase(),
      description,
      image,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Category with this name or slug already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}