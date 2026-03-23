# Scientific Dashboard

A Next.js (App Router) frontend for a scientific dashboard application.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and layout
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   ├── molecules/          # Molecule-related components
│   ├── embeddings/         # Embedding-related components
│   └── shared/             # Shared UI components
├── services/               # API and service modules
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── store/                  # State management
```

## Layout

- **Left Sidebar**: Navigation (Dashboard, Molecules, Chemical Space, Similarity Search)
- **Main Content**: Page content area
- **Right Panel**: Molecule viewer placeholder

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
