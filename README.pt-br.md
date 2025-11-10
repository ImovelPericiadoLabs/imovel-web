[<img src="https://flagcdn.com/w20/us.png" alt="Bandeira dos EUA" width="20"> Read in: 🇺🇸 English](README.md)

# Imóvel Web

> **Imóvel Web** — Aplicação construída com **Next.js (App Router)** para gerenciamento e listagem de imóveis.  
> O projeto utiliza **TypeScript**, **Tailwind CSS**, **Vitest** para testes e **Zustand** para gerenciamento de estado global.

---

## TL;DR

- Framework: **Next.js 16** (App Router).  
- Linguagem: **TypeScript 5**.  
- Estilização: **Tailwind CSS 4**.  
- Testes: **Vitest + @testing-library/react**.  
- Gerenciamento de Estado: **Zustand**.  
- Repositório: [`https://github.com/roxygens/imovel-web`](https://github.com/roxygens/imovel-web).

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

### Como usar

| Comando | Descrição |
| -------- | ---------- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Gera o build de produção. |
| `npm run start` | Executa a build de produção. |
| `npm run lint` | Executa o ESLint para análise de código. |
| `npm run test` | Executa o Vitest e gera o relatório de cobertura. |

---

## Dependências Principais

| Tipo | Pacote | Descrição |
|------|----------|-----------|
| **Core** | `next`, `react`, `react-dom` | Bibliotecas principais da aplicação. |
| **Estado** | `zustand` | Gerenciamento de estado global simples e performático. |
| **Estilo** | `tailwindcss`, `autoprefixer`, `@tailwindcss/postcss` | Estilização moderna e responsiva. |
| **Testes** | `vitest`, `@vitest/coverage-v8` | Testes unitários e relatórios de cobertura. |
| **Lint** | `eslint`, `eslint-config-next` | Padrões e boas práticas de código. |
| **Tipos** | `@types/node`, `@types/react`, `@types/react-dom` | Tipos TypeScript do ambiente. |

---

## Testes e Integração Contínua (CI)

O projeto utiliza **Vitest** para testes unitários, com limiares mínimos de cobertura:

```js
thresholds: {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80
}
```

### Boas práticas de teste

- Todos os testes devem ser escritos em inglês e seguir o formato:  
  `it('should render ...')`
- Sempre testar:
  - Casos de sucesso.  
  - Casos de erro.  
  - Casos de borda (*edge cases*).  
- Execute `npm run test` antes de abrir um PR.

**Exemplo de teste:**

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

## Estrutura Principal (`src/`)

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

### Descrição das Pastas

#### `app/`
Pasta do **Next.js App Router** contendo páginas, layouts e handlers de rotas (`page.tsx`, `layout.tsx`, etc).  
> **Responsabilidade:** Definir as rotas, páginas e estrutura global de layout da aplicação.

---

#### `actions/`
Contém **Server Actions do Next.js** — funções assíncronas executadas no servidor para manipular dados, interagir com banco de dados ou serviços externos.  
Essas funções são ideais para operações **CRUD**, sem precisar de rotas de API separadas.

**Exemplo:**

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
Componentes **React** reutilizáveis da aplicação.  
> Exemplo: `PropertyCard`, `RegisterForm`, `Header`, `Footer`.

---

#### `hooks/`
Hooks personalizados, como `useProperty`, `useFilterProperties`, `useAuth`.  
> **Responsabilidade:** Encapsular lógica reutilizável de estado, efeitos e chamadas de API.

---

#### `layouts/`
Layouts compartilhados (exemplo: `MainLayout`, `DashboardLayout`).  
> **Responsabilidade:** Definir a estrutura visual (navbar, sidebar, footer).

---

#### `libs/`
Configurações e integrações de bibliotecas externas (exemplo: cliente HTTP, funções auxiliares).  
> **Responsabilidade:** Centralizar a configuração e exportação de libs e utilitários externos.

---

#### `providers/`
Providers globais do React (exemplo: `ThemeProvider`, `QueryClientProvider`).  
> **Responsabilidade:** Fornecer contexto global para a aplicação.

---

#### `sections/`
Seções reutilizáveis de páginas (exemplo: `HeroSection`, `FeaturedPropertiesSection`, `ContactSection`).  
> **Responsabilidade:** Agrupar blocos visuais reutilizáveis entre páginas.

---

#### `services/`
Camada responsável por chamadas de API e lógica de negócio (exemplo: `propertyService.ts`, `userService.ts`).  
> **Responsabilidade:** Lidar com acesso a dados e tratamento de erros.

---

#### `store/`
Gerenciamento de **estado global com Zustand**.  
> Todas as stores devem seguir a estrutura padrão com **state** e **actions**, e possuir tipagem explícita (sem `any`, `unknown` ou `never`).

**Exemplo de store padrão:**

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

> **Responsabilidade:** Centralizar e gerenciar o estado global da aplicação, garantindo separação clara entre `state` e `actions`.

---

#### `utils/`
Funções puras e reutilizáveis.  
> Exemplo: `formatCurrency`, `maskPostalCode`, `slugify`.

---

## Convenções de Arquivos

> **Todas as pastas do projeto** devem seguir o mesmo padrão de nomenclatura e estrutura.

| Tipo | Padrão | Exemplo |
|------|---------|---------|
| Componente | `component-name.tsx` | `property-card.tsx` |
| Teste | `component-name.test.tsx` | `property-card.test.tsx` |
| Barrel File | `index.ts` | `export { default } from './property-card'` |

---

## Fluxo de Desenvolvimento

1. **Atualize a branch principal**  
   ```bash
   git checkout main && git pull
   ```

2. **Crie uma nova branch**  
   ```bash
   git checkout -b feat/nome-da-feature
   ```

3. **Execute o servidor de desenvolvimento**  
   ```bash
   npm run dev
   ```

4. **Implemente e teste sua feature**  
   - Adicione testes unitários (`.test.tsx`).  
   - Execute `npm run test`.

5. **Verifique o lint antes de commitar**  
   ```bash
   npm run lint
   ```

6. **Abra um Pull Request (PR)**  
   - Descreva claramente as alterações.  
   - Garanta que o CI (build + lint + testes) passe com sucesso.

---

## Checklist de PR

- ✅ Testes executam localmente.  
- ✅ Cobertura ≥ 80%.  
- ✅ Sem erros no ESLint.  
- ✅ Código modular e bem tipado.  
- ✅ Componentes, hooks e stores seguem as convenções.  

---

## Boas Práticas

- Utilize **TypeScript** em todos os arquivos.  
- Evite `any`, `unknown` e `never`.  
- Escreva **testes em inglês** (`it('should ...')`).  
- Prefira **componentes funcionais**.  
- Mantenha a **store do Zustand** separando `state` e `actions`.  
- Centralize operações assíncronas em **actions/**.  
- Use **Tailwind** para consistência visual.  

---

## Contribuição

Contribuições são bem-vindas!  
Envie PRs com descrições detalhadas, capturas de tela (para alterações de UI) e passos de reprodução.

Repositório oficial:  
👉 [https://github.com/roxygens/imovel-web](https://github.com/roxygens/imovel-web)
