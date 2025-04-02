import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertContactSchema, insertProductSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { z } from "zod";

// Admin middleware to check if the user has admin privileges
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // For simplicity, we're using a header to indicate admin status
  // In a real application, this would check for a logged-in user with admin role
  const adminKey = req.headers["x-admin-key"];
  
  if (!adminKey || adminKey !== "admin-secret") {
    return res.status(403).json({ message: "Unauthorized access" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // API routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching featured products" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products by category" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error searching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.get("/api/products/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const product = await storage.getProductBySlug(slug);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  // Cart management
  app.get("/api/cart", async (req, res) => {
    try {
      let sessionId = req.headers["session-id"] as string;
      
      if (!sessionId) {
        sessionId = nanoid();
        res.setHeader("session-id", sessionId);
      }
      
      const cartItems = await storage.getCartItems(sessionId);
      
      // Get product details for each cart item
      const cartWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProductById(item.productId);
          return {
            ...item,
            product,
          };
        })
      );
      
      res.json(cartWithProducts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      let sessionId = req.headers["session-id"] as string;
      
      if (!sessionId) {
        sessionId = nanoid();
        res.setHeader("session-id", sessionId);
      }
      
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        sessionId,
      });
      
      const existingItem = await storage.getCartItemWithProduct(
        sessionId,
        validatedData.productId
      );
      
      if (existingItem) {
        // Update quantity if item already exists
        const updatedItem = await storage.updateCartItem(
          existingItem.id,
          existingItem.quantity + (validatedData.quantity || 1)
        );
        return res.json(updatedItem);
      }
      
      const newCartItem = await storage.addToCart(validatedData);
      res.status(201).json(newCartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error adding item to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const { quantity } = req.body;
      if (typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const updatedItem = await storage.updateCartItem(id, quantity);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error removing item from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const sessionId = req.headers["session-id"] as string;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      await storage.clearCart(sessionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error clearing cart" });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error submitting contact form" });
    }
  });

  // Admin Routes
  
  // Admin Product Management
  app.post("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.put("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error updating product" });
    }
  });

  app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Admin Contact Management
  app.get("/api/admin/contacts", isAdmin, async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contacts" });
    }
  });

  return httpServer;
}
