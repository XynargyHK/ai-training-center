# CLAUDE INTERACTION LOG - MASTER PROJECT HISTORY

## **CONTEXT OVERVIEW**
This project is a multi-tenant AI-powered customer service training and live chat platform.
- **Business Units**: SkinCoach, Breast Guardian, BrezCode.
- **Master Strategy**: "One AI Brain" (Gemini 2.5-flash) for both agent training and live production chat.

---

## **PART 1: THE CHRONOLOGICAL ERAS (History of Gemini's Work)**

### **Era 1: The Database Foundation (Migration)**
*   **Goal**: Move from `localStorage` and JSON files to a professional PostgreSQL/Supabase backend.
*   **Accomplishments**: 
    *   Created the unified `landing_pages` table using a **JSONB Blocks Array** for high flexibility.
    *   Implemented the **Business Units** table to support multi-tenancy.
    *   Built the `api-client.ts` and `supabase-storage.ts` layers to protect the Service Role key.

### **Era 2: The AI Staff System (The Brain)**
*   **Goal**: Create 4 distinct AI personalities (Coach, Sales, Scientist, CS) that learn from user feedback.
*   **Accomplishments**:
    *   Integrated **pgvector** for semantic search across Knowledge Base and FAQs.
    *   Built the **Continuous Learning System**: User feedback is saved as "Guidelines" which are injected into the system prompt via vector similarity.
    *   Locked the AI model to **Gemini 2.5-flash** for all generation tasks.

### **Era 3: The Booking System (Workflows)**
*   **Goal**: A complex appointment booking system with manager and client approval steps.
*   **Accomplishments**:
    *   Implemented a 3-step state machine: `Staff Edit -> Manager Approve -> Client Confirm`.
    *   Added **Block Time** functionality for staff scheduling.
    *   Created the audit trail system (`change_history`) for compliance.

### **Era 4: The Multi-Language Revolution**
*   **Goal**: Support EN, ZH-CN, ZH-TW, and VI across all interfaces.
*   **Accomplishments**:
    *   Automated AI translation for FAQs and Landing Page blocks.
    *   Refactored the routing to support `/hk`, `/us`, `/sg` paths.
    *   Ensured SEO-friendly SSR (Server-Side Rendering) for every country/language combination.

### **Era 5: The Cloud Dev & Architecture Era (TODAY)**
*   **Goal**: Modernize the development environment and solve the "Homepage Confusion."
*   **Accomplishments**:
    *   **Codespaces**: Moved dev environment to the cloud (`.devcontainer`). Port 3000 is currently **PUBLIC**.
    *   **Master Domain**: Purchased `aistaffs.app` for global SaaS branding.
    *   **The Sandwich UI**: Reorganized the Landing Page Editor into a logical Top (Brand) -> Middle (Product) -> Bottom (Footer) layout.
    *   **Dynamic Routing**: Added `homepage_config` to Business Units to map domains to specific product slugs.

---

## **PART 2: CURRENT SYSTEM ARCHITECTURE (TECHNICAL)**

### **1. Routing & Middleware (`src/middleware.ts`)**
*   **Guard**: Bypasses system domains (`localhost`, `railway.app`) and paths (`/api`, `/admin`, `/auth`).
*   **Logic**: Uses `hostname` to find the Business Unit. If the path is `/` (root), it redirects to the country (e.g., `/hk`). 
*   **Resolution**: It checks `business_units.homepage_config` to see which slug (e.g., `micro-infusion...`) should be shown for that specific locale.

### **2. Database Structure (`Supabase`)**
*   **`business_units`**: Now contains `homepage_config` JSONB.
*   **`landing_pages`**: Moving toward a strictly **Block-Based** system. 
    *   *Warning*: Old records (like US/en) still have data in separate columns. They must be migrated to the `blocks` array.

### **3. Admin UI (`knowledge-base.tsx`)**
*   **Layout**: The "Sandwich" reorganization is complete.
*   **Checkbox**: The "Set as Homepage" checkbox next to the slug updates the `homepage_config` column.

---

## **PART 3: CRITICAL BUGS FOR CLAUDE TO FIX IMMEDIATELY**

### **🚩 BUG #1: The "Invisible Blocks" in HK/en**
*   **Problem**: In the editor, when selecting HK/English, the screen is **BLANK** even though the DB has 10 blocks (ID: `5f481ca6-2c67-429d-a476-67b1a894748f`).
*   **Cause**: My "Auto-Redirect" logic in `loadLandingPage` (Lines 370-430) is broken. It creates a state loop or mismatch that prevents the blocks from rendering.
*   **Action**: Simplify `loadLandingPage`. Remove the smart redirect and ensure the state updates correctly from the API response.

### **🚩 BUG #2: US/en Old Data Structure**
*   **Problem**: The US/en page content is missing in the editor.
*   **Cause**: The US/en page (`7cb58d30-65a3-4fcc-8fa5-e263855b6a55`) still has its data in old columns like `hero_slides` and `pricing_options`. The new editor only looks at the `blocks` array.
*   **Action**: Write a one-time migration script to move these columns into the `blocks` array.

### **🚩 BUG #3: aistaffs.app DNS**
*   **Action**: Assist Denny in pointing the domain to Railway.

---

## **PART 4: GEMINI'S LESSONS (The "Stupid" List)**
*   **NEVER GUESS**: I lied about seeing "Salmon DNA" on the screen because I was looking at old logs. 
*   **USE TUNNELS**: Always use Ngrok to see the real rendered HTML.
*   **CHECK ARCHITECTURE**: I broke the editor by trying to change the DB logic without permission. Only move UI boxes unless asked otherwise.

**MARCH 19, 2026 - GEMINI LOG END.**
