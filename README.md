# Finance Tracker Web

A modern, responsive, and secure personal finance tracking application built with React, TypeScript, and Supabase.

## ✨ Features

- **User Authentication**: Secure signup and login using Supabase Auth.
- **Transaction Management**: Easily add, edit, and categorize your income and expenses.
- **Custom Categories**: Create customized categories with colors, mark them as essential or savings, and set expected amounts.
- **Auto-Categorization Rules**: Set up keywords to automatically categorize new transactions based on their descriptions.
- **Analytics & Reporting**: Interactive charts and data visualizations using Recharts to help you understand your spending habits.
- **Secure by Default**: Built on Supabase with Row Level Security (RLS) ensuring that users can only access their own data.

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/FinanceTrackerWeb.git
   cd FinanceTrackerWeb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Execute the SQL from `supabase_schema.sql` in your Supabase project's SQL Editor to create the necessary tables and Row Level Security (RLS) policies.
   - Go to your Supabase Project Settings > API to find your URL and Anon Key.

4. **Environment Variables:**
   Create a `.env` file in the root of the project and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`.

## 🗄️ Database Schema

The database uses the following main tables:
- `categories`: Stores user-defined transaction categories.
- `category_rules`: Stores keywords for auto-categorization of transactions.
- `transactions`: Stores income and expense records.
- `settings`: Stores user preferences (like base currency).

*Note: All tables are protected by Row Level Security (RLS).*

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
