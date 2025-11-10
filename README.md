[<img src="https://flagcdn.com/w20/br.png" alt="Bandeira do Brasil" width="20"> Leia em: 🇧🇷 Português](README.pt-br.md)

# Imóvel Web

> **Imóvel Web** — Application built with **Next.js (App Router)** for real estate management and listing.  
> The project uses **TypeScript**, **Tailwind CSS**, **Vitest** for testing, and **Zustand** for global state management.

---

## TL;DR

- Framework: **Next.js 16** (App Router).  
- Language: **TypeScript 5**.  
- Styling: **Tailwind CSS 4**.  
- Testing: **Vitest + @testing-library/react**.  
- State Management: **Zustand**.  
- Repository: [`https://github.com/roxygens/imovel-web`](https://github.com/roxygens/imovel-web).

---

## Scripts (`package.json`)

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run --coverage"
}
```

### How to use

| Command | Description |
| -------- | ----------- |
| `npm run dev` | Starts the development server. |
| `npm run build` | Builds the production bundle. |
| `npm run start` | Runs the production build. |
| `npm run lint` | Runs ESLint for code analysis. |
| `npm run test` | Runs Vitest and generates coverage reports. |

---

## Main Dependencies

| Type | Package | Description |
|------|----------|-------------|
| **Core** | `next`, `react`, `react-dom` | Core libraries of the application. |
| **State** | `zustand` | Simple and performant global state management. |
| **Style** | `tailwindcss`, `autoprefixer`, `@tailwindcss/postcss` | Responsive and modern styling. |
| **Testing** | `vitest`, `@vitest/coverage-v8` | Unit testing and coverage reporting. |
| **Lint** | `eslint`, `eslint-config-next` | Code linting and standards. |
| **Types** | `@types/node`, `@types/react`, `@types/react-dom` | TypeScript definitions. |

---

## Testing and CI

The project uses **Vitest** for unit testing with minimum coverage thresholds:

```js
thresholds: {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80
}
```

### Testing guidelines

- All tests must be written in English and follow the format:  
  `it('should render ...')`
- Always test:
  - Success cases.
  - Error cases.
  - Edge cases.
- Run `npm run test` before opening a PR.

Example test:

```tsx
import { render, screen } from '@testing-library/react'
import { it, expect } from 'vitest'
import Button from './Button'

it('should render button label', () => {
  render(<Button>Save</Button>)
  expect(screen.getByText('Save')).toBeDefined()
})
```

---

## Main Structure (`src/`)

```
src/
 ├─ app/
 ├─ actions/
 ├─ components/
 ├─ hooks/
 ├─ layouts/
 ├─ libs/
 ├─ providers/
 ├─ sections/
 ├─ services/
 ├─ store/
 └─ utils/
```

### Folder Descriptions

#### `app/`
Next.js App Router folder containing pages, layouts, and route handlers (`page.tsx`, `layout.tsx`, etc).  
> **Responsibility:** Define pages, routes, and global layout structure.

---

#### `actions/`
Contains **Next.js Server Actions** — async functions executed on the server to handle data operations, database interactions, or external service calls.  
These are ideal for **CRUD** operations without creating separate API routes.

**Example:**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createProperty } from '@/services/propertyService'

export async function createPropertyAction(formData: FormData) {
  const newProperty = {
    title: formData.get('title'),
    price: formData.get('price'),
    address: formData.get('address'),
  }

  await createProperty(newProperty)
  revalidatePath('/properties')
}
```

---

#### `components/`
Reusable **React** components for the app.  
> Example: `PropertyCard`, `RegisterForm`, `Header`, `Footer`.

---

#### `hooks/`
Custom hooks such as `useProperty`, `useFilterProperties`, `useAuth`.  
> Encapsulates reusable logic for state, effects, and API calls.

---

#### `layouts/`
Shared layouts (e.g., `MainLayout`, `DashboardLayout`).  
> Defines the main visual structure (navbar, sidebar, footer).

---

#### `libs/`
Library configurations and shared integrations (e.g., HTTP client, helper functions).  
> **Responsibility:** Centralize external lib setup and utility exports.

---

#### `providers/`
Global React providers (e.g., `ThemeProvider`, `QueryClientProvider`).  
> Provides global context for the app.

---

#### `sections/`
Reusable page sections (e.g., `HeroSection`, `FeaturedPropertiesSection`, `ContactSection`).  
> Groups larger visual components reused across pages.

---

#### `services/`
Encapsulates API calls and business logic (e.g., `propertyService.ts`, `userService.ts`).  
> Handles data access and error management.

---

#### `store/`
Global state management using **Zustand**.  
> All stores must be organized into **state** and **actions**, with strict typing (no `any`, `unknown`, or `never`).

**Standard Store Example:**

```ts
import { create } from 'zustand'

interface Property {
  id: string
  title: string
  price: number
}

interface PropertyStore {
  state: {
    properties: Property[]
  }
  actions: {
    setProperties: (data: Property[]) => void
  }
}

export const usePropertyStore = create<PropertyStore>((set) => ({
  state: {
    properties: [],
  },
  actions: {
    setProperties(data) {
      set((store) => ({
        state: {
          ...store.state,
          properties: data,
        },
      }))
    },
  },
}))
```

> **Responsibility:** Centralize and manage the app’s global state, ensuring clear separation between `state` and `actions`.

---

#### `utils/`
Pure and reusable utility functions.  
> Example: `formatCurrency`, `maskPostalCode`, `slugify`.

---

## File Naming Conventions

> **All folders in the project** must follow this structure and naming standard.

| Type | Pattern | Example |
|------|----------|---------|
| Component | `component-name.tsx` | `property-card.tsx` |
| Test | `component-name.test.tsx` | `property-card.test.tsx` |
| Barrel File | `index.ts` | `export { default } from './property-card'` |

---

## Development Workflow

1. **Update the main branch**  
   ```bash
   git checkout dev && git pull
   ```

2. **Create a new branch**  
   ```bash
   git checkout -b feat/feature-name
   ```

3. **Run the development server**  
   ```bash
   npm run dev
   ```

4. **Implement and test your feature**  
   - Add unit tests (`.test.tsx`).
   - Run `npm run test`.

5. **Lint before committing**  
   ```bash
   npm run lint
   ```

6. **Open a Pull Request (PR)**  
   - Provide a clear description.  
   - Ensure CI passes (build + lint + tests).

---

## PR Checklist

- ✅ Tests pass locally.  
- ✅ Coverage ≥ 80%.  
- ✅ ESLint shows no errors.  
- ✅ Code is modular and strongly typed.  
- ✅ Components, hooks, and stores follow conventions.  

---

## Best Practices

- Use **TypeScript** everywhere.  
- Avoid `any`, `unknown`, or `never`.  
- Write **tests in English** (`it('should ...')`).  
- Prefer **functional components**.  
- Maintain **Zustand store** with `state` and `actions`.  
- Centralize async operations under **actions/**.  
- Use **Tailwind** for consistent styling.  

---

