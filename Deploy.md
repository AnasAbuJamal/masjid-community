# Masjid Community App - Deployment Guide

## Architecture Overview

This project has two main applications:

- **staff-web**: Next.js 16 dashboard for mosque administrators (staff-web/)
- **masjid-mobile**: React Native / Expo mobile app for community members (masjid-mobile/)

Both share a PostgreSQL database via Prisma ORM.

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn
- Git

---

## 1. Database Setup

Create a PostgreSQL database:

```bash
createdb masjid_community
```

Set the `DATABASE_URL` environment variable:

```
DATABASE_URL="postgresql://user:password@localhost:5432/masjid_community"
```

---

## 2. Staff-Web (Admin Dashboard)

### Environment Variables

Create `staff-web/.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/masjid_community"
AUTH_SECRET="generate-a-random-secret-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Install & Build

```bash
cd staff-web
npm install
npx prisma generate
npx prisma db push
npm run build
npm start
```

The dashboard runs on `http://localhost:3000`.

### Seed Data (Optional)

```bash
npx prisma db seed
```

Creates:
- Admin user: `admin@masjid.com` / `Admin123!`
- Sample classes, prayer times, blog posts

---

## 3. Masjid-Mobile (React Native / Expo)

### Environment Variables

Create `masjid-mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Install & Run

```bash
cd masjid-mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (Android/iOS) or press `w` for web.

---

## 4. Production Deployment (Staff-Web)

### Vercel (Recommended)

1. Push to GitHub
2. Import repo on Vercel
3. Set root directory to `staff-web`
4. Add environment variables
5. Deploy

### Manual (Any VPS)

```bash
cd staff-web
npm install
npx prisma generate
npx prisma db push
npm run build
npm start -- -p 3000
```

Use PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name "masjid-staff" -- start
pm2 save
pm2 startup
```

---

## 5. Production Deployment (Mobile)

### Expo Build (iOS/Android)

```bash
cd masjid-mobile
eas build --platform all
```

### Web Build

```bash
cd masjid-mobile
npx expo build:web
```

Serve the `web-build/` folder with any static hosting (Vercel, Netlify, etc.).

---

## 6. Important Considerations

### Authentication
- NextAuth.js with JWT strategy
- Session expires after 30 minutes
- Account locks after 5 failed login attempts (15-minute lockout)
- Default admin: `admin@masjid.com` / `Admin123!`

### Database Migrations
Always run `npx prisma db push` (dev) or `npx prisma migrate deploy` (prod) after pulling schema changes.

### Media Library
Files are stored as URL references (not uploaded to the server). The app stores URLs in the database. For actual file upload, configure an S3 bucket or use a service like Uploadthing.

### Known Issues to Verify
- **Attendance**: If bulk marking fails, check that the user role is `admin` or `teacher`. The API accepts both roles.
- **Student Applications**: When approving, ensure the student's ID is generated. If `generateStudentId` fails, the application approval may silently fail.
- **Media Folder Select**: The folder dropdown uses `_none` internally for the "no folder" option (avoids Radix UI Select bug with empty string values).

### CORS
If running staff-web and masjid-mobile on different domains, ensure CORS is configured on the staff-web server:

```bash
# In next.config.js or proxy config
Access-Control-Allow-Origin: *
```

### Environment Variables Checklist

| Variable | Required | Where |
|---|---|---|
| `DATABASE_URL` | ✅ | staff-web |
| `AUTH_SECRET` | ✅ | staff-web |
| `NEXT_PUBLIC_APP_URL` | ✅ | staff-web |
| `EXPO_PUBLIC_API_URL` | ✅ | masjid-mobile |

---

## 7. Monitoring & Maintenance

- Check `ErrorLog` table for application errors
- Monitor `AuditLog` for suspicious activity
- Run `npx prisma studio` to inspect data
- Set up periodic backups for PostgreSQL
- Monitor Expo build status for mobile deployments

---

## 8. Troubleshooting

**"Select.Item must have a value prop that is not an empty string"**
- Fixed in code. Verify all `<SelectItem value="">` are changed to `<SelectItem value="_none">`.

**Attendance POST fails**
- Ensure the user is logged in (session required but no specific role restriction)
- Check that `studentId` and `classId` exist in the database

**Student lookup "not found" in mobile app**
- The API searches both `id` and `studentId` fields
- Ensure the student exists in the database with the correct numeric ID

**Build errors**
- Clear `.next/` cache: `rm -rf .next && npm run build`
- Prisma client not found: `npx prisma generate`
- Expo web build: `npx expo install react-dom react-native-web @expo/metro-runtime`
