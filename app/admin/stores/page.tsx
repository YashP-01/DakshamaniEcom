"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, ArrowLeft, MapPin, GripVertical, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  serviceable_pincodes: string[];
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: any;
  image_url: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface MapSettings {
  id: string;
  map_image_url: string;
  description: string | null;
}

export default function AdminStores() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [mapSettings, setMapSettings] = useState<MapSettings | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    serviceable_pincodes: "", // Comma-separated string for input
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    opening_hours: {
      monday: "9:00 AM - 9:00 PM",
      tuesday: "9:00 AM - 9:00 PM",
      wednesday: "9:00 AM - 9:00 PM",
      thursday: "9:00 AM - 9:00 PM",
      friday: "9:00 AM - 9:00 PM",
      saturday: "9:00 AM - 9:00 PM",
      sunday: "9:00 AM - 9:00 PM",
    },
    image_url: "",
    description: "",
    display_order: "0",
    is_active: true,
  });

  const [mapFormData, setMapFormData] = useState({
    map_image_url: "",
    description: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadStores();
      loadMapSettings();
    }
  }, [isAuthenticated]);

  const loadStores = async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      setStores(data || []);
    }
    setLoading(false);
  };

  const loadMapSettings = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("store_map_settings")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setMapSettings(data);
      setMapFormData({
        map_image_url: data.map_image_url || "",
        description: data.description || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const storeData = {
      ...formData,
      phone: formData.phone || null,
      email: formData.email || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      opening_hours: formData.opening_hours,
      image_url: formData.image_url || null,
      description: formData.description || null,
      display_order: parseInt(formData.display_order) || 0,
      is_active: formData.is_active,
      serviceable_pincodes: formData.serviceable_pincodes
        ? formData.serviceable_pincodes.split(',').map(p => p.trim()).filter(Boolean)
        : [],
    };

    try {
      if (editingStore) {
        const { error } = await supabase
          .from("stores")
          .update(storeData)
          .eq("id", editingStore.id);

        if (error) throw error;
        toast({ title: "Success", description: "Store updated" });
      } else {
        const { error } = await supabase.from("stores").insert(storeData);

        if (error) throw error;
        toast({ title: "Success", description: "Store created" });
      }

      setShowDialog(false);
      resetForm();
      loadStores();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const handleMapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("store_map_settings")
        .update({
          map_image_url: mapFormData.map_image_url,
          description: mapFormData.description || null,
          updated_by: user?.id || null,
        })
        .eq("id", mapSettings?.id || "");

      if (error) throw error;
      
      toast({ title: "Success", description: "Map image updated" });
      setShowMapDialog(false);
      loadMapSettings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      pincode: store.pincode,
      country: store.country,
      phone: store.phone || "",
      email: store.email || "",
      latitude: store.latitude?.toString() || "",
      longitude: store.longitude?.toString() || "",
      opening_hours: store.opening_hours || formData.opening_hours,
      image_url: store.image_url || "",
      description: store.description || "",
      display_order: store.display_order.toString(),
      is_active: store.is_active,
      serviceable_pincodes: store.serviceable_pincodes ? store.serviceable_pincodes.join(', ') : "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this store?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("stores").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Store deleted" });
      loadStores();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      phone: "",
      email: "",
      latitude: "",
      longitude: "",
      opening_hours: {
        monday: "9:00 AM - 9:00 PM",
        tuesday: "9:00 AM - 9:00 PM",
        wednesday: "9:00 AM - 9:00 PM",
        thursday: "9:00 AM - 9:00 PM",
        friday: "9:00 AM - 9:00 PM",
        saturday: "9:00 AM - 9:00 PM",
        sunday: "9:00 AM - 9:00 PM",
      },
      image_url: "",
      description: "",
      display_order: "0",
      is_active: true,
      serviceable_pincodes: "",
    });
    setEditingStore(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newStores = [...stores];
    const draggedStore = newStores[draggedIndex];
    newStores.splice(draggedIndex, 1);
    newStores.splice(index, 0, draggedStore);
    setStores(newStores);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    const supabase = createClient();
    
    // Update display_order for all stores
    const updates = stores.map((store, index) => ({
      id: store.id,
      display_order: index,
    }));

    try {
      for (const update of updates) {
        await supabase
          .from("stores")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }

      toast({ title: "Success", description: "Store order updated" });
      loadStores();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
      loadStores(); // Reload to revert changes
    }

    setDraggedIndex(null);
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
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-green-600" />
                <h1 className="text-2xl font-bold">Manage Stores</h1>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setMapFormData({
                    map_image_url: mapSettings?.map_image_url || "",
                    description: mapSettings?.description || "",
                  });
                  setShowMapDialog(true);
                }}
              >
                <Map className="h-4 w-4 mr-2" />
                Manage Map Image
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Store
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {stores.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">No stores added yet</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Store
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="cursor-move"
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="h-6 w-6" />
                        <span className="text-sm font-semibold">#{store.display_order + 1}</span>
                      </div>
                      
                      {store.image_url && (
                        <img
                          src={store.image_url}
                          alt={store.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold">{store.name}</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(store)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(store.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-1">{store.address}</p>
                        <p className="text-sm text-gray-500">
                          {store.city}, {store.state} - {store.pincode}
                        </p>
                        {store.phone && (
                          <p className="text-sm text-gray-500">Phone: {store.phone}</p>
                        )}
                        {store.is_active ? (
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Store Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStore ? "Edit Store" : "Add New Store"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="serviceable_pincodes">Serviceable Pincodes (Delivery Zones)</Label>
              <Input
                id="serviceable_pincodes"
                value={formData.serviceable_pincodes}
                onChange={(e) => setFormData({ ...formData, serviceable_pincodes: e.target.value })}
                placeholder="e.g., 560001, 560002, 560003"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter comma-separated pincodes that this store can deliver to
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 28.6139"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., 77.2090"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image_url">Store Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/store-image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Active (visible on stores page)</Label>
            </div>

            <div className="flex gap-3">
              <Button type="submit">{editingStore ? "Update" : "Create"} Store</Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map Image Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Store Map Image</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMapSubmit} className="space-y-4">
            <div>
              <Label htmlFor="map_image_url">Map Image URL *</Label>
              <Input
                id="map_image_url"
                value={mapFormData.map_image_url}
                onChange={(e) => setMapFormData({ ...mapFormData, map_image_url: e.target.value })}
                placeholder="https://example.com/india-map-with-locations.jpg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload an image of India map with your store locations marked
              </p>
            </div>

            {mapFormData.map_image_url && (
              <div className="border rounded-lg p-4">
                <img
                  src={mapFormData.map_image_url}
                  alt="Map preview"
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <div>
              <Label htmlFor="map_description">Description</Label>
              <Textarea
                id="map_description"
                value={mapFormData.description}
                onChange={(e) => setMapFormData({ ...mapFormData, description: e.target.value })}
                rows={2}
                placeholder="Optional description about the map"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">Update Map Image</Button>
              <Button type="button" variant="outline" onClick={() => setShowMapDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}










