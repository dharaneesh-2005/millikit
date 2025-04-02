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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
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
  Leaf
} from "lucide-react";
import { insertProductSchema, type Product } from "@shared/schema";
import { z } from "zod";

// The admin key - in a real app, this would be retrieved securely
const ADMIN_KEY = "admin-secret";

// Extended schema with validation
const productFormSchema = insertProductSchema.extend({
  // Make optional fields required for the form
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  imageUrl: z.string().url("Please enter a valid image URL"),
  // Add validation to existing fields
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductForm() {
  const [_, navigate] = useLocation();
  const [__, params] = useRoute<{ id: string }>("/admin/products/:id");
  const isEditMode = params?.id && params.id !== "new";
  const productId = isEditMode ? parseInt(params?.id || "0") : null;
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

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
    },
  });

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

  const onSubmit = async (data: ProductFormValues) => {
    setSubmitting(true);
    try {
      // Ensure imageGallery is an array with at least the main image
      if (!data.imageGallery || !data.imageGallery.length) {
        data.imageGallery = [data.imageUrl];
      }

      const url = isEditMode
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error(`Failed to ${isEditMode ? "update" : "create"} product`);
      
      const savedProduct = await response.json();
      
      toast({
        title: "Success",
        description: `Product ${isEditMode ? "updated" : "created"} successfully!`,
      });
      
      // Navigate back to dashboard
      navigate("/admin");
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} product:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} product. Please try again.`,
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
                  <div className="space-y-6 md:col-span-2">
                    <h2 className="text-xl font-semibold">Basic Information</h2>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Organic Foxtail Millet" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description *</FormLabel>
                          <FormControl>
                            <Input placeholder="A brief description for product listings" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be shown in product cards and listings.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed product description with key features and benefits" 
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Pricing Section */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Pricing</h2>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹) *</FormLabel>
                          <FormControl>
                            <Input placeholder="299" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="comparePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare at Price (₹)</FormLabel>
                          <FormControl>
                            <Input placeholder="350" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Original price for showing discounts. Leave empty if not on sale.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="badge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Badge Text</FormLabel>
                          <FormControl>
                            <Input placeholder="New / Organic / Sale" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Optional badge to display on the product (e.g., "New", "Sale", "Organic")
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Categorization and Visibility */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Categorization & Visibility</h2>
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Featured Product</FormLabel>
                            <FormDescription>
                              Display this product on the homepage
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inStock"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>In Stock</FormLabel>
                            <FormDescription>
                              Is this product currently available for purchase?
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="0" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              value={field.value || 0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Images */}
                  <div className="space-y-6 md:col-span-2">
                    <h2 className="text-xl font-semibold">Images</h2>
                    
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Image URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL to the main product image
                          </FormDescription>
                          <FormMessage />
                          {field.value && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-2">Image Preview:</p>
                              <div className="border rounded-md overflow-hidden w-32 h-32">
                                <img 
                                  src={field.value} 
                                  alt="Product preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/300x300?text=Invalid+Image+URL";
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Additional Information */}
                  <div className="space-y-6 md:col-span-2">
                    <h2 className="text-xl font-semibold">Additional Information</h2>
                    
                    <FormField
                      control={form.control}
                      name="nutritionFacts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nutrition Facts</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter nutrition information in JSON format or as text" 
                              className="min-h-24"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cookingInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cooking Instructions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Step-by-step preparation instructions" 
                              className="min-h-24"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Rating</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="4.5" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Product rating between 0-5 (e.g., 4.5)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reviewCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Reviews</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                placeholder="0" 
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                value={field.value || 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="weightOptions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight Options</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="250g, 500g, 1kg (comma separated)" 
                              {...field}
                              value={(field.value || []).join(", ")}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value.split(",").map(option => option.trim()).filter(Boolean));
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter comma-separated weight options (e.g., "250g, 500g, 1kg")
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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