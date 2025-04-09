import { useState, useEffect } from "react";
import { useLocation, useParams, useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useMediaQuery } from "@/hooks/use-mobile";
import { 
  ArrowLeft, 
  Check,
  Loader2, 
  Plus, 
  X, 
  FileImage,
  Star, 
  ShoppingCart,
  Info,
  Settings,
  ImageIcon,
  Weight,
  Utensils, 
  Leaf,
  Save,
  CheckCircle2
} from "lucide-react";
import { insertProductSchema, type Product } from "@shared/schema";
import { z } from "zod";

// The admin key - in a real app, this would be retrieved securely
// Get admin key from environment variable or use fallback for local development
const ADMIN_KEY = import.meta.env.VITE_ADMIN_SECRET || "admin-secret";

// Extended schema with validation
const productFormSchema = insertProductSchema.extend({
  // Make optional fields required for the form
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  imageUrl: z.string().url("Please enter a valid image URL"),
  // Add validation to existing fields
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
  // Add slug field with validation
  slug: z.string().optional(),
  // Add weight prices field
  weightPrices: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// For managing weight-specific prices
interface WeightPriceItem {
  weight: string;
  price: string;
}

// For review management, we'll use a local type
interface ReviewItem {
  id: string;
  name: string;
  avatar?: string;
  date: string;
  rating: number;
  comment: string;
  helpfulCount: number;
}

export default function ProductForm() {
  const [_, navigate] = useLocation();
  const [__, params] = useRoute<{ id: string }>("/admin/products/:id");
  const isEditMode = params?.id && params.id !== "new";
  const productId = isEditMode ? parseInt(params?.id || "0") : null;
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  
  // Review management state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editReviewIndex, setEditReviewIndex] = useState<number>(-1);

  // State for managing weight-price combinations
  const [weightPrices, setWeightPrices] = useState<WeightPriceItem[]>([]);
  const [weightPricesSaved, setWeightPricesSaved] = useState(false);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      price: "",
      comparePrice: "",
      badge: "",
      category: "organic",
      imageUrl: "",
      imageGallery: [],
      inStock: true,
      stockQuantity: 0,
      featured: false,
      nutritionFacts: "",
      cookingInstructions: "",
      rating: "",
      reviewCount: 0,
      weightOptions: [],
      slug: "",
      reviews: "",
      weightPrices: "",
    },
  });

  // Load reviews when form data changes
  useEffect(() => {
    const reviewsStr = form.watch("reviews");
    if (reviewsStr) {
      try {
        setReviews(JSON.parse(reviewsStr));
      } catch (e) {
        console.error("Error parsing reviews:", e);
        setReviews([]);
      }
    } else {
      setReviews([]);
    }
  }, [form.watch("reviews")]);

  // Update form when reviews change
  useEffect(() => {
    form.setValue("reviews", JSON.stringify(reviews));
  }, [reviews, form]);

  useEffect(() => {
    if (isEditMode && productId) {
      fetchProduct(productId);
    }
  }, [isEditMode, productId]);

  const fetchProduct = async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      
      const product = await response.json();
      
      // Parse weight prices if available
      if (product.weightPrices) {
        try {
          const pricesObj = JSON.parse(product.weightPrices);
          const weightPriceItems = Object.entries(pricesObj).map(([weight, price]) => ({
            weight,
            price: String(price)
          }));
          setWeightPrices(weightPriceItems);
        } catch (e) {
          console.error("Error parsing weight prices:", e);
          setWeightPrices([]);
        }
      } else {
        setWeightPrices([]);
      }
      
      // Map API data to form values
      form.reset({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription || "",
        price: product.price,
        comparePrice: product.comparePrice || "",
        badge: product.badge || "",
        category: product.category,
        imageUrl: product.imageUrl,
        imageGallery: product.imageGallery || [],
        inStock: product.inStock === true,
        stockQuantity: product.stockQuantity || 0,
        featured: product.featured === true,
        nutritionFacts: product.nutritionFacts || "",
        cookingInstructions: product.cookingInstructions || "",
        rating: product.rating || "",
        reviewCount: product.reviewCount || 0,
        weightOptions: product.weightOptions || [],
        slug: product.slug || "",
        reviews: product.reviews || "[]",
        weightPrices: product.weightPrices || "",
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = () => {
    const newReview: ReviewItem = {
      id: Date.now().toString(),
      name: "",
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      rating: 5,
      comment: "",
      helpfulCount: 0
    };
    setEditingReview(newReview);
    setEditReviewIndex(-1);
  };
  
  const handleEditReview = (review: ReviewItem, index: number) => {
    setEditingReview({ ...review });
    setEditReviewIndex(index);
  };
  
  const handleDeleteReview = (index: number) => {
    const updatedReviews = [...reviews];
    updatedReviews.splice(index, 1);
    setReviews(updatedReviews);
  };
  
  const handleSaveReview = () => {
    if (!editingReview) return;
    
    const updatedReviews = [...reviews];
    if (editReviewIndex >= 0) {
      // Update existing review
      updatedReviews[editReviewIndex] = editingReview;
    } else {
      // Add new review
      updatedReviews.push(editingReview);
    }
    
    setReviews(updatedReviews);
    setEditingReview(null);
    setEditReviewIndex(-1);
  };
  
  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditReviewIndex(-1);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setSubmitting(true);
    try {
      // Ensure imageGallery is an array with at least the main image
      if (!data.imageGallery || !data.imageGallery.length) {
        data.imageGallery = [data.imageUrl];
      }
      
      // Generate slug from product name if not editing an existing product
      if (!isEditMode) {
        // Generate a slug from the product name (convert to lowercase, replace spaces with hyphens)
        const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        data = { ...data, slug };
      }
      
      // Calculate the actual review count based on the reviews array
      let actualReviewCount = 0;
      if (data.reviews) {
        try {
          const reviewsArray = JSON.parse(data.reviews);
          if (Array.isArray(reviewsArray)) {
            actualReviewCount = reviewsArray.length;
          }
        } catch (e) {
          console.error("Error parsing reviews:", e);
        }
      }
      
      // Update the reviewCount to match the actual number of reviews
      data = { ...data, reviewCount: actualReviewCount };
      
      // Ensure weight prices are properly added to form data
      if (weightPrices.length > 0) {
        // Convert weightPrices array to JSON string if not already converted
        if (!data.weightPrices || data.weightPrices === "") {
          console.log("Weight prices not found in form data, adding from state");
          const pricesObj: Record<string, string> = {};
          weightPrices.forEach(item => {
            pricesObj[item.weight] = item.price;
          });
          data = { ...data, weightPrices: JSON.stringify(pricesObj) };
        } else {
          console.log("Using already saved weight prices from form:", data.weightPrices);
        }
      } else if (data.weightOptions && data.weightOptions.length > 0) {
        // If we have weight options but no prices, create default prices
        console.log("Creating default weight prices for weight options");
        const pricesObj: Record<string, string> = {};
        data.weightOptions.forEach(option => {
          pricesObj[option] = data.price || "0";
        });
        data = { ...data, weightPrices: JSON.stringify(pricesObj) };
      }

      const url = isEditMode
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      
      const method = isEditMode ? "PUT" : "POST";
      
      console.log("Submitting product data:", data);
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      console.log("Response:", response.status, responseData);
      
      if (!response.ok) {
        let errorMessage = `Failed to ${isEditMode ? "update" : "create"} product`;
        if (responseData && responseData.error) {
          errorMessage += `: ${responseData.error}`;
        } else if (responseData && responseData.message) {
          errorMessage += `: ${responseData.message}`;
        }
        throw new Error(errorMessage);
      }
      
      const savedProduct = responseData;
      
      toast({
        title: "Success",
        description: `Product ${isEditMode ? "updated" : "created"} successfully!`,
      });
      
      // Navigate back to dashboard
      navigate("/admin");
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} product:`, error);
      let errorMessage = `Failed to ${isEditMode ? "update" : "create"} product.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  const categories = [
    { value: "organic", label: "Organic" },
    { value: "mixed", label: "Mixed" },
    { value: "specialty", label: "Specialty" },
    { value: "flour", label: "Flour" },
    { value: "other", label: "Other" },
  ];

  return (
    <Layout>
      <motion.div 
        className="container mx-auto py-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-green-800">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Product Details" : "Enter Product Details"}</CardTitle>
            <CardDescription>
              Fill out the form below to {isEditMode ? "update the" : "create a new"} product.
              Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information Section */}
                  {/* Rest of form content */}
                  
                  {/* Weight Prices Section */}
                  <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Weight-Specific Pricing</h2>
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <Label htmlFor="weightOption">Weight Option</Label>
                            <div className="flex mt-1">
                              <Input 
                                id="weightOption" 
                                placeholder="e.g., 250g, 500g, 1kg"
                                className="rounded-r-none"
                                value={form.watch("newWeightOption") || ""}
                                onChange={(e) => form.setValue("newWeightOption", e.target.value)}
                              />
                              <Button 
                                type="button" 
                                className="rounded-l-none"
                                onClick={() => {
                                  const newOption = form.watch("newWeightOption");
                                  if (newOption && newOption.trim()) {
                                    const currentOptions = form.watch("weightOptions") || [];
                                    if (!currentOptions.includes(newOption)) {
                                      form.setValue("weightOptions", [...currentOptions, newOption]);
                                      form.setValue("newWeightOption", "");
                                    } else {
                                      toast({
                                        title: "Weight option already exists",
                                        description: `The weight option "${newOption}" already exists.`,
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Weight Options</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {form.watch("weightOptions")?.map((option: string, index: number) => (
                              <div 
                                key={index}
                                className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-1"
                              >
                                <Weight className="h-4 w-4 mr-2 text-gray-500" />
                                <span>{option}</span>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 ml-1 p-0"
                                  onClick={() => {
                                    const currentOptions = form.watch("weightOptions") || [];
                                    form.setValue(
                                      "weightOptions", 
                                      currentOptions.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {(!form.watch("weightOptions") || form.watch("weightOptions").length === 0) && (
                              <div className="text-sm text-gray-500 italic">
                                No weight options added yet. Add some above.
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Weight prices form */}
                        <div className="mt-6">
                          <Label>Set Prices for Each Weight</Label>
                          {form.watch("weightOptions")?.length > 0 ? (
                            <div className="bg-white p-4 border border-gray-200 rounded-md mt-2">
                              <p className="text-sm text-gray-600 mb-4">
                                Enter the price for each weight option. Leave blank to use the default price.
                              </p>
                              <div className="space-y-3">
                                {form.watch("weightOptions")?.map((option: string, index: number) => {
                                  // Find the price for this weight option if it exists
                                  const weightPrice = weightPrices.find(wp => wp.weight === option);
                                  return (
                                    <div key={index} className="flex items-center gap-4">
                                      <div className="w-1/3">
                                        <div className="flex items-center">
                                          <Weight className="h-4 w-4 mr-2 text-gray-500" />
                                          <span>{option}</span>
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                          <Input
                                            placeholder="Price for this weight"
                                            className="pl-8"
                                            value={weightPrice?.price || ""}
                                            onChange={(e) => {
                                              const updatedPrices = [...weightPrices];
                                              const existingIndex = updatedPrices.findIndex(wp => wp.weight === option);
                                              
                                              if (existingIndex >= 0) {
                                                updatedPrices[existingIndex].price = e.target.value;
                                              } else {
                                                updatedPrices.push({
                                                  weight: option,
                                                  price: e.target.value
                                                });
                                              }
                                              
                                              setWeightPrices(updatedPrices);
                                              // Reset saved status when changes are made
                                              setWeightPricesSaved(false);
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="p-4 mt-2 border border-green-200 bg-green-50 rounded-md">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-green-700 font-medium mb-2">Save Your Weight Prices</h4>
                                    <p className="text-sm text-green-600 mb-4">
                                      You've set up weight-specific prices. Simply click the 
                                      <span className="font-semibold"> "Save Weight Prices" </span> 
                                      button below to save them directly to the database.
                                    </p>
                                    <p className="text-sm text-green-600 mb-4">
                                      <CheckCircle2 className="inline-block h-4 w-4 mr-1" /> 
                                      No need to click "Update Product" afterward - your changes will be saved immediately!
                                    </p>
                                  </div>
                                  
                                  {weightPricesSaved && (
                                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md flex items-center">
                                      <Check className="h-4 w-4 mr-2" />
                                      <span className="text-sm font-medium">Prices saved to form</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Using a div with onClick instead of a button to avoid form submission issues */}
                                <div className="flex justify-end">
                                  <div
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors 
                                      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none 
                                      disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 
                                      bg-green-700 hover:bg-green-600 text-white cursor-pointer"
                                    onClick={async () => {
                                      // Save weight prices directly to the database via API
                                      if (weightPrices.length > 0 && productId) {
                                        try {
                                          // Convert to object format
                                          const pricesObj: Record<string, string> = {};
                                          weightPrices.forEach(item => {
                                            pricesObj[item.weight] = item.price;
                                          });
                                          
                                          // Convert to JSON string for the API
                                          const weightPricesJson = JSON.stringify(pricesObj);
                                          
                                          // Save to form state first (as backup)
                                          form.setValue("weightPrices", weightPricesJson);
                                          
                                          // Set loading state
                                          setSubmitting(true);
                                          
                                          // Save directly to database
                                          const response = await fetch(`/api/admin/products/${productId}/weight-prices`, {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                              "x-admin-key": "admin-secret",
                                            },
                                            body: JSON.stringify({ weightPrices: weightPricesJson }),
                                          });
                                          
                                          if (!response.ok) {
                                            const result = await response.json();
                                            throw new Error(result.message || "Failed to save weight prices");
                                          }
                                          
                                          // Set saved state to true to show visual indicator
                                          setWeightPricesSaved(true);
                                          
                                          // Show success message
                                          toast({
                                            title: "Weight prices saved successfully",
                                            description: "Prices have been saved directly to the database."
                                          });
                                          
                                          console.log("Weight prices saved to database:", pricesObj);
                                        } catch (error) {
                                          console.error("Error saving weight prices:", error);
                                          toast({
                                            title: "Error saving prices",
                                            description: error instanceof Error ? error.message : "Something went wrong while saving prices.",
                                            variant: "destructive"
                                          });
                                        } finally {
                                          setSubmitting(false);
                                        }
                                      }
                                    }}
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Weight Prices
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              Add weight options above, then click "Update Prices" to set prices for each weight.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" type="button" asChild>
                    <Link href="/admin">Cancel</Link>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="min-w-[120px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      isEditMode ? "Update Product" : "Create Product"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}