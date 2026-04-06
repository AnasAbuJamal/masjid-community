# Staff Web - Component & Page Design Guide (CRM Style)

## Overview
This design follows a **clean CRM dashboard style** focused on clarity, data readability, and structured workflows.
The UI emphasizes **grids, tables, tabs, and progress tracking**, with minimal visual noise.

---

## Color Theme

* **Primary**: Neutral grayscale (Slate / Gray tones)
* **Background**: Light gray (`gray-50`)
* **Cards**: Pure white with soft borders
* **Text**: Dark gray (`gray-900`) for primary, `gray-500` for secondary
* **Accent colors**:
  * Blue → Actions / links
  * Green → Success / completed
  * Amber → Pending / warning
  * Red → Errors / critical states

**No heavy gradients — keep it flat and professional**

---

## Layout System

### Structure
* **Left Sidebar (Fixed)** - Simple icons + labels, active = light gray background
* **Top Header** - Page title, user icons
* **Main Content** - Grid-based, sections separated by spacing

---

## UI Components

### Base Components (`src/components/ui/`)

| Component | Design Style |
|-----------|--------------|
| Button | Flat, `rounded-lg`, primary = blue |
| Card | White, `rounded-xl`, light border (`border-gray-200`) |
| Input | Thin border, minimal focus ring |
| Textarea | Same as input |
| Badge | Small, soft background colors |
| Label | Small, muted text |
| Switch | Minimal toggle, blue when active |
| Select | Clean dropdown |
| Dialog | Simple modal, centered |
| Toast | Small notification |
| Tabs | **Underline style** (important!) |
| Table | Clean rows, hover highlight |
| Progress | Thin bar |
| ScrollArea | Invisible scroll |

### App Components

| Component | Design Instructions |
|-----------|---------------------|
| AppSidebar | Flat design, gray active state |
| NotificationBell | Minimal icon + badge |
| RoleGuard | No UI impact |
| RequireRole | No UI impact |

---

## Pages

### Login
| Page | Design |
|------|--------|
| Login | Centered simple card, clean inputs |

### Dashboard Pages

| Page | Path | Design Style |
|------|------|---------------|
| Dashboard | `/dashboard` | KPI cards + tables |
| Search | `/dashboard/search` | Large input + list |
| Newsletter | `/dashboard/newsletter` | Table |
| Error Logs | `/dashboard/error-logs` | Table + filters |
| Workers | `/dashboard/workers` | Table/cards |
| Volunteers | `/dashboard/volunteers` | List |
| Users | `/dashboard/users` | Table |
| Settings | `/dashboard/settings` | Form |
| Proposals | `/dashboard/proposals` | Pipeline + table |
| Prayers | `/dashboard/prayers` | Table |
| Media | `/dashboard/media` | Grid |
| Kiosk | `/dashboard/kiosk` | Form |
| Jobs | `/dashboard/jobs` | Table |
| Gamification | `/dashboard/gamification` | Cards |
| Finances | `/dashboard/finances` | Tables + charts |
| Events | `/dashboard/events` | List/table |
| Donations | `/dashboard/donations` | Table + totals |
| Contact | `/dashboard/contact` | List |
| Construction | `/dashboard/construction` | Progress cards |
| Classroom | `/dashboard/classroom` | Tabs + tables |
| Blog | `/dashboard/blog` | Editor + list |
| Audit Logs | `/dashboard/audit-logs` | Table |
| Attendance | `/dashboard/attendance` | Table + filters |
| Assignments | `/dashboard/assignments` | List |

---

## Page Design Guidelines

### 1. Header Section
```jsx
<div>
  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Page Title</h1>
  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Description</p>
</div>
```

### 2. Cards
```jsx
<Card className="card-clean">
  <CardContent className="p-5">
    {/* Content */}
  </CardContent>
</Card>
```

### 3. Buttons
```jsx
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  Action
</Button>
```

### 4. Tables (VERY IMPORTANT)
* Light borders
* Row hover (`hover:bg-gray-50`)
* Compact spacing

### 5. Status Badges
```jsx
<span className="badge-default">Default</span>
<span className="badge-success">Success</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Error</span>
<span className="badge-info">Info</span>
```

---

## CSS Classes Reference

| Class | Purpose |
|-------|---------|
| `card-clean` | White card with border |
| `text-muted` | Gray text |
| `table-row-hover` | Hover effect |
| `badge-default/success/warning/error/info` | Status badges |

---

## Design Principles

1. **Clarity First** - Data > decoration
2. **Consistency** - Same spacing, font sizes
3. **Minimalism** - No gradients, no heavy shadows
4. **Structure** - Use tables, tabs, sections

---

## Priority Order

### High Priority
1. Dashboard - DONE ✓
2. Sidebar - DONE ✓

### Medium Priority
3. Events
4. Donations
5. Users
6. Finances

### Low Priority
7. Settings
8. Media
9. Jobs
10. Others

---

## Final Notes

This design is closer to Salesforce / HubSpot / Notion.

Focus on:
- Readability
- Data organization
- Clean spacing
