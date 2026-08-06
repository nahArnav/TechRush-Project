# Figma Design & UI Directive: "FindIt" Campus Lost & Found System Updates

## Role & Goal
You are a Lead UI/UX & Systems Designer working on the Figma design system and component file for **FindIt**, a Campus Lost & Found web application.

Your objective is to fix layout responsiveness issues, restructure specific modals, build missing UI flows (SafeChat & Handover), and implement an interactive Campus Map using the attached reference spatial layout.

---

## STRICT DESIGN SYSTEM RULES
- **DO NOT redesign or rebrand the core interface.**
- **Preserve existing Glassmorphism tokens:** Dark/Light translucent fills (`rgba(255,255,255,0.08)` / `rgba(15,23,42,0.6)`), backdrop blur (`12px-20px`), subtle border stroke (`1px solid rgba(255,255,255,0.15)`), and smooth corner radii (`12px-20px`).
- **Typography & Colors:** Maintain existing font families, heading scales, and status color tokens.
- **Responsive Auto-Layout:** All frames and components MUST use Figma Auto Layout (`Fill Container` / `Hug Contents`) with rigid constraints to prevent narrow vertical compression or overlapping text.

---

## SPECIFIC DESIGN TASKS & COMPONENT SPECIFICATIONS

### Task 1: Fix "Report an Item" Modal Frame
- **Modal Frame Constraints:** Set desktop frame width to **60%–70% of viewport width** (min-width: `680px`). Do NOT use narrow popup dimensions.
- **Upload Section:**
  - Create a dedicated drop-zone component card with Auto Layout (`Fill Container` horizontal, fixed height `160px`).
  - Contains: Upload Icon, Drag & Drop text label, and secondary helper text.
  - Fix issue where upload card compresses into a thin vertical strip.
- **Form Layout Grid:**
  - Use a 2-column responsive Auto Layout grid for standard fields:
    - *Row 1:* Item Name | Category
    - *Row 2:* Building | Floor
    - *Row 3:* Exact Location | Date & Time
  - Full-width fields for: Description textarea.
- **Anonymous Toggle Alignment:** Align inline with horizontal flex container (`Space Between`), ensuring label and toggle switch do not overlap or break lines.
- **Footer CTA:** Anchor the "Submit Report" button at the bottom frame with fixed positioning / sticky footer layout.

---

### Task 2: Interactive Campus Map Section (Student Dashboard)
Convert the "Campus Map" view into a full-width interactive frame using the provided reference layout.

#### A. Map Spatial Grid Layout (Based on Reference Image)
Recreate the dark glassmorphism campus layout frame containing dark rounded gradient blocks (`bg-slate-900/90` with inner glow):
- **Far Left Column:** `Parking 1` (vertical pill) | `A1 Building` (vertical pill).
- **Top Center Region:** `Library` (top horizontal block) contiguous with `A3 Building` (vertical stem forming an L-shape block).
- **Center-Right Region:** `Ground` (large squarish block).
- **Far Right Column (Stacked):** `Girls Hostel` (top) | `Canteen` (middle) | `Boys Hostel` (bottom).
- **Middle Dividing Axis:** Horizontal rectangular walkway / pathway strip across the lower midsection.
- **Bottom Axis (Left to Right):** `Gate` (small block) | `F Building` (medium block) | `Parking 2` (wide horizontal pill).

#### B. Hotspots & Building Modal Interaction
- **Clickable Hotspots:** Set each building block as an interactive component state (Default, Hover Glow, Active/Selected).
- **Floor Plan Side-Panel / Glass Modal:**
  - On clicking a hotspot, trigger a slide-in glassmorphism modal on the right side (or center overlay).
  - Include Floor Navigation: Segmented Tabs or Dropdown (`Ground` | `1st Floor` | `2nd Floor` | `3rd Floor`).
  - Render floor layout vector outline with distinct item location pins per floor.

#### C. Interactive Map Pins & Status Tokens
Create pin component variants with glowing outer rings for item statuses:
- 🔴 **Lost Item Pin** (`#EF4444`)
- 🟢 **Found Item Pin** (`#10B981`)
- 🟡 **Claimed Item Pin** (`#F59E0B`)
- 🔵 **Recently Reported Pin** (`#3B82F6`)
- **Pin Click Popover Card:** Displays *Item Name*, *Category*, *Status Badge*, *Last Seen Location*, *Timestamp*, and a primary button **"View Details"**.
- **Location Focus State:** Include a variant state featuring an animated double-ring ripple/pulse circle around pins when highlighted from search results.

#### D. Map Context Menu (Direct Reporting)
- Create a Right-Click / Long-Press Context Menu component overlay containing two action items:
  1. `Report Lost Item Here`
  2. `Report Found Item Here`
- Clicking either pre-fills `Building Name`, `Floor Number`, and `Map Coordinates` into the pre-configured Report Item form.

---

### Task 3: Global Header & Navigation Fixes
1. **Light / Dark Theme Switcher:**
   - Add a functional Light/Dark Theme Toggle button component to the main top navigation bar across **Home Page** and **Login Page**.
2. **Bottom Navigation "Home" Redirection:**
   - On the Student Dashboard bottom navigation bar, wire the **Home** icon component instance to navigate back to the primary Home Dashboard view.
3. **Remove "CCTV" Option:**
   - Remove the **CCTV** card/button from the Student Dashboard lower options layout.
   - Re-balance the remaining bottom cards in a clean 3-column Auto Layout grid (`Campus Map` and remaining options).
4. **Login Page Header Cleanup:**
   - Update the top navigation frame on the **Login Page**:
   - Keep ONLY: **Home** and **Support & Help**.
   - **Remove** the redundant **Contact** link.

---

### Task 4: New Component Flows — SafeChat & Handover UI

#### A. SafeChat Interface (Drawer / Modal Frame)
Create a secure peer-to-peer messaging overlay for Lost & Found item recovery:
- **Header:** Item Thumbnail, Title ("Black Leather Wallet"), Status Badge, and User Anonymized ID/Role badge.
- **Chat Body:**
  - Glassmorphism messaging container with scrollable message list.
  - Left-aligned bubbles: Other User (translucent dark slate).
  - Right-aligned bubbles: Current User (accent glass blue).
  - Time stamps and delivery indicators.
- **Safety Banner:** Prominent top notice card: *"Meet in public campus areas (e.g., Canteen, Library Gate) for item exchanges."*
- **Footer:** Text input box with attachment icon and primary "Send" button.

#### B. Item Handover Verification UI
Create a verification modal flow triggered from the SafeChat header or Item Details view:
- **OTP Verification State:**
  - Displays a 4-digit or 6-digit PIN input code box for verification during physical item return.
  - "Generate Handover Code" button for the Finder.
  - "Enter Handover Code" input field for the Seeker.
- **QR Code Verification State:**
  - High-contrast white container wrapper (`bg-white`, `p-4`, `rounded-xl`) holding a readable QR code.
  - "Scan to Complete Handover" status label with a green "Confirm Match & Close Case" action button.

---

## FIGMA FILE STRUCTURE & OUTPUT EXPECTATIONS
- Organize layouts into clear Figma pages: `01_Design_Tokens`, `02_Navigation_&_Headers`, `03_Campus_Map_&_Hotspots`, `04_Modals_&_Forms`, `05_SafeChat_&_Handover`.
- All auto-layout paddings must adhere to 8px spatial grid constraints (`8px`, `16px`, `24px`, `32px`).
- Ensure complete Light and Dark theme variants for all newly created SafeChat, Handover, Map, and Modal components.