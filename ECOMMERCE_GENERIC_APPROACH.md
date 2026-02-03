# E-commerce Generic Approach Guidelines

## Core Principle
NO hardcoded industry-specific logic. Everything is configurable through the database.

---

## Database Schema (Generic)

### 1. Categories
**Table: `product_categories`**
- Defines product categories (e.g., Face, Eye, Body, Scalp for skincare; Tops, Bottoms, Shoes for fashion)
- Each business unit defines their own categories

```
id | business_unit_id | name | handle | display_order
```

### 2. Product Types
**Table: `product_types`**
- Defines types of products (e.g., Cleanser, Serum, Booster for skincare; T-Shirt, Pants for fashion)
- `is_addon` flag indicates if this type is an add-on/booster

```
id | business_unit_id | name | handle | is_addon | display_order
```

### 3. Attributes
**Table: `product_attributes`**
- Defines filterable/taggable attributes (e.g., "Skin Concerns", "Skin Type", "Size", "Color")
- `is_category_linked` = true means options are grouped by category
- `attribute_type` = 'concern' | 'feature' | 'specification' | 'tag'

```
id | business_unit_id | name | handle | attribute_type | is_category_linked | is_filterable | display_order
```

### 4. Attribute Options
**Table: `product_attribute_options`**
- Defines options for each attribute
- If `is_category_linked` = true, each option belongs to a category
- Example: "Acne" option under "Skin Concerns" attribute, linked to "Face" category

```
id | attribute_id | name | handle | category_id (nullable) | display_order
```

### 5. Product Attribute Values
**Table: `product_attribute_values`**
- Links products to attribute options
- Example: "Hydrating Booster" product has "Dryness" and "Dehydration" options

```
id | product_id | attribute_id | option_id
```

### 6. Products
**Table: `products`**
- Main product table
- Links to product_type via `product_type_id`

### 7. Product-Category Mapping
**Table: `product_category_mapping`**
- Products can belong to multiple categories
- Example: A product can be for both "Face" and "Body"

```
id | product_id | category_id
```

### 8. Product Add-on Matches
**Table: `product_addon_matches`**
- Manual matches between base products and add-ons
- Admin selects which add-ons go with which products

```
id | product_id | addon_product_id | display_order
```

---

## Add-on Matching Logic (Generic)

### How it works:
1. **Base Product** has a category (e.g., "Face")
2. **Attribute** has `is_category_linked = true` (e.g., "Skin Concerns")
3. **Options** are linked to categories (e.g., "Acne" → Face, "Dark Circles" → Eye)
4. **Add-ons** have attribute options assigned via `product_attribute_values`

### When editing add-ons for a product:
1. Get product's category (e.g., "Face")
2. Get all category-linked attributes (e.g., "Skin Concerns")
3. Get options for those attributes filtered by category
4. Get all add-ons that have those options assigned
5. Display in table: Option → Add-ons with that option

### UI Flow:
```
Products Table
├── Click "Edit Add-ons" on a Face product
└── Modal opens showing:
    ├── FACE OPTIONS (from category-linked attributes)
    │   ├── Acne → [Booster A] [Booster B]
    │   ├── Dryness → [Booster C]
    │   └── Oiliness → [Booster D] [Booster E]
    └── Select boosters with checkboxes
```

---

## NO Hardcoded Tables

### OLD (Bad - Hardcoded):
- `skin_concerns` - specific to skincare
- `booster_concern_mapping` - specific to skincare
- `customer_concerns` - specific to skincare

### NEW (Good - Generic):
- `product_attributes` - any attribute type
- `product_attribute_options` - any options
- `product_attribute_values` - links products to options

---

## Industry Templates

When a business sets up their catalog, they can choose a template:
- **Skincare**: Categories (Face, Eye, Body, Scalp), Attributes (Skin Concerns, Skin Type)
- **Fashion**: Categories (Men, Women, Kids), Attributes (Size, Color, Material)
- **Food**: Categories (Appetizers, Main, Dessert), Attributes (Dietary, Allergens)
- **Custom**: Start from scratch

Templates pre-populate the generic tables, but everything remains editable.

---

## API Endpoints (Generic)

### Categories
- `GET /api/ecommerce/categories?businessUnitId=xxx`
- `POST /api/ecommerce/categories`
- `PUT /api/ecommerce/categories?id=xxx`
- `DELETE /api/ecommerce/categories?id=xxx`

### Product Types
- `GET /api/ecommerce/product-types?businessUnitId=xxx`
- `POST /api/ecommerce/product-types`
- `PUT /api/ecommerce/product-types?id=xxx`
- `DELETE /api/ecommerce/product-types?id=xxx`

### Attributes
- `GET /api/ecommerce/attributes?businessUnitId=xxx`
- `POST /api/ecommerce/attributes`
- `PUT /api/ecommerce/attributes?id=xxx`
- `DELETE /api/ecommerce/attributes?id=xxx`

### Attribute Options
- `GET /api/ecommerce/attribute-options?attributeId=xxx`
- `POST /api/ecommerce/attribute-options`
- `PUT /api/ecommerce/attribute-options?id=xxx`
- `DELETE /api/ecommerce/attribute-options?id=xxx`

### Product Attribute Values
- `GET /api/ecommerce/product-attributes?productId=xxx`
- `PUT /api/ecommerce/product-attributes` (bulk update for a product)

### Add-on Matches
- `GET /api/ecommerce/addon-matches?productId=xxx`
- `PUT /api/ecommerce/addon-matches` (save matches for a product)

---

## UI Components

### 1. Catalog Settings
- Categories tab: CRUD categories
- Product Types tab: CRUD types with is_addon toggle
- Attributes tab: CRUD attributes with options management

### 2. Products Tab
- List/Grid view of products
- Columns: Image, Name, Category, Type, Status, Add-ons (count + edit button)
- Filter by category, status, type (base/addon)

### 3. Add-on Matching Modal
- Opens when clicking "Edit Add-ons" on a product
- Table grouped by category-linked attribute options
- Checkboxes to select which add-ons match the product
- Filtered by product's category

---

## Key Rules

1. **No hardcoded "skin_concerns" or "booster" references in code**
2. **Use generic attribute system for all product features**
3. **Category-linking is optional per attribute**
4. **Add-on is determined by product_type.is_addon flag**
5. **All industry-specific setup comes from templates, not code**
