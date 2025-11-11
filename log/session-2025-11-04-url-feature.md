# Development Session Log
**Date:** 2025-11-04
**Session Topic:** Adding URL/Web Content Fetching to Knowledge Base

## Session Summary

User requested to add functionality for the AI to search and fetch content from public websites, YouTube, and any URLs to include in the knowledge base.

## Current State Analysis

### Existing Knowledge Base Features
- **Location:** `src/components/admin/ai-training-center.tsx`
- **Upload API:** `src/app/api/upload/route.ts`
- **Supported File Types:**
  - Plain text (.txt)
  - JSON (.json)
  - CSV (.csv)
  - PDF (.pdf)
  - Word documents (.docx, .doc)
  - Excel spreadsheets (.xlsx, .xls)

### Current Implementation
- Files are uploaded via file input and stored in `knowledgebase/` directory
- Content is extracted on the client-side using libraries:
  - `mammoth` for DOCX files
  - `pdfjs-dist` for PDF files
  - `xlsx` for Excel files
- Extracted content is stored as `KnowledgeEntry` objects in localStorage
- Each entry includes: id, category, topic, content, keywords, confidence, timestamps, filePath, fileName

## Planned Implementation

### 1. URL Fetch API Endpoint
**File:** `src/app/api/fetch-url/route.ts`

**Features:**
- Accept POST requests with URL and category
- Validate URL format
- Distinguish between YouTube URLs and regular web pages
- Extract content from web pages:
  - Page title
  - Meta description
  - Meta keywords
  - Main text content (HTML stripped)
- Extract YouTube video information:
  - Video title
  - Author/channel name
  - Video ID
  - Use YouTube oEmbed API (no API key required)

### 2. UI Updates Required
**File:** `src/components/admin/ai-training-center.tsx`

**Additions:**
- Add URL input field in Knowledge Base tab
- Add "Fetch URL" button next to "Upload Files" button
- Handle URL submission and API response
- Display fetched content as new knowledge entry
- Support for both single URLs and batch URL imports

### 3. YouTube Integration
- Extract video ID from various YouTube URL formats:
  - `youtube.com/watch?v=VIDEO_ID`
  - `youtu.be/VIDEO_ID`
  - `youtube.com/embed/VIDEO_ID`
- Use YouTube oEmbed API for metadata
- Store video information for reference

### 4. Web Scraping
- Fetch HTML content from public URLs
- Extract and clean text content
- Remove scripts, styles, and HTML tags
- Normalize whitespace
- Limit content to 10,000 characters
- Extract metadata (title, description, keywords)

## Technical Considerations

### Security
- URL validation to prevent SSRF attacks
- User-Agent header for better compatibility
- Error handling for failed requests
- Timeout handling for slow responses

### Performance
- Content length limiting
- Asynchronous processing
- Progress indicators in UI

### Data Storage
- Store fetched URLs with timestamps
- Track source URL in knowledge entries
- Prevent duplicate URL fetches
- Cache fetched content

## Next Steps

1. ✓ Explore current knowledge base implementation
2. ⏳ Create URL fetch API endpoint (`/api/fetch-url/route.ts`)
3. ⏳ Add YouTube video content extraction
4. ⏳ Update UI to accept URLs (add input field and fetch button)
5. ⏳ Test URL import with various websites
6. ⏳ Test YouTube URL import
7. ⏳ Add error handling and user feedback
8. ⏳ Update documentation

## Benefits

- **Expanded Knowledge Sources:** Users can easily import content from any public website
- **YouTube Integration:** Include video information and metadata in knowledge base
- **Efficiency:** No need to manually copy-paste content from websites
- **Automation:** Potential for bulk URL imports
- **Versatility:** Support for various content types (articles, documentation, videos, etc.)

## Future Enhancements

- Add support for fetching YouTube video transcripts/captions
- Implement URL crawling for multiple pages
- Add RSS feed support
- Schedule periodic URL re-fetching for updated content
- Add website screenshot capture
- Support for authenticated content (with user credentials)
- Add sitemap parsing for bulk imports

---

**Session Status:** In Progress
**Dev Server:** Running on http://localhost:3000
**Next Actions:** Awaiting user approval to proceed with implementation
