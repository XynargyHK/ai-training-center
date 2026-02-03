# Translation Implementation Guide

## ✅ Completed Work

### Translation Interface
- **Total translation keys**: 200+
- **Languages fully implemented**:
  - ✅ English (en)
  - ✅ Simplified Chinese (zh-CN)
  - ✅ Traditional Chinese (zh-TW)
  - ⚠️ Vietnamese (vi) - Base translations only, needs expansion

### Translation Categories

1. **Common Buttons** (8 keys)
   - add, edit, delete, save, cancel, update, create, search

2. **Status & States** (3 keys)
   - active, inactive, status

3. **Business Unit Management** (7 keys)
4. **Knowledge Base Tab** (17 keys)
5. **Training Tab** (39 keys)
6. **FAQ Tab** (17 keys)
7. **Canned Messages Tab** (18 keys)
8. **Booking Management** (94 keys)
   - Services (11 keys)
   - Staff (14 keys)
   - Service Assignments (9 keys)
   - Outlets/Locations (21 keys)
   - Treatment Rooms (24 keys)
9. **Analytics Tab** (3 keys)
10. **AI Model Settings Tab** (21 keys)
11. **Confirmations & Alerts** (4 keys)

## How to Use Translations in Components

### Step 1: Import Translation Function
```typescript
import { type Language, getTranslation } from '@/lib/translations'
```

### Step 2: Add Language State
```typescript
const [selectedLanguage, setSelectedLanguage] = useState<Language>('en')
```

### Step 3: Get Translation Object
```typescript
const t = getTranslation(selectedLanguage)
```

### Step 4: Apply Translations
Replace hardcoded strings with translation references:

```typescript
// Before:
<button>Add Service</button>

// After:
<button>{t.addService}</button>
```

## Common Translation Patterns

### Simple Strings
```typescript
{t.save}
{t.cancel}
{t.businessUnit}
```

### Function-based Translations (with parameters)
```typescript
{t.importSuccess(count)}
{t.error(errorMessage)}
{t.confirmDeleteService(serviceName)}
{t.staffMembers(selectedCount)}
```

### Placeholder Text
```typescript
<input placeholder={t.serviceNamePlaceholder} />
<input placeholder={t.searchEntries} />
```

### Button Titles (tooltips)
```typescript
<button title={t.uploadFilesTitle}>
  {t.uploadFiles}
</button>
```

## Key Translation Mappings

### Buttons
| English | Key | 简体中文 | 繁體中文 |
|---------|-----|----------|----------|
| Add | `t.add` | 添加 | 新增 |
| Edit | `t.edit` | 编辑 | 編輯 |
| Delete | `t.delete` | 删除 | 刪除 |
| Save | `t.save` | 保存 | 儲存 |
| Cancel | `t.cancel` | 取消 | 取消 |
| Update | `t.update` | 更新 | 更新 |
| Create | `t.create` | 创建 | 建立 |
| Search | `t.search` | 搜索 | 搜尋 |

### Status
| English | Key | 简体中文 | 繁體中文 |
|---------|-----|----------|----------|
| Active | `t.active` | 启用 | 啟用 |
| Inactive | `t.inactive` | 禁用 | 停用 |
| Status | `t.status` | 状态 | 狀態 |

### Common Phrases
| English | Key | 简体中文 | 繁體中文 |
|---------|-----|----------|----------|
| Please fill in all fields | `t.pleaseFilldAll` | 请填写所有字段 | 請填寫所有欄位 |
| Are you sure? | `t.areYouSure` | 确定吗？ | 確定嗎？ |
| This action cannot be undone | `t.actionCannotBeUndone` | 此操作无法撤消 | 此操作無法復原 |

## Next Steps for Full Implementation

To apply all translations to the admin component, you need to:

1. **Add translation object** to `ai-training-center.tsx`:
   ```typescript
   const t = getTranslation(selectedLanguage)
   ```

2. **Replace all hardcoded strings** with `t.*` references

3. **Priority areas** (most visible to users):
   - Button labels (Add, Edit, Delete, Save, Cancel)
   - Form field labels
   - Tab names (already done)
   - Modal titles
   - Alert/confirmation messages
   - Placeholder text

## Example Replacements

### Before:
```typescript
<button>Add Service</button>
<input placeholder="Service name..." />
<h3>Services</h3>
{confirm('Delete service?')}
```

### After:
```typescript
<button>{t.addService}</button>
<input placeholder={t.serviceNamePlaceholder} />
<h3>{t.services}</h3>
{confirm(t.deleteFaq)}
```

## Vietnamese Translations

Vietnamese base translations are available but need expansion. To add Vietnamese translations:

1. Find the `'vi'` section in `src/lib/translations.ts`
2. Add the same keys as in `zh-CN` and `zh-TW`
3. Translate each string to Vietnamese

The structure is already in place - just needs translation work.

## Files Modified

- `src/lib/translations.ts` - Added 200+ translation keys for en, zh-CN, zh-TW
- `src/components/admin/ai-training-center.tsx` - Added language selector (header translations already applied)

## Testing Translations

1. Open the admin panel at `/admin`
2. Click the language selector (Globe icon next to "View Live Chat")
3. Select different languages to see translations
4. Currently working: Page title, subtitle, tab labels, business unit label
5. To be applied: All button labels, form fields, messages throughout the component

