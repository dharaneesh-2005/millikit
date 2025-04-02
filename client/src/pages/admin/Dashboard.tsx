import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  ShoppingBag, 
  MessageSquare, 
  LayoutDashboard,
  Check,
  X
} from "lucide-react";
import type { Product, Contact } from "@shared/schema";

// The admin key - in a real app, this would be retrieved securely (e.g., from auth context)
const ADMIN_KEY = "admin-secret";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Fetch products when component mounts
    fetchProducts();
    fetchContacts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/admin/contacts", {
        headers: {
          "x-admin-key": ADMIN_KEY,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch contacts");
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contact messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": ADMIN_KEY,
        },
      });
      
      if (!response.ok) throw new Error("Failed to delete product");
      
      // Update UI by removing the deleted product
      setProducts(products.filter(product => product.id !== productId));
      
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      
      toast({
        title: "Success",
        description: "Product has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleProductFeatured = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({
          featured: !product.featured,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to update product");
      
      const updatedProduct = await response.json();
      
      // Update the product in the UI
      setProducts(products.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      ));
      
      toast({
        title: "Success",
        description: `Product has been ${updatedProduct.featured ? 'added to' : 'removed from'} featured products.`,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <motion.div 
        className="container mx-auto py-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <motion.h1 
            className="text-3xl font-bold text-green-800"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Admin Dashboard
          </motion.h1>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Button variant="outline" asChild>
              <Link href="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
              <TabsTrigger value="products" className="flex items-center">
                <ShoppingBag className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Contacts</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Products Management</CardTitle>
                  <CardDescription>
                    Manage your products, update details, and control visibility.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>A list of all products in your store.</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Featured</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="w-16 h-16 object-cover rounded"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>₹{product.price}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell>
                                <Button 
                                  variant={product.featured ? "default" : "outline"} 
                                  size="icon"
                                  onClick={() => toggleProductFeatured(product)}
                                >
                                  {product.featured ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="icon" asChild>
                                  <Link href={`/admin/products/${product.id}`}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Link>
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Messages</CardTitle>
                  <CardDescription>
                    View and manage customer inquiries and messages.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No contact messages found.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {contacts.map((contact) => (
                        <Card key={contact.id}>
                          <CardHeader>
                            <div className="flex justify-between">
                              <div>
                                <CardTitle>{contact.name}</CardTitle>
                                <CardDescription>{contact.email}</CardDescription>
                              </div>
                              <div className="text-sm text-gray-500">
                                {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : ''}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="whitespace-pre-line">{contact.message}</p>
                          </CardContent>
                          <CardFooter className="flex justify-end">
                            <Button variant="outline" asChild>
                              <a href={`mailto:${contact.email}`}>Reply</a>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Store Statistics</CardTitle>
                  <CardDescription>
                    View key metrics and performance indicators.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Products</CardDescription>
                        <CardTitle className="text-3xl">{products.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Featured Products</CardDescription>
                        <CardTitle className="text-3xl">
                          {products.filter(p => p.featured).length}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Contact Messages</CardDescription>
                        <CardTitle className="text-3xl">{contacts.length}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{selectedProduct?.name}" from your store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedProduct && deleteProduct(selectedProduct.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}