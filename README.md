# KODA - Modern E-Book & Comic Platform 📚✨

KODA is a scalable, full-featured digital reading platform built with the MERN stack (MongoDB, Express, React, Node.js) and TypeScript. It supports both novels (EPUB) and comics (CBZ/CBR), featuring a sleek, responsive UI and powerful content management tools.

## 🚀 Key Features

### 📖 Reader Experience
-   **Multi-Format Support**: Seamless reading for Novels (EPUB) and Comics (CBZ/CBR).
-   **Interactive Reader**: customizable fonts, themes (Light/Dark), and responsive layout.
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

**✅ Pre-Configured**: This project comes with a `.env` file containing the credentials you provided (MongoDB, Google/GitHub OAuth).
No additional setup is required. Just run `npm run dev`!
