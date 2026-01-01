# Nuxt Prisma Full Stack Starter

A full-featured Nuxt 3 starter template for building full stack applications with authentication, email verification, i18n, and UI components out of the box.

## 🔧 Tech Stack

- **Nuxt 3** — Vue-based frontend framework
- **Prisma ORM** — Database toolkit
- **Nuxt UI** — Beautiful and customizable UI components
- **nuxt-auth-utils** — Local email/password authentication
- **nuxt-i18n** — Localization and multi-language support
- **nuxt-nodemailer** — Send verification and reset password emails

## ✨ Features

- 🔐 User authentication (register, login, logout)
- ✅ Email verification via token
- 🔄 Forgot and reset password flow
- 🌍 Multi-language support with `nuxt-i18n`
- 🎨 UI components built with `nuxt-ui`
- 🧠 ORM with Prisma

## 📦 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/idesignzone/nuxt-prisma-auth.git
cd nuxt-prisma-auth
```

### 2. Install dependencies

```bash
npm install
```

### 3 Initialize Prisma (if needed)

If Prisma is not yet initialized, run:

```bash
npx prisma init
```

This will create a prisma/schema.prisma file and set up a .env file if one doesn't exist.

### 4. Set up environment variables

Create a `.env` file and set up your variables:

```env
NUXT_BASE_URL="http://localhost:3000"
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
EMAIL_SMTP_FROM="your-email"
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT=465
GMAIL_SMTP_USER="your-email"
GMAIL_SMTP_PASS="your-app-password"
```

### 5. Migrate the database

```bash
npx prisma migrate dev --name init
```

### 6. Run the development server

```bash
npm run dev
```

Go to `http://localhost:3000` to see the app.

## 🧪 Available Scripts

- `npm run dev` — Starts the development server
- `npm run build` — Builds the application
- `npm run preview` — Preview production build
- `npx prisma studio` — Opens Prisma Studio for DB browsing

## 🔐 Authentication Flow

- User registers with email and password
- Verification email is sent via `nuxt-nodemailer`
- On login, unverified accounts are rejected
- Forgot password email generates secure token
- Password can be reset via tokenized URL

## 🌍 i18n Support

Configure languages in `nuxt.config.ts`:

```ts
  i18n: {
    baseUrl: process.env.NUXT_BASE_URL || 'http://localhost:3000',
    defaultLocale: "en",
    locales: [
      { code: "en", language: 'en-US', name: "English", file: "en.json" },
      { code: "ru", language: 'ru-RU', name: "Russian", file: "ru.json" },
    ],
  },
```

Translations are stored in `locales/` directory.

## 🖼️ Screenshots

### 🏠 Homepage

![Homepage](./public/screenshots/homepage.png)

### 👤 Profile Page

![Profile Page](./public/screenshots/profile.png)

## 🛠️ Folder Structure

```
.
├── middleware/
├── assets/
├── components/
├── i18n/
├── layouts/
├── pages/
├── prisma/
├── public/
├── server/
├── .env
├── app.config.ts
├── app.vue
├── nuxt.config.ts
├── LICENSE.md
├── package.json
├── README.md
└── tsconfig.json
```

## ✅ TODO

- [ ] Add social login support
- [ ] Add admin dashboard
- [ ] Add roles/permissions system

## 📄 License

MIT License © iDesignzone
