# MathPad

A calculator application with a different take - inspired by CalcPad. Built with Next.js, TypeScript, CodeMirror 6, and Tailwind CSS.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features Implemented ✅

- **CodeMirror 6 Editor** with custom right gutter for displaying results
- **Dark/Light Theme** switching with persistent preferences
- **LocalStorage** persistence for editor content and preferences
- **URL Hash Sharing** - share calculations via URL (content encoded in hash)
- **Preferences Dialog** with settings for:
  - Font size
  - Decimal places
  - Decimal separator
  - Thousands separator
  - Theme (dark/light)
- **Auto-completion** for Math functions and user-defined variables
- **JetBrains Mono** font for the editor
- **Keyboard shortcuts**:
  - `ESC` - Close dialogs
  - `Tab` - Accept autocomplete
  - `Ctrl+Space` - Trigger autocomplete
  - `Ctrl+F` - Find & replace
  - `Ctrl+Z` / `Ctrl+Shift+Z` - Undo/Redo

## Project Structure

```
app/
  layout.tsx          # Root layout with JetBrains Mono font
  page.tsx            # Main page (renders App component)
  globals.css         # Global styles and CSS variables

components/
  App.tsx             # Main application container
  Editor.tsx          # CodeMirror editor wrapper
  Help.tsx            # Help/documentation component (placeholder)
  PreferencesDialog.tsx  # Settings modal
  
  codemirror/
    CodeMirror.tsx       # Low-level CM6 wrapper
    Completions.ts       # Autocomplete logic
    DarkTheme.ts         # Dark theme configuration
    LightTheme.ts        # Light theme configuration
    MathpadLang.ts       # Syntax highlighter
    ResultsGutter.ts     # Custom right gutter for results

lib/
  types.ts            # TypeScript interfaces
  use-local-storage.ts  # Custom hook for persistence & URL sharing
```

## What's Next - TODO 📝

### 1. Parser/Evaluator Implementation

The calculation engine is not yet implemented. You need to create a parser/evaluator that:

**Location**: Update the `textToResults()` function in `components/Editor.tsx`

**Requirements**:
- Parse mathematical expressions from text
- Support variables and assignments
- Return an array of result strings (one per line)
- Handle errors gracefully (return '-' or empty string for invalid lines)

**Example Input/Output**:
```
Input:
1 + 2
salary = 100000
tax = 20% of salary

Output:
['3', '100000', '20000']
```

### 2. Build Configuration

The production build currently has issues with SSR. To fix:

Add to `app/page.tsx`:
```typescript
export const dynamic = 'force-dynamic';
```

Or configure Next.js to skip prerendering for this route.

### 3. Help Documentation

The Help component (`components/Help.tsx`) is currently a placeholder. Add your documentation content there, or create a separate help page route.

### 4. Features to Consider

- **Cloud Storage Integration** - Replace localStorage with cloud provider
- **Share Dialog** - UI for copying shareable URLs
- **Export/Import** - Download/upload calculations
- **Keyboard Shortcuts Panel** - Show available shortcuts
- **History/Versions** - Track changes over time
- **Mobile Optimization** - Better UX for touch devices

## Dependencies

Key packages used:
- `next` - React framework
- `react` - UI library
- `@codemirror/state`, `@codemirror/view`, etc. - Editor
- `convert-units` - Unit conversion library (if you implement unit support)
- `tailwindcss` - Styling

## Known Issues

- Build process fails on prerendering (fixed by making page client-side only)
- Some React key warnings in console (cosmetic, from Next.js internals)

## License

MIT
