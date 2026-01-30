"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeftRight, CheckCircle2, XCircle, Clock, Package, Truck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/use-admin-auth";

interface Exchange {
  id: string;
  exchange_number: string;
  order_id: string;
  order_item_id: string;
  customer_id: string;
  return_product_id: string;
  exchange_product_id: string;
  quantity: number;
  status: string;
  reason: string;
  description: string;
  created_at: string;
  exchange_order_id: string | null;
  delivery_date: string | null;
  order_number?: string;
  customer_name?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
}

export default function AdminExchanges() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null);
  const [exchangeProduct, setExchangeProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadExchanges();
    }
  }, [isAuthenticated]);

  const loadExchanges = async () => {
    const supabase = createClient();
    setLoading(true);
    
    try {
      // First, try loading without join to avoid RLS issues with joined tables
      const { data: simpleData, error: simpleError } = await supabase
        .from("exchanges")
        .select("*")
        .order("created_at", { ascending: false });

      if (simpleError) {
        console.error("Error loading exchanges:", simpleError);
        toast({
          title: "Error",
          description: `Failed to load exchange requests: ${simpleError.message}`,
          variant: "destructive",
        });
        setExchanges([]);
        setLoading(false);
        return;
      }

      console.log("Loaded exchanges count:", simpleData?.length || 0);

      // If we have data, try to load order details separately
      if (simpleData && simpleData.length > 0) {
        const exchangesWithOrders = await Promise.all(
          simpleData.map(async (exchange: any) => {
            try {
              const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .select("order_number, customer_name, customer_email, customer_phone")
                .eq("id", exchange.order_id)
                .single();
              
              if (orderError) {
                console.warn(`Could not load order for exchange ${exchange.id}:`, orderError);
              }
              
              return {
                ...exchange,
                order_number: orderData?.order_number || `Order ID: ${exchange.order_id.substring(0, 8)}...`,
                customer_name: orderData?.customer_name || "N/A",
                customer_email: orderData?.customer_email,
                customer_phone: orderData?.customer_phone,
              };
            } catch (err) {
              console.error(`Error loading order for exchange ${exchange.id}:`, err);
              return {
                ...exchange,
                order_number: `Order ID: ${exchange.order_id.substring(0, 8)}...`,
                customer_name: "N/A",
              };
            }
          })
        );
        
        console.log("Exchanges with order data:", exchangesWithOrders.length);
        setExchanges(exchangesWithOrders);
      } else {
        setExchanges([]);
      }
    } catch (error: any) {
      console.error("Unexpected error loading exchanges:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load exchange requests",
        variant: "destructive",
      });
      setExchanges([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeDetails = async (exchange: Exchange) => {
    const supabase = createClient();
    
    // Load order details
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("id", exchange.order_id)
      .single();

    if (orderData) {
      setOrderDetails(orderData);
    }

    // Load order item
    const { data: itemData } = await supabase
      .from("order_items")
      .select("*")
      .eq("id", exchange.order_item_id)
      .single();

    if (itemData) {
      setOrderItem(itemData);
    }

    // Load exchange product
    const { data: productData } = await supabase
      .from("products")
      .select("*")
      .eq("id", exchange.exchange_product_id)
      .single();

    if (productData) {
      setExchangeProduct(productData);
    }
  };

  const handleApprove = async () => {
    if (!selectedExchange) return;

    setProcessing(true);
    const supabase = createClient();

    try {
      // Update exchange status
      const { error: updateError } = await supabase
        .from("exchanges")
        .update({
          status: "approved",
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedExchange.id);

      if (updateError) throw updateError;

      // Schedule pickup (in test mode, just update status)
      // In production, this would call Shiprocket API
      const { error: pickupError } = await supabase
        .from("exchanges")
        .update({
          return_pickup_scheduled: new Date().toISOString(),
          status: "return_shipped",
        })
        .eq("id", selectedExchange.id);

      if (pickupError) throw pickupError;

      toast({
        title: "Success",
        description: "Exchange approved. Pickup scheduled.",
      });

      setShowApproveDialog(false);
      setAdminNotes("");
      setSelectedExchange(null);
      loadExchanges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExchange) return;

    setProcessing(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("exchanges")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedExchange.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exchange request rejected",
      });

      setShowRejectDialog(false);
      setAdminNotes("");
      setSelectedExchange(null);
      loadExchanges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateExchangeOrder = async (exchange: Exchange) => {
    if (!orderDetails || !exchangeProduct) {
      toast({
        title: "Error",
        description: "Order details not loaded",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    try {
      // Create new order for exchange (zero amount since customer already paid)
      const orderNumber = `EXC-${Date.now()}`;
      
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: exchange.customer_id,
          customer_name: orderDetails.customer_name,
          customer_email: orderDetails.customer_email || "",
          customer_phone: orderDetails.shipping_phone || "",
          shipping_full_name: orderDetails.customer_name,
          shipping_address: orderDetails.shipping_address,
          shipping_city: orderDetails.shipping_city,
          shipping_state: orderDetails.shipping_state,
          shipping_pincode: orderDetails.shipping_pincode,
          shipping_country: "India",
          shipping_phone: orderDetails.shipping_phone,
          subtotal: 0,
          shipping_cost: 0,
          tax_amount: 0,
          discount_amount: 0,
          coupon_discount: 0,
          final_amount: 0,
          payment_method: "exchange",
          payment_status: "paid",
          order_status: "confirmed",
          admin_notes: `Exchange order for ${exchange.exchange_number}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: newOrder.id,
          product_id: exchange.exchange_product_id,
          product_name: exchangeProduct.name,
          product_price: exchangeProduct.price,
          quantity: exchange.quantity,
          subtotal: 0,
          discount_percentage: 0,
        });

      if (itemError) throw itemError;

      // Update exchange with new order ID
      const { error: updateError } = await supabase
        .from("exchanges")
        .update({
          exchange_order_id: newOrder.id,
          status: "exchange_shipped",
          updated_at: new Date().toISOString(),
        })
        .eq("id", exchange.id);

      if (updateError) throw updateError;

      // Mark original order as exchanged
      const { error: markExchangedError } = await supabase
        .from("orders")
        .update({
          has_been_exchanged: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exchange.order_id);

      if (markExchangedError) {
        console.error("Error marking order as exchanged:", markExchangedError);
        // Don't throw, as exchange order was created successfully
      }

      // Get original order's chain info to determine exchange order's chain level
      const { data: originalOrder } = await supabase
        .from("orders")
        .select("original_order_id, exchange_chain_level")
        .eq("id", exchange.order_id)
        .single();

      // Calculate chain level: if original order has a chain level, increment it; otherwise start at 1
      const chainLevel = originalOrder?.exchange_chain_level !== null && originalOrder?.exchange_chain_level !== undefined
        ? (originalOrder.exchange_chain_level || 0) + 1 
        : 1;

      // Determine the root original_order_id (for tracking the full chain)
      const rootOrderId = originalOrder?.original_order_id || exchange.order_id;

      // Set exchange order's original_order_id and chain level
      const { error: setChainError } = await supabase
        .from("orders")
        .update({
          original_order_id: rootOrderId,
          exchange_chain_level: chainLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", newOrder.id);

      if (setChainError) {
        console.error("Error setting exchange chain:", setChainError);
      }

      // Create ledger entry
      const { error: ledgerError } = await supabase
        .from("exchange_ledger")
        .insert({
          exchange_id: exchange.id,
          exchange_number: exchange.exchange_number,
          original_order_id: exchange.order_id,
          exchange_order_id: newOrder.id,
          customer_id: exchange.customer_id,
          return_product_id: exchange.return_product_id,
          exchange_product_id: exchange.exchange_product_id,
          quantity: exchange.quantity,
          status: "exchange_shipped",
          exchange_chain_level: chainLevel - 1,
        });

      if (ledgerError) {
        console.error("Error creating ledger entry:", ledgerError);
        // Don't throw, as exchange order was created successfully
      }

      toast({
        title: "Success",
        description: "Exchange order created successfully",
      });

      loadExchanges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
      case "exchange_shipped":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "rejected":
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="mb-6">
            ← Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-lg">
            <ArrowLeftRight className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Exchange Management</h1>
            <p className="text-gray-600">Review and process exchange requests</p>
          </div>
        </div>

        <div className="space-y-4">
          {exchanges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ArrowLeftRight className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No exchange requests</p>
              </CardContent>
            </Card>
          ) : (
            exchanges.map((exchange) => (
              <Card key={exchange.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{exchange.exchange_number}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Created: {new Date(exchange.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-md text-sm font-medium border ${getStatusColor(exchange.status)}`}>
                      {exchange.status.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Customer & Order Info */}
                  <div className="mb-4 pb-4 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700">Customer:</p>
                        <p className="text-gray-600">{exchange.customer_name || "N/A"}</p>
                        <p className="text-gray-600 text-xs mt-1">ID: {exchange.customer_id.substring(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Order:</p>
                        <p className="text-gray-600">{exchange.order_number || `Order ID: ${exchange.order_id.substring(0, 8)}...`}</p>
                        <p className="text-gray-600 text-xs mt-1">
                          Created: {new Date(exchange.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Return Product</h4>
                      <p className="text-sm text-gray-600">Product ID: {exchange.return_product_id.substring(0, 8)}...</p>
                      <p className="text-sm text-gray-600">Quantity: {exchange.quantity}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Exchange Product</h4>
                      <p className="text-sm text-gray-600">Product ID: {exchange.exchange_product_id.substring(0, 8)}...</p>
                      <p className="text-sm text-gray-600">Quantity: {exchange.quantity}</p>
                    </div>
                  </div>
                  
                  {exchange.reason && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold">Reason:</p>
                      <p className="text-sm text-gray-600">{exchange.reason}</p>
                    </div>
                  )}
                  
                  {exchange.description && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold">Description:</p>
                      <p className="text-sm text-gray-600">{exchange.description}</p>
                    </div>
                  )}

                  {exchange.exchange_order_id && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm font-semibold text-green-700">
                        Exchange Order Created: {exchange.exchange_order_id.substring(0, 8)}...
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-2">
                    {exchange.status === "pending" && (
                      <>
                        <Button
                          onClick={async () => {
                            setSelectedExchange(exchange);
                            await loadExchangeDetails(exchange);
                            setShowApproveDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedExchange(exchange);
                            setShowRejectDialog(true);
                          }}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    {(exchange.status === "approved" || exchange.status === "return_shipped") && (
                      <Button
                        onClick={async () => {
                          setSelectedExchange(exchange);
                          await loadExchangeDetails(exchange);
                          await handleCreateExchangeOrder(exchange);
                        }}
                        disabled={processing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Create Exchange Order
                      </Button>
                    )}
                    {exchange.status === "exchange_shipped" && (
                      <span className="px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium">
                        Exchange Order Created
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Exchange Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
              Approve & Schedule Pickup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Exchange Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={processing} variant="destructive">
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

