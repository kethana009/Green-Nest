# 🌿 Green Nest - Product Requirements Document (PRD)

**Version:** 1.0

**Prepared By:** Kethana Gayathri Gunti

**Project Type:** AI-Powered Plant E-Commerce Platform

**Technology Stack:** Next.js, Node.js, Express.js, Supabase, TypeScript, Tailwind CSS

---

# Table of Contents

1. Executive Summary
2. Project Vision
3. Objectives
4. Project Scope
5. Target Users
6. User Roles
7. Functional Requirements
8. Customer Application
9. Admin Dashboard
10. Non-Functional Requirements
11. Technology Stack
12. Future Enhancement

---

# 1. Executive Summary

Green Nest is an AI-powered e-commerce platform that enables customers to discover and purchase plants while receiving intelligent recommendations based on their living environment.

Unlike traditional online plant stores, Green Nest includes an AI-powered Plant Match feature that analyzes a customer's room image and recommends suitable indoor or outdoor plants based on lighting conditions, available space, and environmental characteristics.

The platform consists of two primary modules:

* Customer Application
* Admin Dashboard

The objective is to simplify plant shopping while providing personalized recommendations and an efficient administration system.

---

# 2. Project Vision

To create an intelligent plant shopping platform that helps users choose suitable plants for their homes using Artificial Intelligence while providing a seamless and modern online shopping experience.

---

# 3. Objectives

* Build a modern plant e-commerce platform.
* Provide AI-powered plant recommendations.
* Simplify online plant purchasing.
* Improve user experience through personalized suggestions.
* Provide administrators with complete business management tools.
* Build a scalable and secure application using modern technologies.

---

# 4. Project Scope

The Green Nest platform includes the following modules.

## Customer Module

* User Registration
* Authentication
* Home / Catalog
* Product Search
* Product Filtering
* Plant Match AI
* Product Details
* Shopping Cart
* Checkout
* My Orders
* Wishlist
* Profile Management

## Admin Module

* Dashboard Overview
* Product Management
* Order Management
* Customer Management
* Analytics
* AI Logs

---

# 5. Target Users

## Customers

Users who wish to purchase indoor or outdoor plants with AI-assisted recommendations.

## Plant Enthusiasts

Users interested in discovering suitable plants for their homes.

## Nursery Owners

Businesses that manage inventory, customers, and orders using the admin dashboard.

---

# 6. User Roles

## Customer

Customers can:

* Register
* Login
* Browse products
* Search plants
* Filter products
* Upload room images
* Receive AI recommendations
* Add products to wishlist
* Add products to cart
* Place orders
* Track orders
* Download invoices
* Manage profile

---

## Administrator

Administrators can:

* View dashboard overview
* Manage products
* Manage inventory
* Manage orders
* View customer profiles
* Monitor AI usage
* View analytics
* Generate reports

---

# 7. Functional Requirements

## Authentication

### Customer

* Email Registration
* Email Login
* Google Login
* Password Reset
* Email Verification
* Logout
* Session Management

### Administrator

* Secure Login
* JWT Authentication
* Role-Based Access Control
* Session Timeout

---

# 8. Customer Application

## 8.1 Home / Catalog

### Purpose

Display all available plants and help users discover products.

### Features

* Hero Banner
* Featured Plants
* New Arrivals
* Best Sellers
* Trending Products

### Search

Users can search by:

* Plant Name
* Category
* Plant Benefits

### Filters

* Price
* Category
* Indoor / Outdoor
* Difficulty Level
* Rating
* Availability

### Product Card

Each product displays:

* Plant Image
* Plant Name
* Price
* Discount
* Rating
* Stock Status
* Wishlist Button
* Quick View
* Add to Cart

---

## 8.2 Plant Match AI

### Objective

Recommend suitable plants by analyzing the user's room image.

### Workflow

1. User uploads an image.
2. AI analyzes the environment.
3. AI recommends suitable plants.
4. User can save the recommendation.
5. Recommended plants can be added directly to the shopping cart.

### AI Analysis

The AI identifies:

* Lighting Conditions
* Available Space
* Indoor / Outdoor Environment
* Estimated Ventilation

### AI Recommendation

Results include:

* Recommended Plants
* Confidence Score
* Placement Suggestions
* Care Difficulty
* Watering Frequency

### Additional Features

* Save Recommendation
* Recommendation History
* Download Recommendation Report

---

## 8.3 Product Details

Displays:

* Product Images
* Scientific Name
* Description
* Price
* Discount
* Reviews
* Ratings
* Care Instructions
* Delivery Information
* Similar Products

### Actions

* Add to Cart
* Buy Now
* Add to Wishlist

---

## 8.4 Shopping Cart

### Features

* Add Products
* Remove Products
* Update Quantity
* Shipping Calculation
* Order Summary

---

## 8.5 Checkout

### Checkout Process

* Shipping Address
* Delivery Information
* Dummy Payment Gateway
* Cash on Delivery
* Order Confirmation
* Invoice Generation

---

## 8.6 My Orders

Users can:

* View Order History
* Track Order Status
* Download Invoice

---

## 8.7 User Profile

Users can manage:

* Personal Information
* Profile Picture
* Saved Addresses
* Wishlist
* Order History
* AI Recommendation History

---

# 9. Admin Dashboard

## 9.1 Dashboard Overview

Display:

* Total Revenue
* Total Orders
* Total Customers
* Total Products
* AI Requests
* Low Stock Alerts

---

## 9.2 Product Management

Administrators can:

* Add Products
* Edit Products
* Delete Products
* Manage Categories
* Upload Product Images
* Manage Inventory
* Configure Discounts

---

## 9.3 Order Management

Administrators can:

* View Orders
* Update Order Status
* Generate Invoices
* Assign Shipments

---

## 9.4 Customer Management

Administrators can:

* View Customer Profiles
* View Purchase History
* View AI Usage
* View Total Spending
* Manage Customer Accounts

---

## 9.5 Analytics

Generate reports for:

* Revenue Reports
* Customer Insights
* Product Performance

---

## 9.6 AI Logs

Store the following information:

* Uploaded Image
* AI Recommendation
* Confidence Score
* Processing Time
* Timestamp
* User Information

Administrators can:

* Search Logs
* Filter Logs
* Export Logs

---

# 10. Non-Functional Requirements

* Responsive Design
* Fast Page Load (Less than 2 Seconds)
* Secure Authentication
* Mobile-First Design

---

# 11. Technology Stack

## Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion

## Backend

* Node.js
* Express.js

## Database

* Supabase PostgreSQL

## Authentication

* Supabase Authentication

### Supported Methods

* Email & Password
* Google Authentication

## Storage

* Supabase Storage

Used for:

* Product Images
* User Profile Images
* AI Uploaded Images

## Artificial Intelligence

* OpenAI Vision API or Google Gemini Vision API

Used for:

* Plant Match AI
* AI Recommendation Engine

## Charts

* Recharts

## Payment Gateway (Development)

* Dummy Payment Gateway
* Cash on Delivery
* Test Payment Simulation

---

# 12. Future Enhancement

## AI Chatbot for Plant Care

An AI-powered chatbot that assists users with plant care by answering questions related to watering schedules, sunlight requirements, fertilization, pruning, repotting, and general plant health. The chatbot will provide personalized guidance based on the plant selected by the user, improving engagement and helping users maintain healthy plants after purchase.

---

# Project Summary

Green Nest combines modern e-commerce functionality with Artificial Intelligence to deliver a personalized plant shopping experience. Customers can browse and purchase plants, receive AI-powered recommendations tailored to their living spaces, and manage orders through a simple interface. Administrators can efficiently manage products, customers, and orders while monitoring business performance through analytics and AI logs.

The application is designed using a scalable architecture based on Next.js, Node.js, Express.js, and Supabase, making it suitable as both a production-ready foundation and a comprehensive academic major project.
