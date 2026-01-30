"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, User, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  is_verified_purchase: boolean;
  is_featured: boolean;
  created_at: string;
  customers?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: "",
    review_text: "",
  });

  useEffect(() => {
    loadReviews();
    checkCanReview();
  }, [productId]);

  const loadReviews = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email
          )
        `)
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setCanReview(false);
      return;
    }

    try {
      // Check if user has purchased this product
      const { data: orders } = await supabase
        .from("orders")
        .select(`
          id,
          order_status,
          shipping_status,
          order_items!inner (
            product_id
          )
        `)
        .eq("customer_id", user.id)
        .eq("order_items.product_id", productId);

      // Filter for delivered orders (check both order_status and shipping_status)
      const deliveredOrders = orders?.filter(
        (order) => order.order_status === "delivered" || order.shipping_status === "delivered"
      );

      if (deliveredOrders && deliveredOrders.length > 0) {
        setCanReview(true);

        // Check if user has already reviewed this product
        const { data: existingReview } = await supabase
          .from("product_reviews")
          .select("id")
          .eq("product_id", productId)
          .eq("customer_id", user.id)
          .single();

        setHasReviewed(!!existingReview);
      } else {
        setCanReview(false);
      }
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (!reviewForm.review_text.trim()) {
      toast({
        title: "Review Required",
        description: "Please write your review",
        variant: "destructive",
      });
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Get the order_id for verified purchase
      const { data: allOrders } = await supabase
        .from("orders")
        .select(`
          id,
          order_status,
          shipping_status,
          order_items!inner (
            product_id
          )
        `)
        .eq("customer_id", user.id)
        .eq("order_items.product_id", productId);

      // Find first delivered order
      const orders = allOrders?.find(
        (order) => order.order_status === "delivered" || order.shipping_status === "delivered"
      );

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        customer_id: user.id,
        order_id: orders?.id || null,
        rating: reviewForm.rating,
        title: reviewForm.title.trim() || null,
        review_text: reviewForm.review_text.trim(),
        is_verified_purchase: !!orders?.id,
        is_approved: false, // Requires admin approval
      });

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Your review has been submitted and is pending approval",
      });

      setReviewForm({ rating: 0, title: "", review_text: "" });
      setShowReviewForm(false);
      setHasReviewed(true);
      loadReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCustomerName = (review: Review) => {
    if (review.customers) {
      const firstName = review.customers.first_name || "";
      const lastName = review.customers.last_name || "";
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return review.customers.email.split("@")[0];
    }
    return "Anonymous";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate average rating and total reviews
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const totalReviews = reviews.length;

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
        : 0,
  }));

  const featuredReviews = reviews.filter((r) => r.is_featured);
  const regularReviews = reviews.filter((r) => !r.is_featured);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Customer Reviews</h2>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-700">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-600">({totalReviews} {totalReviews === 1 ? "review" : "reviews"})</span>
            </div>
          )}
        </div>

        {canReview && !hasReviewed && (
          <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Rating *</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= reviewForm.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300 hover:text-yellow-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="review-title">Review Title (Optional)</Label>
                  <Input
                    id="review-title"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    placeholder="Summarize your review"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="review-text">Your Review *</Label>
                  <Textarea
                    id="review-text"
                    value={reviewForm.review_text}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, review_text: e.target.value })
                    }
                    placeholder="Share your experience with this product..."
                    className="mt-2 min-h-[120px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {hasReviewed && (
          <p className="text-sm text-gray-600">You have already reviewed this product</p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      ) : totalReviews === 0 ? (
        <Card className="bg-[#f5f5f0]">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first to review this product!
            </p>
            {!canReview && (
              <p className="text-sm text-gray-500">
                Purchase this product to leave a review
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Rating Distribution</h3>
                <div className="space-y-2">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Review Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Reviews</span>
                    <span className="text-xl font-semibold">{totalReviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Verified Purchases</span>
                    <span className="text-xl font-semibold">
                      {reviews.filter((r) => r.is_verified_purchase).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Featured Reviews */}
          {featuredReviews.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Featured Reviews</h3>
              <div className="space-y-4">
                {featuredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} getCustomerName={getCustomerName} formatDate={formatDate} />
                ))}
              </div>
            </div>
          )}

          {/* All Reviews */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {featuredReviews.length > 0 ? "All Reviews" : "Reviews"}
            </h3>
            <div className="space-y-4">
              {regularReviews.map((review) => (
                <ReviewCard key={review.id} review={review} getCustomerName={getCustomerName} formatDate={formatDate} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  getCustomerName,
  formatDate,
}: {
  review: Review;
  getCustomerName: (review: Review) => string;
  formatDate: (dateString: string) => string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="font-semibold">{getCustomerName(review)}</span>
              {review.is_verified_purchase && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">{formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>

        {review.title && (
          <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
        )}

        {review.review_text && (
          <p className="text-gray-700 whitespace-pre-wrap">{review.review_text}</p>
        )}
      </CardContent>
    </Card>
  );
}

