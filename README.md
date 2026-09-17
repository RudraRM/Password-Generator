# Keyform — Password Generator

A complete Next.js App Router application with a minimalist landing page and an interactive password workspace. Built with TypeScript, Tailwind CSS 4, and Framer Motion.

## Run locally

Use Node.js 20.9 or newer (Node.js 22 LTS recommended).

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. No API keys, environment variables, accounts, or database are required.

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production static export at `http://localhost:3000`. Use HTTPS for a public deployment. The development wrapper accepts both Next.js `--hostname` and managed-preview `--host` flags.

## Pages and components

| Path                        | Purpose                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `app/page.tsx`              | Landing route (`/`)                                                                |
| `app/generate/page.tsx`     | Generator route (`/generate/`)                                                     |
| `app/layout.tsx`            | Metadata, locally bundled fonts, shared navigation and footer                      |
| `app/template.tsx`          | Route-entry animation                                                              |
| `app/globals.css`           | Tailwind import, design tokens, responsive styles, focus and reduced-motion states |
| `components/Landing.tsx`    | Hero, live password specimen, feature grid                                         |
| `components/Generator.tsx`  | Generator output, strength meter, slider and character controls                    |
| `components/CopyButton.tsx` | Animated clipboard feedback and error handling                                     |
| `components/Header.tsx`     | App Router navigation with a shared-layout indicator                               |
| `lib/password.ts`           | Cryptographic generation, validation, entropy calculation                          |
| `lib/clipboard.ts`          | Clipboard API with a user-initiated legacy fallback                                |
| `tests/password.test.ts`    | Security and boundary regression tests                                             |

## Behavior

- Length from 6 to 64 characters, defaulting to 20.
- Uppercase, lowercase, numbers and symbols can be selected independently. Every enabled type is guaranteed to occur. The final enabled type cannot be deselected.
- Optional exclusion removes `i`, `I`, `l`, `L`, `o`, `O`, `0`, `1`, and `|` when present in the selected alphabet.
- Changing any setting immediately creates a new password. Regenerate keeps the current settings.
- Passwords are selectable, use a monospace font with a slashed zero, and wrap at the maximum length.
- Copy feedback resets when the password changes. If all clipboard methods fail, the UI explains manual selection and copying.
- Native range/checkbox/switch semantics, keyboard navigation, visible focus, a skip link and reduced-motion support are included.
- All fonts are served from the build. The application has no third-party runtime scripts, analytics, password API, browser-storage persistence or password history.

## Generation and strength

Generation happens only in a browser effect or user action, never during server rendering or static export. It uses `crypto.getRandomValues()` and rejects the incomplete tail of the 32-bit random range to eliminate modulo bias. It rejects complete candidate strings missing any selected character type, preserving a uniform distribution over all valid passwords. It never falls back to `Math.random()`.

The meter computes the number of valid strings with inclusion–exclusion and derives entropy as `log2(valid strings)`. It accounts for selected groups, similar-character exclusions, and mandatory group coverage. The labels are product thresholds, not external certifications or crack-time guarantees:

| Label    | Entropy              |
| -------- | -------------------- |
| Weak     | Below 50 bits        |
| Medium   | 50 to below 80 bits  |
| Strong   | 80 to below 128 bits |
| Ultimate | 128 bits or more     |

Use a different password for each account and save it in a trusted password manager. A clipboard manager or device synchronization may retain a password after copying. Hosting providers may keep normal request logs, but password generation does not send the password to the host. Extensions, a compromised browser, or an infected device are outside this tool's protection.

In browsers exposing the experimental WebMCP API, the workspace registers `configure_and_generate_password`. It validates all six settings, updates the same visible UI, and returns only nonsecret settings and strength metadata. It never returns or copies a generated password. Unsupported browsers use the normal interface.

## Deployment

`next.config.ts` enables a static export with trailing slashes. `npm run build` creates `out/`, containing both routes and the 404 page. Publish that directory on a static host with HTTPS and directory-index support. No application server is required. For a GitHub Pages project subdirectory, set Next.js `basePath` and the favicon URL to match the deployment path before building.

The `.openai/hosting.json` file links this checkout to its managed preview and selects `out/` as the deployment directory; it contains no credentials. Other hosting providers can ignore that file. The full source lives in [RudraRM/Password-Generator](https://github.com/RudraRM/Password-Generator).

## Tests

`npm test` checks all 15 nonempty character-type combinations at both length boundaries, with exclusions on and off (600 generated samples); rejects invalid settings; verifies all four strength tiers; exercises biased-tail rejection; and checks failure when secure randomness is unavailable. In-memory React component tests also cover initial generation, changing settings, final-type protection, copying, stale clipboard completions, and clipboard failures.

Implementation references: [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), [Web Crypto getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues). Visual direction was inspired by the restrained layouts and typography requested from [UI UX Pro Max](https://uupm.cc/#styles).
