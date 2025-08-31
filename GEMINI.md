# Project Overview

This project is a web crawler and learning hub for Reforge course content. It consists of two main parts:

1.  **Crawler:** A Node.js script (`extract_content.js`) that crawls Reforge course content from HTML files, converts them to Markdown, and saves them.
2.  **Learning Hub:** A Next.js application in the `learning-hub` directory that serves the crawled content in a user-friendly web interface.

## Key Technologies

*   **Crawler:** Node.js, Cheerio, Turndown
*   **Learning Hub:** Next.js, React, TypeScript, Tailwind CSS

# Building and Running

## Crawler

To run the crawler and extract content from the HTML files:

```bash
node extract_content.js
```

## Learning Hub

To run the learning hub application:

```bash
cd learning-hub
npm install
npm run dev
```

This will start the development server at `http://localhost:3000`.

To build the application for production:

```bash
cd learning-hub
npm run build
```

To start the production server:

```bash
cd learning-hub
npm run start
```

# Development Conventions

The project uses ESLint for code linting in the `learning-hub` application. To run the linter:

```bash
cd learning-hub
npm run lint
```
