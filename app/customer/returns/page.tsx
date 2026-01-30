"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { RefreshCw, Package, ArrowLeftRight, Download, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import jsPDF from "jspdf";

interface Order {
  id: string;
  order_number: string;
  final_amount: number;
  created_at: string;
  delivery_date: string | null;
  order_status: string;
  shipping_status?: string;
  has_been_exchanged?: boolean;
  original_order_id?: string | null;
  exchange_chain_level?: number;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  product_price: number;
}

interface Return {
  id: string;
  return_number: string;
  order_id: string;
  reason: string;
  status: string;
  amount: number;
  created_at: string;
}

interface Exchange {
  id: string;
  exchange_number: string;
  order_id: string;
  return_product_id: string;
  exchange_product_id: string;
  status: string;
  created_at: string;
  exchange_order_id: string | null;
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  stock_quantity: number;
}

export default function CustomerReturns() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [returns, setReturns] = useState<Return[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [policy, setPolicy] = useState<any>(null);
  const [returnForm, setReturnForm] = useState({
    reason: "defective",
    description: "",
    return_type: "refund",
  });
  const [exchangeForm, setExchangeForm] = useState({
    order_item_id: "",
    return_product_id: "",
    exchange_product_id: "",
    reason: "",
    description: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/customer/login");
        return;
      }

      // Load eligible orders (delivered orders within 7 days of delivery)
      // Check both order_status and shipping_status for delivered
      // Include exchange tracking fields
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, has_been_exchanged, original_order_id, exchange_chain_level")
        .eq("customer_id", user.id)
        .or("order_status.eq.delivered,shipping_status.eq.delivered")
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error loading orders:", ordersError);
      }

      // Filter orders that are within 7 days of delivery
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const eligibleOrders = (ordersData || []).filter((order) => {
        // Must be delivered (either order_status or shipping_status)
        const isDelivered = order.order_status === "delivered" || order.shipping_status === "delivered";
        if (!isDelivered) return false;

        // Exchange eligibility logic:
        // 1. Original orders (no original_order_id) that have been exchanged are NOT eligible
        // 2. Original orders (no original_order_id) that haven't been exchanged ARE eligible
        // 3. Exchange orders (has original_order_id) ARE eligible if delivered (can be exchanged again)
        
        // If it's an original order (no original_order_id) and has been exchanged, it's not eligible
        if (!order.original_order_id && order.has_been_exchanged) {
          return false;
        }

        // All other cases are eligible (original orders not exchanged, or exchange orders)
        // Check if within 7 days of delivery
        if (order.delivery_date) {
          const deliveryDate = new Date(order.delivery_date);
          return deliveryDate >= sevenDaysAgo;
        }
        
        // If no delivery_date but order is delivered, use updated_at or created_at
        // This handles cases where delivery_date wasn't set but status was updated
        const referenceDate = order.updated_at || order.created_at;
        const deliveryDate = new Date(referenceDate);
        // Assume delivery happened on the day status was updated
        return deliveryDate >= sevenDaysAgo;
      });

      setOrders(eligibleOrders);

      // Load order items for eligible orders
      if (eligibleOrders.length > 0) {
        const orderIds = eligibleOrders.map(o => o.id);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (itemsData) {
          const itemsMap: Record<string, OrderItem[]> = {};
          itemsData.forEach(item => {
            if (!itemsMap[item.order_id]) {
              itemsMap[item.order_id] = [];
            }
            itemsMap[item.order_id].push(item);
          });
          setOrderItems(itemsMap);
        }
      }

      // Load returns
      const { data: returnsData } = await supabase
        .from("returns")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      setReturns(returnsData || []);

      // Load exchanges
      const { data: exchangesData } = await supabase
        .from("exchanges")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      setExchanges(exchangesData || []);

      // Load policy
      const { data: policyData } = await supabase
        .from("return_exchange_policy")
        .select("*")
        .limit(1)
        .single();

      setPolicy(policyData);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const loadAvailableProducts = async (returnProductId?: string) => {
    if (!returnProductId) {
      setAvailableProducts([]);
      return;
    }

    const supabase = createClient();
    
    // For exchanges, customer can ONLY exchange for the same product they're returning
    // Load only the return product (even if out of stock, as it might be restocked)
    const { data: returnProduct, error } = await supabase
      .from("products")
      .select("id, name, image_url, price, stock_quantity")
      .eq("id", returnProductId)
      .eq("is_active", true)
      .single();

    if (error || !returnProduct) {
      console.error("Error loading return product:", error);
      setAvailableProducts([]);
      return;
    }

    // Only allow exchange for the same product
    setAvailableProducts([returnProduct]);
  };

  const handleExchangeDialogOpen = async (order: Order) => {
    setSelectedOrder(order);
    // Load products without return product ID initially
    await loadAvailableProducts();
    setShowExchangeDialog(true);
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !exchangeForm.order_item_id || !exchangeForm.exchange_product_id) {
      toast({
        title: "Error",
        description: "Please select the product to return and the product to exchange with.",
      });
      return;
    }

    // Validate that exchange product is the same as return product
    const orderItem = orderItems[selectedOrder.id]?.find(item => item.id === exchangeForm.order_item_id);
    if (orderItem && exchangeForm.exchange_product_id !== orderItem.product_id) {
      toast({
        title: "Error",
        description: "You can only exchange for the same product you're returning.",
        variant: "destructive",
      });
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Check if order is within 7 days of delivery
    const deliveryDate = selectedOrder.delivery_date 
      ? new Date(selectedOrder.delivery_date)
      : new Date(new Date(selectedOrder.created_at).getTime() + 3 * 24 * 60 * 60 * 1000); // created_at + 3 days
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (deliveryDate < sevenDaysAgo) {
      toast({
        title: "Error",
        description: "Exchange requests can only be submitted within 7 days of order delivery.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the order item
      const orderItem = orderItems[selectedOrder.id]?.find(item => item.id === exchangeForm.order_item_id);
      if (!orderItem) {
        throw new Error("Order item not found");
      }

      const exchangeNumber = `EXC-${Date.now()}`;
      
      const { data, error } = await supabase
        .from("exchanges")
        .insert({
          exchange_number: exchangeNumber,
          order_id: selectedOrder.id,
          order_item_id: exchangeForm.order_item_id,
          customer_id: user.id,
          return_product_id: orderItem.product_id,
          exchange_product_id: exchangeForm.exchange_product_id,
          reason: exchangeForm.reason || "exchange_requested",
          description: exchangeForm.description,
          quantity: orderItem.quantity,
          status: "pending",
          delivery_date: selectedOrder.delivery_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exchange request submitted successfully. Admin will review and process it.",
      });

      setShowExchangeDialog(false);
      setSelectedOrder(null);
      setExchangeForm({
        order_item_id: "",
        return_product_id: "",
        exchange_product_id: "",
        reason: "",
        description: "",
      });
      window.location.reload();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Check if order is within 7 days of delivery
    const deliveryDate = selectedOrder.delivery_date 
      ? new Date(selectedOrder.delivery_date)
      : new Date(new Date(selectedOrder.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (deliveryDate < sevenDaysAgo) {
      toast({
        title: "Error",
        description: "Return requests can only be submitted within 7 days of order delivery.",
        variant: "destructive",
      });
      return;
    }

    try {
      const returnNumber = `RET-${Date.now()}`;
      
      const { data, error } = await supabase
        .from("returns")
        .insert({
          return_number: returnNumber,
          order_id: selectedOrder.id,
          customer_id: user.id,
          reason: returnForm.reason,
          description: returnForm.description,
          return_type: returnForm.return_type,
          amount: selectedOrder.final_amount,
          quantity: 1,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Return request submitted successfully",
      });

      setShowReturnDialog(false);
      setSelectedOrder(null);
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const downloadPolicyPDF = () => {
    if (!policy) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(policy.title || "Return & Exchange Policy", 20, 20);
    
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(policy.content || "", 170);
    doc.text(lines, 20, 35);

    doc.save("Return-Exchange-Policy.pdf");
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          <Link href="/customer/dashboard">
            <Button variant="outline" size="sm" className="mb-8">
              ← Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Returns & Exchanges</h1>
            {policy && (
              <Button
                variant="outline"
                onClick={() => setShowPolicyDialog(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View Policy
              </Button>
            )}
          </div>

          {/* Returns Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Return Requests</h2>
              {orders.length > 0 && (
                <Button onClick={() => setShowReturnDialog(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Request Return
                </Button>
              )}
            </div>

            {returns.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No return requests</p>
                  <p className="text-sm text-gray-500">
                    Returns can only be requested within 7 days of order delivery
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {returns.map((returnItem) => (
                  <Card key={returnItem.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{returnItem.return_number}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Reason: {returnItem.reason.replace("_", " ")}
                          </p>
                          <p className="text-sm text-gray-600">
                            Amount: ₹{returnItem.amount.toFixed(2)}
                          </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-md text-sm font-medium border flex items-center gap-2 ${getStatusColor(returnItem.status)}`}>
                          {getStatusIcon(returnItem.status)}
                          {returnItem.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Exchanges Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Exchange Requests</h2>
              {orders.length > 0 && (
                <Button onClick={() => setShowExchangeDialog(true)}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Request Exchange
                </Button>
              )}
            </div>

            {exchanges.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ArrowLeftRight className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No eligible orders for exchange</p>
                  <p className="text-sm text-gray-500">
                    Exchanges can only be requested within 7 days of order delivery
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {exchanges.map((exchange) => (
                  <Card key={exchange.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{exchange.exchange_number}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Order: {exchange.order_id.substring(0, 8)}...
                          </p>
                          {exchange.exchange_order_id && (
                            <p className="text-sm text-green-600 mt-1">
                              Exchange Order Created
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1.5 rounded-md text-sm font-medium border flex items-center gap-2 ${getStatusColor(exchange.status)}`}>
                          {getStatusIcon(exchange.status)}
                          {exchange.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReturnSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Select Order</Label>
                <Select
                  value={selectedOrder?.id || ""}
                  onValueChange={(value) => {
                    const order = orders.find(o => o.id === value);
                    setSelectedOrder(order || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - ₹{order.final_amount.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reason</Label>
                <Select
                  value={returnForm.reason}
                  onValueChange={(value) => setReturnForm({ ...returnForm, reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defective">Defective Product</SelectItem>
                    <SelectItem value="wrong_item">Wrong Item</SelectItem>
                    <SelectItem value="not_as_described">Not as Described</SelectItem>
                    <SelectItem value="size_issue">Size Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={returnForm.description}
                  onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })}
                  placeholder="Please describe the issue..."
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowReturnDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exchange Dialog */}
      <Dialog open={showExchangeDialog} onOpenChange={setShowExchangeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Exchange</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExchangeSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Select Order</Label>
                <Select
                  value={selectedOrder?.id || ""}
                  onValueChange={(value) => {
                    const order = orders.find(o => o.id === value);
                    setSelectedOrder(order || null);
                    setExchangeForm({
                      order_item_id: "",
                      return_product_id: "",
                      exchange_product_id: "",
                      reason: "",
                      description: "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - ₹{order.final_amount.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedOrder && (
                <>
                  <div>
                    <Label>Select Product to Return</Label>
                    <Select
                      value={exchangeForm.order_item_id}
                      onValueChange={async (value) => {
                        const item = orderItems[selectedOrder.id]?.find(i => i.id === value);
                        const productId = item?.product_id || "";
                        setExchangeForm({
                          ...exchangeForm,
                          order_item_id: value,
                          return_product_id: productId,
                          exchange_product_id: "", // Reset exchange product selection
                        });
                        // Reload products to include the return product
                        await loadAvailableProducts(productId);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product to return" />
                      </SelectTrigger>
                      <SelectContent>
                        {orderItems[selectedOrder.id]?.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.product_name} (Qty: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Product to Exchange With</Label>
                    <Select
                      value={exchangeForm.exchange_product_id}
                      onValueChange={(value) => setExchangeForm({ ...exchangeForm, exchange_product_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product to exchange with" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            No products available. Please select a product to return first.
                          </div>
                        ) : (
                          availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ₹{product.price.toFixed(2)}
                              {product.stock_quantity > 0 && ` (Stock: ${product.stock_quantity})`}
                              {product.stock_quantity === 0 && " (Out of Stock - Will be restocked)"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {exchangeForm.return_product_id && (
                      <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-2 rounded">
                        ℹ️ Exchange Policy: You can only exchange for the same product you're returning. This ensures product consistency and quality.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Reason (Optional)</Label>
                    <Input
                      value={exchangeForm.reason}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, reason: e.target.value })}
                      placeholder="e.g., Size issue, Color preference"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={exchangeForm.description}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, description: e.target.value })}
                      placeholder="Please describe why you want to exchange..."
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowExchangeDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Exchange Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Policy Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{policy?.title || "Return & Exchange Policy"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {policy?.content || "No policy content available."}
              </div>
            </div>
            {policy && (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Return Window:</p>
                    <p className="text-gray-600">{policy.return_window_days} days</p>
                  </div>
                  <div>
                    <p className="font-semibold">Exchange Window:</p>
                    <p className="text-gray-600">{policy.exchange_window_days} days</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              Close
            </Button>
            {policy && (
              <Button onClick={downloadPolicyPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
