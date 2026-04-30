# Vue Education Skeleton

## About
A clean, reusable skeleton for building privacy-focused educational platforms tailored for two primary user groups:
1. **Doctors**: Clinical tools and educational resources.
2. **Patients**: Health information and support modules.

This skeleton provides a pre-configured frontend foundation with Vue 3 (Vapor Mode), PWA support, and TypeScript setup, ready for extension with local AI modules and a custom Python backend. The full application will be deployed online via Wasmer.

### Core Features:
- **Privacy-First Design**: Architecture supports local AI processing to keep sensitive data offline.
- **Multimodal Education**: Planned support for Speech-to-Text (STT) and Text-to-Speech (TTS) for audiovisual materials.
- **Doctor/Patient Portals**: Structured to support role-specific modules for clinical and patient use.
- **PWA Ready**: Offline support via service worker implementation.
- **Modern Stack**: Vue 3.6 Vapor Mode, Vite 8, Vitest, and oxfmt for high performance and developer efficiency.
---

## Technical Stack

### Frontend (this skeleton)
- **Framework**: [Vue 3.6 (Vapor Mode)](https://github.com/vuejs/core-vapor) - Experimental high-performance compilation strategy.
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Formatter**: [oxfmt](https://github.com/oxc-project/oxc) - Rust-based, high-performance.
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

### Planned Backend
- **Runtime**: Python (to be written from scratch)
- **Hosting**: [Wasmer.io](https://wasmer.io) - Supports Python, Node.js, and WASM deployments.
- **Database**: MySQL (or PostgreSQL)
- **Local AI**: Planned integration with local LLM inference (OMLX / ONNX Runtime Web) for privacy-first features.

---

## Prerequisites

### Frontend Development
- **Node.js**: v20.19.0+ or v22.12.0+
- **pnpm**: Install via `npm install -g pnpm`

### Full-Stack / Backend (Planned)
- **Python**: v3.10+ (for the new backend)
- **Database**: MySQL or PostgreSQL (local or Docker)
- **Wasmer CLI** (optional): For local simulation of Wasmer deployment - `curl https://get.wasmer.io -sSfL | sh`
- **Browser**: Modern browser with WebAssembly (WASM) support for local AI features.

__Note:__ On macOS, most tools can be installed via `brew`.
---

## Project Setup

### Installation
```sh
pnpm install
```

### Development
Start the development server with hot-reload:
```sh
pnpm dev
```

### Type-Checking & Production Build
```sh
pnpm build
```

### Testing
Run unit tests with Vitest:
```sh
pnpm test:unit
```

### Formatting
Format the codebase using the experimental oxfmtr:
```sh
pnpm format
```

> [oxfmtr](https://oxc.rs/docs/guide/what-is-oxc.html) Oxidation Compiler is a collection of high-performance tools for JavaScript and TypeScript written in Rust.

---

## Keywords
`education`, `vue3`, `skeleton`, `pwa`, `privacy-first`, `local-ai`, `doctors`, `patients`, `wasmer`
