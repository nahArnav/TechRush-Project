# Figma UI/UX Directive: "FindIt" Campus Lost & Found System Updates

## Role & Goal
You are a Lead UI/UX & Systems Designer updating the Figma design file for **FindIt**, a Campus Lost & Found web application.

Your objective is to implement **4 core structural, navigational, and workflow updates** across the Login, Dashboard, Modals, and Header components.

---

## STRICT DESIGN CONSTRAINTS
- **Design System Integrity:** Maintain the existing glassmorphism theme, translucent fills (`rgba(255, 255, 255, 0.08)` / `rgba(15, 23, 42, 0.6)`), backdrop blur (`12px-20px`), subtle border stroke (`1px solid rgba(255, 255, 255, 0.15)`), corner radii (`12px-20px`), typography, and color tokens.
- **Auto Layout Rigidity:** All components and modal frames must use Figma Auto Layout (`Fill Container` / `Hug Contents`) with rigid constraints to prevent broken spacing or overlapping fields.
- **Dark/Light Mode Parity:** Ensure every new component variant supports both Light and Dark mode states seamlessly.

---

## SPECIFIC TASK DIRECTIVES

### 1. Unified Design & Theming (Login & Dashboard)
- **Core Task:** Standardize the placement and styling of the Dark/Light mode toggle button.
- **Login Header Update:**
  - Insert a clean, minimal Dark/Light mode toggle button in the top-right corner of the **Login Page Header**.
  - **Pixel & Style Parity:** Match the exact pixel dimensions, right/top margins, padding, border radius, and hover transitions as the toggle instance on the post-login Dashboard header.
  - **Visual Continuity:** Ensures that when a user logs in, the theme toggle remains completely static in visual position between screens.

---

### 2. Landscape Layout Popup Interfaces (Claim & Report Workflow)
- **Core Task:** Convert all vertical stacked popup modals into modern, wide desktop landscape modals.
- **Frame Constraints:**
  - Width: Wide landscape aspect ratio (min-width `880px` up to `1080px`).
  - Layout: Multi-column horizontal Auto Layout grid (`Direction: Horizontal`, `Gap: 20px-24px`).
  - Text Alignment: Left-aligned content across all interior cards and fields.

#### Modal Specifications:
1. **Report an Item Modal (3-Column Landscape Grid):**
   - **Column 1 (Upload Block):** Dedicated square/portrait image dropzone with upload icon, helper text, and file preview area.
   - **Column 2 (Item Details Form):** Inputs for *Item Name*, *Category*, *Date/Time Found*, and *Description*.
   - **Column 3 (Location Pin Map):** Embedded interactive mini-map block allowing users to drop a pin on campus buildings, accompanied by the submit action CTA.

2. **Your Claim Status Modal (3-Column Landscape Grid):**
   - **Column 1 (Status Timeline):** Horizontal visual progress tracker (`Submitted` → `Under Review` → `Approved` → `Handoff Ready`).
   - **Column 2 (Proof Verification Description):** Display user-submitted claim details, description text, and upload proof thumbnail.
   - **Column 3 (Identity & Action Prompt):** Location selection buttons (e.g., `[Kessler Hall]`, `[Kessler Security Office]`) and "Verify Identity" CTA button.

---

### 3. Sidebar Navigation & Safe Chat "Messenger" UI
- **Core Task:** Add a dedicated peer-to-peer Safe Chat view to the application layout.

#### A. Navigation Sidebar Addition
- Add a new navigation item: **"Chats"** (or **"Messages"**) in the left-hand navigation sidebar directly below the main menu options. Include a modern chat bubble icon.

#### B. Main Messenger Layout (Split View)
When the "Chats" tab is active, transform the main canvas into a 2-column Messenger application frame:
- **Left Column (Chat List Panel - 30% Width):**
  - Search input for messages.
  - Scrollable list of active conversations. Each card displays:
    - Item Thumbnail (e.g., small square preview of the wallet/keys).
    - Other Person's Name (e.g., "Sam R.").
    - Last message snippet & timestamp.
    - Status Badge (e.g., `Found`, `Claim Pending`).
- **Main Column (Active Chat Window - 70% Width):**
  - **Persistent Header:** Displays the other user's name, verified role tag, Item Thumbnail + Item ID/Name, and current case status.
  - **Security Banner:** Top notice card: *"Peer-to-peer connection for active case #FD-1082. Meet in designated campus handoff points for exchanges."*
  - **Message Stream:** Translucent glass message bubbles (Left-aligned for sender, Right-aligned for current user).
  - **Conversation Controls (Footer):**
    - Text input field.
    - Photo attachment icon button (for additional verification photos).
    - Prominent action button: **"Propose Handoff"** / **"Confirm Receipt"**.

---

### 4. Header Update: User Profile & Dropdown (Removing Online Status)
- **Core Task:** Clean up top header status and add comprehensive profile controls.

#### Header Modifications:
1. **Status Removal:** Locate and completely remove the green/red "Online/Offline" status dot from the top-right header section.
2. **Profile Component Addition:**
   - Add a User Profile block in place of the removed status indicator.
   - Structure: `36px` circular avatar placeholder (student photo) + User Name (`Alex J.`) + subtle dropdown arrow icon.
3. **Profile Dropdown Menu (Overlay Variant):**
   - Clicking the profile block triggers a glassmorphism dropdown menu.
   - Options: `View/Edit Profile`, `Saved Handoff Points`, `Preferences`, and `Log Out`.

#### Profile & Settings Page Frame:
- Clicking "Edit Profile" navigates to a new page frame containing editable glassmorphism cards:
  - **Personal Info:** Name, Campus Student ID (e.g., `STU-2024-889`), Email, Preferred Contact Method.
  - **Saved Handoff Points:** Preferred campus meeting spots (e.g., *Main Library Gate*, *Student Canteen Ground Floor*).

---

## OUTPUT EXPECTATIONS
- Updated Frame Variants for **Login View** and **Dashboard View** showing exact header alignment.
- **Landscape Modal Components** for Report and Claim flows using 3-column auto-layout.
- Full **Messenger Application View** page layout.
- **Header Profile Component Set** including Dropdown hover and click states.