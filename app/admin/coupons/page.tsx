"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface Coupon {
  id: string;
  code: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
}

export default function AdminCoupons() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_percentage: "",
    discount_amount: "",
    min_order_amount: "0",
    max_discount_amount: "",
    usage_limit: "",
    is_active: true,
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: "",
  });

  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadCoupons();
    }
  }, [isAuthenticated]);

  const loadCoupons = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const couponData: any = {
      code: formData.code.toUpperCase(),
      min_order_amount: parseFloat(formData.min_order_amount),
      usage_limit: formData.usage_limit
        ? parseInt(formData.usage_limit)
        : null,
      is_active: formData.is_active,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until || null,
    };

    if (formData.discount_type === "percentage") {
      couponData.discount_percentage = parseInt(formData.discount_percentage);
      couponData.discount_amount = null;
      couponData.max_discount_amount = formData.max_discount_amount
        ? parseFloat(formData.max_discount_amount)
        : null;
    } else {
      couponData.discount_amount = parseFloat(formData.discount_amount);
      couponData.discount_percentage = null;
      couponData.max_discount_amount = null;
    }

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);

        if (error) throw error;
        toast({ title: "Success", description: "Coupon updated" });
      } else {
        const { error } = await supabase.from("coupons").insert(couponData);

        if (error) throw error;
        toast({ title: "Success", description: "Coupon created" });
      }

      setShowDialog(false);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_percentage ? "percentage" : "amount",
      discount_percentage: coupon.discount_percentage?.toString() || "",
      discount_amount: coupon.discount_amount?.toString() || "",
      min_order_amount: coupon.min_order_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || "",
      usage_limit: coupon.usage_limit?.toString() || "",
      is_active: coupon.is_active,
      valid_from: new Date(coupon.valid_from).toISOString().split("T")[0],
      valid_until: coupon.valid_until
        ? new Date(coupon.valid_until).toISOString().split("T")[0]
        : "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Coupon deleted" });
      loadCoupons();
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_percentage: "",
      discount_amount: "",
      min_order_amount: "0",
      max_discount_amount: "",
      usage_limit: "",
      is_active: true,
      valid_from: new Date().toISOString().split("T")[0],
      valid_until: "",
    });
    setEditingCoupon(null);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Coupons Management</h1>
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-xl mb-2">{coupon.code}</h3>
                    {coupon.discount_percentage ? (
                      <p className="text-green-600 font-bold">
                        {coupon.discount_percentage}% OFF
                      </p>
                    ) : (
                      <p className="text-green-600 font-bold">
                        ₹{coupon.discount_amount} OFF
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      coupon.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {coupon.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>Min Order: ₹{coupon.min_order_amount}</p>
                  {coupon.usage_limit && (
                    <p>
                      Usage: {coupon.used_count}/{coupon.usage_limit}
                    </p>
                  )}
                  {coupon.valid_until && (
                    <p>Valid until: {new Date(coupon.valid_until).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Add Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div>
              <Label htmlFor="discount_type">Discount Type *</Label>
              <select
                id="discount_type"
                required
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({ ...formData, discount_type: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="percentage">Percentage</option>
                <option value="amount">Fixed Amount</option>
              </select>
            </div>
            {formData.discount_type === "percentage" ? (
              <>
                <div>
                  <Label htmlFor="discount_percentage">Discount Percentage *</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    required
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max_discount_amount">Max Discount Amount (₹)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="discount_amount">Discount Amount (₹) *</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.discount_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_amount: e.target.value })
                  }
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_order_amount">Min Order Amount (₹) *</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.min_order_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_order_amount: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="usage_limit">Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  required
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

