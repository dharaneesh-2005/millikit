# Vercel Deployment Guide for Millikit E-Commerce

This guide provides step-by-step instructions for deploying the Millikit E-Commerce application to Vercel.

## Prerequisites

1. [Vercel account](https://vercel.com/signup)
2. [GitHub repository](https://github.com/) with your code
3. [Vercel CLI](https://vercel.com/docs/cli) (optional, but recommended)

## Step 1: Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository including the Vercel configuration file:
- `vercel.json`
- `api/index.ts` (serverless function for API routes)

## Step 2: Connect Your Project to Vercel

### Option A: Using the Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click "Deploy"

### Option B: Using the Vercel CLI

1. Install the Vercel CLI if you haven't already:
   ```bash
   npm i -g vercel
   ```

2. Login to your Vercel account:
   ```bash
   vercel login
   ```

3. Deploy your application from your project directory:
   ```bash
   vercel
   ```

4. Follow the interactive prompts to configure your deployment

## Step 3: Configure Environment Variables (if needed)

If your application uses environment variables:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add your environment variables
4. Click "Save"

## Step 4: Set Up Custom Domain (Optional)

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Step 5: Monitor Your Deployment

1. Go to your project in the Vercel dashboard
2. Navigate to "Deployments" to see all deployments
3. Click on a deployment to view logs and details
4. Access your application at the provided URL

## Troubleshooting

### Build Failures

If your build fails:

1. Check the build logs in the Vercel dashboard
2. Verify that all dependencies are correctly specified in `package.json`
3. Make sure your build command is correct
4. Check for any environment variables that might be missing

### API Routes Not Working

If your API routes return 404 errors:

1. Check that your serverless function in `api/index.ts` is correctly set up
2. Verify that your Vercel configuration is correct
3. Make sure your frontend is making requests to the correct URL

### Static Assets Not Loading

If static assets (images, CSS, JavaScript) are not loading:

1. Check that they are correctly included in your build output
2. Verify that paths in your code are correct

## Maintenance and Updates

To update your application:

1. Push changes to your GitHub repository
2. Vercel will automatically rebuild and redeploy your application
3. You can view the deployment status in the Vercel dashboard

## Admin Access

Access the admin panel at `/admin/login` with:
- Username: `admin_millikit`
- Password: `the_millikit`

## Support

If you encounter issues with Vercel deployment, you can:

1. Check [Vercel documentation](https://vercel.com/docs)
2. Visit [Vercel Help](https://vercel.com/help)
3. Contact [Vercel Support](https://vercel.com/contact)