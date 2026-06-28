# 🌿 Green Nest - PRD Part 1: Project Overview & System Core

## 1. Executive Summary & Vision

Green Nest is a next-generation, AI-driven plant e-commerce platform designed to bridge the gap between plant retail and plant care success. Traditional plant shopping websites lack personalized context, leading to high plant mortality rates for novice buyers. Green Nest solves this problem by integrating a computer-vision-based **Plant Match AI** tool directly into the shopping flow. This tool analyzes user space photos, detects lighting and dimensions, and automatically suggests compatible plants from the active catalog.

### 1.1 Core Objectives
*   **Intelligent Recommendations:** Implement a Vision AI module to suggest indoor/outdoor plants matching environmental lighting and size conditions.
*   **Seamless Purchase Journey:** Simplify discovery, selection, cart management, and payment processing into a modern single-page-app interface.
*   **Comprehensive Management:** Build a feature-rich, dark-mode admin workspace to manage inventory, track order updates, audit AI usage metrics, and visualize performance charts.
*   **Scalable Architecture**: Formulate a decoupled frontend (Next.js 15) and backend API (Express.js) backed by Supabase for database persistence, storage, and authentication.

---

## 2. Target Users & Access Matrix

### 2.1 Target User Profiles
*   **Casual Plant Buyers:** Individuals looking to decorate their spaces with low-maintenance indoor plants, relying heavily on AI verification.
*   **Plant Enthusiasts:** Experienced growers seeking specific scientific varieties, filtration categories, and precise care guides.
*   **Nursery Admins/Owners:** Platform managers who update stock levels, update shipping queues, examine customer spending, and monitor API costs.

### 2.2 Role-Based Access Control (RBAC) Matrix
The platform separates roles into `Guest`, `Customer`, and `Administrator`.

| Feature Modules | Guest User | Verified Customer | Administrator |
| :--- | :--- | :--- | :--- |
| **Browse Catalog** | Read-Only | Read-Only | Full Access |
| **Search & Filter** | Read-Only | Read-Only | Full Access |
| **AI Plant Matcher** | Try Once (No Save) | Unlimited (With Saved History) | View Logs / Usage |
| **Shopping Cart** | Read/Modify (Local) | Read/Modify (DB Synced) | N/A |
| **Order History** | N/A | View Own / Invoices | View All / Update Status |
| **Wishlist** | N/A | Read/Modify Own | N/A |
| **Analytics & Logs** | N/A | N/A | Read-Only Graphs |
| **Product Inventory**| N/A | N/A | CRUD Operations |

---

## 3. Technology Stack & Hosting Foundation

The codebase is structured to optimize speed, scalability, and ease of deployment.

```
       +--------------------------------------------+
       |             Client (Next.js 15)            |
       |  TypeScript, Tailwind CSS, Framer Motion  |
       +---------------------+----------------------+
                             | REST API (JWT)
                             v
       +---------------------+----------------------+
       |           Backend Server (Express)         |
       |        TypeScript, Node.js Runtime         |
       +----------+----------------------+----------+
                  |                      |
                  v                      v
       +----------+-----------+  +-------+----------+
       |   Supabase Platform  |  |  Vision AI APIs  |
       |  PostgreSQL, Auth,   |  | OpenAI GPT-4o /  |
       |     Blob Storage     |  |   Gemini Flash   |
       +----------------------+  +------------------+
```

### 3.1 Frontend Web client
*   **Framework:** Next.js 15 (React 19) utilizing App Router conventions.
*   **Styling:** Tailwind CSS combined with `shadcn/ui` base primitives.
*   **Aesthetic Principle:** Glassmorphism (frosted card panels, gradient lighting glows, floating ambient animations).
*   **Motion Framework:** `framer-motion` for page layout shifts, cart drawers, upload animations, and step-by-step wizards.
*   **Charts Library:** `recharts` for scalable SVG graphs inside the Admin module.

### 3.2 Backend Service Layers
*   **Runtime:** Node.js environment utilizing TypeScript.
*   **Framework:** Express.js structure organizing routers, controllers, and services.
*   **AI SDKs:** Integration hooks for OpenAI's `openai` package or Google's `@google/generative-ai` to handle vision payloads.

### 3.3 Core Database & Security
*   **Database:** Supabase hosted PostgreSQL.
*   **Authentication:** Supabase Auth providing JWT generation and Google OAuth callback redirect loops.
*   **Object Store:** Supabase Storage configured with three target buckets:
    *   `product-images` (Public read, Admin-write)
    *   `avatar-images` (Public read, Authenticated-write)
    *   `ai-uploads` (Authenticated-write only, expires every 30 days)

---

## 4. Non-Functional Requirements

*   **Responsive Adaptation:** Layouts must conform dynamically to Mobile, Tablet, and Desktop breakpoints. The customer application adopts a Mobile-First layout flow.
*   **Loading Speed (Core Web Vitals):** Cumulative Layout Shift (CLS) must remain under `0.1`, and Largest Contentful Paint (LCP) must register in under `2.0 seconds` utilizing Next.js image components and CDN caching.
*   **Authentication Security:** All REST calls interacting with orders, wishlists, or admin features must validate bearer JWT signatures. Admin endpoints check database roles.
*   **SEO Optimization:** Fully dynamic title tags, meta descriptions, open-graph image assets, and logical H1-H6 heading hierarchy matching catalog entries.

---

## 5. Future Enhancements: AI Plant Care Chatbot

An interactive chatbot panel positioned in the lower-right corner of the customer interface, available post-purchase.
*   **Contextual Memory:** Integrates with the customer's purchase history to instantly know what plant types they own.
*   **Visual Diagnosis:** Allows users to upload a photo of yellowing or damaged leaves, feeding it to the Gemini/OpenAI Vision API to get care recovery tips.
*   **Watering Alerts Integration:** Integrates into a local browser notification cron system to remind users when to water their registered plants.
