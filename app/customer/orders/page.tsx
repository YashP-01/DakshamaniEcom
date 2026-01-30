"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, Calendar, Phone, Mail, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import OrderTracking from "@/components/order-tracking";
// OrderInvoice component removed - using inline invoice display

interface Order {
  id: string;
  order_number: string;
  final_amount: number;
  order_status: string;
  shipping_status: string;
  payment_status: string;
  tracking_number?: string;
  tracking_url?: string;
  shiprocket_shipment_id?: string;
  created_at: string;
  estimated_delivery_date?: string;
  delivery_date?: string | null;
  payment_method?: string;
  admin_notes?: string;
  // Full order details
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_full_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_phone?: string;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  discount_amount?: number;
  coupon_discount?: number;
  coupon_code?: string;
  razorpay_payment_id?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  product_price: number;
  discount_percentage: number;
  subtotal: number;
  product_image_url?: string;
}

interface OrderStatusHistory {
  id: string;
  status: string;
  comment?: string;
  created_at: string;
}

export default function CustomerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/customer/login");
        return;
      }

      // Verify customer profile exists first
      const { data: customerProfile, error: profileError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Customer profile error:", profileError);
        // Profile might not exist, try to create it
        const { error: createError } = await supabase
          .from("customers")
          .insert({
            id: user.id,
            email: user.email || "",
            is_admin: false,
            is_active: true,
          });

        if (createError) {
          console.error("Failed to create customer profile:", createError);
        }
      }

      // Load orders - RLS will filter to only this customer's orders
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading orders:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("User ID:", user.id);
        toast({
          title: "Error",
          description: error.message || "Failed to load orders",
          variant: "destructive",
        });
      } else {
        console.log("Orders loaded:", data?.length || 0, "orders for user:", user.id);
      }

      setOrders(data || []);

      // Load order items for all orders
      if (data && data.length > 0) {
        const orderIds = data.map((o) => o.id);
        const { data: allItems } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (allItems) {
          const itemsMap: Record<string, OrderItem[]> = {};
          allItems.forEach((item) => {
            if (!itemsMap[item.order_id]) {
              itemsMap[item.order_id] = [];
            }
            itemsMap[item.order_id].push(item);
          });
          setOrderItemsMap(itemsMap);
        }
      }

      setLoading(false);
    };

    loadOrders();
  }, [router]);

  const loadOrderDetails = async (orderId: string) => {
    const supabase = createClient();

    // Load full order details
    const { data: fullOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fullOrder) {
      setSelectedOrder({ ...selectedOrder!, ...fullOrder });
    }

    // Load order items
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    setOrderItems(items || []);

    // Load status history
    const { data: history } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    setStatusHistory(history || []);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "confirmed":
      case "processing":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "shipped":
      case "in_transit":
      case "out_for_delivery":
        return <Truck className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "confirmed":
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
      case "in_transit":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusProgress = (status: string, shippingStatus: string) => {
    // Use shipping_status if available, otherwise fall back to order_status
    const effectiveStatus = shippingStatus || status;
    
    switch (effectiveStatus.toLowerCase()) {
      case "delivered":
        return 100;
      case "out_for_delivery":
        return 90;
      case "in_transit":
        return 80;
      case "shipped":
        return 75;
      case "processing":
      case "confirmed":
        return 50;
      case "pending":
        return 25;
      default:
        return 0;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "failed":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          {/* Header */}
          <div className="mb-8">
            <Link href="/customer/dashboard">
              <Button variant="outline" size="sm" className="mb-4">
                ← Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
                <p className="text-gray-600">
                  {orders.length} {orders.length === 1 ? "order" : "orders"} total
                </p>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-16 text-center">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Start shopping to see your orders here. Browse our collection of premium natural products.
                </p>
                <Link href="/products">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Browse Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order, index) => {
                const items = orderItemsMap[order.id] || [];
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                const progress = getStatusProgress(order.order_status, order.shipping_status);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Left Section - Order Info */}
                          <div className="flex-1 space-y-4">
                            {/* Order Header */}
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Order #{order.order_number}
                                  </h3>
                                  {order.payment_method === "exchange" && (
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 rounded">
                                      EXCHANGE
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  Placed on {new Date(order.created_at).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              
                              {/* Status Badges - Subtle */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                                    order.order_status === "delivered" || order.shipping_status === "delivered"
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : order.order_status === "cancelled"
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : order.order_status === "shipped" || order.shipping_status === "shipped" || order.shipping_status === "in_transit" || order.shipping_status === "out_for_delivery"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-gray-50 text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  {getStatusIcon(order.shipping_status || order.order_status)}
                                  <span className="capitalize">{order.shipping_status || order.order_status}</span>
                                </span>
                                <span
                                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                                    order.payment_status === "paid"
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : order.payment_status === "pending"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-gray-50 text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  {order.payment_status.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar - Subtle */}
                            {(order.order_status !== "cancelled" && order.shipping_status !== "cancelled") && (
                              <div>
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                                  <span>Order Progress</span>
                                  <span className="font-medium">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <motion.div
                                    className={`h-full ${
                                      progress === 100
                                        ? "bg-green-500"
                                        : progress >= 75
                                        ? "bg-blue-500"
                                        : progress >= 50
                                        ? "bg-amber-500"
                                        : "bg-gray-400"
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.6, delay: index * 0.05 }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Product Preview */}
                            {items.length > 0 && (
                              <div className="pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <ShoppingBag className="h-4 w-4" />
                                    <span>
                                      {items.length} {items.length === 1 ? "item" : "items"} • {itemCount} {itemCount === 1 ? "unit" : "units"}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Product List with Details */}
                                <div className="space-y-2">
                                  {items.slice(0, 3).map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100"
                                    >
                                      <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded border border-gray-200 bg-white overflow-hidden">
                                          {item.product_image_url ? (
                                            <img
                                              src={item.product_image_url}
                                              alt={item.product_name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Package className="h-5 w-5 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        {item.quantity > 1 && (
                                          <div className="absolute -top-1 -right-1 bg-gray-700 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                                            {item.quantity}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {item.product_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Qty: {item.quantity} × ₹{item.product_price.toFixed(2)} = ₹{item.subtotal.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                  {items.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                      +{items.length - 3} more {items.length - 3 === 1 ? "item" : "items"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Quick Info - Subtle */}
                            <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              {order.estimated_delivery_date && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-gray-500">Est. Delivery:</span>
                                  <span className="font-medium text-gray-700">
                                    {new Date(order.estimated_delivery_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {order.payment_method && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-gray-500">Payment:</span>
                                  <span className="font-medium text-gray-700 capitalize">{order.payment_method}</span>
                                </div>
                              )}
                              {order.shipping_city && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-gray-500">Ship to:</span>
                                  <span className="font-medium text-gray-700">{order.shipping_city}</span>
                                </div>
                              )}
                            </div>

                            {/* Tracking */}
                            {order.tracking_number && (
                              <div className="pt-2 flex items-center gap-2 text-sm text-gray-600">
                                <Truck className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-gray-500">Tracking:</span>
                                <span className="font-mono font-medium text-gray-700">{order.tracking_number}</span>
                              </div>
                            )}
                          </div>

                          {/* Right Section - Amount & Action */}
                          <div className="lg:border-l lg:border-gray-200 lg:pl-6 lg:min-w-[200px] flex flex-col justify-between">
                            <div className="mb-4 lg:mb-0">
                              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Total Amount</p>
                              <p className={`text-2xl font-semibold ${order.final_amount === 0 ? "text-purple-600" : "text-gray-900"}`}>
                                {order.final_amount === 0 ? "₹0.00 (Exchange)" : `₹${order.final_amount.toFixed(2)}`}
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedOrder(order);
                                loadOrderDetails(order.id);
                              }}
                              variant="outline"
                              className="w-full lg:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Order #{selectedOrder.order_number}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(selectedOrder.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.order_status)}`}>
                      {getStatusIcon(selectedOrder.order_status)}
                      <span className="ml-1">{selectedOrder.order_status}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedOrder.payment_status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {selectedOrder.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Invoice - Show only if paid */}
                {selectedOrder.payment_status === "paid" && selectedOrder.subtotal && orderItems && (
                  <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
                    <h3 className="text-xl font-bold mb-4">Order Invoice</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Order Number:</p>
                          <p className="font-semibold">{selectedOrder.order_number || selectedOrder.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Order Date:</p>
                          <p className="font-semibold">
                            {new Date(selectedOrder.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Items:</h4>
                        <div className="space-y-2">
                          {orderItems.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product_name} x {item.quantity}</span>
                              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold">₹{selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        {selectedOrder.shipping_cost && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping:</span>
                            <span className="font-semibold">₹{selectedOrder.shipping_cost.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total:</span>
                          <span>₹{selectedOrder.total?.toFixed(2) || selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold">₹{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Discount:</span>
                            <span>-₹{selectedOrder.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedOrder.coupon_discount && selectedOrder.coupon_discount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Coupon ({selectedOrder.coupon_code || "N/A"}):</span>
                            <span>-₹{selectedOrder.coupon_discount.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedOrder.shipping_cost !== undefined && selectedOrder.shipping_cost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping:</span>
                            <span className="font-semibold">₹{selectedOrder.shipping_cost.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedOrder.tax_amount !== undefined && selectedOrder.tax_amount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax:</span>
                            <span className="font-semibold">₹{selectedOrder.tax_amount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold text-green-600 text-lg">₹{selectedOrder.final_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Method:</span>
                        <p className="font-semibold capitalize">{selectedOrder.payment_method || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <p className={`font-semibold ${
                          selectedOrder.payment_status === "paid" ? "text-green-600" : "text-yellow-600"
                        }`}>
                          {selectedOrder.payment_status.toUpperCase()}
                        </p>
                      </div>
                      {selectedOrder.razorpay_payment_id && (
                        <div>
                          <span className="text-gray-600">Payment ID:</span>
                          <p className="font-mono text-xs">{selectedOrder.razorpay_payment_id}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {selectedOrder.shipping_full_name && (
                        <p className="font-semibold">{selectedOrder.shipping_full_name}</p>
                      )}
                      {selectedOrder.shipping_address && (
                        <p className="text-gray-600">{selectedOrder.shipping_address}</p>
                      )}
                      {selectedOrder.shipping_city && selectedOrder.shipping_state && (
                        <p className="text-gray-600">
                          {selectedOrder.shipping_city}, {selectedOrder.shipping_state} - {selectedOrder.shipping_pincode}
                        </p>
                      )}
                      {selectedOrder.shipping_country && (
                        <p className="text-gray-600">{selectedOrder.shipping_country}</p>
                      )}
                      {selectedOrder.shipping_phone && (
                        <p className="text-gray-600 flex items-center gap-1 mt-2">
                          <Phone className="h-3 w-3" />
                          {selectedOrder.shipping_phone}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Order Items ({orderItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {item.product_image_url ? (
                              <img
                                src={item.product_image_url}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{item.product_name}</p>
                            {item.product_sku && (
                              <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>Qty: {item.quantity}</span>
                              <span>Price: ₹{item.product_price.toFixed(2)}</span>
                              {item.discount_percentage > 0 && (
                                <span className="text-green-600">
                                  {item.discount_percentage}% off
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{item.subtotal.toFixed(2)}</p>
                            {item.discount_percentage > 0 && (
                              <p className="text-sm text-gray-500 line-through">
                                ₹{(item.product_price * item.quantity).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Tracking */}
                {(selectedOrder.shiprocket_shipment_id || selectedOrder.tracking_number) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Order Tracking
                    </h3>
                    <OrderTracking
                      orderId={selectedOrder.id}
                      shipmentId={selectedOrder.shiprocket_shipment_id || null}
                      trackingNumber={selectedOrder.tracking_number || null}
                      orderStatus={selectedOrder.order_status}
                      shippingStatus={selectedOrder.shipping_status}
                    />
                  </div>
                )}

                {/* Status History */}
                {statusHistory.length > 0 && (
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle>Order Status Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {statusHistory.map((status, index) => (
                          <div key={status.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                            <div className="mt-1">
                              {getStatusIcon(status.status)}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold capitalize">{status.status}</p>
                              {status.comment && (
                                <p className="text-sm text-gray-600 mt-1">{status.comment}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(status.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}

