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
import Image from "next/image";

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  show_on_products_page?: boolean;
  products_page_position?: number;
  discount_type?: string;
  discount_value?: number;
}

export default function AdminOffers() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    is_active: true,
    display_order: "0",
    show_on_products_page: false,
    products_page_position: "0",
    discount_type: "percentage",
    discount_value: "",
  });

  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadOffers();
    }
  }, [isAuthenticated]);

  const loadOffers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("display_order");

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const offerData: any = {
      title: formData.title,
      description: formData.description,
      image_url: formData.image_url,
      link_url: formData.link_url,
      is_active: formData.is_active,
      display_order: parseInt(formData.display_order),
      show_on_products_page: formData.show_on_products_page,
      products_page_position: parseInt(formData.products_page_position) || 0,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
    };

    try {
      if (editingOffer) {
        const { error } = await supabase
          .from("offers")
          .update(offerData)
          .eq("id", editingOffer.id);

        if (error) throw error;
        toast({ title: "Success", description: "Offer updated" });
      } else {
        const { error } = await supabase.from("offers").insert(offerData);

        if (error) throw error;
        toast({ title: "Success", description: "Offer created" });
      }

      setShowDialog(false);
      resetForm();
      loadOffers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      image_url: offer.image_url,
      link_url: offer.link_url || "",
      show_on_products_page: offer.show_on_products_page || false,
      products_page_position: (offer.products_page_position || 0).toString(),
      discount_type: offer.discount_type || "percentage",
      discount_value: offer.discount_value?.toString() || "",
      is_active: offer.is_active,
      display_order: offer.display_order.toString(),
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("offers").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Offer deleted" });
      loadOffers();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      link_url: "",
      is_active: true,
      display_order: "0",
      show_on_products_page: false,
      products_page_position: "0",
      discount_type: "percentage",
      discount_value: "",
    });
    setEditingOffer(null);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
              <h1 className="text-2xl font-bold">Offers Management</h1>
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Offer
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="p-0">
                <div className="relative h-48">
                  <Image
                    src={offer.image_url}
                    alt={offer.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{offer.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        offer.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {offer.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {offer.description}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(offer)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(offer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
              {editingOffer ? "Edit Offer" : "Add Offer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="image_url">Image URL *</Label>
              <Input
                id="image_url"
                type="url"
                required
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://example.com/banner-image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 1920x1080px for best quality on full-screen hero banners
              </p>
            </div>
            <div>
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) =>
                  setFormData({ ...formData, link_url: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
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
            </div>

            {/* Products Page Banner Settings */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-lg">Products Page Banner</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show_on_products_page"
                  checked={formData.show_on_products_page}
                  onChange={(e) =>
                    setFormData({ ...formData, show_on_products_page: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="show_on_products_page">Show on Products Page</Label>
              </div>
              {formData.show_on_products_page && (
                <div>
                  <Label htmlFor="products_page_position">Position (After how many rows)</Label>
                  <Input
                    id="products_page_position"
                    type="number"
                    min="0"
                    value={formData.products_page_position}
                    onChange={(e) =>
                      setFormData({ ...formData, products_page_position: e.target.value })
                    }
                    placeholder="e.g., 1 = after first row of 4 products"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Position 1 = after first row (4 products), Position 2 = after second row (8 products), etc.
                  </p>
                </div>
              )}
            </div>

            {/* Discount Settings */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-lg">Discount Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <select
                    id="discount_type"
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_type: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="discount_value">Discount Value</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    placeholder={formData.discount_type === "percentage" ? "e.g., 20" : "e.g., 100"}
                  />
                </div>
              </div>
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

