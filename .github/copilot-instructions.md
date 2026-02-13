# Copilot Instructions — Hazardous Atelier

## Architecture
- **React 18 + Vite** SPA. Single monolithic component at `src/components/CockpitScene.jsx` (~1100 lines) contains all game logic, state, and UI.
- **`src/App.jsx`**: Thin wrapper — iOS-style loading overlay that preloads audio, then renders `CockpitScene`.
- **`src/index.css`**: All styling lives here (~2400 lines). Pure CSS, no preprocessors, no CSS modules.
- **`api/`**: Vercel serverless functions. `generate-text.js` (pastry names + descriptions via AI) and `generate-image.js` (image gen via AI).
- **`vite.config.js`**: Custom `apiMiddleware` plugin that intercepts `/api/*` routes in dev, dynamically imports and runs the serverless functions locally so the same code works in dev and on Vercel.

## AI Integration
- All AI goes through **Hack Club's OpenAI-compatible API** at `https://ai.hackclub.com/proxy/v1/chat/completions`.
- API key is in `.env` as `VITE_HACKCLUB_API_KEY`. Serverless functions read it via `process.env`. The Vite config loads `.env` into `process.env` for dev.
- Text generation uses model `qwen/qwen3-32b`. Image generation uses `google/gemini-2.0-flash-exp:free` with `modalities: ["image", "text"]`.
- Client calls `/api/generate-text` (same origin) — never call the AI API directly from the browser (CORS).

## Critical Conventions
- **ZERO comments in code.** Never add comments to any file. This is a strict rule.
- All game state is `useState`/`useCallback` hooks in `CockpitScene.jsx`. No external state management.
- Customer avatars use **DiceBear notionists** style for both the register and the window: `https://api.dicebear.com/9.x/notionists/svg?seed=<name>`.
- Audio files live in `public/audio/`. Three files: `bell-ring.mp3`, `pc-ambient.mp3`, `cassette-insert.mp3`.
- Zoom system: three targets (`computer`, `clock`, `pos`) using `dimIn` + `zoomMorph` CSS animations.

## Game Data Flow
1. Player types `gen new "<prompt>"` in the terminal → client POSTs to `/api/generate-text` → AI returns `{ name, description }` → slot updates to `ready`.
2. Player rings bell → `generateCustomer()` creates a customer with random traits from hardcoded arrays (60 names, species, patience, cravings).
3. Player clicks serve in the register → `handleServe` awards random $100-$400, clears slot, shows customer reaction.

## Dev Workflow
- `npm run dev` starts Vite with the API middleware on port 5173.
- Serverless functions are tested locally via the Vite middleware — no need for `vercel dev`.
- Deploys to **Vercel**. The `api/` directory auto-deploys as serverless functions.

## Shop System
- 3 items: `cpu-turbo` (faster gen), `ram-stick` (+1 slot), `model-v2` (richer descriptions). Defined in `SHOP_ITEMS` array at top of `CockpitScene.jsx`.
