import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/openfoodfacts';
import { searchQuerySchema } from '@/lib/validators';

// Request deduplication at API level (in-memory, per server instance)
const pendingSearches = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    // Validate query
    const validation = searchQuerySchema.safeParse({ query });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameter', details: validation.error.errors },
        { status: 400 }
      );
    }

    const normalizedQuery = validation.data.query.trim().toLowerCase();
    
    // Check if same query is already being processed
    if (pendingSearches.has(normalizedQuery)) {
      // Return the existing promise
      const products = await pendingSearches.get(normalizedQuery);
      return NextResponse.json({ products }, { status: 200 });
    }

    // Create search promise
    const searchPromise = searchProducts(validation.data.query);
    
    // Store it to prevent duplicate requests
    pendingSearches.set(normalizedQuery, searchPromise);
    
    // Clean up after request completes (with a delay to handle rapid requests)
    searchPromise.finally(() => {
      setTimeout(() => {
        pendingSearches.delete(normalizedQuery);
      }, 1000); // Keep in map for 1 second to catch rapid duplicate requests
    });

    const products = await searchPromise;

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search products', message: error.message },
      { status: 500 }
    );
  }
}

