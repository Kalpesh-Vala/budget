# **Budget Tracker Web App – Product & Technical Specification**

## **Tech Stack**

* Next.js (App Router)
* Tailwind CSS
* MongoDB
* JWT Authentication (HTTP-only cookies)
* Chart.js or Recharts
* Deployed on Vercel
* MongoDB Atlas

---

## **Goal**

Build a **full-stack, secure, responsive, fast** budget tracking web app that replaces Excel.
Users should only enter data once and everything else must be calculated automatically.

---

## **Core Features**

### **Authentication**

* User Registration
* Secure Login
* Password hashing using bcrypt
* JWT authentication
* Token stored in HTTP-only cookie
* User stays logged in for **7 days**
* Logout
* Protected routes (dashboard not accessible without login)

---

## **App Layout**

Use a dashboard layout:

### Desktop

* Sidebar navigation

### Mobile

* Bottom navigation bar

### Pages

* Dashboard
* Daily Expenses
* Monthly Summary
* Category Budget
* Analytics
* Profile
* Logout

---

## **Database Design (MongoDB)**

### **User**

```
User {
  _id
  name
  email
  passwordHash
  createdAt
}
```

### **Expense**

```
Expense {
  _id
  userId
  date
  category
  type (personal | shared)
  paymentMethod (UPI | Cash | Card | Bank)
  description
  amount
  createdAt
}
```

### **Monthly Fixed Costs**

```
MonthlyCost {
  _id
  userId
  month
  rent
  electricity
  gas
  maintenance
  other
}
```

---

## **Daily Expense Page**

User can:

* Add
* Edit
* Delete expenses

Fields:

* Date (default today)
* Category (dropdown)
* Expense Type (Personal / Shared)
* Payment Method (UPI, Cash, Card, Bank)
* Description
* Amount

Display:

* Total for selected day
* Total for selected month

---

## **Monthly Daily Summary**

Auto-generated from Daily Expenses.

Table:

* Date
* Day
* Combined Description (e.g. Grocery + Lunch + Travel)
* Total spent

No manual input allowed.

---

## **Monthly Category Budget**

Auto-calculated from expenses:

* Grocery
* Breakfast
* Lunch
* Dinner
* Travel
* Snacks
* Personal
* Shared
* Extras

User-entered:

* Rent
* Electricity
* Gas
* Maintenance
* Other

Show:

* Variable total
* Fixed total
* Grand total

---

## **Overall Summary**

Table:

* Month
* Total spending

Also show:

* Highest spending month
* Average monthly spending
* Lifetime total

Month selector dropdown.

---

## **Analytics**

Use Chart.js or Recharts.

Charts:

* Category-wise Pie Chart
* Daily spending Bar Chart
* Monthly trend Line Chart
* Personal vs Shared Pie Chart

Charts must update live when data changes.

---

## **UI / UX**

Use Tailwind CSS with:

* Cards
* Tables
* Dropdowns
* Mobile-first design
* Dark mode support
* Clean dashboard layout

---

## **Performance & Security**

* bcrypt for passwords
* JWT in HTTP-only cookies
* API rate limiting
* User data isolation
* MongoDB aggregation queries
* Indexed fields for fast queries
* No sensitive data on frontend

---

## **Deployment Ready**

* Works on Vercel
* Uses `.env` for secrets
* MongoDB Atlas compatible

---

## **Final Goal**

A user should:

* Enter data once
* See everything auto-calculated
* Access from any device
* Never need Excel again

---

If you want next, I can also give you:

* **Folder structure**
* **API design**
* **Auth flow**
* **MongoDB schemas**
* **Production deployment steps** 🚀
