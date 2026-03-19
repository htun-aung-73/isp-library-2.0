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
- **Backend/Database**: [Baserow](https://baserow.io/) (Headless DB)
- **Visualization**: [Recharts](https://recharts.org/)
- **Security**: [Bcryptjs](https://github.com/dcodeIO/bcrypt.js) for password hashing

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

## 🚀 Key Functions & API Integration

The system communicates with clinical precision through its Baserow integration layer:

- **Inventory Management**: `getBooks()`, `getBook(id)` - Fetch and display the entire library catalog or specific titles.
- **Author Relations**: `getAuthors()`, `getBooksByAuthorId(id)` - Map complex relationships between creators and their works.
- **User Lifecycle**: `createUser()`, `getUserByEmail()` - Handle secure enrollment and session management.
- **Borrowing Logic**: `createBorrowRecord()`, `updateBorrowRecord()` - Manage the stateful transition of books from available to borrowed/returned.
- **Analytics Engine**: `getAllBorrowRecords()` - Aggregate data for real-time visualization of library trends.

## 🏁 Getting Started

### Prerequisites

- Node.js (Latest Stable)
- pnpm / npm / yarn
- A Baserow account and API token

### Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_BASEROW_API_URL=https://api.baserow.io
NEXT_PUBLIC_BASEROW_API_TOKEN=your_token_here
NEXT_PUBLIC_BASEROW_TABLE_BOOKS=your_table_id
NEXT_PUBLIC_BASEROW_TABLE_AUTHORS=your_table_id
NEXT_PUBLIC_BASEROW_TABLE_USERS=your_table_id
NEXT_PUBLIC_BASEROW_TABLE_BORROW_BOOKS=your_table_id
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

3. Run the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📄 License

This project is private and intended for the ISP Community.
