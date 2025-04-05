import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct, type ProductReview,
  cartItems, type CartItem, type InsertCartItem,
  contacts, type Contact, type InsertContact
} from "@shared/schema";
import { IStorage } from "./storage";
import { verifyToken } from './otpUtils';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, like, ilike, desc, and, or, count, max, asc } from 'drizzle-orm';
import postgres from 'postgres';
import { PgTable } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL implementation of the storage interface
 * Uses Drizzle ORM to interact with the database
 */
export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private client: ReturnType<typeof postgres>;

  constructor(connectionString: string) {
    console.log('Connecting to PostgreSQL database...');
    // Create a Postgres client with native SSL support
    this.client = postgres(connectionString, { ssl: 'require' });
    // Initialize Drizzle with the client
    this.db = drizzle(this.client);
  }

  // Helper function to ensure reviews are properly serialized/deserialized
  private parseReviews(reviewsStr: string | null): ProductReview[] {
    if (!reviewsStr) return [];
    try {
      return JSON.parse(reviewsStr) as ProductReview[];
    } catch (error) {
      console.error('Error parsing reviews:', error);
      return [];
    }
  }

  // Helper function to stringify reviews for storage
  private stringifyReviews(reviews: ProductReview[]): string {
    return JSON.stringify(reviews);
  }

  /** 
   * User Operations
   */
  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.username, username));
    return results.length > 0 ? results[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = await this.db.insert(users).values(user).returning();
    return newUser[0];
  }

  async isAdmin(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.isAdmin || false;
  }

  async enableOtp(userId: number, secret: string): Promise<User | undefined> {
    const updated = await this.db
      .update(users)
      .set({ otpSecret: secret, otpEnabled: true })
      .where(eq(users.id, userId))
      .returning();
    
    return updated.length > 0 ? updated[0] : undefined;
  }

  async verifyOtp(userId: number, token: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.otpEnabled || !user.otpSecret) {
      return false;
    }
    
    return verifyToken(token, user.otpSecret);
  }

  /** 
   * Product Operations
   */
  async getProducts(): Promise<Product[]> {
    const results = await this.db.select().from(products);
    return results;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const results = await this.db.select().from(products).where(eq(products.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const results = await this.db.select().from(products).where(eq(products.slug, slug));
    return results.length > 0 ? results[0] : undefined;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await this.db.select().from(products).where(eq(products.category, category));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await this.db.select().from(products).where(eq(products.featured, true));
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!query) {
      return this.getProducts();
    }
    
    // Search in name, description, and category
    return await this.db.select().from(products).where(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.description, `%${query}%`), 
        ilike(products.category, `%${query}%`)
      )
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct = await this.db.insert(products).values(product).returning();
    return newProduct[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const updated = await this.db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    
    return updated.length > 0 ? updated[0] : undefined;
  }

  async deleteProduct(id: number): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  /** 
   * Cart Operations
   */
  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return await this.db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async getCartItemWithProduct(sessionId: string, productId: number): Promise<CartItem | undefined> {
    const results = await this.db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.sessionId, sessionId),
          eq(cartItems.productId, productId)
        )
      );
    
    return results.length > 0 ? results[0] : undefined;
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const newCartItem = await this.db.insert(cartItems).values(cartItem).returning();
    return newCartItem[0];
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const updated = await this.db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    
    return updated.length > 0 ? updated[0] : undefined;
  }

  async removeFromCart(id: number): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  /** 
   * Contact Operations
   */
  async createContact(contact: InsertContact): Promise<Contact> {
    const newContact = await this.db.insert(contacts).values(contact).returning();
    return newContact[0];
  }

  async getContacts(): Promise<Contact[]> {
    return await this.db.select().from(contacts);
  }
}