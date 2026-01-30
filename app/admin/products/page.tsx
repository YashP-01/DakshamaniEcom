"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number;
  discount_percentage: number;
  image_url: string;
  gallery_images: string[];
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  stock_quantity: number;
  weight_grams: number;
  weight_unit: string;
  shelf_life_days: number;
  storage_instructions: string;
  origin_country: string;
  certification: string[];
  is_active: boolean;
  show_on_homepage?: boolean;
  homepage_display_order?: number;
  has_variants?: boolean;
  variant_count?: number;
}

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [showVariantsDialog, setShowVariantsDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [variantFormData, setVariantFormData] = useState({
    variant_name: "",
    sku: "",
    price: "",
    compare_at_price: "",
    stock_quantity: "0",
    is_active: true,
  });
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    short_description: "",
    price: "",
    compare_at_price: "",
    discount_percentage: "0",
    image_url: "",
    gallery_images: "",
    category: "dry_fruits",
    subcategory: "",
    brand: "",
    sku: "",
    barcode: "",
    stock_quantity: "0",
    low_stock_threshold: "10",
    track_inventory: true,
    allow_backorder: false,
    weight_grams: "",
    weight_unit: "grams",
    shelf_life_days: "",
    storage_instructions: "",
    origin_country: "",
    certification: "",
    is_active: true,
    is_featured: false,
    show_on_homepage: false,
    homepage_display_order: "0",
    meta_title: "",
    meta_description: "",
    tags: "",
  });

  const [nutritionData, setNutritionData] = useState({
    serving_size: "",
    calories: "",
    protein: "",
    carbohydrates: "",
    sugar: "",
    fiber: "",
    fat: "",
    saturated_fat: "",
    trans_fat: "",
    cholesterol: "",
    sodium: "",
    potassium: "",
    calcium: "",
    iron: "",
    vitamin_a: "",
    vitamin_c: "",
  });

  const [allergens, setAllergens] = useState<{ name: string; severity: string }[]>([]);
  const [newAllergen, setNewAllergen] = useState({ name: "", severity: "moderate" });
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([]);
  const [newIngredient, setNewIngredient] = useState({ name: "", quantity: "" });

  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated]);

  const loadProducts = async () => {
    const supabase = createClient();
    setLoading(true);
    
    // Load products with variant information
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (
          id,
          is_active
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message });
      setProducts([]);
    } else {
      // Process products with variants
      const productsWithVariants = (data || []).map((product: any) => ({
        ...product,
        has_variants: product.product_variants?.some((v: any) => v.is_active) || false,
        variant_count: product.product_variants?.filter((v: any) => v.is_active).length || 0,
        product_variants: undefined // Remove nested data
      }));
      setProducts(productsWithVariants);
    }
    setLoading(false);
  };

  const loadVariants = async (productId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("price");
    
    if (data) setVariants(data);
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProductId) return;

    const supabase = createClient();
    const variantData = {
      product_id: currentProductId,
      variant_name: variantFormData.variant_name,
      sku: variantFormData.sku || null,
      price: parseFloat(variantFormData.price),
      compare_at_price: variantFormData.compare_at_price ? parseFloat(variantFormData.compare_at_price) : null,
      stock_quantity: parseInt(variantFormData.stock_quantity),
      is_active: variantFormData.is_active,
    };

    try {
      if (editingVariant) {
        const { error } = await supabase
          .from("product_variants")
          .update(variantData)
          .eq("id", editingVariant.id);
        if (error) throw error;
        toast({ title: "Success", description: "Variant updated" });
      } else {
        const { error } = await supabase
          .from("product_variants")
          .insert(variantData);
        if (error) throw error;
        toast({ title: "Success", description: "Variant created" });
      }
      
      // If variant is active, check if we should activate the product
      if (variantFormData.is_active) {
        const { data: activeVariants } = await supabase
          .from("product_variants")
          .select("id")
          .eq("product_id", currentProductId)
          .eq("is_active", true);
        
        if (activeVariants && activeVariants.length > 0) {
          // Activate product if it has at least one active variant
          await supabase
            .from("products")
            .update({ is_active: true })
            .eq("id", currentProductId);
        }
      }
      
      loadVariants(currentProductId);
      loadProducts(); // Reload products to update variant count
      setVariantFormData({
        variant_name: "",
        sku: "",
        price: "",
        compare_at_price: "",
        stock_quantity: "0",
        is_active: true,
      });
      setEditingVariant(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const handleVariantDelete = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId);
    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Variant deleted" });
      
      // Check if product still has active variants
      if (currentProductId) {
        const { data: activeVariants } = await supabase
          .from("product_variants")
          .select("id")
          .eq("product_id", currentProductId)
          .eq("is_active", true);
        
        if (!activeVariants || activeVariants.length === 0) {
          // Deactivate product if no active variants remain
          await supabase
            .from("products")
            .update({ is_active: false })
            .eq("id", currentProductId);
          toast({ 
            title: "Warning", 
            description: "Product deactivated. Add at least one active variant to make it live.",
            variant: "destructive"
          });
        }
        
        loadVariants(currentProductId);
        loadProducts(); // Reload products to update variant count
      }
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const productData: any = {
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description,
      short_description: formData.short_description,
      price: parseFloat(formData.price),
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      discount_percentage: parseInt(formData.discount_percentage),
      image_url: formData.image_url,
      gallery_images: formData.gallery_images
        ? formData.gallery_images.split(",").map((url) => url.trim())
        : [],
      category: formData.category,
      subcategory: formData.subcategory || null,
      brand: formData.brand || null,
      sku: formData.sku || null,
      barcode: formData.barcode || null,
      stock_quantity: parseInt(formData.stock_quantity),
      low_stock_threshold: parseInt(formData.low_stock_threshold),
      track_inventory: formData.track_inventory,
      allow_backorder: formData.allow_backorder,
      weight_grams: formData.weight_grams ? parseFloat(formData.weight_grams) : null,
      weight_unit: formData.weight_unit,
      shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
      storage_instructions: formData.storage_instructions || null,
      origin_country: formData.origin_country || null,
      certification: formData.certification
        ? formData.certification.split(",").map((c) => c.trim())
        : [],
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      meta_title: formData.meta_title || null,
      meta_description: formData.meta_description || null,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
    };

    try {
      let productId: string;

      // Add homepage fields if they're set
      const finalProductData: any = { ...productData };
      if (formData.show_on_homepage !== undefined) {
        finalProductData.show_on_homepage = formData.show_on_homepage;
        finalProductData.homepage_display_order = parseInt(formData.homepage_display_order) || 0;
      }

      if (editingProduct) {
        const { data, error } = await supabase
          .from("products")
          .update(finalProductData)
          .eq("id", editingProduct.id)
          .select()
          .single();

        if (error) {
          // If error is about missing columns, try without homepage fields
          if (error.code === '42703' && formData.show_on_homepage !== undefined) {
            const { data: retryData, error: retryError } = await supabase
              .from("products")
              .update(productData)
              .eq("id", editingProduct.id)
              .select()
              .single();
            if (retryError) throw retryError;
            productId = editingProduct.id;
            toast({ 
              title: "Success", 
              description: "Product updated (homepage showcase available after schema cache refreshes)" 
            });
          } else {
            throw error;
          }
        } else {
          productId = editingProduct.id;
          toast({ title: "Success", description: "Product updated" });
        }
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(finalProductData)
          .select()
          .single();

        if (error) {
          // If error is about missing columns, try without homepage fields
          if (error.code === '42703' && formData.show_on_homepage !== undefined) {
            const { data: retryData, error: retryError } = await supabase
              .from("products")
              .insert(productData)
              .select()
              .single();
            if (retryError) throw retryError;
            productId = retryData.id;
            toast({ 
              title: "Success", 
              description: "Product created (homepage showcase available after schema cache refreshes)" 
            });
          } else {
            throw error;
          }
        } else {
          productId = data.id;
          toast({ title: "Success", description: "Product created" });
        }
      }

      // Save nutrition data
      if (currentProductId || productId) {
        const pid = currentProductId || productId;
        await saveNutritionData(pid);
        await saveAllergens(pid);
        await saveIngredients(pid);
      }

      // CRITICAL: Check if product has at least one active variant before allowing it to be active
      if (productId && formData.is_active) {
        const pid = currentProductId || productId;
        const { data: variants } = await supabase
          .from("product_variants")
          .select("id")
          .eq("product_id", pid)
          .eq("is_active", true);
        
        if (!variants || variants.length === 0) {
          // Deactivate product if no active variants
          await supabase
            .from("products")
            .update({ is_active: false })
            .eq("id", pid);
          
          toast({ 
            title: "Warning", 
            description: "Product created/updated but set to inactive. Add at least one active variant to make it live on the website.",
            variant: "destructive"
          });
        } else {
          toast({ title: "Success", description: "Product saved successfully" });
        }
      } else {
        toast({ title: "Success", description: "Product saved successfully" });
      }

      setShowDialog(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const saveNutritionData = async (productId: string) => {
    const supabase = createClient();
    
    // Check if nutrition data exists
    const { data: existing } = await supabase
      .from("product_nutrition")
      .select("id")
      .eq("product_id", productId)
      .single();

    const nutritionRecord: any = {
      product_id: productId,
      serving_size: nutritionData.serving_size || null,
      calories: nutritionData.calories ? parseFloat(nutritionData.calories) : null,
      protein: nutritionData.protein ? parseFloat(nutritionData.protein) : null,
      carbohydrates: nutritionData.carbohydrates ? parseFloat(nutritionData.carbohydrates) : null,
      sugar: nutritionData.sugar ? parseFloat(nutritionData.sugar) : null,
      fiber: nutritionData.fiber ? parseFloat(nutritionData.fiber) : null,
      fat: nutritionData.fat ? parseFloat(nutritionData.fat) : null,
      saturated_fat: nutritionData.saturated_fat ? parseFloat(nutritionData.saturated_fat) : null,
      trans_fat: nutritionData.trans_fat ? parseFloat(nutritionData.trans_fat) : null,
      cholesterol: nutritionData.cholesterol ? parseFloat(nutritionData.cholesterol) : null,
      sodium: nutritionData.sodium ? parseFloat(nutritionData.sodium) : null,
      potassium: nutritionData.potassium ? parseFloat(nutritionData.potassium) : null,
      calcium: nutritionData.calcium ? parseFloat(nutritionData.calcium) : null,
      iron: nutritionData.iron ? parseFloat(nutritionData.iron) : null,
      vitamin_a: nutritionData.vitamin_a ? parseFloat(nutritionData.vitamin_a) : null,
      vitamin_c: nutritionData.vitamin_c ? parseFloat(nutritionData.vitamin_c) : null,
    };

    if (existing) {
      await supabase
        .from("product_nutrition")
        .update(nutritionRecord)
        .eq("id", existing.id);
    } else {
      await supabase.from("product_nutrition").insert(nutritionRecord);
    }
  };

  const saveAllergens = async (productId: string) => {
    const supabase = createClient();
    
    // Delete existing allergens
    await supabase.from("product_allergens").delete().eq("product_id", productId);

    // Insert new allergens
    if (allergens.length > 0) {
      await supabase.from("product_allergens").insert(
        allergens.map((a) => ({
          product_id: productId,
          allergen_name: a.name,
          severity: a.severity,
        }))
      );
    }
  };

  const saveIngredients = async (productId: string) => {
    const supabase = createClient();
    
    // Delete existing ingredients
    await supabase.from("product_ingredients").delete().eq("product_id", productId);

    // Insert new ingredients
    if (ingredients.length > 0) {
      await supabase.from("product_ingredients").insert(
        ingredients.map((ing, index) => ({
          product_id: productId,
          ingredient_name: ing.name,
          quantity: ing.quantity || null,
          display_order: index,
        }))
      );
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setCurrentProductId(product.id);
    
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      short_description: product.short_description || "",
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || "",
      discount_percentage: product.discount_percentage.toString(),
      image_url: product.image_url || "",
      gallery_images: product.gallery_images?.join(", ") || "",
      category: product.category,
      subcategory: product.subcategory || "",
      brand: product.brand || "",
      sku: product.sku || "",
      barcode: "",
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: "10",
      track_inventory: true,
      allow_backorder: false,
      weight_grams: product.weight_grams?.toString() || "",
      weight_unit: product.weight_unit || "grams",
      shelf_life_days: product.shelf_life_days?.toString() || "",
      storage_instructions: product.storage_instructions || "",
      origin_country: product.origin_country || "",
      certification: product.certification?.join(", ") || "",
      is_active: product.is_active,
      is_featured: product.is_featured || false,
      show_on_homepage: product.show_on_homepage || false,
      homepage_display_order: product.homepage_display_order?.toString() || "0",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      tags: product.tags?.join(", ") || "",
    });

    // Load nutrition, allergens, ingredients
    const supabase = createClient();
    
    const { data: nutrition } = await supabase
      .from("product_nutrition")
      .select("*")
      .eq("product_id", product.id)
      .single();

    if (nutrition) {
      setNutritionData({
        serving_size: nutrition.serving_size || "",
        calories: nutrition.calories?.toString() || "",
        protein: nutrition.protein?.toString() || "",
        carbohydrates: nutrition.carbohydrates?.toString() || "",
        sugar: nutrition.sugar?.toString() || "",
        fiber: nutrition.fiber?.toString() || "",
        fat: nutrition.fat?.toString() || "",
        saturated_fat: nutrition.saturated_fat?.toString() || "",
        trans_fat: nutrition.trans_fat?.toString() || "",
        cholesterol: nutrition.cholesterol?.toString() || "",
        sodium: nutrition.sodium?.toString() || "",
        potassium: nutrition.potassium?.toString() || "",
        calcium: nutrition.calcium?.toString() || "",
        iron: nutrition.iron?.toString() || "",
        vitamin_a: nutrition.vitamin_a?.toString() || "",
        vitamin_c: nutrition.vitamin_c?.toString() || "",
      });
    }

    const { data: allergensData } = await supabase
      .from("product_allergens")
      .select("*")
      .eq("product_id", product.id);

    if (allergensData) {
      setAllergens(
        allergensData.map((a: any) => ({
          name: a.allergen_name,
          severity: a.severity,
        }))
      );
    }

    const { data: ingredientsData } = await supabase
      .from("product_ingredients")
      .select("*")
      .eq("product_id", product.id)
      .order("display_order");

    if (ingredientsData) {
      setIngredients(
        ingredientsData.map((i: any) => ({
          name: i.ingredient_name,
          quantity: i.quantity || "",
        }))
      );
    }

    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Product deleted" });
      loadProducts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      short_description: "",
      price: "",
      compare_at_price: "",
      discount_percentage: "0",
      image_url: "",
      gallery_images: "",
      category: "dry_fruits",
      subcategory: "",
      brand: "",
      sku: "",
      barcode: "",
      stock_quantity: "0",
      low_stock_threshold: "10",
      track_inventory: true,
      allow_backorder: false,
      weight_grams: "",
      weight_unit: "grams",
      shelf_life_days: "",
      storage_instructions: "",
      origin_country: "",
      certification: "",
      is_active: true,
      is_featured: false,
      show_on_homepage: false,
      homepage_display_order: "0",
      meta_title: "",
      meta_description: "",
      tags: "",
    });
    setNutritionData({
      serving_size: "",
      calories: "",
      protein: "",
      carbohydrates: "",
      sugar: "",
      fiber: "",
      fat: "",
      saturated_fat: "",
      trans_fat: "",
      cholesterol: "",
      sodium: "",
      potassium: "",
      calcium: "",
      iron: "",
      vitamin_a: "",
      vitamin_c: "",
    });
    setAllergens([]);
    setIngredients([]);
    setEditingProduct(null);
    setCurrentProductId(null);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (isLoading || !isAuthenticated) {
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
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Products Management</h1>
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        product.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                    {/* Check if product has variants */}
                    {(() => {
                      const hasVariants = product.has_variants;
                      return !hasVariants ? (
                        <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 mt-1">
                          No Variants
                        </span>
                      ) : null;
                    })()}
                    {product.show_on_homepage && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        Homepage #{product.homepage_display_order || 0}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-lg font-bold text-green-600">
                      ₹{product.price}
                    </span>
                    {product.discount_percentage > 0 && (
                      <span className="ml-2 text-sm text-red-500">
                        {product.discount_percentage}% OFF
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    Stock: {product.stock_quantity}
                  </span>
                </div>
                {product.shelf_life_days && (
                  <p className="text-xs text-gray-500 mb-4">
                    Shelf Life: {product.shelf_life_days} days
                  </p>
                )}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentProductId(product.id);
                      loadVariants(product.id);
                      setShowVariantsDialog(true);
                    }}
                    className={!product.has_variants ? "border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100" : ""}
                  >
                    Variants {product.variant_count ? `(${product.variant_count})` : "(0)"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced Product Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (!editingProduct) {
                      setFormData((prev) => ({
                        ...prev,
                        slug: generateSlug(e.target.value),
                      }));
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL-friendly)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
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
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) =>
                    setFormData({ ...formData, short_description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Pricing</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="compare_at_price">Compare at Price (₹)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    step="0.01"
                    value={formData.compare_at_price}
                    onChange={(e) =>
                      setFormData({ ...formData, compare_at_price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="discount_percentage">Discount (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Images</h3>
              <div>
                <Label htmlFor="image_url">Main Image URL *</Label>
                <Input
                  id="image_url"
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="gallery_images">Gallery Images (comma-separated URLs)</Label>
                <Input
                  id="gallery_images"
                  type="text"
                  value={formData.gallery_images}
                  onChange={(e) =>
                    setFormData({ ...formData, gallery_images: e.target.value })
                  }
                  placeholder="https://image1.com, https://image2.com"
                />
              </div>
            </div>

            {/* Category & Classification */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Category & Classification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="dry_fruits">Dry Fruits</option>
                    <option value="masalas">Masalas</option>
                    <option value="sweets">Sweets</option>
                    <option value="ghee">Ghee</option>
                    <option value="moringa_powder">Moringa Powder</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) =>
                      setFormData({ ...formData, subcategory: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Food Industry Specific */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Food Industry Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight_grams">Weight (grams)</Label>
                  <Input
                    id="weight_grams"
                    type="number"
                    step="0.01"
                    value={formData.weight_grams}
                    onChange={(e) =>
                      setFormData({ ...formData, weight_grams: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="weight_unit">Weight Unit</Label>
                  <select
                    id="weight_unit"
                    value={formData.weight_unit}
                    onChange={(e) =>
                      setFormData({ ...formData, weight_unit: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="grams">Grams</option>
                    <option value="kg">Kilograms</option>
                    <option value="ml">Milliliters</option>
                    <option value="l">Liters</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="shelf_life_days">Shelf Life (days)</Label>
                  <Input
                    id="shelf_life_days"
                    type="number"
                    value={formData.shelf_life_days}
                    onChange={(e) =>
                      setFormData({ ...formData, shelf_life_days: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="origin_country">Origin Country</Label>
                  <Input
                    id="origin_country"
                    value={formData.origin_country}
                    onChange={(e) =>
                      setFormData({ ...formData, origin_country: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="storage_instructions">Storage Instructions</Label>
                <textarea
                  id="storage_instructions"
                  value={formData.storage_instructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      storage_instructions: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
                  placeholder="Store in a cool, dry place..."
                />
              </div>
              <div>
                <Label htmlFor="certification">Certifications (comma-separated)</Label>
                <Input
                  id="certification"
                  value={formData.certification}
                  onChange={(e) =>
                    setFormData({ ...formData, certification: e.target.value })
                  }
                  placeholder="Organic, FSSAI, ISO..."
                />
              </div>
            </div>

            {/* Stock Management */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Stock Management</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        low_stock_threshold: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="track_inventory"
                    checked={formData.track_inventory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        track_inventory: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="track_inventory">Track Inventory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow_backorder"
                    checked={formData.allow_backorder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allow_backorder: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="allow_backorder">Allow Backorder</Label>
                </div>
              </div>
            </div>

            {/* Nutrition Information Button */}
            <div className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentProductId(editingProduct?.id || null);
                  setShowNutritionDialog(true);
                }}
                className="w-full"
              >
                Manage Nutrition Information
              </Button>
            </div>

            {/* Allergens */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Allergens</h3>
              <div className="flex space-x-2">
                <Input
                  placeholder="Allergen name"
                  value={newAllergen.name}
                  onChange={(e) =>
                    setNewAllergen({ ...newAllergen, name: e.target.value })
                  }
                />
                <select
                  value={newAllergen.severity}
                  onChange={(e) =>
                    setNewAllergen({ ...newAllergen, severity: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
                <Button
                  type="button"
                  onClick={() => {
                    if (newAllergen.name) {
                      setAllergens([...allergens, newAllergen]);
                      setNewAllergen({ name: "", severity: "moderate" });
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                              {allergens.map((allergen: { name: string; severity: string }, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span>
                      {allergen.name} ({allergen.severity})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setAllergens(allergens.filter((_: any, i: number) => i !== index))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Ingredients</h3>
              <div className="flex space-x-2">
                <Input
                  placeholder="Ingredient name"
                  value={newIngredient.name}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, name: e.target.value })
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Quantity (optional)"
                  value={newIngredient.quantity}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, quantity: e.target.value })
                  }
                  className="w-32"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newIngredient.name) {
                      setIngredients([...ingredients, newIngredient]);
                      setNewIngredient({ name: "", quantity: "" });
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                              {ingredients.map((ingredient: { name: string; quantity: string }, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span>
                      {ingredient.name}
                      {ingredient.quantity && ` (${ingredient.quantity})`}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIngredients(ingredients.filter((_: any, i: number) => i !== index))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Status</h3>
              <div className="flex items-center space-x-4">
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
                  {formData.is_active && (
                    <div className="ml-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⚠️ Product must have at least one active variant to be visible on website
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) =>
                      setFormData({ ...formData, is_featured: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_featured">Featured</Label>
                </div>
              </div>
            </div>

            {/* Homepage Showcase */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Homepage Showcase</h3>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="show_on_homepage"
                  checked={formData.show_on_homepage}
                  onChange={(e) =>
                    setFormData({ ...formData, show_on_homepage: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="show_on_homepage">Show on Homepage</Label>
              </div>
              {formData.show_on_homepage && (
                <div>
                  <Label htmlFor="homepage_display_order">Display Order</Label>
                  <Input
                    id="homepage_display_order"
                    type="number"
                    min="0"
                    value={formData.homepage_display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, homepage_display_order: e.target.value })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first. Products with the same order will be sorted by creation date.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 border-t pt-4">
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
              <Button type="submit">Save Product</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nutrition Information Dialog */}
      <Dialog open={showNutritionDialog} onOpenChange={setShowNutritionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nutrition Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serving_size">Serving Size</Label>
              <Input
                id="serving_size"
                value={nutritionData.serving_size}
                onChange={(e) =>
                  setNutritionData({
                    ...nutritionData,
                    serving_size: e.target.value,
                  })
                }
                placeholder="e.g., 100g, 1 piece"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  step="0.01"
                  value={nutritionData.calories}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      calories: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.01"
                  value={nutritionData.protein}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      protein: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="carbohydrates">Carbohydrates (g)</Label>
                <Input
                  id="carbohydrates"
                  type="number"
                  step="0.01"
                  value={nutritionData.carbohydrates}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      carbohydrates: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="sugar">Sugar (g)</Label>
                <Input
                  id="sugar"
                  type="number"
                  step="0.01"
                  value={nutritionData.sugar}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      sugar: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="fiber">Fiber (g)</Label>
                <Input
                  id="fiber"
                  type="number"
                  step="0.01"
                  value={nutritionData.fiber}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      fiber: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.01"
                  value={nutritionData.fat}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      fat: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="saturated_fat">Saturated Fat (g)</Label>
                <Input
                  id="saturated_fat"
                  type="number"
                  step="0.01"
                  value={nutritionData.saturated_fat}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      saturated_fat: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="trans_fat">Trans Fat (g)</Label>
                <Input
                  id="trans_fat"
                  type="number"
                  step="0.01"
                  value={nutritionData.trans_fat}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      trans_fat: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="cholesterol">Cholesterol (mg)</Label>
                <Input
                  id="cholesterol"
                  type="number"
                  step="0.01"
                  value={nutritionData.cholesterol}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      cholesterol: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="sodium">Sodium (mg)</Label>
                <Input
                  id="sodium"
                  type="number"
                  step="0.01"
                  value={nutritionData.sodium}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      sodium: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="potassium">Potassium (mg)</Label>
                <Input
                  id="potassium"
                  type="number"
                  step="0.01"
                  value={nutritionData.potassium}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      potassium: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="calcium">Calcium (mg)</Label>
                <Input
                  id="calcium"
                  type="number"
                  step="0.01"
                  value={nutritionData.calcium}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      calcium: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="iron">Iron (mg)</Label>
                <Input
                  id="iron"
                  type="number"
                  step="0.01"
                  value={nutritionData.iron}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      iron: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="vitamin_a">Vitamin A (IU)</Label>
                <Input
                  id="vitamin_a"
                  type="number"
                  step="0.01"
                  value={nutritionData.vitamin_a}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      vitamin_a: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="vitamin_c">Vitamin C (mg)</Label>
                <Input
                  id="vitamin_c"
                  type="number"
                  step="0.01"
                  value={nutritionData.vitamin_c}
                  onChange={(e) =>
                    setNutritionData({
                      ...nutritionData,
                      vitamin_c: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNutritionDialog(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variants Management Dialog */}
      <Dialog open={showVariantsDialog} onOpenChange={setShowVariantsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Product Variants</DialogTitle>
            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-2">
              ⚠️ <strong>Important:</strong> Products must have at least one active variant to be visible on the website. 
              Without variants, the product will be automatically deactivated.
            </p>
          </DialogHeader>
          <div className="space-y-6">
            {/* Variant Form */}
            <form onSubmit={handleVariantSubmit} className="space-y-4 border-b pb-4">
              <h3 className="font-semibold">{editingVariant ? "Edit Variant" : "Add Variant"}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="variant_name">Variant Name * (e.g., 250gm, 500gm, 1kg)</Label>
                  <Input
                    id="variant_name"
                    required
                    value={variantFormData.variant_name}
                    onChange={(e) => setVariantFormData({ ...variantFormData, variant_name: e.target.value })}
                    placeholder="250gm"
                  />
                </div>
                <div>
                  <Label htmlFor="variant_sku">SKU (Optional)</Label>
                  <Input
                    id="variant_sku"
                    value={variantFormData.sku}
                    onChange={(e) => setVariantFormData({ ...variantFormData, sku: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="variant_price">Price (₹) *</Label>
                  <Input
                    id="variant_price"
                    type="number"
                    step="0.01"
                    required
                    value={variantFormData.price}
                    onChange={(e) => setVariantFormData({ ...variantFormData, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="variant_compare_price">Compare at Price (₹)</Label>
                  <Input
                    id="variant_compare_price"
                    type="number"
                    step="0.01"
                    value={variantFormData.compare_at_price}
                    onChange={(e) => setVariantFormData({ ...variantFormData, compare_at_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="variant_stock">Stock Quantity *</Label>
                  <Input
                    id="variant_stock"
                    type="number"
                    required
                    value={variantFormData.stock_quantity}
                    onChange={(e) => setVariantFormData({ ...variantFormData, stock_quantity: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="variant_active"
                    checked={variantFormData.is_active}
                    onChange={(e) => setVariantFormData({ ...variantFormData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="variant_active">Active</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                {editingVariant && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingVariant(null);
                      setVariantFormData({
                        variant_name: "",
                        sku: "",
                        price: "",
                        compare_at_price: "",
                        stock_quantity: "0",
                        is_active: true,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit">{editingVariant ? "Update" : "Add"} Variant</Button>
              </div>
            </form>

            {/* Variants List */}
            <div>
              <h3 className="font-semibold mb-4">Existing Variants</h3>
              {variants.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No variants added yet</p>
              ) : (
                <div className="space-y-2">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-semibold">{variant.variant_name}</div>
                        <div className="text-sm text-gray-600">
                          ₹{variant.price.toFixed(2)}
                          {variant.compare_at_price && (
                            <span className="ml-2 line-through text-gray-400">
                              ₹{variant.compare_at_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stock: {variant.stock_quantity} | {variant.is_active ? "Active" : "Inactive"}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingVariant(variant);
                            setVariantFormData({
                              variant_name: variant.variant_name,
                              sku: variant.sku || "",
                              price: variant.price.toString(),
                              compare_at_price: variant.compare_at_price?.toString() || "",
                              stock_quantity: variant.stock_quantity.toString(),
                              is_active: variant.is_active,
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleVariantDelete(variant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
