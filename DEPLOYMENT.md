# Quick Deployment Guide

## Option 1: Vercel (Easiest - Recommended)

### Method A: Using Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to your project
cd portfolio

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? toby-portfolio (or your choice)
# - Directory? ./
# - Override settings? No
```

Your site will be live at: `https://your-project.vercel.app`

### Method B: Using Vercel Website (No CLI needed)
1. Go to https://vercel.com
2. Sign up with GitHub/GitLab/Bitbucket
3. Click "New Project"
4. Import your portfolio folder
5. Click "Deploy"

Done! Your site is live.

---

## Option 2: Netlify

### Method A: Netlify Drop (Super Easy)
```bash
# Build the project
npm run build

# Go to https://app.netlify.com/drop
# Drag and drop the 'build' folder
```

### Method B: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod

# Follow prompts and select the 'build' folder when asked
```

---

## Option 3: GitHub Pages (Free)

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to package.json:
```json
"homepage": "https://yourusername.github.io/portfolio",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

3. Deploy:
```bash
npm run deploy
```

---

## Adding Custom Domain

### For Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### For Netlify:
1. Go to Site settings > Domain management
2. Add custom domain
3. Update DNS records

---

## Environment Variables (for Weather API)

### Vercel:
1. Go to project settings
2. Click "Environment Variables"
3. Add: `REACT_APP_WEATHER_API_KEY` = your-api-key

### Netlify:
1. Site settings > Build & deploy > Environment
2. Add: `REACT_APP_WEATHER_API_KEY` = your-api-key

Then update App.jsx to use:
```javascript
const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
```

---

## Troubleshooting

### Build fails?
- Make sure you ran `npm install`
- Check Node version: `node -v` (should be v14+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Images not showing?
- Make sure images are in the `public` folder
- Use paths like `/images/photo.jpg` (with leading slash)

### Weather not working?
- Get API key from https://openweathermap.org/api
- Replace YOUR_API_KEY in App.jsx
- Or set up environment variable (see above)
