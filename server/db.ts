import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { users, products, cartItems, contacts } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Mock product data to populate database with initial data
import { sampleProducts } from './sampleData';

/**
 * Initialize the database connection and run migrations
 */
export async function initializeDatabase(url: string) {
  console.log('Initializing database connection...');
  try {
    // Create a postgres client for migrations
    const migrationClient = postgres(url, { ssl: 'require' });
    // Create a drizzle instance for migrations
    const migrationDb = drizzle(migrationClient);
    
    // Create necessary tables if they don't exist
    await migrationDb.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        otp_secret TEXT,
        otp_enabled BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        short_description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        compare_price DECIMAL(10, 2),
        badge TEXT,
        category TEXT NOT NULL,
        image_url TEXT NOT NULL,
        image_gallery TEXT[],
        in_stock BOOLEAN DEFAULT TRUE,
        stock_quantity INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE,
        nutrition_facts TEXT,
        cooking_instructions TEXT,
        rating DECIMAL(3, 2),
        review_count INTEGER DEFAULT 0,
        weight_options TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        reviews TEXT
      );
      
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id TEXT,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create a client for data operations
    const client = postgres(url, { ssl: 'require' });
    const db = drizzle(client);
    
    // Create admin user if it doesn't exist
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin_millikit'));
    
    if (adminUser.length === 0) {
      console.log('Creating admin user...');
      await db.insert(users).values({
        username: 'admin_millikit',
        password: 'the_millikit', // In production, use a properly hashed password
        name: 'Admin',
        isAdmin: true,
      });
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if we need to insert sample products
    const existingProducts = await db.select().from(products);
    
    if (existingProducts.length === 0) {
      console.log('Populating products table with sample data...');
      
      // Insert products in batches to avoid overwhelming the database
      for (const product of sampleProducts) {
        await db.insert(products).values(product);
      }
      
      console.log(`Added ${sampleProducts.length} sample products`);
    } else {
      console.log(`Database already has ${existingProducts.length} products`);
    }
    
    // Close the migration client
    await migrationClient.end();
    
    console.log('Database initialization complete');
    return { client, db };
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}