# KODA - Modern E-Book & Comic Platform 📚✨

KODA is a scalable, full-featured digital reading platform built with the MERN stack (MongoDB, Express, React, Node.js) and TypeScript. It supports both novels (EPUB) and comics (CBZ/CBR), featuring a sleek, responsive UI and powerful content management tools.

## 🚀 Key Features

### 📖 Reader Experience
-   **Multi-Format Support**: Seamless reading for Novels (EPUB) and Comics (CBZ/CBR).
-   **Interactive Reader**: Clean, distraction-free reading UI with adjustable font sizing.
-   **Progress Tracking**: Automatically saves reading progress and history.

### 🌍 Content & Discovery
-   **Multi-Language Support**: Content available in English, Hindi, French, Spanish, Chinese, and more.
-   **Advanced Search**: Filter by Genre, Language, Type (Novel/Comic), and Sort options.
-   **Recommendations**: Personalized "Recommended for You" and "Trending" sections.

### ✍️ Author Studio
-   **Dashboard**: Analytics for views, likes, and reader engagement.
-   **Content Management**: Upload and manage stories, chapters, and covers.
-   **Monetization Ready**: Structure for author earnings and detailed stats.

### 🛡️ Admin & Security
-   **Admin Panel**: comprehensive analytics, user management, and content moderation.
-   **Role-Based Access**: Secure roles for Users, Authors, and Admins.
-   **Content Safety**: NSFW filters and content reporting systems.

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   MongoDB (running locally or cloud URI)

### Installation

### Installation

1.  **Setup Project:**
    *   Extract the `Koda_Shareable.zip` file.
    *   Open the folder in VS Code or your terminal.

2.  **Server Setup:**
    ```bash
    cd server
    npm install
    # Start the server
    npm run dev
    ```

3.  **Client Setup:**
    ```bash
    # Open a new terminal
    cd client
    npm install
    npm run dev
    ```

## Scripts

-   `npm run build`: Builds the project for production.

### ⚙️ Configuration

1. **Server Configuration**: Create a `.env` file in the `server` directory and add the necessary environment variables (e.g., `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, etc.). You can use `.env.example` as a reference if available.
2. **Client Configuration**: Create a `.env` file in the `client` directory and specify your `VITE_API_URL` (typically `http://localhost:5001/api`).

Once configured, run `npm run dev` in both directories!
