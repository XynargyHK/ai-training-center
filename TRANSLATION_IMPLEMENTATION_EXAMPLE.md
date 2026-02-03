# Translation Implementation Examples

This document shows specific examples of how to apply translations in the admin component.

## Currently Working (Already Implemented)

✅ Page title and subtitle
✅ Language selector
✅ "View Live Chat" button
✅ "Business Unit:" label
✅ All 8 navigation tab labels

## Examples for Remaining Elements

### Business Unit Section (Lines ~1700-1710)

**Before:**
```tsx
<button className="...">
  Add Business Unit
</button>
```

**After:**
```tsx
<button className="...">
  {t.addBusinessUnit}
</button>
```

### Training Guidelines Section (Line ~1947)

**Before:**
```tsx
<button className="...">
  Add Guideline
</button>
```

**After:**
```tsx
<button className="...">
  {t.addGuideline}
</button>
```

### FAQ Section (Line ~2420, 2923)

**Before:**
```tsx
<button className="...">
  Add Category
</button>
```

**After:**
```tsx
<button className="...">
  {t.addCategory}
</button>
```

### Booking - Services Section (Lines ~3147, 3157)

**Before:**
```tsx
<button className="...">
  Add Service
</button>

<p>No services yet. Click "Add Service" to create one.</p>
```

**After:**
```tsx
<button className="...">
  {t.addService}
</button>

<p>{t.noServicesYet}</p>
```

### Booking - Staff Section (Lines ~3310, 3320)

**Before:**
```tsx
<button className="...">
  Add Staff Member
</button>

<p>No staff members yet. Click "Add Staff Member" to create one.</p>
```

**After:**
```tsx
<button className="...">
  {t.addStaffMember}
</button>

<p>{t.noStaffYet}</p>
```

### Booking - Outlets Section (Lines ~3687, 3696)

**Before:**
```tsx
<button className="...">
  Add Outlet
</button>

<p>No outlets yet. Click "Add Outlet" to create one.</p>
```

**After:**
```tsx
<button className="...">
  {t.addOutlet}
</button>

<p>{t.noOutletsYet}</p>
```

### Booking - Rooms Section (Lines ~3930, 3939)

**Before:**
```tsx
<button className="...">
  Add Room
</button>

<p>No rooms yet. Click "Add Room" to create one.</p>
```

**After:**
```tsx
<button className="...">
  {t.addRoom}
</button>

<p>{t.noRoomsYet}</p>
```

## Common Button Patterns

### Save/Cancel Buttons

**Before:**
```tsx
<button onClick={handleSave}>Save</button>
<button onClick={handleCancel}>Cancel</button>
```

**After:**
```tsx
<button onClick={handleSave}>{t.save}</button>
<button onClick={handleCancel}>{t.cancel}</button>
```

### Edit/Delete Buttons

**Before:**
```tsx
<button title="Edit">
  <Edit className="w-4 h-4" />
</button>
<button title="Delete">
  <Trash2 className="w-4 h-4" />
</button>
```

**After:**
```tsx
<button title={t.edit}>
  <Edit className="w-4 h-4" />
</button>
<button title={t.delete}>
  <Trash2 className="w-4 h-4" />
</button>
```

## Form Field Labels

### Text Input Labels

**Before:**
```tsx
<label>Service Name</label>
<input placeholder="e.g., Classic Facial, Deep Tissue Massage" />
```

**After:**
```tsx
<label>{t.serviceName}</label>
<input placeholder={t.serviceNamePlaceholder} />
```

### Description Fields

**Before:**
```tsx
<label>Description</label>
<textarea placeholder="Brief description of the service..." />
```

**After:**
```tsx
<label>{t.description}</label>
<textarea placeholder={t.descriptionPlaceholder} />
```

## Modal Titles

### Service Modal

**Before:**
```tsx
<h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
```

**After:**
```tsx
<h3>{editingService ? t.editService : t.addNewService}</h3>
```

### Staff Modal

**Before:**
```tsx
<h3>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
```

**After:**
```tsx
<h3>{editingStaff ? t.editStaffMember : t.addNewStaffMember}</h3>
```

## Status Badges

**Before:**
```tsx
<span className="...">
  {item.is_active ? 'Active' : 'Inactive'}
</span>
```

**After:**
```tsx
<span className="...">
  {item.is_active ? t.active : t.inactive}
</span>
```

## Alert/Confirmation Messages

### Delete Confirmations

**Before:**
```tsx
if (window.confirm(`Delete service "${service.name}"?`)) {
  // delete logic
}
```

**After:**
```tsx
if (window.confirm(t.confirmDeleteService(service.name))) {
  // delete logic
}
```

### Success Messages

**Before:**
```tsx
alert('Service saved successfully!')
```

**After:**
```tsx
alert(t.serviceSaved)
```

## Search Inputs

**Before:**
```tsx
<input
  type="search"
  placeholder="Search entries..."
  className="..."
/>
```

**After:**
```tsx
<input
  type="search"
  placeholder={t.searchEntries}
  className="..."
/>
```

## Section Headers

**Before:**
```tsx
<h2>Booking Management</h2>
<h3>Services</h3>
<h3>Staff</h3>
<h3>Service Assignments</h3>
<h3>Outlets / Locations</h3>
<h3>Treatment Rooms</h3>
```

**After:**
```tsx
<h2>{t.bookingManagement}</h2>
<h3>{t.services}</h3>
<h3>{t.staff}</h3>
<h3>{t.serviceAssignments}</h3>
<h3>{t.outlets}</h3>
<h3>{t.treatmentRooms}</h3>
```

## Loading States

**Before:**
```tsx
<span>Generating...</span>
<span>Fetching...</span>
<span>Testing...</span>
<span>Researching...</span>
```

**After:**
```tsx
<span>{t.generating}</span>
<span>{t.fetching}</span>
<span>{t.testing}</span>
<span>{t.researching}</span>
```

## Implementation Strategy

To fully implement translations:

1. **Start with most visible elements** (already done for tabs, title, subtitle)
2. **Apply button labels** (Add, Edit, Delete, Save, Cancel)
3. **Apply modal titles**
4. **Apply form labels and placeholders**
5. **Apply status messages and alerts**
6. **Apply empty state messages**
7. **Apply help text and descriptions**

Each section follows the same pattern:
1. Find hardcoded English text
2. Replace with `{t.translationKey}`
3. Ensure the translation key exists in `src/lib/translations.ts`

## Testing After Implementation

1. Open admin panel at `/admin`
2. Use language selector to switch between:
   - English
   - 简体中文 (Simplified Chinese)
   - 繁體中文 (Traditional Chinese)
3. Navigate through all tabs
4. Open modals and forms
5. Trigger alerts and confirmations
6. Verify all text translates correctly

## Current Status

**Translations Available**: ✅ 200+ keys for en, zh-CN, zh-TW
**Applied to Component**: ⚠️ Partial (header, tabs, business unit label only)
**Remaining Work**: Apply translations to ~190+ remaining UI elements

The translation system is fully functional and ready to use. The remaining work is mechanical - replacing hardcoded strings with translation references throughout the component.
