# P3 Research Lab - Scientific Dashboard UI

A modern Next.js (App Router) frontend for molecular drug discovery, providing interactive visualization and analysis of molecular datasets, embeddings, and similarity search results.

## 🏗️ Architecture Overview

The Scientific Dashboard provides:
- **Multi-page Interface**: Dashboard, Molecules, Chemical Space, Similarity Search, Results
- **Data Visualization**: Interactive charts (Plotly, Recharts), 3D molecular structures (3DMol)
- **Similarity Search**: SMILES-based molecular similarity queries with ranked results
- **State Management**: Zustand for centralized state across pages
- **Type Safety**: Full TypeScript with typed API contracts
- **API Integration**: Typed fetch-based client for backend communication

## Tech Stack

- **Framework**: Next.js 14 (App Router with dynamic routing)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Visualization**: 
  - Plotly.js (2D/3D scientific plots)
  - Recharts (composable charts)
  - 3DMol.js (interactive molecular structures)
- **State Management**: Zustand 4
- **Charting Components**: TanStack React Table
- **Package Manager**: npm

## 📁 Directory Structure

### `/src/app`
**Next.js App Router pages and layouts**

- **`layout.tsx`** - Root layout with sidebar navigation and main container
- **`globals.css`** - Global Tailwind CSS setup
- **`page.tsx`** - Root page (redirects to `/dashboard`)
- **`/dashboard`** - Main dashboard view with overview statistics and charts
- **`/molecules`** - Molecule browser and inspector
- **`/similarity`**, **`/similarity-search`** - Molecular similarity search interface
- **`/chemical-space`** - Chemical space embeddings with optional visualization
- **`/results`** - Results display and artifact management

### `/src/components`
**Reusable React components**

- **`/dashboard`** - Dashboard-specific components (stats cards, charts, summaries)
- **`/molecules`** - Molecule-related components (list, details, structure viewer)
- **`/embeddings`** - Embedding visualization and analysis components
- **`/similarity`** - Similarity search UI components
- **`/shared`** - Reusable UI components (buttons, cards, modals, sidebar, header)

### `/src/services`
**API communication and backend integration**

- **`api.ts`** - Centralized API client with typed responses
  - `moleculeDetails()` - Fetch molecule metadata
  - `similaritySearch()` - Query similarity search endpoint
  - `getEmbeddingMap()` - Embedding visualization data
  - `getDatasets()` - Available datasets
  - Centralized error handling with `ApiError` class

### `/src/types`
**TypeScript type definitions and interfaces**

- **`api.ts`** - API contract types (request/response interfaces)
- **`domain.ts`** - Domain models (Molecule, Embedding, Result, etc.)
- Full typing ensures compile-time safety and runtime contract validation

### `/src/store`
**Zustand state management**

- Global state for:
  - Current dataset selection
  - Search query history
  - Visualization settings
  - User preferences

### Dashboard Store Example

```tsx
"use client";

import { useDashboardStore } from "@/store";

export default function DashboardHeaderExample() {
        const user = useDashboardStore((state) => state.user);
        const currentDataset = useDashboardStore((state) => state.currentDataset);
        const uiPreferences = useDashboardStore((state) => state.uiPreferences);
        const setCurrentDataset = useDashboardStore((state) => state.setCurrentDataset);
        const setUiPreferences = useDashboardStore((state) => state.setUiPreferences);

        return (
                <div className="flex items-center justify-between">
                        <div>
                                <p className="text-sm text-slate-400">Signed in as</p>
                                <p className="font-medium text-slate-100">{user?.name ?? "Guest"}</p>
                        </div>

                        <div className="flex items-center gap-3">
                                <button
                                        className="rounded bg-slate-800 px-3 py-2 text-sm"
                                        onClick={() => setCurrentDataset("DrugBank")}
                                >
                                        Dataset: {currentDataset ?? "None"}
                                </button>

                                <button
                                        className="rounded bg-slate-800 px-3 py-2 text-sm"
                                        onClick={() =>
                                                setUiPreferences({ sidebarCollapsed: !uiPreferences.sidebarCollapsed })
                                        }
                                >
                                        {uiPreferences.sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                                </button>
                        </div>
                </div>
        );
}
```

### `/src/hooks`
**Custom React hooks**

- Query hooks for data fetching
- Effect hooks for analytics and logging
- State management helpers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended 20+)
- npm 9+ or yarn
- Backend running on `http://localhost:8000`

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Create .env.local in the frontend directory
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 3. Start development server (with hot reload)
npm run dev

# 4. Open browser
# http://localhost:3000
```

Development server includes:
- Hot module replacement (HMR)
- Fast refresh for React components
- TypeScript compilation on-the-fly

### Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🔗 API Integration

The frontend communicates with the backend via the **`/services/api.ts`** client:

```typescript
// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Example: Similarity Search
const results = await similaritySearch({
  query_smiles: "CCO",
  dataset: "ZINC250k",
  top_k: 10
});
```

### Key Endpoints Used
- `POST /molecules/similar` - Similarity search
- `GET /molecules/{id}` - Molecule details
- `GET /embeddings/map` - Embedding visualization data
- `GET /health` - Health check

## 🎨 Styling

**Tailwind CSS** provides utility-first styling with custom theme configuration:

```bash
# Tailwind config
postcss.config.mjs     # PostCSS + Tailwind setup
tailwind.config.ts     # Tailwind theme and plugin configuration
```

Custom components use Tailwind classes for:
- Responsive layouts (mobile-first design)
- Dark mode support (configurable via theme)
- Consistent spacing and typography

## 🧪 Development Workflow

### Component Development
```bash
# 1. Create new component in /src/components
# 2. Define TypeScript types in /src/types
# 3. Import and use in pages (/src/app)
# 4. Run dev server: npm run dev
# 5. Test in browser with hot reload
```

### Adding New Pages
```bash
# Create directory in /src/app with layout.tsx and page.tsx
mkdir src/app/my-page
touch src/app/my-page/page.tsx

# Page will be automatically routed to /my-page
```

## ⚙️ Environment Configuration

Create `.env.local` file in the `frontend/` directory:

```bash
# Required: Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Analytics, monitoring, etc.
NEXT_PUBLIC_APP_VERSION=0.1.0
```

**Note**: Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## 🔄 Data Flow

```
User Interaction (UI)
        ↓
React Component State (Zustand)
        ↓
API Service (services/api.ts)
        ↓
Backend (http://localhost:8000)
        ↓
PostgreSQL / Milvus / Vector Store
        ↓
Response → Component → Re-render
```

## 📊 Key Features

### 1. Dashboard
- Overview of molecular datasets and statistics
- Real-time charts and metrics
- Quick access to main workflows

### 2. Molecule Browser
- Search and filter molecule library
- View molecular properties (SMILES, molecular weight, LogP, etc.)
- Structure visualization with 3DMol.js

### 3. Similarity Search
- Input SMILES string
- Query against datasets
- Ranked results with similarity scores
- Molecule structure preview

### 4. Chemical Space Exploration
- Visualize embedding distributions
- Explore molecular landscape
- Interactive 2D/3D projections

### 5. Results Management
- View historical query results
- Download result artifacts
- Compare search results

## 🐛 Troubleshooting

### Backend Not Connecting
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check NEXT_PUBLIC_API_URL in .env.local
cat .env.local

# Restart frontend dev server
npm run dev
```

### Port Already in Use (3000)
```bash
# Run on alternate port
npm run dev -- -p 3001
```

### TypeScript Errors
```bash
# Rebuild TypeScript cache
rm -rf .next
npm run dev
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 🪟 Windows Path Note

On Windows systems with `!` in the project path, webpack may fail validation during build:
```
Path: C:/path/with/!/node_modules/...
```

**Workaround**: Run frontend from a path without special characters (`!`, `@`, etc.).

## 📦 Docker Deployment

The frontend can be containerized with Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t p3-frontend:latest .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api:8000 p3-frontend:latest
```

## 📄 Related Documentation

- [Backend README](../README.md) - API and services documentation
- [API Documentation](../api/API_DOCUMENTATION.md) - Endpoint reference
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design overview
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development guidelines

## 📞 Support

### Common Issues
1. **API Connection Errors** - Ensure `NEXT_PUBLIC_API_URL` is correctly set and backend is running
2. **Slow Performance** - Check network tab in browser DevTools for slow endpoints
3. **Build Failures** - Clear `.next/` and `node_modules/` and rebuild

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npm run dev
```

---

**Version**: 0.1.0  
**Last Updated**: April 1, 2026  
**Status**: Active Development
