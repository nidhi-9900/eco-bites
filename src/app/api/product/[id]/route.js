import { NextResponse } from 'next/server';
import { getProductById } from '@/lib/openfoodfacts';
import { productIdSchema } from '@/lib/validators';

export async function GET(request, { params }) {
  try {
    // Handle params - in Next.js 16.0.3, params is synchronous, but we check for Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate product ID
    const validation = productIdSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid product ID', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Fetch product details
    const product = await getProductById(validation.data.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Product API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    if (error.message === 'Product not found' || error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch product', 
        message: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

