# Chat History & Image Storage System

## Overview
Complete chat history tracking system with image storage for compliance, safety monitoring, and issue tracing.

## Architecture

### 1. Database Tables

#### `chat_sessions`
Tracks user chat sessions with metadata
- `id`: Session UUID
- `business_unit_id`: Which business unit
- `ai_staff_id`: Which AI staff member handled the chat
- `user_identifier`: Email, user ID, or anonymous session ID
- `user_ip`: User's IP address
- `user_agent`: Browser info
- `language`: Chat language
- `started_at` / `ended_at`: Session timing
- `total_messages`: Auto-incremented count
- `has_red_flags`: True if contains flagged content
- `flagged_reason`: Why it was flagged

#### `chat_messages`
Individual messages with images
- `id`: Message UUID
- `session_id`: Parent session
- `message_type`: 'user' or 'ai'
- `content`: Message text
- `image_url`: URL to image in Supabase Storage (if has image)
- `has_image`: Boolean flag
- `ai_model`: Which model generated response
- `ai_provider`: anthropic, openai, google
- `tokens_used`: API token usage
- `is_flagged`: Flagged for review
- `flag_reason`: Why flagged
- `sentiment`: positive, negative, neutral

### 2. Supabase Storage

**Bucket**: `chat-images`
- **Access**: Public read, service role write
- **Path**: `{session_id}/{timestamp}-{random}.{ext}`
- **Example**: `abc-123/1732180800-a7f3b.png`

### 3. Image Flow

```
User uploads/captures image
   ↓
Base64 encoded in browser
   ↓
Sent to backend API
   ↓
Converted to Buffer
   ↓
Uploaded to Supabase Storage (chat-images bucket)
   ↓
Public URL returned
   ↓
URL saved in chat_messages.image_url
   ↓
AI analyzes image (sent as base64)
   ↓
Both user message & AI response saved to database
```

## API Functions

### Chat Storage (`src/lib/chat-storage.ts`)

1. **uploadChatImage(imageBase64, sessionId)**
   - Uploads image to Supabase Storage
   - Returns public URL

2. **createChatSession(params)**
   - Creates new chat session
   - Returns session ID

3. **saveChatMessage(params)**
   - Saves message to database
   - Auto-uploads image if provided
   - Returns message ID

4. **loadChatHistory(sessionId)**
   - Loads all messages for a session
   - Returns array of messages

5. **endChatSession(sessionId)**
   - Marks session as ended

6. **flagMessage(messageId, reason)**
   - Flags message for admin review

7. **getFlaggedSessions(businessUnitId)**
   - Gets all flagged sessions for compliance review

### API Route (`/api/chat-history`)

Actions:
- `create_session` - Start new chat session
- `save_message` - Save user/AI message with optional image
- `load_history` - Load chat history
- `end_session` - End chat session
- `flag_message` - Flag suspicious content
- `get_flagged_sessions` - Get flagged chats for review

## Setup Instructions

### 1. Run Database Migration

```bash
# Execute the SQL migration
psql -h your-supabase-host -U postgres -d postgres -f sql-migrations/015_create_chat_history_tables.sql
```

OR use Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `sql-migrations/015_create_chat_history_tables.sql`
3. Run the script

### 2. Create Supabase Storage Bucket

In Supabase Dashboard:
1. Go to **Storage**
2. Click **New Bucket**
3. Name: `chat-images`
4. **Public bucket**: ✅ Yes (for public URLs)
5. **File size limit**: 10MB recommended
6. Click **Create**

### 3. Set Storage Policies

```sql
-- Allow public read
CREATE POLICY "Public can view chat images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chat-images');

-- Allow service role to upload
CREATE POLICY "Service role can upload chat images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'chat-images');
```

### 4. Environment Variables

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Usage in Frontend

### Creating a Session

```typescript
const response = await fetch('/api/chat-history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_session',
    businessUnitId: '77313e61-2a19-4f3e-823b-80390dde8bd2',
    aiStaffId: staff.id,
    userIdentifier: userEmail || `anon-${Date.now()}`,
    language: 'en'
  })
})

const { sessionId } = await response.json()
```

### Saving a Message (with Image)

```typescript
// Save user message with image
await fetch('/api/chat-history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'save_message',
    sessionId: currentSessionId,
    messageType: 'user',
    content: userMessage,
    imageBase64: selectedImage  // Optional: "data:image/png;base64,..."
  })
})

// Save AI response
await fetch('/api/chat-history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'save_message',
    sessionId: currentSessionId,
    messageType: 'ai',
    content: aiResponse,
    aiModel: 'gemini-2.5-flash',
    aiProvider: 'google',
    tokensUsed: 1234
  })
})
```

### Loading Chat History

```typescript
const response = await fetch('/api/chat-history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'load_history',
    sessionId: currentSessionId
  })
})

const { messages } = await response.json()
// messages = [{ id, content, image_url, message_type, created_at, ... }]
```

## Compliance & Safety Features

### Red Flag Detection
- Messages can be flagged automatically or manually
- Flagged sessions marked with `has_red_flags = true`
- Admin dashboard can filter flagged sessions

### Traceability
- Every message has timestamp
- User IP and user agent tracked
- Full conversation history preserved
- Images permanently stored with URLs

### Admin Review
```typescript
// Get all flagged sessions
const response = await fetch('/api/chat-history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get_flagged_sessions',
    businessUnitId: '77313e61-2a19-4f3e-823b-80390dde8bd2',
    limit: 100
  })
})

const { sessions } = await response.json()
```

## Next Steps

1. ✅ Run database migration
2. ✅ Create Supabase Storage bucket
3. ⏳ Update frontend to integrate chat history
4. ⏳ Add automatic content moderation
5. ⏳ Build admin dashboard for flagged sessions

## Security Notes

- Images stored in public bucket (readable by anyone with URL)
- Service role key required for uploads
- RLS policies protect database access
- Consider adding content moderation AI for auto-flagging
- GDPR: Implement data deletion API if needed
