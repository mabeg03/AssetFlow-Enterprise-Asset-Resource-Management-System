# AssetFlow — Enterprise Asset & Resource Management System

A centralized ERP platform to track, allocate, and maintain physical assets 
and shared resources across any organization (offices, schools, hospitals, factories).

## 🧩 Problem Statement
Organizations rely on spreadsheets and paper logs to manage assets, leading to 
poor visibility into asset location, condition, and allocation. AssetFlow digitizes 
the full asset lifecycle with role-based workflows, conflict-free allocation, 
resource booking, and structured audits.

## 🛠️ Tech Stack
- **Frontend:** React + Tailwind
- **Backend/DB:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **AI Layer:** Gemini API (audit summaries, maintenance priority suggestion)

## 👥 Team & Ownership
| Person | Module | Branch |
|---|---|---|
| A | Auth + Org Setup + Asset Registry + Allocation/Transfer | `feature/auth-assets` |
| B | Resource Booking + Maintenance + Audit Cycles | `feature/booking-maintenance-audit` |
| C | Dashboard + Reports + Notifications + Gemini AI | `feature/dashboard-ai` |

## 📁 Folder Structure