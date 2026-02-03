require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 21 Industry Templates with researched fields
const templates = [
  {
    name: 'Personalized Skincare',
    handle: 'personalized-skincare',
    description: 'For personalized skincare businesses with custom formulations and boosters',
    icon: '🧴',
    fields: [
      { key: 'tagline', label: 'Tagline', type: 'text', section: 'main' },
      { key: 'ingredients', label: 'Ingredients', type: 'rich_text', section: 'accordion' },
      { key: 'hero_benefit', label: 'Hero Benefit', type: 'rich_text', section: 'main' },
      { key: 'key_actives', label: 'Key Actives', type: 'rich_text', section: 'accordion' },
      { key: 'face_benefits', label: 'Face Benefits', type: 'rich_text', section: 'tab' },
      { key: 'body_benefits', label: 'Body Benefits', type: 'rich_text', section: 'tab' },
      { key: 'hair_benefits', label: 'Hair/Scalp Benefits', type: 'rich_text', section: 'tab' },
      { key: 'eye_benefits', label: 'Eye Benefits', type: 'rich_text', section: 'tab' },
      { key: 'clinical_studies', label: 'Clinical Studies', type: 'rich_text', section: 'accordion' },
      { key: 'trade_name', label: 'Trade Name', type: 'text', section: 'main' },
      { key: 'usage_instructions', label: 'Usage Instructions', type: 'rich_text', section: 'accordion' },
      { key: 'contraindications', label: 'Contraindications', type: 'rich_text', section: 'accordion' },
      { key: 'ph_level', label: 'pH Level', type: 'text', section: 'main' }
    ]
  },
  {
    name: 'Skincare Retail',
    handle: 'skincare-retail',
    description: 'For skincare retailers like Sephora, Ulta - standard beauty product fields',
    icon: '💄',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'main', required: true },
      { key: 'size_options', label: 'Size Options', type: 'text', section: 'main' },
      { key: 'item_number', label: 'Item Number / SKU', type: 'text', section: 'main' },
      { key: 'rating', label: 'Rating', type: 'number', section: 'main', options: { min: 0, max: 5, step: 0.1 } },
      { key: 'review_count', label: 'Review Count', type: 'number', section: 'main' },
      { key: 'product_benefits', label: 'Product Benefits', type: 'rich_text', section: 'main' },
      { key: 'key_ingredients', label: 'Key Ingredients', type: 'rich_text', section: 'accordion' },
      { key: 'full_ingredients', label: 'Full Ingredients List', type: 'rich_text', section: 'accordion' },
      { key: 'formulated_without', label: 'Formulated Without', type: 'multi_select', section: 'main', options: [
        { value: 'parabens', label: 'Parabens' },
        { value: 'fragrance', label: 'Fragrance' },
        { value: 'alcohol', label: 'Alcohol' },
        { value: 'sulfates', label: 'Sulfates' },
        { value: 'phthalates', label: 'Phthalates' }
      ]},
      { key: 'certifications', label: 'Certifications', type: 'multi_select', section: 'main', options: [
        { value: 'clean', label: 'Clean' },
        { value: 'cruelty_free', label: 'Cruelty Free' },
        { value: 'vegan', label: 'Vegan' },
        { value: 'sustainable', label: 'Sustainable Packaging' }
      ]},
      { key: 'usage_instructions', label: 'How To Use', type: 'rich_text', section: 'accordion' },
      { key: 'warnings', label: 'Warnings', type: 'rich_text', section: 'accordion' },
      { key: 'skin_type', label: 'Skin Type', type: 'multi_select', section: 'main', options: [
        { value: 'normal', label: 'Normal' },
        { value: 'dry', label: 'Dry' },
        { value: 'oily', label: 'Oily' },
        { value: 'combination', label: 'Combination' },
        { value: 'sensitive', label: 'Sensitive' }
      ]}
    ]
  },
  {
    name: 'Restaurant / Cafe',
    handle: 'restaurant',
    description: 'For restaurants, cafes, food delivery - menu items with dietary info',
    icon: '🍽️',
    fields: [
      { key: 'calories', label: 'Calories', type: 'number', section: 'main' },
      { key: 'dietary_labels', label: 'Dietary Labels', type: 'multi_select', section: 'main', options: [
        { value: 'vegetarian', label: 'Vegetarian (V)' },
        { value: 'vegan', label: 'Vegan (VG)' },
        { value: 'gluten_free', label: 'Gluten-Free (GF)' },
        { value: 'dairy_free', label: 'Dairy-Free (DF)' },
        { value: 'nut_free', label: 'Nut-Free' },
        { value: 'halal', label: 'Halal' },
        { value: 'kosher', label: 'Kosher' }
      ]},
      { key: 'spice_level', label: 'Spice Level', type: 'select', section: 'main', options: [
        { value: 'mild', label: 'Mild' },
        { value: 'medium', label: 'Medium' },
        { value: 'hot', label: 'Hot' },
        { value: 'extra_hot', label: 'Extra Hot' }
      ]},
      { key: 'allergens', label: 'Allergens', type: 'multi_select', section: 'main', options: [
        { value: 'milk', label: 'Milk' },
        { value: 'eggs', label: 'Eggs' },
        { value: 'fish', label: 'Fish' },
        { value: 'shellfish', label: 'Shellfish' },
        { value: 'tree_nuts', label: 'Tree Nuts' },
        { value: 'peanuts', label: 'Peanuts' },
        { value: 'wheat', label: 'Wheat' },
        { value: 'soy', label: 'Soy' },
        { value: 'sesame', label: 'Sesame' }
      ]},
      { key: 'portion_size', label: 'Portion Size', type: 'text', section: 'main' },
      { key: 'prep_time', label: 'Prep Time (minutes)', type: 'number', section: 'main' },
      { key: 'ingredients', label: 'Ingredients', type: 'rich_text', section: 'accordion' },
      { key: 'chef_notes', label: 'Chef Notes', type: 'rich_text', section: 'accordion' },
      { key: 'pairs_with', label: 'Pairs Well With', type: 'text', section: 'main' },
      { key: 'customization_options', label: 'Customization Options', type: 'rich_text', section: 'accordion' }
    ]
  },
  {
    name: 'Apparel / Fashion',
    handle: 'apparel',
    description: 'For clothing stores - sizes, materials, care instructions',
    icon: '👗',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'main' },
      { key: 'material_composition', label: 'Material Composition', type: 'rich_text', section: 'main' },
      { key: 'size_chart', label: 'Size Chart', type: 'rich_text', section: 'accordion' },
      { key: 'available_sizes', label: 'Available Sizes', type: 'multi_select', section: 'main', options: [
        { value: 'xs', label: 'XS' },
        { value: 's', label: 'S' },
        { value: 'm', label: 'M' },
        { value: 'l', label: 'L' },
        { value: 'xl', label: 'XL' },
        { value: 'xxl', label: 'XXL' }
      ]},
      { key: 'color', label: 'Color', type: 'text', section: 'main' },
      { key: 'fit_type', label: 'Fit Type', type: 'select', section: 'main', options: [
        { value: 'slim', label: 'Slim Fit' },
        { value: 'regular', label: 'Regular Fit' },
        { value: 'relaxed', label: 'Relaxed Fit' },
        { value: 'oversized', label: 'Oversized' }
      ]},
      { key: 'gender', label: 'Gender', type: 'select', section: 'main', options: [
        { value: 'mens', label: "Men's" },
        { value: 'womens', label: "Women's" },
        { value: 'unisex', label: 'Unisex' },
        { value: 'kids', label: 'Kids' }
      ]},
      { key: 'care_instructions', label: 'Care Instructions', type: 'rich_text', section: 'accordion' },
      { key: 'sustainability_labels', label: 'Sustainability', type: 'multi_select', section: 'main', options: [
        { value: 'organic', label: 'Organic Cotton' },
        { value: 'recycled', label: 'Recycled Materials' },
        { value: 'sustainable', label: 'Sustainably Sourced' }
      ]},
      { key: 'season', label: 'Season/Collection', type: 'text', section: 'main' },
      { key: 'model_measurements', label: 'Model Measurements', type: 'text', section: 'main' }
    ]
  },
  {
    name: 'Flower Shop',
    handle: 'florist',
    description: 'For florists - arrangement details, care, delivery',
    icon: '💐',
    fields: [
      { key: 'flower_types', label: 'Flower Types', type: 'rich_text', section: 'main' },
      { key: 'color_palette', label: 'Color Palette', type: 'text', section: 'main' },
      { key: 'arrangement_size', label: 'Arrangement Size', type: 'select', section: 'main', options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'premium', label: 'Premium' }
      ]},
      { key: 'vase_included', label: 'Vase Included', type: 'boolean', section: 'main' },
      { key: 'vase_life', label: 'Vase Life (days)', type: 'number', section: 'main' },
      { key: 'care_instructions', label: 'Care Instructions', type: 'rich_text', section: 'accordion' },
      { key: 'occasion', label: 'Occasion', type: 'multi_select', section: 'main', options: [
        { value: 'birthday', label: 'Birthday' },
        { value: 'anniversary', label: 'Anniversary' },
        { value: 'sympathy', label: 'Sympathy' },
        { value: 'wedding', label: 'Wedding' },
        { value: 'mothers_day', label: "Mother's Day" },
        { value: 'valentines', label: "Valentine's Day" },
        { value: 'get_well', label: 'Get Well' },
        { value: 'thank_you', label: 'Thank You' }
      ]},
      { key: 'same_day_delivery', label: 'Same Day Delivery Available', type: 'boolean', section: 'main' },
      { key: 'delivery_cutoff', label: 'Same Day Cutoff Time', type: 'text', section: 'main' },
      { key: 'fragrance_level', label: 'Fragrance Level', type: 'select', section: 'main', options: [
        { value: 'none', label: 'No Fragrance' },
        { value: 'light', label: 'Light' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'strong', label: 'Strong' }
      ]}
    ]
  },
  {
    name: 'Liquor / Wine Store',
    handle: 'liquor',
    description: 'For wine shops, liquor stores - tasting notes, ratings, pairing',
    icon: '🍷',
    fields: [
      { key: 'winery', label: 'Winery/Distillery', type: 'text', section: 'main' },
      { key: 'region', label: 'Region/Country', type: 'text', section: 'main' },
      { key: 'grape_variety', label: 'Grape Variety/Spirit Type', type: 'text', section: 'main' },
      { key: 'vintage', label: 'Vintage Year', type: 'number', section: 'main' },
      { key: 'abv', label: 'ABV %', type: 'number', section: 'main', options: { min: 0, max: 100, step: 0.1 } },
      { key: 'volume', label: 'Volume (ml)', type: 'number', section: 'main' },
      { key: 'rating', label: 'Rating (1-100)', type: 'number', section: 'main', options: { min: 0, max: 100 } },
      { key: 'tasting_notes', label: 'Tasting Notes', type: 'rich_text', section: 'main' },
      { key: 'flavor_profile', label: 'Flavor Profile', type: 'multi_select', section: 'main', options: [
        { value: 'fruity', label: 'Fruity' },
        { value: 'oaky', label: 'Oaky' },
        { value: 'spicy', label: 'Spicy' },
        { value: 'floral', label: 'Floral' },
        { value: 'earthy', label: 'Earthy' },
        { value: 'smoky', label: 'Smoky' }
      ]},
      { key: 'food_pairing', label: 'Food Pairing', type: 'rich_text', section: 'accordion' },
      { key: 'serving_temp', label: 'Serving Temperature', type: 'text', section: 'main' },
      { key: 'drinking_window', label: 'Drinking Window', type: 'text', section: 'main' },
      { key: 'awards', label: 'Awards', type: 'rich_text', section: 'accordion' }
    ]
  },
  {
    name: 'Grocery / Supermarket',
    handle: 'grocery',
    description: 'For grocery stores - nutrition facts, allergens, storage',
    icon: '🛒',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'main' },
      { key: 'nutrition_facts', label: 'Nutrition Facts', type: 'rich_text', section: 'accordion' },
      { key: 'serving_size', label: 'Serving Size', type: 'text', section: 'main' },
      { key: 'calories_per_serving', label: 'Calories per Serving', type: 'number', section: 'main' },
      { key: 'ingredients', label: 'Ingredients', type: 'rich_text', section: 'accordion' },
      { key: 'allergens', label: 'Allergens', type: 'multi_select', section: 'main', options: [
        { value: 'milk', label: 'Milk' },
        { value: 'eggs', label: 'Eggs' },
        { value: 'fish', label: 'Fish' },
        { value: 'shellfish', label: 'Shellfish' },
        { value: 'tree_nuts', label: 'Tree Nuts' },
        { value: 'peanuts', label: 'Peanuts' },
        { value: 'wheat', label: 'Wheat' },
        { value: 'soy', label: 'Soy' },
        { value: 'sesame', label: 'Sesame' }
      ]},
      { key: 'storage_instructions', label: 'Storage Instructions', type: 'text', section: 'main' },
      { key: 'shelf_life', label: 'Shelf Life', type: 'text', section: 'main' },
      { key: 'origin_country', label: 'Country of Origin', type: 'text', section: 'main' },
      { key: 'certifications', label: 'Certifications', type: 'multi_select', section: 'main', options: [
        { value: 'organic', label: 'Organic' },
        { value: 'non_gmo', label: 'Non-GMO' },
        { value: 'kosher', label: 'Kosher' },
        { value: 'halal', label: 'Halal' },
        { value: 'fair_trade', label: 'Fair Trade' }
      ]},
      { key: 'unit_size', label: 'Unit Size/Weight', type: 'text', section: 'main' },
      { key: 'pack_quantity', label: 'Pack Quantity', type: 'number', section: 'main' }
    ]
  },
  {
    name: 'Bakery / Pastry',
    handle: 'bakery',
    description: 'For bakeries - ingredients, allergens, freshness, custom orders',
    icon: '🥐',
    fields: [
      { key: 'ingredients', label: 'Ingredients', type: 'rich_text', section: 'accordion' },
      { key: 'allergens', label: 'Allergens', type: 'multi_select', section: 'main', options: [
        { value: 'wheat', label: 'Wheat/Gluten' },
        { value: 'milk', label: 'Milk/Dairy' },
        { value: 'eggs', label: 'Eggs' },
        { value: 'nuts', label: 'Nuts' },
        { value: 'soy', label: 'Soy' }
      ]},
      { key: 'may_contain', label: 'May Contain (Cross-Contamination)', type: 'text', section: 'main' },
      { key: 'calories', label: 'Calories', type: 'number', section: 'main' },
      { key: 'serving_size', label: 'Serving Size', type: 'text', section: 'main' },
      { key: 'freshness_duration', label: 'Best Consumed Within', type: 'text', section: 'main' },
      { key: 'storage_tips', label: 'Storage Tips', type: 'text', section: 'accordion' },
      { key: 'serves_count', label: 'Serves (people)', type: 'number', section: 'main' },
      { key: 'customizable', label: 'Customizable', type: 'boolean', section: 'main' },
      { key: 'order_advance_time', label: 'Order Advance Time Required', type: 'text', section: 'main' },
      { key: 'dietary_options', label: 'Dietary Options', type: 'multi_select', section: 'main', options: [
        { value: 'gluten_free', label: 'Gluten-Free Available' },
        { value: 'vegan', label: 'Vegan Available' },
        { value: 'sugar_free', label: 'Sugar-Free Available' }
      ]}
    ]
  },
  {
    name: 'Jewelry Store',
    handle: 'jewelry',
    description: 'For jewelry - metals, gemstones, certifications, sizing',
    icon: '💎',
    fields: [
      { key: 'metal_type', label: 'Metal Type', type: 'select', section: 'main', options: [
        { value: 'gold', label: 'Gold' },
        { value: 'white_gold', label: 'White Gold' },
        { value: 'rose_gold', label: 'Rose Gold' },
        { value: 'platinum', label: 'Platinum' },
        { value: 'silver', label: 'Sterling Silver' },
        { value: 'titanium', label: 'Titanium' }
      ]},
      { key: 'metal_purity', label: 'Metal Purity', type: 'select', section: 'main', options: [
        { value: '10k', label: '10K (41.7%)' },
        { value: '14k', label: '14K (58.3%)' },
        { value: '18k', label: '18K (75%)' },
        { value: '22k', label: '22K (91.7%)' },
        { value: '24k', label: '24K (Pure)' },
        { value: '925', label: 'Sterling Silver 925' }
      ]},
      { key: 'gemstone_type', label: 'Gemstone Type', type: 'text', section: 'main' },
      { key: 'carat_weight', label: 'Carat Weight', type: 'number', section: 'main', options: { min: 0, step: 0.01 } },
      { key: 'diamond_4cs', label: 'Diamond 4Cs (Cut, Clarity, Color, Carat)', type: 'rich_text', section: 'accordion' },
      { key: 'certification', label: 'Certification (GIA, IGI)', type: 'text', section: 'main' },
      { key: 'certificate_number', label: 'Certificate Number', type: 'text', section: 'main' },
      { key: 'ring_size', label: 'Ring Size', type: 'text', section: 'main' },
      { key: 'chain_length', label: 'Chain Length (inches)', type: 'number', section: 'main' },
      { key: 'total_weight', label: 'Total Weight (grams)', type: 'number', section: 'main', options: { step: 0.1 } },
      { key: 'care_instructions', label: 'Care Instructions', type: 'rich_text', section: 'accordion' },
      { key: 'appraisal_value', label: 'Appraisal Value', type: 'number', section: 'main' }
    ]
  },
  {
    name: 'Electronics',
    handle: 'electronics',
    description: 'For electronics - specs, warranty, compatibility',
    icon: '📱',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'main' },
      { key: 'model_number', label: 'Model Number', type: 'text', section: 'main' },
      { key: 'specifications', label: 'Specifications', type: 'rich_text', section: 'accordion' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'main' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'main' },
      { key: 'compatibility', label: 'Compatibility', type: 'rich_text', section: 'accordion' },
      { key: 'connectivity', label: 'Connectivity', type: 'multi_select', section: 'main', options: [
        { value: 'wifi', label: 'WiFi' },
        { value: 'bluetooth', label: 'Bluetooth' },
        { value: 'usb_c', label: 'USB-C' },
        { value: 'usb_a', label: 'USB-A' },
        { value: 'hdmi', label: 'HDMI' },
        { value: 'nfc', label: 'NFC' }
      ]},
      { key: 'power_requirements', label: 'Power Requirements', type: 'text', section: 'main' },
      { key: 'battery_life', label: 'Battery Life', type: 'text', section: 'main' },
      { key: 'whats_in_box', label: "What's In The Box", type: 'rich_text', section: 'accordion' },
      { key: 'warranty_period', label: 'Warranty Period', type: 'text', section: 'main' },
      { key: 'energy_rating', label: 'Energy Rating', type: 'text', section: 'main' }
    ]
  },
  {
    name: 'Furniture',
    handle: 'furniture',
    description: 'For furniture stores - dimensions, assembly, weight capacity',
    icon: '🛋️',
    fields: [
      { key: 'dimensions', label: 'Assembled Dimensions (L x W x H)', type: 'text', section: 'main' },
      { key: 'package_dimensions', label: 'Package Dimensions', type: 'text', section: 'main' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'main' },
      { key: 'weight_capacity', label: 'Weight Capacity', type: 'text', section: 'main' },
      { key: 'materials', label: 'Materials', type: 'rich_text', section: 'main' },
      { key: 'color_options', label: 'Color/Finish Options', type: 'text', section: 'main' },
      { key: 'assembly_required', label: 'Assembly Required', type: 'boolean', section: 'main' },
      { key: 'assembly_time', label: 'Estimated Assembly Time', type: 'text', section: 'main' },
      { key: 'assembly_instructions', label: 'Assembly Instructions', type: 'url', section: 'accordion' },
      { key: 'room_type', label: 'Room Type', type: 'multi_select', section: 'main', options: [
        { value: 'living_room', label: 'Living Room' },
        { value: 'bedroom', label: 'Bedroom' },
        { value: 'dining', label: 'Dining Room' },
        { value: 'office', label: 'Office' },
        { value: 'outdoor', label: 'Outdoor' }
      ]},
      { key: 'style', label: 'Style', type: 'select', section: 'main', options: [
        { value: 'modern', label: 'Modern' },
        { value: 'traditional', label: 'Traditional' },
        { value: 'scandinavian', label: 'Scandinavian' },
        { value: 'industrial', label: 'Industrial' },
        { value: 'rustic', label: 'Rustic' }
      ]},
      { key: 'number_of_packages', label: 'Number of Packages', type: 'number', section: 'main' }
    ]
  },
  {
    name: 'Pharmacy / Health',
    handle: 'pharmacy',
    description: 'For pharmacies - drug facts, dosage, warnings',
    icon: '💊',
    fields: [
      { key: 'active_ingredients', label: 'Active Ingredients', type: 'rich_text', section: 'main', required: true },
      { key: 'inactive_ingredients', label: 'Inactive Ingredients', type: 'rich_text', section: 'accordion' },
      { key: 'purpose', label: 'Purpose', type: 'text', section: 'main' },
      { key: 'uses', label: 'Uses', type: 'rich_text', section: 'main' },
      { key: 'warnings', label: 'Warnings', type: 'rich_text', section: 'main', required: true },
      { key: 'directions', label: 'Directions/Dosage', type: 'rich_text', section: 'main', required: true },
      { key: 'drug_interactions', label: 'Drug Interactions', type: 'rich_text', section: 'accordion' },
      { key: 'side_effects', label: 'Possible Side Effects', type: 'rich_text', section: 'accordion' },
      { key: 'storage', label: 'Storage Instructions', type: 'text', section: 'main' },
      { key: 'prescription_required', label: 'Prescription Required', type: 'boolean', section: 'main' },
      { key: 'ndc_number', label: 'NDC Number', type: 'text', section: 'main' },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', section: 'main' }
    ]
  },
  {
    name: 'Pet Store',
    handle: 'pet-store',
    description: 'For pet stores - pet type, life stage, ingredients, AAFCO',
    icon: '🐾',
    fields: [
      { key: 'pet_type', label: 'Pet Type', type: 'select', section: 'main', required: true, options: [
        { value: 'dog', label: 'Dog' },
        { value: 'cat', label: 'Cat' },
        { value: 'bird', label: 'Bird' },
        { value: 'fish', label: 'Fish' },
        { value: 'small_animal', label: 'Small Animal' },
        { value: 'reptile', label: 'Reptile' }
      ]},
      { key: 'life_stage', label: 'Life Stage', type: 'select', section: 'main', options: [
        { value: 'puppy_kitten', label: 'Puppy/Kitten' },
        { value: 'adult', label: 'Adult' },
        { value: 'senior', label: 'Senior' },
        { value: 'all_stages', label: 'All Life Stages' }
      ]},
      { key: 'breed_size', label: 'Breed Size', type: 'select', section: 'main', options: [
        { value: 'small', label: 'Small Breed' },
        { value: 'medium', label: 'Medium Breed' },
        { value: 'large', label: 'Large Breed' },
        { value: 'giant', label: 'Giant Breed' },
        { value: 'all', label: 'All Sizes' }
      ]},
      { key: 'aafco_statement', label: 'AAFCO Statement', type: 'rich_text', section: 'accordion' },
      { key: 'guaranteed_analysis', label: 'Guaranteed Analysis', type: 'rich_text', section: 'accordion' },
      { key: 'ingredients', label: 'Ingredients', type: 'rich_text', section: 'accordion' },
      { key: 'feeding_directions', label: 'Feeding Directions', type: 'rich_text', section: 'main' },
      { key: 'calorie_content', label: 'Calorie Content', type: 'text', section: 'main' },
      { key: 'net_weight', label: 'Net Weight', type: 'text', section: 'main' }
    ]
  },
  {
    name: 'Bookstore',
    handle: 'bookstore',
    description: 'For bookstores - author, ISBN, format, genre',
    icon: '📚',
    fields: [
      { key: 'author', label: 'Author', type: 'text', section: 'main', required: true },
      { key: 'isbn', label: 'ISBN', type: 'text', section: 'main' },
      { key: 'publisher', label: 'Publisher', type: 'text', section: 'main' },
      { key: 'publication_date', label: 'Publication Date', type: 'date', section: 'main' },
      { key: 'format', label: 'Format', type: 'select', section: 'main', options: [
        { value: 'hardcover', label: 'Hardcover' },
        { value: 'paperback', label: 'Paperback' },
        { value: 'ebook', label: 'eBook' },
        { value: 'audiobook', label: 'Audiobook' }
      ]},
      { key: 'pages', label: 'Number of Pages', type: 'number', section: 'main' },
      { key: 'language', label: 'Language', type: 'text', section: 'main' },
      { key: 'genre', label: 'Genre', type: 'multi_select', section: 'main', options: [
        { value: 'fiction', label: 'Fiction' },
        { value: 'non_fiction', label: 'Non-Fiction' },
        { value: 'mystery', label: 'Mystery' },
        { value: 'romance', label: 'Romance' },
        { value: 'sci_fi', label: 'Sci-Fi' },
        { value: 'biography', label: 'Biography' },
        { value: 'self_help', label: 'Self-Help' },
        { value: 'children', label: "Children's" }
      ]},
      { key: 'edition', label: 'Edition', type: 'text', section: 'main' },
      { key: 'synopsis', label: 'Synopsis', type: 'rich_text', section: 'main' },
      { key: 'rating', label: 'Rating', type: 'number', section: 'main', options: { min: 0, max: 5, step: 0.1 } },
      { key: 'review_count', label: 'Review Count', type: 'number', section: 'main' }
    ]
  },
  {
    name: 'Hardware / Tools',
    handle: 'hardware',
    description: 'For hardware stores - specifications, power, warranty',
    icon: '🔧',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'main' },
      { key: 'model_number', label: 'Model Number', type: 'text', section: 'main' },
      { key: 'power_source', label: 'Power Source', type: 'select', section: 'main', options: [
        { value: 'corded', label: 'Corded Electric' },
        { value: 'cordless', label: 'Cordless Battery' },
        { value: 'gas', label: 'Gas Powered' },
        { value: 'manual', label: 'Manual' },
        { value: 'pneumatic', label: 'Pneumatic' }
      ]},
      { key: 'voltage', label: 'Voltage', type: 'text', section: 'main' },
      { key: 'wattage', label: 'Wattage', type: 'text', section: 'main' },
      { key: 'speed_rpm', label: 'Speed/RPM', type: 'text', section: 'main' },
      { key: 'specifications', label: 'Technical Specifications', type: 'rich_text', section: 'accordion' },
      { key: 'whats_included', label: "What's Included", type: 'rich_text', section: 'accordion' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'main' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'main' },
      { key: 'warranty', label: 'Warranty', type: 'text', section: 'main' },
      { key: 'safety_certifications', label: 'Safety Certifications', type: 'text', section: 'main' }
    ]
  },
  {
    name: 'Spa / Salon Services',
    handle: 'spa-salon',
    description: 'For spas and salons - duration, preparation, aftercare',
    icon: '💆',
    fields: [
      { key: 'duration', label: 'Duration (minutes)', type: 'number', section: 'main', required: true },
      { key: 'therapist_level', label: 'Therapist Level', type: 'select', section: 'main', options: [
        { value: 'junior', label: 'Junior' },
        { value: 'senior', label: 'Senior' },
        { value: 'master', label: 'Master' },
        { value: 'specialist', label: 'Specialist' }
      ]},
      { key: 'service_description', label: 'Service Description', type: 'rich_text', section: 'main' },
      { key: 'what_to_expect', label: 'What To Expect', type: 'rich_text', section: 'accordion' },
      { key: 'preparation', label: 'Preparation', type: 'rich_text', section: 'accordion' },
      { key: 'aftercare', label: 'Aftercare', type: 'rich_text', section: 'accordion' },
      { key: 'contraindications', label: 'Contraindications', type: 'rich_text', section: 'accordion' },
      { key: 'add_on_services', label: 'Available Add-Ons', type: 'rich_text', section: 'accordion' },
      { key: 'therapist_gender_preference', label: 'Therapist Gender Preference', type: 'boolean', section: 'main' },
      { key: 'cancellation_policy', label: 'Cancellation Policy', type: 'rich_text', section: 'accordion' },
      { key: 'member_price', label: 'Member Price', type: 'number', section: 'main' }
    ]
  },
  {
    name: 'Real Estate',
    handle: 'real-estate',
    description: 'For real estate listings - bedrooms, sqft, amenities',
    icon: '🏠',
    fields: [
      { key: 'property_type', label: 'Property Type', type: 'select', section: 'main', options: [
        { value: 'house', label: 'House' },
        { value: 'condo', label: 'Condo' },
        { value: 'townhouse', label: 'Townhouse' },
        { value: 'apartment', label: 'Apartment' },
        { value: 'land', label: 'Land' },
        { value: 'commercial', label: 'Commercial' }
      ]},
      { key: 'bedrooms', label: 'Bedrooms', type: 'number', section: 'main' },
      { key: 'bathrooms', label: 'Bathrooms', type: 'number', section: 'main', options: { step: 0.5 } },
      { key: 'sqft', label: 'Square Footage', type: 'number', section: 'main' },
      { key: 'lot_size', label: 'Lot Size', type: 'text', section: 'main' },
      { key: 'year_built', label: 'Year Built', type: 'number', section: 'main' },
      { key: 'parking', label: 'Parking', type: 'text', section: 'main' },
      { key: 'hoa_dues', label: 'HOA Dues (monthly)', type: 'number', section: 'main' },
      { key: 'hoa_includes', label: 'HOA Includes', type: 'rich_text', section: 'accordion' },
      { key: 'amenities', label: 'Amenities', type: 'multi_select', section: 'main', options: [
        { value: 'pool', label: 'Pool' },
        { value: 'gym', label: 'Gym' },
        { value: 'doorman', label: 'Doorman' },
        { value: 'elevator', label: 'Elevator' },
        { value: 'laundry', label: 'In-Unit Laundry' },
        { value: 'balcony', label: 'Balcony' },
        { value: 'garage', label: 'Garage' }
      ]},
      { key: 'virtual_tour', label: 'Virtual Tour URL', type: 'url', section: 'main' },
      { key: 'walkability_score', label: 'Walk Score', type: 'number', section: 'main' },
      { key: 'school_rating', label: 'School Rating', type: 'text', section: 'main' }
    ]
  },
  {
    name: 'Automotive Parts',
    handle: 'automotive',
    description: 'For auto parts - compatibility, OEM numbers, fitment',
    icon: '🚗',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'main' },
      { key: 'part_number', label: 'Part Number', type: 'text', section: 'main', required: true },
      { key: 'oem_part_number', label: 'OEM Part Number', type: 'text', section: 'main' },
      { key: 'vehicle_compatibility', label: 'Vehicle Compatibility', type: 'rich_text', section: 'main' },
      { key: 'fitment_notes', label: 'Fitment Notes', type: 'rich_text', section: 'accordion' },
      { key: 'quality_level', label: 'Quality Level', type: 'select', section: 'main', options: [
        { value: 'economy', label: 'Economy' },
        { value: 'oe', label: 'OE (Original Equipment)' },
        { value: 'oem', label: 'OEM' },
        { value: 'premium', label: 'Premium' },
        { value: 'performance', label: 'Performance' }
      ]},
      { key: 'warranty', label: 'Warranty', type: 'text', section: 'main' },
      { key: 'core_charge', label: 'Core Charge', type: 'number', section: 'main' },
      { key: 'shipping_weight', label: 'Shipping Weight', type: 'text', section: 'main' },
      { key: 'installation_difficulty', label: 'Installation Difficulty', type: 'select', section: 'main', options: [
        { value: 'diy_easy', label: 'DIY Easy' },
        { value: 'diy_moderate', label: 'DIY Moderate' },
        { value: 'professional', label: 'Professional Recommended' }
      ]},
      { key: 'specifications', label: 'Technical Specifications', type: 'rich_text', section: 'accordion' }
    ]
  },
  {
    name: 'Travel / Tours',
    handle: 'travel',
    description: 'For travel agencies - itinerary, inclusions, cancellation',
    icon: '✈️',
    fields: [
      { key: 'duration', label: 'Duration (days/nights)', type: 'text', section: 'main', required: true },
      { key: 'destinations', label: 'Destinations', type: 'rich_text', section: 'main' },
      { key: 'itinerary', label: 'Day-by-Day Itinerary', type: 'rich_text', section: 'accordion' },
      { key: 'inclusions', label: 'Inclusions', type: 'rich_text', section: 'main' },
      { key: 'exclusions', label: 'Exclusions', type: 'rich_text', section: 'main' },
      { key: 'group_size', label: 'Group Size (min-max)', type: 'text', section: 'main' },
      { key: 'departure_dates', label: 'Available Departure Dates', type: 'rich_text', section: 'main' },
      { key: 'difficulty_level', label: 'Difficulty Level', type: 'select', section: 'main', options: [
        { value: 'easy', label: 'Easy' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'challenging', label: 'Challenging' },
        { value: 'strenuous', label: 'Strenuous' }
      ]},
      { key: 'accommodation', label: 'Accommodation Details', type: 'rich_text', section: 'accordion' },
      { key: 'deposit', label: 'Deposit Required', type: 'number', section: 'main' },
      { key: 'balance_due', label: 'Balance Due (days before)', type: 'number', section: 'main' },
      { key: 'cancellation_policy', label: 'Cancellation Policy', type: 'rich_text', section: 'accordion' },
      { key: 'single_supplement', label: 'Single Supplement', type: 'number', section: 'main' }
    ]
  },
  {
    name: 'Sports / Fitness',
    handle: 'sports-fitness',
    description: 'For sports equipment - size, material, skill level',
    icon: '🏃',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'main' },
      { key: 'sport_type', label: 'Sport/Activity', type: 'multi_select', section: 'main', options: [
        { value: 'running', label: 'Running' },
        { value: 'training', label: 'Training' },
        { value: 'yoga', label: 'Yoga' },
        { value: 'cycling', label: 'Cycling' },
        { value: 'swimming', label: 'Swimming' },
        { value: 'team_sports', label: 'Team Sports' }
      ]},
      { key: 'size_options', label: 'Size Options', type: 'text', section: 'main' },
      { key: 'size_chart', label: 'Size Chart', type: 'rich_text', section: 'accordion' },
      { key: 'color_options', label: 'Color Options', type: 'text', section: 'main' },
      { key: 'material', label: 'Material/Technology', type: 'rich_text', section: 'main' },
      { key: 'gender', label: 'Gender', type: 'select', section: 'main', options: [
        { value: 'mens', label: "Men's" },
        { value: 'womens', label: "Women's" },
        { value: 'unisex', label: 'Unisex' },
        { value: 'kids', label: 'Kids' }
      ]},
      { key: 'skill_level', label: 'Skill Level', type: 'select', section: 'main', options: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'professional', label: 'Professional' }
      ]},
      { key: 'features', label: 'Key Features', type: 'rich_text', section: 'accordion' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'main' },
      { key: 'care_instructions', label: 'Care Instructions', type: 'rich_text', section: 'accordion' }
    ]
  },
  {
    name: 'Boutique / Gift Shop',
    handle: 'boutique',
    description: 'For boutiques and gift shops - handmade, occasions, personalization',
    icon: '🎁',
    fields: [
      { key: 'material', label: 'Material', type: 'text', section: 'main' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'main' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'main' },
      { key: 'color_options', label: 'Color Options', type: 'text', section: 'main' },
      { key: 'handmade', label: 'Handmade', type: 'boolean', section: 'main' },
      { key: 'artist_designer', label: 'Artist/Designer', type: 'text', section: 'main' },
      { key: 'origin_country', label: 'Made In', type: 'text', section: 'main' },
      { key: 'gift_wrappable', label: 'Gift Wrap Available', type: 'boolean', section: 'main' },
      { key: 'occasion', label: 'Occasion', type: 'multi_select', section: 'main', options: [
        { value: 'birthday', label: 'Birthday' },
        { value: 'wedding', label: 'Wedding' },
        { value: 'anniversary', label: 'Anniversary' },
        { value: 'holiday', label: 'Holiday' },
        { value: 'baby_shower', label: 'Baby Shower' },
        { value: 'housewarming', label: 'Housewarming' }
      ]},
      { key: 'personalization', label: 'Personalization Options', type: 'rich_text', section: 'accordion' },
      { key: 'care_instructions', label: 'Care Instructions', type: 'rich_text', section: 'accordion' },
      { key: 'made_to_order', label: 'Made to Order', type: 'boolean', section: 'main' },
      { key: 'lead_time', label: 'Lead Time', type: 'text', section: 'main' }
    ]
  },
  {
    name: 'Apparel Factory Outlet',
    handle: 'factory-outlet',
    description: 'For factory outlets - original price, discount tiers, defect grades',
    icon: '🏷️',
    fields: [
      { key: 'original_brand', label: 'Original Brand', type: 'text', section: 'main' },
      { key: 'original_collection', label: 'Original Collection', type: 'text', section: 'main' },
      { key: 'discount_tier', label: 'Discount Tier', type: 'select', section: 'main', options: [
        { value: '30', label: '30% Off' },
        { value: '50', label: '50% Off' },
        { value: '70', label: '70% Off' },
        { value: '90', label: '90% Off (Clearance)' }
      ]},
      { key: 'condition_grade', label: 'Condition Grade', type: 'select', section: 'main', options: [
        { value: 'a', label: 'Grade A - Perfect' },
        { value: 'b', label: 'Grade B - Minor Flaw' },
        { value: 'c', label: 'Grade C - Visible Defect' }
      ]},
      { key: 'defect_description', label: 'Defect Description (if applicable)', type: 'text', section: 'main' },
      { key: 'clearance_reason', label: 'Clearance Reason', type: 'select', section: 'main', options: [
        { value: 'overstock', label: 'Overstock' },
        { value: 'last_season', label: 'Last Season' },
        { value: 'sample', label: 'Sample' },
        { value: 'discontinued', label: 'Discontinued' }
      ]},
      { key: 'final_sale', label: 'Final Sale (No Returns)', type: 'boolean', section: 'main' },
      { key: 'bulk_discount', label: 'Bulk Discount Available', type: 'text', section: 'main' },
      { key: 'size_options', label: 'Available Sizes', type: 'text', section: 'main' },
      { key: 'color', label: 'Color', type: 'text', section: 'main' },
      { key: 'material', label: 'Material', type: 'text', section: 'main' },
      { key: 'limited_stock_qty', label: 'Limited Stock (show alert if <)', type: 'number', section: 'main' }
    ]
  }
];

async function seedTemplates() {
  console.log('Seeding product templates...\n');

  let order = 0;
  for (const template of templates) {
    order++;

    // Check if template exists
    const { data: existing } = await supabase
      .from('product_templates')
      .select('id')
      .eq('handle', template.handle)
      .single();

    let templateId;

    if (existing) {
      console.log(`Template exists: ${template.name}`);
      templateId = existing.id;

      // Update template
      await supabase
        .from('product_templates')
        .update({
          name: template.name,
          description: template.description,
          icon: template.icon,
          display_order: order
        })
        .eq('id', templateId);

      // Delete existing fields
      await supabase
        .from('template_fields')
        .delete()
        .eq('template_id', templateId);
    } else {
      // Create template
      const { data, error } = await supabase
        .from('product_templates')
        .insert({
          name: template.name,
          handle: template.handle,
          description: template.description,
          icon: template.icon,
          display_order: order,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.log(`Error creating ${template.name}:`, error.message);
        continue;
      }

      templateId = data.id;
      console.log(`Created: ${template.name}`);
    }

    // Insert fields
    let fieldOrder = 0;
    for (const field of template.fields) {
      fieldOrder++;

      const { error: fieldError } = await supabase
        .from('template_fields')
        .insert({
          template_id: templateId,
          field_key: field.key,
          field_label: field.label,
          field_type: field.type,
          field_options: field.options ? JSON.stringify(field.options) : null,
          display_section: field.section || 'main',
          display_order: fieldOrder,
          is_required: field.required || false,
          placeholder: field.placeholder || null,
          help_text: field.help_text || null
        });

      if (fieldError) {
        console.log(`  Error adding field ${field.key}:`, fieldError.message);
      }
    }

    console.log(`  Added ${template.fields.length} fields`);
  }

  // Summary
  const { data: allTemplates } = await supabase
    .from('product_templates')
    .select('name, handle')
    .order('display_order');

  console.log('\n=== All Templates ===');
  allTemplates?.forEach((t, i) => {
    console.log(`${i + 1}. ${t.name} (${t.handle})`);
  });
}

seedTemplates().catch(console.error);
