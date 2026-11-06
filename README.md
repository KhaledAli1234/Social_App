# Social App — Backend API

A social media backend with posts, nested comments, friends, real-time chat (1-to-1 and groups) and a GraphQL endpoint. Built with **Node.js, Express 5, TypeScript and MongoDB**, with files stored on **AWS S3**.

## Features

**Auth & accounts**
- Email signup with OTP confirmation, Google Sign-In / Sign-Up
- Login with access + refresh tokens, logout with token revocation
- Forgot password flow (send OTP → verify → reset)
- Two-step verification (enable + confirm with OTP)
- Update basic info, password and email (request + confirm)
- Roles: `user`, `admin`, `super-admin` (change role, dashboard, hard delete, restore)
- Freeze / restore accounts

**Social**
- Posts with up to 2 image attachments, tagging users, `allowComments` and `availability` (`public` · `friends` · `only-me`)
- Like / unlike, freeze and hard delete
- Comments with replies (`/post/:postId/comment`)
- Friend requests (send, accept, delete), unfriend, block user

**Real-time (Socket.IO)**
- Authenticated socket connections, online/offline presence
- Direct messages and group chat rooms (`sendMessage`, `sendGroupMessage`, `join_room`)
- Chat history REST endpoints

**GraphQL**
- Single `/graphql` endpoint (auth required) with queries and mutations for users and posts: `allUsers`, `searchUser`, `addFollower`, `allPosts`, `likePost`

**Files (AWS S3)**
- Upload through Multer, streaming download and pre-signed URLs

**Security & quality**
- Helmet, CORS, rate limiting, request validation with Zod
- Repository pattern for data access, typed DTOs, centralized error handling

## Tech Stack

| Area | Technology |
|---|---|
| Runtime / framework | Node.js, Express 5, TypeScript |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| API styles | REST + GraphQL (`graphql`, `graphql-http`) |
| Auth | JWT, bcrypt, Google Auth Library |
| Storage | AWS S3 (SDK v3) |
| Validation | Zod |
| Email | Nodemailer |
| Security | Helmet, CORS, express-rate-limit |

## Project Structure

```
src/
├── DB/
│   ├── models/          # User, Post, Comment, Chat, FriendRequest, Token
│   └── repository/      # Generic database repository + one per model
├── middleware/          # authentication / authorization, validation
├── modules/
│   ├── auth/            # signup, login, Google, OTP, password reset
│   ├── user/            # profile, friends, 2FA, roles, REST + GraphQL
│   ├── post/            # posts, likes, REST + GraphQL
│   ├── comment/         # comments and replies
│   ├── chat/            # chat REST + socket events
│   ├── gateway/         # Socket.IO setup and presence
│   └── graphql/         # schema assembly
├── utils/               # email, multer + S3, OTP, tokens, hashing, responses
├── app.controller.ts    # bootstrap
└── index.ts
```

## API Overview

| Area | Endpoints |
|---|---|
| Auth `/auth` | `POST /signup` · `POST /login` · `POST /signup-gmail` · `POST /login-gmail` · `PATCH /confirm-Email` · `PATCH /send-forgot-password` · `PATCH /verify-forgot-password` · `PATCH /reset-forgot-password` |
| User `/user` | `GET /` · `PATCH /update-basic-info` · `PATCH /update-password` · `POST /update-email/request` · `POST /update-email/confirm` · `PATCH /profile-image` · `PATCH /profile-cover-image` · `POST /refresh-token` · `POST /logout` · `POST /enable` · `POST /confirm` |
| Friends `/user` | `POST /:userId/send-friend-request` · `PATCH /accept-friend-request/:requestId` · `DELETE /requests/:requestId` · `PATCH /unfriend/:friendId` · `PATCH /block/:userId` |
| Admin `/user` | `GET /dashboard` · `PATCH /:userId/change-role` · `DELETE /:userId/freeze-account` · `PATCH /:userId/restore-account` · `DELETE /:userId` |
| Posts `/post` | `GET /` · `GET /:postId` · `POST /` · `PATCH /:postId` · `PATCH /:postId/like` · `PATCH /:postId/freeze` · `DELETE /:postId/hard-delete` |
| Comments `/post/:postId/comment` | create, reply, list, update, freeze, hard delete |
| Chat `/chat` | `GET /` · `POST /group` · `GET /group/:groupId` |
| Files | `GET /upload/*path` · `GET /upload/pre-signed/*path` |
| GraphQL | `/graphql` |

**Socket events:** `sayHi`, `sendMessage`, `join_room`, `sendGroupMessage` (client → server) · `newMessage`, `successMessage`, `offline_User`, `custom_error` (server → client).

## Getting Started

**Requirements:** Node.js 20+, MongoDB, an AWS S3 bucket, a Google OAuth client ID, an SMTP/Gmail account.

```bash
git clone https://github.com/KhaledAli1234/Social_App.git
cd Social_App
npm install
```

Create `config/.env.development`:

```env
PORT=5000
MOOD=DEV
DB_URI=mongodb://localhost:27017/social_app
APPLICATION_NAME=Social App

# Auth
ACCESS_USER_TOKEN_SIGNATURE=change_me
ACCESS_TOKEN_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800
SALT=12
WEB_CLIENT_ID=

# Email
EMAIL=you@example.com
EMAIL_PASSWORD=app_password

# AWS S3
AWS_REGION=
AWS_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS=120
```

Run in development (TypeScript watch + Node watch):

```bash
npm run start:dev
```

## Author

**Khaled Ali** — Backend Developer · [GitHub](https://github.com/KhaledAli1234) · [LinkedIn](https://linkedin.com/in/khaled-ali)
