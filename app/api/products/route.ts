import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    // Only return products that have at least one active variant
    const { data: allProducts, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (
          id,
          is_active
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter products with active variants and clean up nested data
    const cleanedProducts = allProducts
      ?.filter((product: any) => 
        product.product_variants?.some((v: any) => v.is_active)
      )
      .map((product: any) => {
        const { product_variants, ...rest } = product;
        return rest;
      });

    return NextResponse.json({ products: cleanedProducts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    // This should be protected with admin authentication
    const { data: product, error } = await supabase
      .from("products")
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

