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
    
    // Return clear error for database connection issues
    return res.status(500).json({ 
      error: 'Database Connection Error',
      message: 'Could not connect to the database. Make sure DATABASE_URL environment variable is set correctly.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Add health check endpoint for easier debugging
  if (req.url === '/api/health') {
    return res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      dbInitialized: !!db,
      dbConnected: !!storage,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasPgHost: !!process.env.PGHOST,
        hasPgUser: !!process.env.PGUSER,
        hasPgPassword: !!process.env.PGPASSWORD,
        hasPgDatabase: !!process.env.PGDATABASE,
        hasPgPort: !!process.env.PGPORT,
        hasAdminKey: !!process.env.ADMIN_KEY
      }
    });
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