import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import axios from "axios";

// Check if we're in test mode (no Razorpay credentials)
const TEST_MODE = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;

let razorpay: Razorpay | null = null;

if (!TEST_MODE) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      console.warn("Razorpay credentials incomplete, using test mode");
    } else {
      razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      console.log("Razorpay initialized successfully with Key ID:", keyId.substring(0, 10) + "...");
    }
  } catch (error: any) {
    console.error("Razorpay initialization failed:", error.message);
    console.warn("Falling back to test mode");
    razorpay = null;
  }
} else {
  console.log("Razorpay test mode: No credentials provided");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      orderId,
      orderData,
    }: {
      amount: number;
      orderId?: string;
      orderData: any;
    } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount. Amount must be greater than 0." },
        { status: 400 }
      );
    }

    // Minimum amount check (₹1 = 100 paise)
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      return NextResponse.json(
        { success: false, error: "Minimum order amount is ₹1.00" },
        { status: 400 }
      );
    }

    // Generate receipt if not provided
    const receipt = orderId || `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // TEST MODE: Create mock Razorpay order
    if (TEST_MODE || !razorpay) {
      const mockOrderId = `order_test_${Date.now()}`;
      return NextResponse.json({
        success: true,
        order: {
          id: mockOrderId,
          amount: amountInPaise,
          currency: "INR",
          receipt: receipt,
          status: "created",
        },
        testMode: true,
      });
    }

    // PRODUCTION MODE: Create real Razorpay order
    const options = {
      amount: amountInPaise, // Convert to paise (must be integer)
      currency: "INR",
      receipt: receipt, // Required by Razorpay, must be unique
      payment_capture: 1, // Auto-capture payment
      notes: {
        order_data: JSON.stringify({
          customer_name: orderData?.name || "Guest",
          customer_email: orderData?.email || "",
        }),
      },
    };

    console.log("Creating Razorpay order with options:", {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt,
    });

    const razorpayOrder = await razorpay.orders.create(options);

    console.log("Razorpay order created successfully:", razorpayOrder.id);

    return NextResponse.json({
      success: true,
      order: razorpayOrder,
      testMode: false,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to create Razorpay order";
    if (error.error) {
      errorMessage = error.error.description || error.error.reason || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Log full error for debugging
    console.error("Full error details:", {
      message: error.message,
      error: error.error,
      statusCode: error.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          error: error.error,
          statusCode: error.statusCode,
        } : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = body;

    // Validate required fields with detailed error messages
    if (!orderData) {
      return NextResponse.json(
        { success: false, error: "Missing required order data: orderData is required" },
        { status: 400 }
      );
    }
    
    const missingFields = [];
    if (!orderData.name) missingFields.push("name");
    if (!orderData.email) missingFields.push("email");
    if (!orderData.phone) missingFields.push("phone");
    if (!orderData.address) missingFields.push("address");
    if (!orderData.city) missingFields.push("city");
    if (!orderData.state) missingFields.push("state");
    if (!orderData.pincode) missingFields.push("pincode");
    if (!orderData.items || orderData.items.length === 0) missingFields.push("items");
    
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      console.error("Received orderData:", {
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode,
        itemsCount: orderData.items?.length || 0,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required order data: ${missingFields.join(", ")}`,
          missingFields: missingFields
        },
        { status: 400 }
      );
    }

    // TEST MODE: Skip signature verification
    if (!TEST_MODE && process.env.RAZORPAY_KEY_SECRET) {
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest("hex");

      if (signature !== razorpay_signature) {
        return NextResponse.json(
          { success: false, error: "Invalid signature" },
          { status: 400 }
        );
      }
    }

    // Save order to database with customer_id if available
    const supabase = createClient();
    
    // Get user if logged in
    let customerId = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.log("Auth error (non-critical):", authError.message);
      } else if (user) {
        customerId = user.id;
        
        // Ensure customer profile exists in customers table
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingCustomer) {
          // Create customer profile if it doesn't exist
          const { error: createError } = await supabase
            .from("customers")
            .insert({
              id: user.id,
              email: user.email || orderData.email,
              phone: orderData.phone,
              first_name: orderData.name?.split(' ')[0] || '',
              last_name: orderData.name?.split(' ').slice(1).join(' ') || '',
            });

          if (createError) {
            console.error("Failed to create customer profile:", createError);
            // Continue anyway - customer_id will be null
            customerId = null;
          }
        }
      }
    } catch (e) {
      console.log("User not logged in, proceeding as guest");
      // User not logged in, continue as guest
    }

    // Generate order number (will be auto-generated by trigger, but we can set it)
    const orderNumber = `DN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

    // Get shipping address ID if provided
    const shippingAddressId = orderData.shippingAddressId || null;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: orderData.name,
        customer_email: orderData.email,
        customer_phone: orderData.phone,
        shipping_address_id: shippingAddressId,
        shipping_full_name: orderData.name,
        shipping_address: orderData.address,
        shipping_city: orderData.city,
        shipping_state: orderData.state,
        shipping_pincode: orderData.pincode,
        shipping_country: orderData.country || "India",
        shipping_phone: orderData.phone,
        subtotal: orderData.totalAmount,
        discount_amount: orderData.discountAmount || 0,
        coupon_discount: orderData.couponDiscount || 0,
        final_amount: orderData.finalAmount,
        coupon_code: orderData.couponCode || null,
        payment_status: "paid",
        payment_id: razorpay_payment_id,
        order_status: "confirmed",
        shipping_status: "pending",
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order save error:", orderError);
      return NextResponse.json(
        { success: false, error: `Failed to save order: ${orderError.message}` },
        { status: 500 }
      );
    }

    // Insert order items (stock will be automatically reduced by trigger)
    const orderItems = orderData.items.map((item: any) => {
      // Use item.product_id (always present in CartItem)
      // item.id might be concatenated as "product_id-variant_id" for variant items
      const productId = item.product_id;
      const variantId = item.variant_id || null;
      
      if (!productId) {
        throw new Error(`Invalid product_id for item: ${item.name || 'Unknown'}`);
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        throw new Error(`Invalid product_id format: ${productId}`);
      }

      return {
        order_id: order.id,
        product_id: productId,
        product_variant_id: variantId && uuidRegex.test(variantId) ? variantId : null,
        product_name: item.name,
        product_sku: item.sku || null,
        product_image_url: item.image || null,
        product_price: parseFloat(item.price) || 0,
        discount_percentage: Math.round(parseFloat(item.discount) || 0), // Ensure integer
        quantity: Math.round(parseFloat(item.quantity) || 1), // Ensure integer
        subtotal: parseFloat(
          ((item.discount
            ? item.price * (1 - item.discount / 100)
            : item.price) * item.quantity).toFixed(2)
        ),
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      console.error("Order items save error:", itemsError);
      // Try to delete the order if items insertion failed
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { success: false, error: `Failed to save order items: ${itemsError.message}` },
        { status: 500 }
      );
    }

    // Log order status change
    const { error: historyError } = await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: "confirmed",
      comment: "Order confirmed and payment received",
      updated_by: "system",
    });

    if (historyError) {
      console.error("Status history error:", historyError);
      // Continue anyway - this is not critical
    }

    // Create Shiprocket order (only if credentials are available)
    if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
      try {
        const shiprocketResponse = await createShiprocketOrder(order, orderItems);
        
        if (shiprocketResponse.success) {
          await supabase
            .from("orders")
            .update({
              shiprocket_order_id: shiprocketResponse.order_id,
              shiprocket_shipment_id: shiprocketResponse.shipment_id,
            })
            .eq("id", order.id);
        }
      } catch (shiprocketError) {
        console.error("Shiprocket error:", shiprocketError);
        // Continue even if Shiprocket fails
      }
    } else {
      console.log("Shiprocket credentials not found, skipping Shiprocket integration (Test Mode)");
    }

    // Update coupon usage if applicable
    if (orderData.couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("used_count")
        .eq("code", orderData.couponCode)
        .single();
      
      if (coupon) {
        await supabase
          .from("coupons")
          .update({ used_count: coupon.used_count + 1 })
          .eq("code", orderData.couponCode);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Order placed successfully",
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

async function createShiprocketOrder(order: any, orderItems: any[]) {
  const token = await getShiprocketToken();

  const payload = {
    order_id: order.id,
    order_date: new Date().toISOString(),
    pickup_location: "Primary", // You'll need to set this up in Shiprocket
    billing_customer_name: order.user_name,
    billing_last_name: "",
    billing_address: order.shipping_address,
    billing_address_2: "",
    billing_city: order.city,
    billing_pincode: order.pincode,
    billing_state: order.state,
    billing_country: "India",
    billing_email: order.user_email,
    billing_phone: order.user_phone,
    shipping_is_billing: true,
    shipping_customer_name: order.user_name,
    shipping_last_name: "",
    shipping_address: order.shipping_address,
    shipping_address_2: "",
    shipping_city: order.city,
    shipping_pincode: order.pincode,
    shipping_country: "India",
    shipping_state: order.state,
    shipping_email: order.user_email,
    shipping_phone: order.user_phone,
    order_items: orderItems.map((item) => ({
      name: item.product_name,
      sku: item.product_id,
      units: item.quantity,
      selling_price: item.product_price,
    })),
    payment_method: "Prepaid",
    sub_total: order.total_amount,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  };

  const response = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    success: true,
    order_id: response.data.order_id,
    shipment_id: response.data.shipment_id,
  };
}

async function getShiprocketToken() {
  const response = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      email: process.env.SHIPROCKET_EMAIL!,
      password: process.env.SHIPROCKET_PASSWORD!,
    }
  );

  return response.data.token;
}

