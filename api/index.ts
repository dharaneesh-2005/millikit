import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { initializeDatabase } from '../server/db';

// Create Express app instance
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Setup logging middleware
app.use((req, res, next) => {
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  next();
});

// Initialize server and routes
let serverInstance: any;

// This is a handler for Vercel serverless functions
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!serverInstance) {
    // Initialize the database if DATABASE_URL is available
    if (process.env.DATABASE_URL) {
      try {
        console.log('Vercel serverless function: Initializing database');
        await initializeDatabase(process.env.DATABASE_URL);
        console.log('Vercel serverless function: Database initialized successfully');
      } catch (error) {
        console.error('Vercel serverless function: Error initializing database:', error);
      }
    } else {
      console.log('Vercel serverless function: No DATABASE_URL found, skipping database initialization');
    }
    
    // Only register routes once
    const server = createServer(app);
    await registerRoutes(app);
    serverInstance = server;
  }
  
  // Forward the request to Express
  return new Promise((resolve, reject) => {
    app(req, res);
    res.on('finish', resolve);
    res.on('error', reject);
  });
}