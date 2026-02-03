# Product Landing Page System - Future Implementation Plan

## Overview
System to link custom landing pages to specific products, allowing rich marketing pages instead of basic product detail pages.

## Database Structure

### Products Table
```sql
-- Fields added in migration 091_products_landing_page_link.sql
has_landing_page BOOLEAN DEFAULT FALSE
landing_page_reference_url TEXT  -- URL of competitor/reference site for AI generation
```

### Landing Pages Table
```sql
-- Field added in migration 091_products_landing_page_link.sql
product_id UUID REFERENCES products(id) -- NULL = business unit landing, NOT NULL = product landing
```

## How It Works

### 1. Product Creation Flow
1. Admin creates product in Product Catalog Manager
2. At bottom: **"Landing Page (Optional)"** section
3. Checkbox: ✅ "Create a dedicated marketing landing page for this product"
4. If checked:
   - Enter reference URL (competitor site)
   - Click "Generate" - AI creates landing page content
   - System saves `has_landing_page = true` on product

### 2. Landing Page Editor
- Located in Knowledge Base (Landing Page tab)
- Can create/edit landing pages
- Links to product_id when it's a product landing page
- Contains: hero banners, pricing tables, testimonials, FAQs, etc.

### 3. Shop/Browse Flow
**WITHOUT Landing Page:**
```
Shop → Product Card → Standard Product Detail Page → Add to Cart
```

**WITH Landing Page:**
```
Shop → Product Card → Custom Landing Page → Pricing Table → Add to Cart
```

### 4. Technical Implementation

#### A. Product Card Link
```typescript
// In src/app/livechat/shop/page.tsx
const productUrl = product.has_landing_page
  ? `/livechat?businessUnit=${businessUnit}&product=${product.id}`
  : `/products/${product.id}`
```

#### B. Landing Page Load
```typescript
// In src/app/livechat/page.tsx
const productId = searchParams.get('product')
if (productId) {
  // Load landing page for this specific product
  // landing_pages WHERE product_id = productId
} else {
  // Load general business unit landing page
  // landing_pages WHERE business_unit_id = X AND product_id IS NULL
}
```

#### C. Pricing Table Integration
```typescript
// Pricing table block connects to product variants
{
  type: 'pricing',
  data: {
    product_id: 'uuid-here',
    pricing_options: [
      { variant_id: 'uuid-1mth', title: '1 Month', price: 79, ... },
      { variant_id: 'uuid-3mth', title: '3 Months', price: 149, ... },
      { variant_id: 'uuid-6mth', title: '6 Months', price: 199, ... }
    ]
  }
}
```

#### D. Add to Cart Action
```typescript
// When "Buy Now" clicked
const addToCart = async (variantId: string) => {
  // Add variant to cart (localStorage or API)
  // Redirect to /livechat/checkout or show cart modal
}
```

## API Endpoints Needed

### 1. Save Product with Landing Page
```
POST /api/ecommerce/products
Body: {
  ...productData,
  has_landing_page: true,
  landing_page_reference_url: "https://competitor.com"
}
```

### 2. Generate Landing Page
```
POST /api/ecommerce/generate-landing-page
Body: {
  referenceUrl: "https://competitor.com",
  productName: "Product Name",
  productId: "uuid"
}
Response: { landingPage: {...} }
```

### 3. Save Landing Page
```
POST /api/landing-page
Body: {
  product_id: "uuid",  // Link to product
  business_unit_id: "uuid",
  ...landingPageData
}
```

### 4. Load Landing Page
```
GET /api/landing-page?businessUnit=slug&product=uuid
Response: { landingPage: {...} }
```

## Database Queries

### Get Product with Landing Page Status
```sql
SELECT p.*,
  (SELECT COUNT(*) FROM landing_pages WHERE product_id = p.id) as has_landing_page_created
FROM products p
WHERE p.id = $1
```

### Get Landing Page for Product
```sql
SELECT * FROM landing_pages
WHERE product_id = $1
  AND business_unit_id = $2
  AND country = $3
  AND language_code = $4
```

### Get Products with Landing Pages
```sql
SELECT p.* FROM products p
WHERE p.has_landing_page = true
  AND EXISTS (SELECT 1 FROM landing_pages WHERE product_id = p.id)
```

## UI/UX Flow

### Product Form
```
[Product Details]
[Images]
[Pricing & Variants]
...
[Landing Page (Optional)]
  ☐ Create a dedicated marketing landing page for this product

  [Reference URL: ________________________] [Generate]

  [Preview of generated landing page]
```

### Shop Page
```
[Product Cards Grid]

Card with landing page:
- Badge: "Custom Page"
- Click → /livechat?product=uuid

Card without landing page:
- Click → /products/uuid (standard detail page)
```

### Landing Page
```
URL: /livechat?businessUnit=skincoach&country=US&lang=en&product=uuid

[Hero Carousel]
[Pricing Table] ← Shows product variants
[Features]
[Testimonials]
[FAQs]
```

## Benefits

1. **Rich Marketing Pages**: Beautiful custom pages per product
2. **A/B Testing**: Different landing pages for same product
3. **Conversion Optimization**: Pricing tables, testimonials, social proof
4. **Easy Management**: Edit in Knowledge Base landing page editor
5. **Flexible**: Can disable landing page, falls back to standard product page

## Implementation Checklist

- [x] Database migration (091_products_landing_page_link.sql)
- [x] Product form has landing page checkbox
- [x] Product API saves has_landing_page field
- [ ] Link landing page to product when saving
- [ ] Update shop to redirect based on has_landing_page
- [ ] Landing page loads product-specific content
- [ ] Pricing table connects to product variants
- [ ] Add to cart from pricing table
- [ ] Test complete flow

## Notes

- Each product can have ONE landing page per locale
- Landing pages are locale-specific (country + language)
- Product can exist in shop without landing page (uses standard detail page)
- Pricing table block is reusable for any product
