"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, ArrowLeft, Video, Image as ImageIcon } from "lucide-react";
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

interface VerticalCard {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url: string | null;
  link_url: string | null;
  position: "left" | "right";
  display_order: number;
  is_active: boolean;
}

export default function AdminVerticalCards() {
  const router = useRouter();
  const [cards, setCards] = useState<VerticalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<VerticalCard | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    media_url: "",
    media_type: "image" as "image" | "video",
    thumbnail_url: "",
    link_url: "",
    position: "left" as "left" | "right",
    is_active: true,
    display_order: "0",
  });

  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadCards();
    }
  }, [isAuthenticated]);

  const loadCards = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vertical_cards")
      .select("*")
      .order("display_order");

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      setCards(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const cardData = {
      title: formData.title,
      description: formData.description || null,
      media_url: formData.media_url,
      media_type: formData.media_type,
      thumbnail_url: formData.thumbnail_url || null,
      link_url: formData.link_url || null,
      position: formData.position,
      is_active: formData.is_active,
      display_order: parseInt(formData.display_order),
    };

    try {
      if (editingCard) {
        const { error } = await supabase
          .from("vertical_cards")
          .update(cardData)
          .eq("id", editingCard.id);

        if (error) throw error;
        toast({ title: "Success", description: "Vertical card updated" });
      } else {
        const { error } = await supabase.from("vertical_cards").insert(cardData);

        if (error) throw error;
        toast({ title: "Success", description: "Vertical card created" });
      }

      setShowDialog(false);
      resetForm();
      loadCards();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const handleEdit = (card: VerticalCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      description: card.description || "",
      media_url: card.media_url,
      media_type: card.media_type,
      thumbnail_url: card.thumbnail_url || "",
      link_url: card.link_url || "",
      position: card.position,
      is_active: card.is_active,
      display_order: card.display_order.toString(),
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("vertical_cards").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Card deleted" });
      loadCards();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      media_url: "",
      media_type: "image",
      thumbnail_url: "",
      link_url: "",
      position: "left",
      is_active: true,
      display_order: "0",
    });
    setEditingCard(null);
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
              <h1 className="text-2xl font-bold">Vertical Content Cards</h1>
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id}>
              <CardContent className="p-0">
                <div className="relative h-48">
                  {card.media_type === "video" ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      {card.thumbnail_url ? (
                        <Image
                          src={card.thumbnail_url}
                          alt={card.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Video className="h-12 w-12 text-gray-400" />
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={card.media_url}
                      alt={card.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{card.title}</h3>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          card.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {card.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {card.position} - #{card.display_order}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {card.description}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    {card.media_type === "video" ? (
                      <Video className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-xs text-gray-500 capitalize">
                      {card.media_type}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(card)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(card.id)}
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
              {editingCard ? "Edit Vertical Card" : "Add Vertical Card"}
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
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="media_type">Media Type *</Label>
              <select
                id="media_type"
                value={formData.media_type}
                onChange={(e) =>
                  setFormData({ ...formData, media_type: e.target.value as "image" | "video" })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <Label htmlFor="media_url">
                {formData.media_type === "video" ? "Video URL *" : "Image URL *"}
              </Label>
              <Input
                id="media_url"
                type="url"
                required
                value={formData.media_url}
                onChange={(e) =>
                  setFormData({ ...formData, media_url: e.target.value })
                }
                placeholder={
                  formData.media_type === "video"
                    ? "https://example.com/video.mp4 or YouTube embed URL"
                    : "https://example.com/image.jpg"
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.media_type === "video"
                  ? "For videos, use direct video URL or YouTube embed URL"
                  : "Recommended size: 400x600px for vertical cards"}
              </p>
            </div>
            {formData.media_type === "video" && (
              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL (Optional)</Label>
                <Input
                  id="thumbnail_url"
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail_url: e.target.value })
                  }
                  placeholder="https://example.com/thumbnail.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Preview image for video (recommended: 400x600px)
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="link_url">Link URL (Optional)</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) =>
                  setFormData({ ...formData, link_url: e.target.value })
                }
                placeholder="https://example.com/page"
              />
              <p className="text-xs text-gray-500 mt-1">
                Where to redirect when card is clicked
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position *</Label>
                <select
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value as "left" | "right" })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="left">Left Side</option>
                  <option value="right">Right Side</option>
                </select>
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: e.target.value })
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



