import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertContactSchema, insertProductSchema, insertUserSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { z } from "zod";
import { generateSecret, generateQrCode, verifyToken } from "./otpUtils";
import { setupAuth } from "./auth";

// Session storage for admin authentication
interface AdminSession {
  userId: number;
  username: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const adminSessions = new Map<string, AdminSession>();

// Admin middleware to check if the user has admin privileges
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers["admin-session-id"] as string;
  
  if (!sessionId || !adminSessions.has(sessionId)) {
    return res.status(403).json({ 
      success: false,
      message: "Unauthorized access" 
    });
  }
  
  const session = adminSessions.get(sessionId)!;
  
  if (!session.isAuthenticated || !session.isAdmin) {
    return res.status(403).json({ 
      success: false,
      message: "Unauthorized access" 
    });
  }
  
  // Add the admin user data to the request
  (req as any).adminUser = {
    userId: session.userId,
    username: session.username
  };
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Admin authentication routes handled below
  
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

  // Admin Authentication Routes
  
  // Admin Login - Only allows the predefined admin user (simplified without OTP)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false,
          message: "Username and password are required" 
        });
      }
      
      // Only allow the admin user to log in
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.id !== 1) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid username or password" 
        });
      }
      
      // In a real app, you would properly hash and compare passwords
      // This is a simplified version for demonstration
      if (user.password !== password) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid username or password" 
        });
      }
      
      // Create session directly without OTP
      const sessionId = nanoid();
      const isUserAdmin = await storage.isAdmin(user.id);
      
      adminSessions.set(sessionId, {
        userId: user.id,
        username: user.username,
        isAdmin: isUserAdmin,
        isAuthenticated: true
      });
      
      res.status(200).json({
        success: true,
        sessionId,
        userId: user.id,
        username: user.username
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred during login" 
      });
    }
  });
  
  // Admin OTP Verification
  app.post("/api/admin/verify-otp", async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      if (!userId || !token) {
        return res.status(400).json({ 
          success: false,
          message: "User ID and token are required" 
        });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }
      
      const isValid = await storage.verifyOtp(userId, token);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid OTP code" 
        });
      }
      
      // Create session if OTP is valid
      const sessionId = nanoid();
      const isUserAdmin = await storage.isAdmin(user.id);
      
      adminSessions.set(sessionId, {
        userId: user.id,
        username: user.username,
        isAdmin: isUserAdmin,
        isAuthenticated: true
      });
      
      res.status(200).json({
        success: true,
        sessionId,
        userId: user.id,
        username: user.username
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred during verification" 
      });
    }
  });
  
  // Admin Registration - Disabled, only predefined admin allowed
  app.post("/api/admin/register", async (req, res) => {
    // Return error since registration is disabled
    return res.status(403).json({ 
      success: false,
      message: "Registration is disabled. Please use the predefined admin credentials." 
    });
  });
  
  // Admin OTP Setup - only works for predefined admin user
  app.post("/api/admin/setup-otp", async (req, res) => {
    try {
      const { username, password, currentOtpToken } = req.body;
      
      // Check if username is admin
      if (username !== "admin") {
        return res.status(401).json({
          success: false,
          message: "Only the admin user can set up 2FA"
        });
      }
      
      // Get the admin user (only works for the predefined admin user with ID 1)
      const user = await storage.getUser(1); // Use ID 1 which is our predefined admin
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "Admin user not found" 
        });
      }
      
      // Verify password
      if (password !== "millikit2023") {
        return res.status(401).json({
          success: false,
          message: "Invalid admin credentials"
        });
      }
      
      // Check if user already has OTP enabled
      if (user.otpEnabled && user.otpSecret) {
        // If user already has OTP enabled, we need to verify the current OTP token
        // before allowing to generate a new one
        if (!currentOtpToken) {
          return res.status(400).json({
            success: false,
            message: "Current OTP token required to regenerate 2FA",
            needsCurrentOtp: true,
            userId: user.id
          });
        }
        
        // Verify the current OTP token
        const isValidToken = await storage.verifyOtp(user.id, currentOtpToken);
        
        if (!isValidToken) {
          return res.status(400).json({
            success: false,
            message: "Current OTP token required to regenerate 2FA",
            needsCurrentOtp: true,
            userId: user.id
          });
        }
      }
      
      // Generate OTP secret for user
      const secret = generateSecret(user.username);
      
      // Generate QR code for Google Authenticator
      const qrCodeUrl = await generateQrCode(user.username, secret);
      
      // If OTP is already enabled, warn in the response but still allow regenerating
      const alreadyEnabled = user.otpEnabled;
      
      res.status(200).json({
        success: true,
        userId: user.id, // Return the actual user ID
        secret,
        qrCodeUrl,
        alreadyEnabled: alreadyEnabled
      });
    } catch (error) {
      console.error('OTP setup error:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred during OTP setup" 
      });
    }
  });
  
  // Admin OTP Verification after setup
  app.post("/api/admin/verify-setup", async (req, res) => {
    try {
      const { userId, token, secret } = req.body;
      
      if (!userId || !token || !secret) {
        return res.status(400).json({ 
          success: false,
          message: "User ID, token, and secret are required" 
        });
      }
      
      // Verify token manually since the secret isn't yet saved
      const isValid = verifyToken(token, secret);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid OTP code" 
        });
      }
      
      // Enable OTP for the user and save the secret
      const updatedUser = await storage.enableOtp(userId, secret);
      
      if (!updatedUser) {
        return res.status(500).json({ 
          success: false,
          message: "Failed to enable OTP for user" 
        });
      }
      
      res.status(200).json({
        success: true,
        userId: updatedUser.id,
        otpEnabled: true
      });
    } catch (error) {
      console.error('Setup verification error:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred during verification" 
      });
    }
  });
  
  // Admin Logout
  app.post("/api/admin/logout", async (req, res) => {
    try {
      const sessionId = req.headers["admin-session-id"] as string;
      
      if (sessionId && adminSessions.has(sessionId)) {
        adminSessions.delete(sessionId);
      }
      
      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred during logout" 
      });
    }
  });
  
  // Admin Session Check
  app.get("/api/admin/session", async (req, res) => {
    try {
      const sessionId = req.headers["admin-session-id"] as string;
      
      if (!sessionId || !adminSessions.has(sessionId)) {
        return res.status(401).json({ 
          success: false,
          authenticated: false 
        });
      }
      
      const session = adminSessions.get(sessionId)!;
      
      res.status(200).json({
        success: true,
        authenticated: session.isAuthenticated,
        isAdmin: session.isAdmin,
        userId: session.userId,
        username: session.username
      });
    } catch (error) {
      console.error('Session check error:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred during session check" 
      });
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
