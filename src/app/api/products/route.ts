import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const categoryId = searchParams.get('category');
    const slug = searchParams.get('slug');
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '20');

    const filter: any = {};
    if (activeOnly) filter.isActive = true;
    if (categoryId) filter.category = categoryId;
    if (slug) filter.slug = slug.toLowerCase();

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug isActive')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.log(error)
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
    const {
      name,
      slug,
      description,
      price,
      images,
      category,
      commands,
      options,
      isActive,
      stock,
      isUnlimited,
      order,
      metadata,
    } = body;

    if (!name || !slug || !description || price === undefined || !category) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      slug: slug.toLowerCase(),
      description,
      price,
      images: images || [],
      category,
      commands: commands || [],
      options: options || [],
      isActive: isActive !== undefined ? isActive : true,
      stock,
      isUnlimited: isUnlimited !== undefined ? isUnlimited : true,
      order: order || 0,
      metadata,
    });

    await product.populate('category', 'name slug isActive');

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Product with this slug already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}