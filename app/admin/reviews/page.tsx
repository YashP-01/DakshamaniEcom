"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X, Star, MessageSquare, User, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  products?: {
    name: string;
    image_url: string;
  };
  customers?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export default function AdminReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [reviewCounts, setReviewCounts] = useState({ pending: 0, approved: 0, all: 0 });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Check if user is admin
      const { data: customerData } = await supabase
        .from("customers")
        .select("is_admin, is_active")
        .eq("id", user.id)
        .single();

      if (!customerData || !customerData.is_admin || !customerData.is_active) {
        await supabase.auth.signOut();
        router.push("/admin/login");
        return;
      }

      loadReviews();
    };

    checkAuth();
  }, [router, filter]);

  const loadReviews = async () => {
    const supabase = createClient();
    setLoading(true);
    
    console.log("Loading reviews with filter:", filter);

    try {
      // Load reviews using authenticated Supabase client (RLS will allow admins)
      let query = supabase
        .from("product_reviews")
        .select(`
          *,
          products (
            name,
            image_url
          ),
          customers (
            first_name,
            last_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("is_approved", false);
      } else if (filter === "approved") {
        query = query.eq("is_approved", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading reviews:", error);
        throw error;
      }

      console.log("Reviews loaded successfully:", data?.length || 0);
      setReviews(data || []);

      // Get counts
      const [pendingResult, approvedResult, allResult] = await Promise.all([
        supabase.from("product_reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }).eq("is_approved", true),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }),
      ]);

      setReviewCounts({
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        all: allResult.count || 0,
      });
    } catch (err: any) {
      console.error("Unexpected error loading reviews:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load reviews",
        variant: "destructive",
      });
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("product_reviews")
      .update({ is_approved: true })
      .eq("id", reviewId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Review approved successfully",
      });
      loadReviews();
      setShowDialog(false);
    }
  };

  const handleReject = async (reviewId: string) => {
    if (!confirm("Are you sure you want to reject this review? It will be deleted.")) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Review rejected and deleted",
      });
      loadReviews();
      setShowDialog(false);
    }
  };

  const handleToggleFeatured = async (reviewId: string, currentFeatured: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("product_reviews")
      .update({ is_featured: !currentFeatured })
      .eq("id", reviewId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Review ${!currentFeatured ? "featured" : "unfeatured"} successfully`,
      });
      loadReviews();
    }
  };

  const getCustomerName = (review: Review) => {
    if (review.customers) {
      const firstName = review.customers.first_name || "";
      const lastName = review.customers.last_name || "";
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return review.customers.email || "Anonymous";
    }
    return "Anonymous";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-green-600" />
                <h1 className="text-2xl font-bold">Product Reviews</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Pending ({reviewCounts.pending})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            className={filter === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Approved ({reviewCounts.approved})
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            All Reviews ({reviewCounts.all})
          </Button>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p>Filter: {filter}</p>
            <p>Total reviews loaded: {reviews.length}</p>
            <p>Pending count: {reviews.filter(r => !r.is_approved).length}</p>
            <p>Approved count: {reviews.filter(r => r.is_approved).length}</p>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {filter === "pending"
                  ? "No pending reviews to approve"
                  : filter === "approved"
                  ? "No approved reviews yet"
                  : "No reviews found"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Check the browser console for any errors
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      {review.products?.image_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={review.products.image_url}
                            alt={review.products.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">
                              {review.products?.name || "Product"}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span>{getCustomerName(review)}</span>
                              <span className="mx-2">•</span>
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(review.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {review.is_verified_purchase && (
                              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                                Verified Purchase
                              </span>
                            )}
                            {review.is_approved && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                                Approved
                              </span>
                            )}
                            {review.is_featured && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-semibold text-gray-700">
                            {review.rating}.0
                          </span>
                        </div>

                        {/* Title */}
                        {review.title && (
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {review.title}
                          </h4>
                        )}

                        {/* Review Text */}
                        {review.review_text && (
                          <p className="text-gray-700 mb-4 line-clamp-3">
                            {review.review_text}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setShowDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full
                          </Button>
                          {!review.is_approved && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(review.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(review.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          {review.is_approved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                            >
                              {review.is_featured ? "Unfeature" : "Feature"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Review Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedReview.products?.image_url && (
                  <img
                    src={selectedReview.products.image_url}
                    alt={selectedReview.products.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedReview.products?.name || "Product"}
                  </h3>
                  <p className="text-sm text-gray-600">{getCustomerName(selectedReview)}</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedReview.created_at)}</p>
                </div>
              </div>

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= selectedReview.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {selectedReview.title && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">{selectedReview.title}</h4>
                </div>
              )}

              <div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedReview.review_text}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {!selectedReview.is_approved && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedReview.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Review
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedReview.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Review
                    </Button>
                  </>
                )}
                {selectedReview.is_approved && (
                  <Button
                    variant="outline"
                    onClick={() => handleToggleFeatured(selectedReview.id, selectedReview.is_featured)}
                  >
                    {selectedReview.is_featured ? "Remove from Featured" : "Mark as Featured"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

