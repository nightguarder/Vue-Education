# Educational AI-Supported Platform for Doctors and Patients (Thesis Project)

## About

This project is part of a Master's Thesis focused on the design and development of a software system to support psychiatric care with a primary emphasis on **sensitive data protection**.

The platform addresses the critical need to utilize modern Generative AI tools (such as Large Language Models) in clinical practice without the risks associated with sending sensitive patient data to cloud providers. It implements a secure, **locally operated (on-premise)** environment for patient education and clinical support.

### Key Research Areas:

- **Privacy-First AI**: Implementation of LLMs on local hardware to ensure data remains offline.
- **Multimodal Education**: Utilizing Speech-to-Text (STT) and Text-to-Speech (TTS) technologies to generate audiovisual educational materials.
- **Clinical Integration**: Providing tools for doctors to transcribe patient sessions and deliver personalized medical information to doctors and patients.
- **Proof of Concept**: Demonstrating that advanced AI tools can be efficiently and economically operated within a private medical practice.
- **User Experience**: Ensuring the platform is intuitive and user-friendly for both doctors and patients.
- **Security** : All AI models and data processing are performed locally - on premise, ensuring no data leaves your device. This guarantees privacy and security for all users.

---

## Technical Stack

This project utilizes an experimental and modern technical stack to achieve high performance and developer efficiency:

- **Framework**: [Vue 3.6 (Vapor Mode)](https://github.com/vuejs/core-vapor) - Utilizing the latest experimental performance-oriented compilation strategy for Vue.
- **Package Manager**: [pnpm](https://pnpm.io/) - Fast, disk space efficient package management.
- **Formating**: [oxfmtr](https://github.com/oxc-project/oxc) - A highly experimental and high-performance Rust-based formatter.
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/) - A Vite-native unit testing framework.

---

## Prerequisites

To run this platform locally, you will need to set up the following components:

- **PHP 8.3+**: The backend logic is powered by PHP. Ensure you have PHP 8.3 or higher installed to handle API requests and database interactions.
- **MySQL Database (via Colima or Docker)**: The platform requires a MySQL server. It is recommended to use **Colima** or **Docker** to spin up a local MySQL instance.
- **OMLX (Local AI Server)**: OMLX is a local AI model server built on Apple's **MLX** framework, designed for high-performance inference on Apple Silicon. It provides the Local inference capabilities for the platform, ensuring all data processing remains private and offline. Open-source project at [https://github.com/jundot/omlx](https://github.com/jundot/omlx)
- **Node.js & pnpm**: The frontend is built with Vue 3 and Vite. You will need Node.js and the **pnpm** package manager for installation and development.
- **Browser Support (WASM/WebGPU)**: Since the platform utilizes **ONNX Runtime Web** for local Text-to-Speech (TTS) and other AI tasks, a modern browser with WebAssembly (WASM) support is recommended.
- **Composer**: PHP dependency manager for backend components.

---

## Dependencies

### UI & Styling

- **Bootstrap 5**: Core styling framework [docs](https://getbootstrap.com/docs/5.0/getting-started/introduction/).
- **Bootstrap Vue Next**: Seamless integration of Vue 3, Bootstrap 5, and TypeScript [github](https://github.com/bootstrap-vue/bootstrap-vue-next).
- **Bootstrap Icons**: Official [open source](https://github.com/twbs/icons) SVG icon library for Bootstrap.
  - **Frontend (npm)**: `npm i bootstrap-icons`
  - **Backend (Composer)**: `composer require twbs/bootstrap-icons`

### Core Frontend

- **Vue 3 (Vapor Mode)**: Core framework.
- **Vue Router**: Client-side routing.
- **VueUse**: Collection of essential Vue composition utilities.

### Tooling

- **Vite**: Build tool and dev server.
- **Vitest**: Unit testing.
- **oxfmt**: High-performance Rust-based formatter.

---

## Project Setup

### Frontend
1. Install dependencies
```sh
pnpm install
```

2. Start the development server 

Start the development server with hot-reload:

```sh
pnpm dev
```

3. Build for production and launch for production with the build:

```sh
pnpm build && pnpm preview
```

4. Run unit tests with Vitest:

```sh
pnpm test:unit
```


5. Format the codebase using the experimental oxfmtr:

```sh
pnpm format
```

> [oxfmtr](https://oxc.rs/docs/guide/what-is-oxc.html) Oxidation Compiler is a collection of high-performance tools for JavaScript and TypeScript written in Rust.

### Backend

The backend is a PHP based API that is hosted on a separate server (InfinityFree). The frontend communicates with the backend using RESTful API calls.
However you can host the backend on localhost as well. 

```sh
php -S localhost:8000 -t backend/api
```

### Containers
backend requires a MySQL database to be running. You can use Docker to run a MySQL container.
FOr lightweight resources I use [colima](https://colima.run), which runs with sensible defaults without becoming a burden on RAM & CPU. 

1. Start colima isntance
```sh
colima start
```
2. Docker compose instance
```sh
cd backend && docker-compose up -d
```
---

## Keywords

`education`, `content generation`, `language models`, `local operation`, `medicine`, `neural networks`, `software engineering`, `web application`
