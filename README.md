# 📚 ISP Library Management System

A modern, full-stack Library Management System designed for the ISP Community. This application provides a seamless experience for discovering, borrowing, and tracking books, powered by a robust backend and a cutting-edge frontend.

## ✨ Key Features

- **🔍 Smart Search & Discovery**: Efficiently browse the collection using **Ag-Grid** with support for filtering by title, author, or publication year.
- **📖 Easy Borrowing System**: Request books with a single click, track due dates, and manage your personalized reading list.
- **📊 Dynamic Analytics**: Visualize the library's collection through beautiful charts, including language distribution and top contributors.
- **👨‍🏫 Author Directory**: Explore comprehensive profiles of authors and browse their complete bibliographies within the system.
- **🛡️ Secure Authentication**: Personal accounts with hashed password security, enabling individual borrowing history and digital library cards.
- **⚙️ Admin Dashboard**: Centralized management for library administrators to track all borrowed records and system usage.

## 🛠️ Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/), [Ag-Grid](https://www.ag-grid.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) & RTK Query
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM v7](https://www.prisma.io/) (`@prisma/adapter-pg`)
- **Auth**: Custom dual JWT (access + refresh) via [`jose`](https://github.com/panva/jose) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js) password hashing
- **Email**: [Mailchimp Transactional](https://mailchimp.com/developer/transactional/) (account verification & password reset)
- **Visualization**: [Recharts](https://recharts.org/)

## Sample Views

![Landing Page](/public/1.png)
![Login Page](/public/2.png)
![Books Page](/public/3.png)
![Analytics Page](/public/4.png)
![Book Detail Page](/public/6.png)
![Book Detail Page](/public/7.png)
![Mybooks Page](/public/5.png)
![Book Detail Page](/public/7.png)
![Author Page](/public/8.png)
![Author Detail Page](/public/9.png)
![Admin Detail Page](/public/10.png)
![Admin Detail Page](/public/11.png)

## 🚀 Key Functions & Data Access Layer

All database access goes through a Prisma-backed Data Access Layer in [`lib/db/client.ts`](lib/db/client.ts):

- **Inventory Management**: `getBooks()`, `getBook(id)` - Fetch and display the entire library catalog or specific titles.
- **Author Relations**: `getAuthors()`, `getBooksByAuthorId(id)` - Map complex relationships between creators and their works.
- **User Lifecycle**: `createUser()`, `getUserByEmail()` - Handle secure enrollment and session management.
- **Borrowing Logic**: `createBorrowRecord()`, `updateBorrowRecord()` - Manage the stateful transition of books from available to borrowed/returned.
- **Analytics Engine**: `getAllBorrowRecords()` - Aggregate data for real-time visualization of library trends.

## 🏁 Getting Started

### Prerequisites

- Node.js (Latest Stable)
- pnpm / npm / yarn
- A PostgreSQL database
- A Mailchimp Transactional API key (for verification & password-reset emails)

### Environment Variables

Create a `.env` file in the root directory (see `.env.example`) and add the following:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth (JWT signing secrets)
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_RESET_SECRET=your_reset_secret

# Email (Mailchimp Transactional)
MAILCHIMP_API_KEY=your_mailchimp_transactional_api_key
MAILCHIMP_FROM_EMAIL=hello@yourdomain.com
MAILCHIMP_FROM_NAME=ISP Library

# App
NEXT_PUBLIC_APP_NAME=ISP Library
NEXT_PUBLIC_APP_DESCRIPTION=Library Management System
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_BORROWS_PER_PERIOD=5
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/library-management-system.git
   cd library-management-system
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up the database (generate client, run migrations, seed data):
   ```bash
   pnpm db:migrate
   pnpm db:seed
   pnpm db:admin-seed   # creates an admin user
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📄 License

This project is private and intended for the ISP Community.
