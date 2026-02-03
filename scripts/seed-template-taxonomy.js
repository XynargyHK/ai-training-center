// Seed template categories, types, and attributes for each industry template
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Template taxonomy definitions
const TEMPLATE_TAXONOMY = {
  'personalized-skincare': {
    categories: [
      { name: 'Face', handle: 'face', icon: '😊' },
      { name: 'Eye', handle: 'eye', icon: '👁️' },
      { name: 'Body', handle: 'body', icon: '🧴' },
      { name: 'Hair', handle: 'hair', icon: '💇' }
    ],
    types: [
      { name: 'Booster', handle: 'booster', is_addon: true },
      { name: 'Cream', handle: 'cream', is_addon: false },
      { name: 'Serum', handle: 'serum', is_addon: false },
      { name: 'Cleanser', handle: 'cleanser', is_addon: false },
      { name: 'Toner', handle: 'toner', is_addon: false },
      { name: 'Mask', handle: 'mask', is_addon: false },
      { name: 'Oil', handle: 'oil', is_addon: false },
      { name: 'Shampoo', handle: 'shampoo', is_addon: false },
      { name: 'Conditioner', handle: 'conditioner', is_addon: false }
    ],
    attributes: [
      {
        name: 'Skin Concerns',
        handle: 'skin_concerns',
        attribute_type: 'concern',
        is_category_linked: true,
        is_filterable: true,
        options: {
          'face': ['Wrinkles', 'Fine Lines', 'Acne', 'Dullness', 'Large Pores', 'Oiliness', 'Dryness', 'Redness', 'Hyperpigmentation', 'Uneven Skin Tone', 'Loss of Firmness', 'Sagging'],
          'eye': ['Dark Circles', 'Puffiness', 'Crow\'s Feet', 'Fine Lines', 'Under-eye Bags', 'Droopy Eyelids'],
          'body': ['Cellulite', 'Stretch Marks', 'Dry Skin', 'Rough Texture', 'Uneven Tone', 'Loss of Firmness'],
          'hair': ['Hair Loss', 'Thinning', 'Dandruff', 'Dry Scalp', 'Oily Scalp', 'Frizz', 'Damage', 'Split Ends']
        }
      },
      {
        name: 'Skin Type',
        handle: 'skin_type',
        attribute_type: 'preference',
        is_category_linked: false,
        is_filterable: true,
        options: ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive', 'All Types']
      }
    ],
    addon_rules: [
      { base_type: 'cream', addon_type: 'booster' },
      { base_type: 'serum', addon_type: 'booster' },
      { base_type: 'oil', addon_type: 'booster' },
      { base_type: 'mask', addon_type: 'booster' }
    ]
  },

  'skincare-retail': {
    categories: [
      { name: 'Face', handle: 'face', icon: '😊' },
      { name: 'Eye', handle: 'eye', icon: '👁️' },
      { name: 'Body', handle: 'body', icon: '🧴' },
      { name: 'Sun Care', handle: 'sun-care', icon: '☀️' },
      { name: 'Lip Care', handle: 'lip-care', icon: '💋' }
    ],
    types: [
      { name: 'Moisturizer', handle: 'moisturizer', is_addon: false },
      { name: 'Cleanser', handle: 'cleanser', is_addon: false },
      { name: 'Serum', handle: 'serum', is_addon: false },
      { name: 'Sunscreen', handle: 'sunscreen', is_addon: false },
      { name: 'Mask', handle: 'mask', is_addon: false },
      { name: 'Toner', handle: 'toner', is_addon: false },
      { name: 'Exfoliator', handle: 'exfoliator', is_addon: false }
    ],
    attributes: [
      {
        name: 'Skin Type',
        handle: 'skin_type',
        attribute_type: 'preference',
        is_category_linked: false,
        is_filterable: true,
        options: ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive']
      },
      {
        name: 'Key Ingredients',
        handle: 'key_ingredients',
        attribute_type: 'feature',
        is_category_linked: false,
        is_filterable: true,
        options: ['Vitamin C', 'Retinol', 'Hyaluronic Acid', 'Niacinamide', 'Salicylic Acid', 'AHA/BHA', 'Peptides', 'Ceramides']
      }
    ],
    addon_rules: []
  },

  'restaurant': {
    categories: [
      { name: 'Appetizers', handle: 'appetizers', icon: '🥗' },
      { name: 'Main Course', handle: 'main-course', icon: '🍽️' },
      { name: 'Desserts', handle: 'desserts', icon: '🍰' },
      { name: 'Beverages', handle: 'beverages', icon: '🥤' },
      { name: 'Sides', handle: 'sides', icon: '🍟' }
    ],
    types: [
      { name: 'Dish', handle: 'dish', is_addon: false },
      { name: 'Drink', handle: 'drink', is_addon: false },
      { name: 'Add-on', handle: 'addon', is_addon: true },
      { name: 'Combo', handle: 'combo', is_addon: false }
    ],
    attributes: [
      {
        name: 'Dietary Options',
        handle: 'dietary_options',
        attribute_type: 'constraint',
        is_category_linked: false,
        is_filterable: true,
        options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Dairy-Free', 'Nut-Free', 'Low-Carb']
      },
      {
        name: 'Spice Level',
        handle: 'spice_level',
        attribute_type: 'preference',
        is_category_linked: false,
        is_filterable: true,
        options: ['Mild', 'Medium', 'Hot', 'Extra Hot']
      }
    ],
    addon_rules: [
      { base_type: 'dish', addon_type: 'addon' },
      { base_type: 'drink', addon_type: 'addon' }
    ]
  },

  'apparel': {
    categories: [
      { name: 'Men', handle: 'men', icon: '👔' },
      { name: 'Women', handle: 'women', icon: '👗' },
      { name: 'Kids', handle: 'kids', icon: '👶' },
      { name: 'Accessories', handle: 'accessories', icon: '👜' }
    ],
    types: [
      { name: 'Shirt', handle: 'shirt', is_addon: false },
      { name: 'Pants', handle: 'pants', is_addon: false },
      { name: 'Dress', handle: 'dress', is_addon: false },
      { name: 'Jacket', handle: 'jacket', is_addon: false },
      { name: 'Shoes', handle: 'shoes', is_addon: false },
      { name: 'Bag', handle: 'bag', is_addon: false },
      { name: 'Accessory', handle: 'accessory', is_addon: true }
    ],
    attributes: [
      {
        name: 'Size',
        handle: 'size',
        attribute_type: 'feature',
        is_category_linked: true,
        is_filterable: true,
        options: {
          'men': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          'women': ['XS', 'S', 'M', 'L', 'XL'],
          'kids': ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-12Y']
        }
      },
      {
        name: 'Color',
        handle: 'color',
        attribute_type: 'feature',
        is_category_linked: false,
        is_filterable: true,
        options: ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Beige', 'Pink']
      },
      {
        name: 'Occasion',
        handle: 'occasion',
        attribute_type: 'preference',
        is_category_linked: false,
        is_filterable: true,
        options: ['Casual', 'Formal', 'Business', 'Sport', 'Party', 'Beach']
      }
    ],
    addon_rules: [
      { base_type: 'shirt', addon_type: 'accessory' },
      { base_type: 'dress', addon_type: 'accessory' },
      { base_type: 'pants', addon_type: 'accessory' }
    ]
  },

  'florist': {
    categories: [
      { name: 'Bouquets', handle: 'bouquets', icon: '💐' },
      { name: 'Arrangements', handle: 'arrangements', icon: '🌸' },
      { name: 'Plants', handle: 'plants', icon: '🪴' },
      { name: 'Gifts', handle: 'gifts', icon: '🎁' }
    ],
    types: [
      { name: 'Bouquet', handle: 'bouquet', is_addon: false },
      { name: 'Arrangement', handle: 'arrangement', is_addon: false },
      { name: 'Plant', handle: 'plant', is_addon: false },
      { name: 'Add-on', handle: 'addon', is_addon: true }
    ],
    attributes: [
      {
        name: 'Occasion',
        handle: 'occasion',
        attribute_type: 'preference',
        is_category_linked: false,
        is_filterable: true,
        options: ['Birthday', 'Anniversary', 'Wedding', 'Sympathy', 'Get Well', 'Thank You', 'Love', 'Congratulations']
      },
      {
        name: 'Flower Type',
        handle: 'flower_type',
        attribute_type: 'feature',
        is_category_linked: false,
        is_filterable: true,
        options: ['Roses', 'Lilies', 'Orchids', 'Tulips', 'Sunflowers', 'Carnations', 'Mixed']
      }
    ],
    addon_rules: [
      { base_type: 'bouquet', addon_type: 'addon' },
      { base_type: 'arrangement', addon_type: 'addon' }
    ]
  },

  'electronics': {
    categories: [
      { name: 'Phones', handle: 'phones', icon: '📱' },
      { name: 'Laptops', handle: 'laptops', icon: '💻' },
      { name: 'Tablets', handle: 'tablets', icon: '📱' },
      { name: 'Audio', handle: 'audio', icon: '🎧' },
      { name: 'Accessories', handle: 'accessories', icon: '🔌' }
    ],
    types: [
      { name: 'Device', handle: 'device', is_addon: false },
      { name: 'Accessory', handle: 'accessory', is_addon: true },
      { name: 'Service', handle: 'service', is_addon: true }
    ],
    attributes: [
      {
        name: 'Brand',
        handle: 'brand',
        attribute_type: 'feature',
        is_category_linked: false,
        is_filterable: true,
        options: ['Apple', 'Samsung', 'Google', 'Sony', 'LG', 'Microsoft', 'Dell', 'HP', 'Lenovo']
      },
      {
        name: 'Storage',
        handle: 'storage',
        attribute_type: 'feature',
        is_category_linked: false,
        is_filterable: true,
        options: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB']
      }
    ],
    addon_rules: [
      { base_type: 'device', addon_type: 'accessory' },
      { base_type: 'device', addon_type: 'service' }
    ]
  }
}

async function seedTemplateTaxonomy() {
  console.log('Seeding template taxonomy...\n')

  // Get all templates
  const { data: templates, error: templatesError } = await supabase
    .from('product_templates')
    .select('id, name, handle')

  if (templatesError) {
    console.error('Error fetching templates:', templatesError)
    return
  }

  for (const template of templates) {
    const taxonomy = TEMPLATE_TAXONOMY[template.handle]

    if (!taxonomy) {
      console.log(`⏭️  ${template.name} - No taxonomy defined, skipping`)
      continue
    }

    console.log(`\n📦 ${template.name}`)
    console.log('─'.repeat(40))

    // 1. Seed categories
    const categoryMap = {}
    if (taxonomy.categories) {
      for (let i = 0; i < taxonomy.categories.length; i++) {
        const cat = taxonomy.categories[i]
        const { data, error } = await supabase
          .from('template_categories')
          .upsert({
            template_id: template.id,
            name: cat.name,
            handle: cat.handle,
            icon: cat.icon,
            display_order: i
          }, { onConflict: 'template_id,handle', ignoreDuplicates: false })
          .select()
          .single()

        if (error) {
          // Try insert without upsert
          const { data: insertData, error: insertError } = await supabase
            .from('template_categories')
            .insert({
              template_id: template.id,
              name: cat.name,
              handle: cat.handle,
              icon: cat.icon,
              display_order: i
            })
            .select()
            .single()

          if (insertError && !insertError.message.includes('duplicate')) {
            console.error(`  ❌ Category ${cat.name}:`, insertError.message)
          } else if (insertData) {
            categoryMap[cat.handle] = insertData.id
            console.log(`  ✅ Category: ${cat.name}`)
          }
        } else if (data) {
          categoryMap[cat.handle] = data.id
          console.log(`  ✅ Category: ${cat.name}`)
        }
      }

      // If we couldn't get IDs from upsert, fetch them
      if (Object.keys(categoryMap).length === 0) {
        const { data: existingCats } = await supabase
          .from('template_categories')
          .select('id, handle')
          .eq('template_id', template.id)

        existingCats?.forEach(c => { categoryMap[c.handle] = c.id })
      }
    }

    // 2. Seed product types
    const typeMap = {}
    if (taxonomy.types) {
      for (let i = 0; i < taxonomy.types.length; i++) {
        const type = taxonomy.types[i]
        const { data, error } = await supabase
          .from('template_product_types')
          .insert({
            template_id: template.id,
            name: type.name,
            handle: type.handle,
            is_addon: type.is_addon,
            display_order: i
          })
          .select()
          .single()

        if (error && !error.message.includes('duplicate')) {
          console.error(`  ❌ Type ${type.name}:`, error.message)
        } else {
          if (data) typeMap[type.handle] = data.id
          console.log(`  ✅ Type: ${type.name}${type.is_addon ? ' (addon)' : ''}`)
        }
      }

      // Fetch existing types if needed
      if (Object.keys(typeMap).length === 0) {
        const { data: existingTypes } = await supabase
          .from('template_product_types')
          .select('id, handle')
          .eq('template_id', template.id)

        existingTypes?.forEach(t => { typeMap[t.handle] = t.id })
      }
    }

    // 3. Seed attributes and options
    if (taxonomy.attributes) {
      for (let i = 0; i < taxonomy.attributes.length; i++) {
        const attr = taxonomy.attributes[i]

        const { data: attrData, error: attrError } = await supabase
          .from('template_attributes')
          .insert({
            template_id: template.id,
            name: attr.name,
            handle: attr.handle,
            attribute_type: attr.attribute_type,
            is_category_linked: attr.is_category_linked,
            is_filterable: attr.is_filterable,
            display_order: i
          })
          .select()
          .single()

        if (attrError && !attrError.message.includes('duplicate')) {
          console.error(`  ❌ Attribute ${attr.name}:`, attrError.message)
          continue
        }

        let attributeId = attrData?.id
        if (!attributeId) {
          // Fetch existing
          const { data: existingAttr } = await supabase
            .from('template_attributes')
            .select('id')
            .eq('template_id', template.id)
            .eq('handle', attr.handle)
            .single()
          attributeId = existingAttr?.id
        }

        if (!attributeId) continue

        console.log(`  ✅ Attribute: ${attr.name} (${attr.is_category_linked ? 'category-linked' : 'global'})`)

        // Seed options
        if (attr.is_category_linked && typeof attr.options === 'object' && !Array.isArray(attr.options)) {
          // Category-linked options
          for (const [catHandle, options] of Object.entries(attr.options)) {
            const categoryId = categoryMap[catHandle]
            for (let j = 0; j < options.length; j++) {
              const optionName = options[j]
              const optionHandle = optionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

              const { error: optError } = await supabase
                .from('template_attribute_options')
                .insert({
                  attribute_id: attributeId,
                  category_id: categoryId,
                  name: optionName,
                  handle: optionHandle,
                  display_order: j
                })

              if (optError && !optError.message.includes('duplicate')) {
                console.error(`    ❌ Option ${optionName}:`, optError.message)
              }
            }
            console.log(`    → ${catHandle}: ${options.length} options`)
          }
        } else if (Array.isArray(attr.options)) {
          // Global options
          for (let j = 0; j < attr.options.length; j++) {
            const optionName = attr.options[j]
            const optionHandle = optionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

            const { error: optError } = await supabase
              .from('template_attribute_options')
              .insert({
                attribute_id: attributeId,
                category_id: null,
                name: optionName,
                handle: optionHandle,
                display_order: j
              })

            if (optError && !optError.message.includes('duplicate')) {
              console.error(`    ❌ Option ${optionName}:`, optError.message)
            }
          }
          console.log(`    → ${attr.options.length} options`)
        }
      }
    }

    // 4. Seed addon rules
    if (taxonomy.addon_rules && taxonomy.addon_rules.length > 0) {
      for (const rule of taxonomy.addon_rules) {
        const baseTypeId = typeMap[rule.base_type]
        const addonTypeId = typeMap[rule.addon_type]

        if (!baseTypeId || !addonTypeId) continue

        const { error: ruleError } = await supabase
          .from('template_addon_rules')
          .insert({
            template_id: template.id,
            base_type_id: baseTypeId,
            addon_type_id: addonTypeId
          })

        if (ruleError && !ruleError.message.includes('duplicate')) {
          console.error(`  ❌ Addon rule:`, ruleError.message)
        } else {
          console.log(`  ✅ Addon rule: ${rule.base_type} → ${rule.addon_type}`)
        }
      }
    }
  }

  console.log('\n' + '═'.repeat(50))
  console.log('✅ Template taxonomy seeding complete!')
}

seedTemplateTaxonomy()
