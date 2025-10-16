# Deployment Guide

## Deploying to Vercel

### Prerequisites
- GitHub account (you already have this)
- Vercel account (free)
- Monday.com API token

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Step 2: Deploy from GitHub

1. In Vercel dashboard, click **"New Project"**
2. Import your GitHub repository:
   - Find `ChrisGelles/MondayFormFixer`
   - Click **"Import"**

3. Configure the project:
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)

### Step 3: Add Environment Variables

Before deploying, add these environment variables:

1. Click **"Environment Variables"** section
2. Add the following variables:

| Name | Value | Notes |
|------|-------|-------|
| `VITE_MONDAY_API_TOKEN` | `your_api_token_here` | Your Monday.com API token (required) |
| `VITE_SOURCE_BOARD_ID` | `10021032653` | Source board ID - Project Athena content (optional, defaults to 10021032653) |
| `VITE_DESTINATION_BOARD_ID` | `your_board_id` | Destination board ID where orders are created (optional, can set in UI) |

**To get your Monday API token:**
1. Log in to Monday.com
2. Click your profile picture (bottom left)
3. Select "Developers"
4. Click "My Access Tokens"
5. Copy your token or create a new one

3. Click **"Deploy"**

### Step 4: Wait for Deployment

- Vercel will build and deploy your app
- Takes about 1-2 minutes
- You'll get a URL like: `https://monday-form-fixer-xxx.vercel.app`

### Step 5: Test the Deployment

1. Visit your Vercel URL
2. The app should auto-connect (no login needed)
3. Configure destination board ID (if not set in env vars)
4. Test creating an order

### Step 6: Share with Team

**Option 1: Direct Link**
- Share the Vercel URL with colleagues
- They can bookmark it

**Option 2: Embed in SharePoint**
```html
<iframe 
  src="https://your-app.vercel.app" 
  width="100%" 
  height="1200px" 
  frameborder="0"
  style="border: none;"
></iframe>
```

### Step 7: Set Up Custom Domain (Optional)

If you have a custom domain like `cmnh.org`:

1. In Vercel project settings → **Domains**
2. Add domain: `athena-orders.cmnh.org`
3. Follow DNS configuration instructions
4. Wait for DNS to propagate (5-60 minutes)

## Automatic Updates

Once deployed, **any push to GitHub automatically updates Vercel**:

1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically rebuilds and deploys
4. New version live in 1-2 minutes

## Environment Variables

### Required
- `VITE_MONDAY_API_TOKEN` - Your Monday.com API token

### Optional
- `VITE_SOURCE_BOARD_ID` - Source board ID (defaults to `10021032653` if not set)
- `VITE_DESTINATION_BOARD_ID` - Destination board ID (can be set in UI if not provided)

### How Environment Variables Work

1. **In Vercel:** Set in dashboard → Project → Settings → Environment Variables
2. **Locally:** Create `.env.local` file (ignored by git):
   ```
   VITE_MONDAY_API_TOKEN=your_token_here
   VITE_SOURCE_BOARD_ID=10021032653
   VITE_DESTINATION_BOARD_ID=your_destination_board_id
   ```

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node version compatibility (18.x or higher)

### API Connection Fails
- Verify `VITE_MONDAY_API_TOKEN` is set correctly
- Check token has correct permissions in Monday.com

### Form Not Showing
- Ensure `VITE_DESTINATION_BOARD_ID` is set (or configure in UI)
- Check browser console for errors

## Security Notes

- API token stored in Vercel (secure)
- Token not visible in browser
- Users never see the actual API token
- All communication happens over HTTPS

