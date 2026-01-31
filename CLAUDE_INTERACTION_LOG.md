# Claude Interaction Log & Memory
**Last Updated:** 2026-01-05

## CRITICAL RULES - READ FIRST EVERY TIME

### 0. NEVER MODIFY DATABASE WITHOUT PERMISSION
- **NEVER** run SQL commands, curl requests, or scripts that write/update/delete data in the database
- **NEVER** run test commands against the live database
- **ALWAYS** ask user for explicit permission before ANY database change
- This includes: INSERT, UPDATE, DELETE, ALTER TABLE, DROP, or any API calls that modify data
- Code changes are fine — database changes require permission EVERY TIME

### 1. ALWAYS SEARCH BEFORE CREATING
- Before writing ANY code, search for existing patterns
- Look in conversation history first
- Grep the codebase second
- Show what you found before implementing

### 2. USE EXACT FORMATS - NO VARIATIONS
When user says "same format," find the exact code and copy it. NO modifications.

### 3. FULL TEXT CONTROL SET - MANDATORY FOR ALL TEXT
**EVERY text editor MUST include ALL of these controls:**
- ✅ Alignment (left, center, right)
- ✅ Bold
- ✅ Italic
- ✅ Font Size
- ✅ Font Family
- ✅ Color

**No exceptions. If it's text, it gets the full set.**

**Layout Rule:** Styling controls ALWAYS go ON TOP (above) the text input fields, not below.

---

## ESTABLISHED PATTERNS

### Text Editor Controls
**Pattern Type:** UniversalTextEditor
**Location:** `src/components/admin/landing-page/UniversalTextEditor.tsx`
**Usage:** For full text editing with alignment, bold, italic, fonts, colors

**Exact Format:**
```tsx
<UniversalTextEditor
  label="Label Here"
  value={data.field || ''}
  onChange={(value) => updateData('field', value)}
  align={data.field_align || 'center'}
  onAlignChange={(align) => updateData('field_align', align)}
  bold={data.field_bold || false}
  onBoldChange={(bold) => updateData('field_bold', bold)}
  italic={data.field_italic || false}
  onItalicChange={(italic) => updateData('field_italic', italic)}
  fontSize={data.field_font_size || '1rem'}
  onFontSizeChange={(size) => updateData('field_font_size', size)}
  fontFamily={data.field_font_family || 'Josefin Sans'}
  onFontFamilyChange={(family) => updateData('field_font_family', family)}
  color={data.field_color || '#000000'}
  onColorChange={(color) => updateData('field_color', color)}
/>
```

**Pattern Type:** TextEditorControls (without text input)
**Location:** `src/components/admin/landing-page/TextEditorControls.tsx`
**Usage:** For styling controls ONLY (price display, plan titles, features)
**When to use:** When you need the FULL SET of controls but NO text field

**Exact Format (FULL SET - USE THIS):**
```tsx
<TextEditorControls
  label="Label Here"
  value=""
  onChange={() => {}}
  hideTextInput
  textAlign={data.field_text_align}
  onTextAlignChange={(align) => updateData('field_text_align', align)}
  bold={data.field_bold}
  onBoldChange={(bold) => updateData('field_bold', bold)}
  italic={data.field_italic}
  onItalicChange={(italic) => updateData('field_italic', italic)}
  fontSize={data.field_font_size}
  onFontSizeChange={(size) => updateData('field_font_size', size)}
  fontFamily={data.field_font_family}
  onFontFamilyChange={(family) => updateData('field_font_family', family)}
  color={data.field_color}
  onColorChange={(color) => updateData('field_color', color)}
/>
```

**Reference:** Hero banner price editor in `src/components/admin/knowledge-base.tsx` lines 3406-3458

---

### Block Header Controls
**Pattern:** Header actions with alignment, bold, italic, font controls
**Location:** `src/components/admin/landing-page/BlockManager.tsx`
**Usage:** Steps, Accordion, Testimonials, Pricing blocks

**Key Classes:**
- Buttons: `px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600`
- Color picker: `w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform`
- Labels: "Text" and "BG" below color pickers

**Example:** See `renderTestimonialsHeaderActions` in BlockManager.tsx

---

### Cart System Integration
**NEVER link to old shop pages**
**Pattern:** Pass `onAddToCart` prop from parent
**Flow:**
1. Component receives `onAddToCart` prop
2. Fetch product data if needed
3. Call `onAddToCart(product)` - this opens cart sidebar
4. NO localStorage logic
5. NO redirect to `/livechat/shop`

**Reference:** PricingBlock.tsx and hero banner PriceBannerContent

---

## USER CORRECTIONS THIS SESSION

### Date: 2026-01-05

1. **Deleted old PricingBlock files** - Was using wrong component structure
   - Must use hero banner price structure (headline, features, plans)
   - NOT old product_name structure

2. **Currency symbol** - User said "take away the currency symbol"
   - Reason: Already determined at landing page level
   - Don't add currency fields to blocks

3. **Text editors for features** - User said "also add the same text editor for subheadline and features"
   - Applied UniversalTextEditor for subheadline
   - Added styling controls for features

4. **Plan/Price styling** - User said "same format as in hero banner, i told you many many times"
   - Must use TextEditorControls with hideTextInput
   - NOT custom input fields
   - Reference: knowledge-base.tsx lines 3406-3458

5. **Cart integration** - User said old shop link is incorrect
   - Fixed to use parent's addToCart function
   - Opens cart sidebar like hero banner

---

## COMMON MISTAKES TO AVOID

### ❌ Creating new patterns when one exists
**Instead:** Search for existing pattern first

### ❌ Using localStorage for cart
**Instead:** Pass onAddToCart prop from parent

### ❌ Custom styling for text controls
**Instead:** Use TextEditorControls or UniversalTextEditor

### ❌ Adding features not requested
**Example:** Don't add currency symbol if not asked
**Instead:** Only implement what's explicitly requested

### ❌ Improvising on established patterns
**Instead:** Copy exact format from existing code

---

## FILE LOCATIONS

### Landing Page Components
- Block editors: `src/components/admin/landing-page/blocks/`
- Block renderers: `src/components/landing-page/blocks/`
- Block registry: `src/components/admin/landing-page/block-registry.ts`
- Block manager: `src/components/admin/landing-page/BlockManager.tsx`
- Text editors: `src/components/admin/landing-page/UniversalTextEditor.tsx` and `TextEditorControls.tsx`

### Hero Banner
- Editor: `src/components/admin/knowledge-base.tsx` (search for "Price Banner")
- Renderer: `src/app/livechat/page.tsx` (PriceBannerContent function)

### Main Landing Page
- `src/app/livechat/page.tsx` - Contains cart system, addToCart function

---

## WORKFLOW FOR EACH REQUEST

1. **READ THIS FILE FIRST** - Before responding to ANY request
2. **Search conversation history** - Has this been corrected already?
3. **Search codebase** - Find the existing pattern
4. **Show user what you found** - "I found this pattern at X, will use this"
5. **Copy exactly** - No modifications unless explicitly requested
6. **Update this log** - Add any new corrections or patterns

---

## NOTES
- User prefers EXACT copies of existing patterns
- User gets frustrated when same mistakes repeat
- Always reference line numbers when showing patterns
- If unsure, ASK before implementing
