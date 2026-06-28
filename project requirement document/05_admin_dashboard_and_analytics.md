# 🌿 Green Nest - PRD Part 5: Admin Dashboard & Analytics

## 1. Dashboard Overview

The Admin workspace (`/admin/dashboard`) is a dedicated console for tracking sales performance, inventory status, and AI tool usage. The dashboard uses a dark glassmorphic design system to create a high-tech dashboard feel.

### 1.1 KPI Widgets Grid
A grid of 4 cards displays high-level business metrics. Each card features a colored neon glow highlighting status changes:
*   **Total Revenue Card:** Displays gross sales with a small green sparkline showing the weekly trend.
*   **Total Orders Card:** Shows the total order count with a badge tracking pending orders.
*   **Total Customers Card:** Tracks active customer accounts and registers weekly sign-ups.
*   **AI Requests Card:** Counts daily Vision API requests, displaying a yellow alert icon if costs or volumes approach monthly limits.

---

## 2. Recharts Data Visualizations

The dashboard features interactive, customizable SVG charts powered by Recharts.

### 2.1 Sales & Revenue Area Chart
*   **Metrics:** Tracks monthly revenue totals and refund rates.
*   **Styling:** Translucent green gradients fill the area under chart lines (`stopColor="hsl(162, 70%, 50%)"`).
*   **Interactive Tooltip:** Hovering over points displays a glassmorphic info box showing sales totals, order counts, and growth percentages for that month.

### 2.2 Product Performance Scatter Matrix
*   **Metrics:** Maps product stock quantities (X-axis) against popularity scores (Y-axis) based on reviews and sales.
*   **Purpose:** Helps admins quickly identify high-demand items that are running low on stock.

### 2.3 AI Rate Limits Gauge
*   **Metrics:** A circular gauge tracking monthly Vision API usage against the platform's API key rate limit.
*   **Visual Warning:** The gauge ring changes color from emerald green to amber yellow at 80% usage, and turns rose red if usage exceeds 95% of the limit.

---

## 3. Product & Stock Management

The product management view (`/admin/products`) provides tools to manage the plant catalog.

```
  +-------------------------------------------------------------+
  |  [+ Add New Product]                    Search Products...   |
  +-------------------------------------------------------------+
  |  Image  Name           Category   Price   Stock   Actions   |
  |  [🪴]   Monstera Del.  Indoor     $32.00  45      [Edit][Del]|
  |  [🌿]   Snake Plant    Indoor     $22.00  12      [Edit][Del]|
  |  [🌸]   Hibiscus       Outdoor    $28.00  0       [Edit][Del]|
  +-------------------------------------------------------------+
```

### 3.1 Inventory Management
*   **Inventory Table:** A sortable data table displaying thumbnail images, names, prices, categories, and stock counts.
*   **Add/Edit Dialog:** A slide-out panel or modal with input fields for scientific names, pricing, description, benefits tags, and care guidelines.
*   **Image Uploader:** A drag-and-drop uploader to add new product photos. Photos are uploaded directly to the Supabase `product-images` bucket, updating the product's image url array.
*   **Stock Status Alerts:** A yellow badge highlights items with low stock (`stock_quantity < 5`), and a red badge marks items that are out of stock.

---

## 4. Order & Shipment Management

Admins manage order fulfillment via `/admin/orders`.

### 4.1 Order Queue & Shipment Updates
*   **Queue Listing:** A list of orders sortable by order date, payment status, and order total.
*   **Fulfillment Workflows:** Admins can select an order to open its details pane and update its shipping status using a dropdown selector:
    `[Pending] -> [Processing] -> [Shipped] -> [Delivered]`.
*   **Status Update Email Trigger:** Updating an order's status to `Shipped` automatically sends a notification email to the user containing their shipping tracking links.
*   **Invoice Generator:** Button to generate and send PDF invoices to customers.

---

## 5. Customer Profiles & Audit History

The customer directory (`/admin/customers`) helps admins review client engagement.

### 5.1 Customer Auditing
*   **Client Profiles:** Displays user contact details, account creation dates, and total lifetime spending.
*   **Order logs:** Lists all past orders placed by the user.
*   **AI Usage Limits:** Displays the user's total AI Match runs. Admins can click a toggle to adjust rate limits or block users if spamming is detected.

---

## 6. AI Log Auditor

The auditor view (`/admin/logs`) provides a log of all Plant Match runs, helping admins monitor matching accuracy and usage metrics.

### 6.1 Log Auditor Elements
*   **Logs Table:** Records the upload timestamp, user ID, detected lighting and space parameters, and matching accuracy score.
*   **Payload Viewer Popover:** Clicking a row opens a glassmorphic details pane displaying the raw image thumbnail alongside the API request and response JSON. This helps developers troubleshoot matching errors or bad recommendations.
*   **Data Exporter:** A button to export logs as a CSV sheet for external analytics.
