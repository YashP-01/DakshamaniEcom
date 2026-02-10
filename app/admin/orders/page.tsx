"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Package, Truck, CheckCircle2, Calendar, MapPin, Phone, Mail, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_full_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  shipping_phone?: string;
  final_amount: number;
  payment_status: string;
  order_status: string;
  shipping_status: string;
  delivery_date: string | null;
  estimated_delivery_date: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  created_at: string;
  admin_notes?: string;
  store_id?: string | null;
  stores?: {
    name: string;
  } | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  product_price: number;
  subtotal: number;
  product_image_url?: string;
}

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusForm, setStatusForm] = useState({
    order_status: "",
    shipping_status: "",
    delivery_date: "",
    estimated_delivery_date: "",
    tracking_number: "",
    tracking_url: "",
    admin_notes: "",
  });

  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    const supabase = createClient();
    setLoading(true);
    
    const { data, error } = await supabase
      .from("orders")
      .select("*, stores(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setOrders(data || []);

    // Load order items for all orders
    if (data && data.length > 0) {
      const orderIds = data.map(order => order.id);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) {
        console.error("Error loading order items:", itemsError);
      } else {
        // Group items by order_id
        const itemsMap: Record<string, OrderItem[]> = {};
        (itemsData || []).forEach(item => {
          if (!itemsMap[item.order_id]) {
            itemsMap[item.order_id] = [];
          }
          itemsMap[item.order_id].push(item);
        });
        setOrderItems(itemsMap);
      }
    }
    
    setLoading(false);
  };

  const loadOrderDetails = async (orderId: string) => {
    // Items are already loaded in loadOrders, no need to reload
    // This function is kept for compatibility with handleOpenStatusDialog
  };

  const handleOpenStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    // Items are already loaded, no need to call loadOrderDetails
    
    setStatusForm({
      order_status: order.order_status,
      shipping_status: order.shipping_status,
      delivery_date: order.delivery_date 
        ? new Date(order.delivery_date).toISOString().split('T')[0]
        : "",
      estimated_delivery_date: order.estimated_delivery_date
        ? new Date(order.estimated_delivery_date).toISOString().split('T')[0]
        : "",
      tracking_number: order.tracking_number || "",
      tracking_url: order.tracking_url || "",
      admin_notes: order.admin_notes || "",
    });
    
    setShowStatusDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    setSaving(true);
    const supabase = createClient();

    try {
      const updates: any = {
        order_status: statusForm.order_status,
        shipping_status: statusForm.shipping_status,
        tracking_number: statusForm.tracking_number || null,
        tracking_url: statusForm.tracking_url || null,
        admin_notes: statusForm.admin_notes || null,
        updated_at: new Date().toISOString(),
      };

      // Auto-set delivery_date when order_status is set to delivered
      if (statusForm.order_status === "delivered" && !statusForm.delivery_date) {
        updates.delivery_date = new Date().toISOString();
      } else if (statusForm.delivery_date) {
        updates.delivery_date = new Date(statusForm.delivery_date).toISOString();
      } else if (statusForm.order_status !== "delivered") {
        // Only clear delivery_date if order is not delivered
        updates.delivery_date = null;
      }

      // Auto-set shipping_status to delivered when order_status is delivered
      if (statusForm.order_status === "delivered" && statusForm.shipping_status !== "delivered") {
        updates.shipping_status = "delivered";
        statusForm.shipping_status = "delivered";
      }

      if (statusForm.estimated_delivery_date) {
        updates.estimated_delivery_date = new Date(statusForm.estimated_delivery_date).toISOString();
      } else {
        updates.estimated_delivery_date = null;
      }

      // Update order
      const { error: updateError } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", selectedOrder.id);

      if (updateError) throw updateError;

      // Log status change to history
      const { data: { user } } = await supabase.auth.getUser();
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: selectedOrder.id,
          status: statusForm.order_status,
          comment: `Status updated: ${statusForm.order_status} | Shipping: ${statusForm.shipping_status}${statusForm.admin_notes ? ` | Notes: ${statusForm.admin_notes}` : ""}`,
          updated_by: user?.email || "admin",
        });

      if (historyError) {
        console.error("Error logging status history:", historyError);
      }

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      setShowStatusDialog(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "shipped":
      case "in_transit":
      case "out_for_delivery":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "confirmed":
      case "processing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Orders Management</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <p className="text-gray-600">
            Total Orders: {orders.length} | Test Mode: Manual status updates (Shiprocket API disabled)
          </p>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No orders found</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="border-2 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleOpenStatusDialog(order)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.stores && (
                    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2">
                       <MapPin className="h-5 w-5 text-blue-600" />
                       <div>
                         <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Fulfilled By</p>
                         <p className="font-semibold text-blue-900">{order.stores.name}</p>
                       </div>
                    </div>
                  )}
                  {!order.stores && (
                    <div className="mb-6 bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center gap-2">
                       <Package className="h-5 w-5 text-gray-500" />
                       <div>
                         <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fulfilled By</p>
                         <p className="font-semibold text-gray-700">Central Warehouse</p>
                       </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Customer Info */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Customer Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {order.customer_name}</p>
                        <p><span className="font-medium">Email:</span> {order.customer_email}</p>
                        <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>{order.shipping_full_name}</p>
                        <p>{order.shipping_address}</p>
                        <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
                        <p>{order.shipping_country}</p>
                        {order.shipping_phone && <p><span className="font-medium">Phone:</span> {order.shipping_phone}</p>}
                      </div>
                    </div>

                    {/* Order Status */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Order Status
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500">Payment:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Order:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.order_status)}`}>
                            {order.order_status.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Shipping:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.shipping_status)}`}>
                            {order.shipping_status.toUpperCase()}
                          </span>
                        </div>
                        <div className="pt-2">
                          <p className="text-lg font-bold text-gray-900">
                            ₹{order.final_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {orderItems[order.id] && orderItems[order.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Order Items ({orderItems[order.id].length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {orderItems[order.id].map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                            {item.product_image_url && (
                              <img 
                                src={item.product_image_url} 
                                alt={item.product_name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{item.product_name}</p>
                              {item.product_sku && (
                                <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-600">
                                  Qty: <span className="font-medium">{item.quantity}</span> × ₹{item.product_price.toFixed(2)}
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  ₹{item.subtotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracking & Dates */}
                  {(order.tracking_number || order.delivery_date || order.estimated_delivery_date) && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {order.tracking_number && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Tracking:</span>
                          <span className="font-mono">{order.tracking_number}</span>
                        </div>
                      )}
                      {order.delivery_date && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Delivered:</span>
                          <span>{new Date(order.delivery_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {order.estimated_delivery_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Est. Delivery:</span>
                          <span>{new Date(order.estimated_delivery_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {order.shiprocket_order_id && (
                    <div className="mt-2 text-xs text-gray-500">
                      Shiprocket Order ID: {order.shiprocket_order_id}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Order Status - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Items Preview */}
              {selectedOrder && orderItems[selectedOrder.id] && orderItems[selectedOrder.id].length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Order Items ({orderItems[selectedOrder.id].length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {orderItems[selectedOrder.id].map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order_status">Order Status</Label>
                  <Select
                    value={statusForm.order_status}
                    onValueChange={(value) => setStatusForm({ ...statusForm, order_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shipping_status">Shipping Status</Label>
                  <Select
                    value={statusForm.shipping_status}
                    onValueChange={(value) => setStatusForm({ ...statusForm, shipping_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tracking_number">Tracking Number</Label>
                  <Input
                    id="tracking_number"
                    value={statusForm.tracking_number}
                    onChange={(e) => setStatusForm({ ...statusForm, tracking_number: e.target.value })}
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <Label htmlFor="tracking_url">Tracking URL</Label>
                  <Input
                    id="tracking_url"
                    value={statusForm.tracking_url}
                    onChange={(e) => setStatusForm({ ...statusForm, tracking_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_delivery_date">Estimated Delivery Date</Label>
                  <Input
                    id="estimated_delivery_date"
                    type="date"
                    value={statusForm.estimated_delivery_date}
                    onChange={(e) => setStatusForm({ ...statusForm, estimated_delivery_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={statusForm.delivery_date}
                    onChange={(e) => setStatusForm({ ...statusForm, delivery_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={statusForm.admin_notes}
                  onChange={(e) => setStatusForm({ ...statusForm, admin_notes: e.target.value })}
                  placeholder="Add any notes about this order..."
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                <p className="font-semibold">Test Mode Active</p>
                <p>Status updates are manual. Shiprocket API integration is disabled for testing.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
