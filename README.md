# My GPT

<img width="1799" height="962" alt="Screenshot from 2025-08-18 14-28-18" src="https://github.com/user-attachments/assets/7bcdd23d-7a14-4181-b0af-5334f7b1a9f2" />

A pixel-perfect, full-stack clone of ChatGPT with memory, file uploads, and message editing capabilities. Built with Next.js, Vercel AI SDK, and modern web technologies.

## ✨ Features

### Core Functionality
- **Authentic ChatGPT UI/UX** - Pixel-perfect replication
- **Vercel AI SDK Integration** - Streaming chat responses
- **Context-Aware Memory** - Powered by mem0
- **Message Editing** - Edit & regenerate responses seamlessly

### Advanced Capabilities
- **File Uploads** - Images (PNG/JPG) & Documents (PDF/DOCX/TXT)
- **Long Context Handling** - Smart message trimming for model limits
- **File Storage** - Uploadcare integration

## 🛠 Tech Stack

| Category          | Technology                          |
|-------------------|-------------------------------------|
| Framework         | Next.js 14 (App Router)             |
| Language          | TypeScript                          |
| UI Components     | ShadCN + TailwindCSS                |
| AI SDK            | Vercel AI SDK                       |
| Authentication    | Clerk                               |
| Database          | MongoDB Atlas                       |
| File Storage      | Uploadcare                          |
| Memory Service    | mem0                                |
| Deployment        | Vercel                              |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Uploadcare account
- Clerk setup

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/SinghaAnirban005/MyGPT.git
   cd my-gpt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```



