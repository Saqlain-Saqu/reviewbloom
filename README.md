# 🌸 ReviewBloom — Multi-Language Shopify Review App

## Features
- ✅ English, Urdu, Hindi reviews
- ✅ Auto email after order
- ✅ Admin dashboard
- ✅ Widget for product pages
- ✅ PostgreSQL database
- ✅ Railway deployment ready

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env file
```bash
cp .env.example .env
```
Fill in your credentials.

### 3. Railway PostgreSQL
- Railway → New Service → PostgreSQL
- Copy DATABASE_URL to .env

### 4. Deploy to Railway
```bash
git init
git add .
git commit -m "ReviewBloom initial"
git push
```
Connect GitHub repo to Railway.

### 5. Railway Variables
Add all .env variables to Railway Variables tab.

### 6. Shopify Partners
- App URL: https://your-app.railway.app/auth/install
- Redirect URL: https://your-app.railway.app/auth/callback
- Scopes: read_products,write_products,read_orders,write_script_tags

### 7. Install Widget on Store
Add to product.liquid:
```html
<div data-reviewbloom data-product-id="{{ product.id }}"></div>
```
