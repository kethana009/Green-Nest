# 🌿 Green Nest - PRD Part 3: Customer Experience & E-Commerce

## 1. Catalog & Product Discovery

The catalog page (`/`) is the primary landing area for plant discovery. It implements search, category filtering, and product grids using glassmorphic UI patterns.

### 1.1 Hero Section
*   **Aesthetics:** High-impact banner with translucent glass panels overlaying a slow-moving organic background gradient (moving from deep forest emerald to vibrant lime green).
*   **Primary CTA:** Prominent action button reading **"Find Your Plant Match"** with a pulse glow animation (`animate-pulse-glow`), linking to `/match`.

### 1.2 Search & Filters Panel
*   **Search Box:** A glass input field supporting query matches on `name`, `scientific_name`, `category`, and items in `benefits` (e.g., searching "Air Purifying" yields compatible results).
*   **Filters Sidebar:**
    *   *Price Range Slider:* An interactive slider to filter prices from $0 to $300.
    *   *Placement Category Toggles:* Buttons to filter by `Indoor` or `Outdoor` locations.
    *   *Care Difficulty Selector:* Dropdown or group buttons for `Beginner`, `Intermediate`, and `Expert` levels.
    *   *Availability Toggle:* Checkbox to display only in-stock items (`stock_quantity > 0`).

### 1.3 Product Cards Grid
*   **Visual Layout:** Responsive grid scaling from 1 column (mobile) to 4 columns (large desktops).
*   **Card Design:** Glassmorphic backing with a slight white border.
    *   *Plant Image:* Centered image with a zoom-in hover transition.
    *   *Badges:* Care difficulty color-coded overlay (Beginner: Green, Intermediate: Yellow, Expert: Red).
    *   *Details:* Bold plant name, italicized scientific name, price, discount tag, and active rating stars.
    *   *Interactive Buttons:*
        *   *Wishlist Heart:* Absolute-positioned icon in the top right. Clicking it triggers a bounce animation and toggles selection state.
        *   *Cart Icon:* Absolute-positioned button in the bottom right. Clicking it adds the item to the cart with a temporary flying leaf success indicator.

```
  +-----------------------------------+
  | [Difficulty: Beginner]     (Heart)|
  |                                   |
  |             [IMAGE]               |
  |         Monstera Deliciosa        |
  |         🧬 Monstera Deliciosa     |
  |                                   |
  |  ⭐⭐⭐⭐ (4.8)   $32.00  [+] Cart|
  +-----------------------------------+
```

---

## 2. Product Details View

Accessible via `/product/[id]`, this page provides detailed care guidance and scientific details for each plant.

### 2.1 Media Grid & Overview
*   **Primary Zoom:** Hovering over the main product photo magnifies the details to show leaf textures.
*   **Detailed Parameters:** Grid of glass info boxes outlining Care Difficulty, Watering Frequency, Sunlight Requirements, and Air Purifying benefits.
*   **Watering Gauge Timeline:** A visual meter tracking the soil moisture curve and indicating the watering point:
    `[-- Overwatered --|-- Perfect (Water Now!) --|-- Underwatered --]`

### 2.2 Tabbed Content Area
Uses glass tab switchers with slide animations (`framer-motion` layout ID):
*   **Description Tab:** Rich text copy describing the plant's origin, look, and room styling advice.
*   **Care Instructions Tab:** Expanded checklist outlining fertilizer requirements, repotting intervals, pet safety warnings, and pruning instructions.
*   **Reviews Tab:** Lists user feedback with individual star counts, text descriptions, and review dates.
    *   *Review Creator:* Form allows verified buyers to submit a 1-5 star rating and comment.

---

## 3. Shopping Cart Logic

The shopping cart exists as a slide-out right drawer and a dedicated `/cart` page.

### 3.1 Cart Operations & Persistence
*   **Guest Persistence:** Guest users can add plants, change quantities, and remove items. The cart persists in `localStorage` as an array of items:
    ```typescript
    interface ICartItem {
      product_id: string;
      quantity: number;
      price: number;
    }
    ```
*   **Authentication Merge:** Upon logging in, the system checks for local cart items, queries the database, and merges them with the customer's remote cart database row, avoiding duplicate items.
*   **Inventory Verification:** Before showing the final cart, the client verifies quantities against active product stock levels, adjusting cart quantities if stock is insufficient and displaying a warning toast.

---

## 4. Checkout & Dummy Payment Gateways

The checkout page (`/checkout`) handles shipping entry and dummy payment simulation.

### 4.1 Step-by-Step Checkout Wizard
*   **Step 1: Shipping Address:** Select a saved address or enter a new shipping address.
*   **Step 2: Shipping Method:** Select shipping speeds (Standard: $5.00, Express: $15.00).
*   **Step 3: Payment Details:** Toggle between Credit Card Simulation and Cash on Delivery.

### 4.2 Visual Credit Card Simulator
Selecting the Card option renders an interactive 3D glass card mockup:
*   As card numbers, names, and expirations are typed into inputs, they render instantly onto the corresponding positions on the card.
*   Focusing on the CVV input triggers a 3D flip animation (`rotateY: 180`), showing the back of the card and CVV strip.
*   Clicking **"Pay Now"** triggers a mock verification progress wheel, updates payment status to `completed` in the database, and redirects the user to the order confirmation page.

```
       +---------------------------------------------+
       |  🌿 GREEN NEST CARD         [VISA Logo]     |
       |                                             |
       |  4000 1234 5678 9010                        |
       |                                             |
       |  VALERIE PENTHOUSE               09 / 30    |
       +---------------------------------------------+
```

### 4.3 Cash on Delivery (COD)
Selecting COD displays a delivery truck illustration. Completing checkout sets the payment status to `pending`, triggers a success dialog, and schedules invoice generation.

---

## 5. Invoices & Order Management

### 5.1 Order Receipts
After placing an order, users can access `/profile` to view details.
*   **Status Tracker:** A visual horizontal progress line tracking shipment statuses:
    `[Order Placed] ===> [Processing] ===> [Shipped] ===> [Delivered]`
*   **Invoice Generator:** Button to download a print-ready PDF invoice containing the seller's details, item summaries, tax calculations, and a unique tracking barcode.
