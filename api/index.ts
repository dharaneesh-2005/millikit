import { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Express, Request, Response, NextFunction } from 'express';
import { setupAuth } from '../server/auth';
import { registerRoutes } from '../server/routes';
import { Server } from 'http';
import dotenv from 'dotenv';
import cookie from 'cookie-parser';
import session from 'express-session';
import { initializeDatabase } from '../server/db';
import { PostgreSQLStorage } from '../server/postgresql';
import { setStorage } from '../server/storage';

// Load environment variables
dotenv.config();

// Configure session store based on environment
let sessionOptions: session.SessionOptions;
const sessionSecret = process.env.SESSION_SECRET || 'millikit-secret';

// Database connection
let db: { client: any; db: any } | null = null;
let storage: PostgreSQLStorage | null = null;

// Create and configure Express app
const app = express();

// Common middleware
app.use(express.json());
app.use(cookie());

// Initialize session middleware
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'An unexpected error occurred',
  });
});

// Initialize database connection before handling requests
const initializeServerComponents = async () => {
  try {
    // Initialize database if needed
    if (!db || !storage) {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      console.log('Initializing database connection...');
      db = await initializeDatabase(databaseUrl);
      
      // Create the storage adapter
      storage = new PostgreSQLStorage(databaseUrl);
      setStorage(storage);
      
      // Setup authentication
      setupAuth(app);
      
      // Register API routes
      await registerRoutes(app);
      
      console.log('Server components initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize server components:', error);
    throw error;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize server components if needed
  try {
    await initializeServerComponents();
  } catch (error) {
    console.error('Failed to initialize server in serverless function:', error);
    // Continue and let the error handling middleware handle the error
  }
  
  // Forward the request to Express
  return new Promise<void>((resolve, reject) => {
    try {
      app(req, res);
      res.on('finish', () => resolve());
      res.on('error', reject);
    } catch (error) {
      console.error('Vercel serverless function: Error handling request:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      resolve();
    }
  });
}