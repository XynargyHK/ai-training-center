# SkinCoach System Plan

## Overview
SkinCoach is a personalized skincare e-commerce system. Products include base products (cleansers, serums, creams) and addons (boosters) that enhance them. AI recommends personalized routines based on customer concerns.

---

## Core Data Structure

### Products Hierarchy
```
BASE PRODUCTS              ADDONS (Boosters)
─────────────              ─────────────────
Cleanser            +      Vitamin C Booster, Tea Tree Booster
Face Serum          +      Retinol Booster, Hyaluronic Booster
Face Cream          +      Peptide Booster, Niacinamide Booster
Eye Cream           +      Caffeine Booster
Body Lotion         +      Firming Booster
Scalp Treatment     +      Hair Growth Booster
```

### Categories (Body Areas)
- Face
- Eye
- Body
- Scalp/Hair

### Concerns (Customer Pain Points)

| Category | Concerns |
|----------|----------|
| **Face** (11) | Acne, Redness/Rosacea, Pigmentation/Dark Spots, Sagging, Fine Lines/Wrinkles, Uneven Texture, Large Pores, Dullness, Dryness, Oiliness, Sensitivity |
| **Eye** (3) | Eye Bags, Dark Circles, Crow's Feet |
| **Body** (9) | Stretch Marks, Cellulite, Eczema, Psoriasis, Varicose Veins, Cysts/Nodules, Rashes, Underarm Odor, Dry Skin |
| **Scalp/Hair** (7) | Hair Loss/Thinning, Dandruff, Scalp Acne, Scalp Irritation, Oily Scalp, Dry Scalp, Premature Graying |

**Total: 30 concerns**

---

## Database Relationships

```
1. products ←──pairs with──→ addons (product_addon_matches)
   "Face Serum"              "Vitamin C Booster"

2. addons ←──addresses──→ concerns (booster_concern_mapping)
   "Vitamin C Booster"       "Pigmentation", "Dullness"

3. concerns ←──belongs to──→ category
   "Pigmentation"            "Face"
```

### Key Tables:
- `products` - All products (base + boosters)
- `product_categories` - Face, Eye, Body, Scalp
- `product_addon_matches` - Which boosters go with which base products
- `skin_concerns` - Master list of 30 concerns (NEW)
- `booster_concern_mapping` - Which boosters address which concerns (NEW)

---

## Implementation Phases

### Phase 1: Concerns System (CURRENT)
- [x] Define concerns list (30 concerns across 4 categories)
- [ ] Create `skin_concerns` table
- [ ] Create `booster_concern_mapping` table
- [ ] Seed 30 concerns
- [ ] Update/create UI to manage booster ↔ concern mappings
- [ ] AI auto-suggest initial mappings using Gemini

### Phase 2: Quiz & Profile System (FUTURE)
- Customer assessment quiz (already exists at skincoach.ai)
- Collect: gender, age, skin type, concerns, climate, budget
- Store in `customer_profiles` table
- Link concerns to customer
- NOTE: Quiz/assessment is OPTIONAL for other industries
  - Coaching services: likely need assessment
  - Retail/outlet: may not need assessment
  - Make this configurable per business unit

### Phase 3: AI Recommendation Engine (FUTURE)
- Build personalized routine from quiz results
- Match: concerns → boosters → base products
- Create bundle combinations
- Category-based or duration-based bundles

### Phase 4: Offer & Closing Strategy (FUTURE)
- Progressive offer strategy:
  1. Complete 6-month bundle (40% off)
  2. 3-month bundle (30% off)
  3. 1-month starter (20% off)
  4. Category-only bundle
  5. Single product
- Objection handling
- Risk reversal (90-day guarantee)
- Free shipping threshold ($100+)
- Urgency/scarcity messaging

---

## AI Sales Flow (Target State)

```
Quiz Complete
     ↓
"Based on your profile (35F, combination skin, humid climate),
 your main concerns are: Acne, Large Pores, Oiliness"
     ↓
"I've created your personalized routine:"
 • Clarifying Cleanser + Tea Tree Booster
 • Pore-Minimizing Serum + Niacinamide Booster
 • Oil-Control Moisturizer + Mattifying Booster
     ↓
"BEST VALUE: 6-month supply - $XXX (Save 40%)"
     ↓
[Customer hesitates]
     ↓
"How about starting with 3 months? $XXX (Save 30%)"
     ↓
[Still hesitant]
     ↓
"Try our 1-month starter kit - $XXX (Save 20%)
 + FREE shipping + 90-day money-back guarantee"
     ↓
[Close the deal]
```

---

## Generic Structure (For Other Industries)

This concern-based addon system works for any industry:

| Industry | Categories | Concerns | Addons |
|----------|------------|----------|--------|
| **Spa** | Back, Neck, Feet, Full Body | Muscle tension, Stress, Poor circulation | Hot stone, Aromatherapy, CBD oil |
| **Hair Salon** | Color, Texture, Scalp, Ends | Brassiness, Frizz, Damage | Toner, Keratin, Olaplex |
| **Dental** | Aesthetics, Sensitivity, Gums | Staining, Cold sensitivity, Bleeding | Whitening, Fluoride, Deep clean |
| **Auto Detail** | Exterior, Interior, Wheels, Glass | Scratches, Odors, Brake dust | Ceramic coating, Ozone, Clay bar |
| **Pet Grooming** | Coat, Skin, Nails, Ears | Matting, Itchiness, Overgrown nails | De-shedding, Medicated shampoo |
| **Fitness** | Weight, Strength, Mobility, Recovery | Stubborn fat, Tightness, Soreness | Nutrition plan, Stretching, Massage |

---

## Reference URLs
- SkinCoach landing page with quiz: skincoach.ai
- Admin system: ai-training-center

---

*Last updated: Session working on Phase 1*
