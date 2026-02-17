# KODA - Ebook Platform

KODA is a scalable ebook platform built with the MERN stack (MongoDB, Express, React, Node.js) and TypeScript.

## Project Structure

The project is organized into two main directories:

-   `server/`: Backend API (Node.js + Express + TypeScript)
-   `client/`: Frontend Application (React + Vite + TypeScript)

## Features (Planned)

-   **Authentication**: Secure user login and registration.
-   **Book Management**: Upload, categorize, and manage ebooks.
-   **Reader Interface**: Interactive ebook reader.

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   MongoDB (running locally or cloud URI)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Koda
    ```

2.  **Server Setup:**
    ```bash
    cd server
    npm install
    # Create a .env file based on .env.example (or use defaults)
    npm run dev
    ```

3.  **Client Setup:**
    ```bash
    cd client
    npm install
    npm run dev
    ```

## Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the project for production.
