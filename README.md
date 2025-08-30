# Reforge Learning Hub

A Next.js-based AI learning hub that extracts course content from HTML files and displays them in a searchable, organized interface.

## Features

- **Content Extraction**: Extracts course content from HTML files and converts them to a compressed JSON database
- **Course Browsing**: Browse courses by category and subcategory
- **Lesson Viewing**: Full lesson content display with images and formatting
- **Search**: Search through course content and lessons
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Content Extraction

Extract course content from HTML files:

```bash
# Extract all courses
node extract_content.js

# Incremental extraction (only changed files)
node extract_content.js --incremental

# Extract specific course
node extract_content.js --course "AI Strategy"
```

## Project Structure

- `src/app/` - Next.js app directory with pages and components
- `extract_content.js` - Content extraction script
- `courses_database.json` - Generated course database
- `courses/` - Source HTML course files

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure build settings:
   - **Framework**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Deploy

The app will automatically deploy on every push to the main branch.

## Built With

- [Next.js 15](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Heroicons](https://heroicons.com/) - Icons
