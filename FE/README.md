# Crossing Legal AI Frontend -

## 📁 Project Structure

```
crossing-frontend/
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── projects/          # Project management pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable React components
│   │   ├── Dashboard.tsx      # Main dashboard component
│   │   ├── FormSections.tsx   # Form section management
│   │   ├── Header.tsx         # Application header
│   │   ├── LoginForm.tsx      # Authentication form
│   │   ├── ProjectsTable.tsx  # Project listing table
│   │   └── SectionFields.tsx  # Dynamic form fields
│   ├── hooks/                 # Custom React hooks
│   │   └── useAuthFetch.ts    # Authenticated fetch hook
│   ├── types/                 # TypeScript type definitions
│   │   └── project.ts         # Project interface types
│   ├── package.json           # Dependencies and scripts
│   ├── next.config.js         # Next.js configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── tsconfig.json          # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Clerk account for authentication

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>\
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**

   Create a `.env` file in the `frontend` directory:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### API Endpoints

The following endpoints are fully integrated and ready for use:

| Method | Endpoint                                                       | Description                          |
| ------ | -------------------------------------------------------------- | ------------------------------------ |
| `GET`  | `/projects`                                                    | Show projects on list                |
| `POST` | `/projects`                                                    | Create project, ask for project type |
| `GET`  | `/projects`                                                    | Update projects list                 |
| `GET`  | `/projects/{project_id}/forms`                                 | Open {project_id}, show forms        |
| `GET`  | `/projects/{project_id}/forms/{form_id}`                       | Open {form_id}, show sections        |
| `GET`  | `/projects/{project_id}/forms/{form_id}/sections/{section_id}` | Open {section_id}, show form fields  |
| `POST` | `/projects/{project_id}/forms/{form_id}/sections/{section_id}` | Finish section                       |
| `POST` | `/projects/{project_id}/forms/{form_id}`                       | Finish Form                          |
| `GET`  | `/projects/{project_id}/forms/{form_id}/pdf`                   | Get PDF                              |
| `GET`  | `/projects/{project_id}/documents/package`                     | Get Package                          |

### Frontend Logic Flow

1. **Show projects on list** → `GET /projects`
2. **Create project, ask for project type** → `POST /projects`
3. **Update projects list** → `GET /projects`
4. **Open {project_id}, show forms** → `GET /projects/{project_id}/forms`
5. **Open {form_id}, show sections** → `GET /projects/{project_id}/forms/{form_id}/sections`
6. **Open {section_id}, show form fields** → `GET /projects/{project_id}/forms/{form_id}/sections/{section_id}`
7. **Fill fields one by one** → User interaction
8. **Finish section** → `POST /projects/{project_id}/forms/{form_id}/sections/{section_id}`
9. **Open another section** → `GET /projects/{project_id}/forms/{form_id}/sections/{section_id_2}`
10. **Fill fields one by one** → User interaction
11. **Finish section** → `POST /projects/{project_id}/forms/{form_id}/sections/{section_id_2}`
12. **Finish Form** → `POST /projects/{project_id}/forms/{form_id}`
13. **Get PDF** → `GET /projects/{project_id}/forms/{form_id}/pdf`
14. **Get Package** → `GET /projects/{project_id}/documents/package`
