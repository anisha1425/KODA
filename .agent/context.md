# Project Context — KODA (E-Book Platform)

## 1. Project Overview
KODA is a free, inclusive, and mobile-friendly E-Book Platform for reading and publishing
**Novels and Comics**. The platform removes paywalls for core reading features and enables
users to actively participate as readers, authors, and community members.

The system encourages **user-generated content**, multilingual accessibility, and interactive
reading through comments, discussions, and ratings. KODA is designed as a scalable MERN
stack web application suitable for an MCA final-year project and freelance-grade delivery.

---

## 2. Tech Stack
- Frontend: React (mobile-first, responsive UI)
- Backend: Node.js + Express.js
- Database: MongoDB
- Authentication: JWT with role-based access control
- Storage: Cloud object storage for images, comics, and downloads
- Architecture: MERN (REST APIs)

---

## 3. User Roles
- **Reader**
  - Browse, read, download novels and comics
  - Comment, rate, bookmark, and track reading progress

- **Author**
  - Publish novels or comics
  - Manage chapters/pages and metadata
  - View engagement metrics (views, likes, comments)

- **Admin**
  - Approve or reject content
  - Manage users and authors
  - Moderate discussions and reports

---

## 4. Core Features
- Free user registration and login
- Two main sections: **Novels** and **Comics**
- Wide genre support (fiction, fantasy, romance, thriller, educational, etc.)
- Author self-publishing without third-party publishers
- Multilingual content support (English, German, Spanish – extensible)
- Inline or section-based commenting system
- Ratings, bookmarks, and reading progress tracking
- Offline download options
- Purchase/support links (optional, non-blocking)
- Admin moderation and approval workflow
- Mobile-friendly and responsive design

---

## 5. Functional Requirements
- User registration and authentication
- Role-based access (Reader, Author, Admin)
- CRUD operations for books, chapters, and comic pages
- Browse and search by title, author, genre, and language
- Commenting and discussion system
- Bookmarking and download functionality
- Admin content moderation and user management

---

## 6. Non-Functional Requirements
- Usability: Simple, intuitive UI for all user types
- Scalability: Support growing users and content
- Security: Secure authentication, protected APIs, input validation
- Performance: Fast content loading and smooth reading experience
- Compatibility: Works on desktop and mobile browsers

---

## 7. Data & Architecture Notes
- MongoDB collections:
  - Users
  - Books
  - Chapters / ComicPages
  - Comments
  - Ratings
  - Bookmarks
- REST-based backend APIs
- Media files served via cloud storage + CDN
- Separation of backend and frontend codebases

---

## 8. Content Publishing Workflow
1. Author uploads book/comic with metadata
2. Admin reviews and approves content
3. Approved content becomes publicly visible
4. Readers interact via comments and ratings
5. Reports trigger moderation actions

---

## 9. Security Guidelines
- Password hashing and JWT authentication
- Role-based route protection
- Input sanitization to prevent XSS
- Secure file upload handling
- HTTPS for all communications

---

## 10. Antigravity Usage Guidance
Use Antigravity workflows as follows:
- `/brainstorm` → architecture, feature design, and planning
- `/create` → schemas, APIs, authentication, components
- `/enhance` → UI improvements and performance tuning
- `/debug` → backend or frontend issue analysis
- `/orchestrate` → security review and system validation

**Project Tags:**  
`mern`, `ebooks`, `comics`, `multilingual`, `ugc`, `reader-author-admin`, `mobile-first`

---

## 11. Project Intent
This project aims to democratize access to literature and comics by removing financial
barriers, empowering new writers, supporting cultural diversity, and transforming reading
into a collaborative social experience.
