This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Smart Hospital Patient Portal Features

### Profile Page
- Displays patient information captured during registration at `/dashboard/profile`
- Shows personal details (name, DOB, gender, OPD ID), contact info (phone, email, address), and account username
- **Inline editing**: Click "Edit Profile" to enable edit mode for most fields
- Protected fields: OPD ID and username cannot be changed
- Data is stored in localStorage for demo purposes (no backend required yet)

### Theme Support
- Light/Dark mode toggle using `next-themes`
- Theme toggle button in the dashboard header (sun/moon icon)
- Respects system preferences by default
- Theme persists across sessions

### How it Works
1. Navigate to `/register` and complete the patient registration form
2. Upon successful submission, profile data (excluding passwords) is saved to localStorage
3. You're automatically redirected to `/dashboard/profile` to view your information
4. Click "Edit Profile" to modify your details inline (OPD ID and username are protected)
5. Click "Save Changes" to update or "Cancel" to discard changes
6. Click the sun/moon icon in the header to toggle between light and dark themes

### Key Files
- `app/lib/profileStorage.ts` - Client-side profile storage helper
- `app/dashboard/profile/page.tsx` - Profile page component
- `app/components/ui/theme-toggle.tsx` - Theme toggle button
- `app/components/registration/patient-registration-form.tsx` - Registration form with profile saving
- `app/layout.tsx` - Root layout with ThemeProvider

**Note:** This uses localStorage for demo purposes. Replace with API calls when backend is available.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
