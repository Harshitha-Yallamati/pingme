# PingMe 💬

A modern, high-performance real-time chat application built with **React**, **Vite**, and **Supabase**. PingMe offers a seamless messaging experience with a focus on speed, security, and a premium user interface.

![PingMe Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Supabase%20%7C%20Tailwind-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)

---

## ✨ Features

-   **⚡ Real-time Messaging**: Instant message delivery and updates powered by Supabase Realtime.
-   **🔐 Secure Authentication**: Robust user sign-up and login system via Supabase Auth.
-   **📞 Voice/Video Calls**: Integrated call interface for enhanced communication.
-   **⌨️ Typing Indicators**: Real-time feedback when your friends are typing.
-   **🟢 Presence Tracking**: See who's online and active in real-time.
-   **📱 Fully Responsive**: A mobile-first design that looks stunning on every device.
-   **🎨 Premium UI**: Built with Shadcn UI and Tailwind CSS for a sleek, modern aesthetic.
-   **🔔 Interactive Notifications**: Real-time toast notifications for new messages and status updates.
-   **🌗 Dark Mode Support**: Easy on the eyes with native dark mode integration.
-   **PingMe AI Assistant**: In-app AI panel for drafting replies, summarizing assistant chats, polishing messages, and quick suggestions.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

### Backend & Infrastructure
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Realtime**: Supabase Realtime Engine
- **Auth**: Supabase Auth (JWT based)
- **Hosting**: Recommended [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [Bun](https://bun.sh/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Harshitha-Yallamati/pingme.git
   cd pingme
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

### Development

Start the application and AI assistant API in two terminals:
```bash
npm run dev
npm run dev:ai
```
The application will be available at `http://localhost:8080`.

---

## 📂 Project Structure

```text
src/
├── components/     # Reusable UI components (Chat, Layout, UI primitives)
├── data/           # Static data and constants
├── hooks/          # Custom React hooks for logic and data fetching
├── integrations/   # Third-party service integrations (Supabase)
├── lib/            # Utility functions and third-party configurations
├── pages/          # Main application views (Landing, Login, Signup, Chat)
├── types/          # TypeScript interfaces and type definitions
└── test/           # Test suites and configuration
```

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ by [Harshitha Yallamati](https://github.com/Harshitha-Yallamati)
