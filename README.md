<a name="readme-top"></a>

# Nutripare

A web app for scanning and comparing the nutritional content of food products, powered by the Open Food Facts database.

## Table of Contents

- [About](#about)
- [Built With](#built-with)
- [Features](#features)
- [Run Locally](#run-locally)
- [Contact](#contact)

---

## About

<a name="about"></a>

Nutripare lets you look up food products by barcode or name, view their nutritional information, and compare them side by side. Each product receives a computed nutrition score based on configurable thresholds, making it easy to make informed decisions at a glance. User data — saved products, comparisons, and nutrition settings — is persisted per account via Firebase.

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Built With

<a name="built-with"></a>

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/) (Auth + Firestore)
- [Open Food Facts API](https://world.openfoodfacts.org/data)
- [shadcn/ui](https://ui.shadcn.com/)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- [Vitest](https://vitest.dev/)

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Features

<a name="features"></a>

- **Barcode scanning** — scan a product's barcode directly from your camera to look it up instantly
- **Product search** — search for products by barcode
- **Side-by-side comparison** — compare two or more products' full nutritional profiles at once
- **Nutrition scoring** — each product gets a score based on user-defined thresholds for nutrients (green / blue / amber / red)
- **Saved products** — save products to your account for quick access later
- **Saved comparisons** — save product comparisons to revisit them
- **Custom nutrition settings** — configure which nutrients matter and set your own thresholds
- **Expandable comparison table** — expand the table to fit all products (or full viewport width on wide comparisons) with a toolbar toggle; preference is persisted across sessions
- **Dark / light mode** — toggle between themes, persisted across sessions
- **Authentication** — sign in with email/password or Google via Firebase Auth

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Run Locally

<a name="run-locally"></a>

**Prerequisites:** Node.js 18+, npm, and a Firebase project with Auth and Firestore enabled.

1. Clone the repository

   ```bash
   git clone https://github.com/ioanat94/nutripare.git
   cd nutripare
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   OPENFOODFACTS_BASE_URL=https://world.openfoodfacts.net
   OPENFOODFACTS_STAGING_AUTH=off:off
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Contact

<a name="contact"></a>

**Ioana Tiplea**

- Email: [ioanatiplea94@gmail.com](mailto:ioanatiplea94@gmail.com)
- LinkedIn: [linkedin.com/in/ioana-tiplea](https://www.linkedin.com/in/ioana-tiplea/)
- GitHub: [github.com/ioanat94](https://github.com/ioanat94/)

<p align="right"><a href="#readme-top">back to top</a></p>
