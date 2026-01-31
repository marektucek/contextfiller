# ContextFiller

A modern, dark-mode React application that generates context-aware filler text using the Google Gemini API. Unlike traditional "Lorem Ipsum," this tool creates readable, relevant placeholder text based on your subject matter.

## Features

- 🎨 **Dark Mode UI** - Modern slate/zinc dark theme
- 🌍 **Multi-language Support** - English, Czech, or custom language
- 🎭 **Tone Selection** - Professional, Semi-professional, Friendly, or Funny
- 📋 **Three Output Formats** - Sentence, Short Paragraph, and Long Paragraph
- 🔐 **Secure API Key Management** - Environment variable or localStorage fallback
- ⚡ **Fast Generation** - Powered by Gemini 2.5 Flash model

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**

   Option A: Environment Variable (Recommended)
   - Create a `.env` file in the root directory
   - Add your Gemini API key:
     ```
     VITE_GEMINI_API_KEY=your_api_key_here
     ```

   Option B: Settings Modal
   - If no environment variable is set, the app will prompt you to enter your API key
   - The key will be stored in your browser's localStorage

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Usage

1. Enter a subject/topic in the input field (e.g., "Organic Skincare")
2. Select your preferred language (EN, CZ, or Other)
3. Choose a tone (Professional, Semi-professional, Friendly, or Funny)
4. Click "Generate Filler Text"
5. Copy any of the generated texts using the copy icon

## Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Google Gemini API** - Text Generation

## API Key

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## License

MIT
