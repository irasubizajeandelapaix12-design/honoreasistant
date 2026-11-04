# Honore Assistant — Advanced All-in-One Personal AI Assistant

Honore Assistant is an enterprise-grade personal AI assistant, engineering partner, research analyst, productivity manager, and task automation agent built with Node.js, Express, React, TypeScript, Tailwind CSS, and the Google GenAI SDK (`@google/genai`).

---

## 🌟 Key Features

1. **Multi-Model Cognitive Engine**
   - Built on `gemini-3.8-flash` with Google Search grounding for real-time web intelligence and direct source citations.
   - Streaming Server-Sent Events (SSE) response pipeline for low latency.
   - Multimodal analysis: Image attachment understanding and document parsing (TXT, MD, CSV, JSON, PDF).
   - Multilingual fluency: English, Kinyarwanda, French, Swahili, Spanish, and more.

2. **Personal AI Memory System**
   - Persistent memory vault across sessions.
   - Categorizes user preferences, active project states, system instructions, and verified facts.
   - Seamlessly injects active memories into conversational context so Aether remembers your workflow.

3. **Code Studio & Sandbox**
   - In-app multi-language code runner with stdout capture, error logs, and execution benchmarks.
   - Live Web Preview for interactive HTML/CSS/JS web applications.
   - AI code review and optimization.

4. **Internet Research Studio**
   - Deep search interface grounded in live Google Search.
   - Verification of claims with direct URL citations.
   - 1-click export of research findings to the Document Library.

5. **Document Intelligence & Creator**
   - Create, edit, and download documents in Markdown, CSV, JSON, HTML, and Plain Text.
   - Browser print-to-PDF formatting for executive reports.
   - Document analysis in chat.

6. **Relational Database Assistant**
   - Interactive SQL query runner supporting `SELECT`, `INSERT`, `CREATE TABLE`, `SHOW TABLES`, and `DESCRIBE`.
   - Live schema explorer with tabular figures and column inspector.
   - AI query designer and schema architect.

7. **Productivity & Task Management**
   - Kanban board with `To Do`, `In Progress`, and `Completed` lanes.
   - Priority tagging (`high`, `medium`, `low`) and deadline tracking.
   - AI Daily Schedule Planner that converts active tasks into a time-blocked day agenda.

8. **Autonomous Automation Engine**
   - Multi-step agent pipelines for automated research briefing, code security audits, and daily briefings.
   - Real-time step progress tracking and output logging.

9. **Voice Companion Overlay**
   - Full-screen hands-free voice conversation mode.
   - Real-time audio waveform canvas visualizer.
   - Speech-to-text input and natural text-to-speech voice playback.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Google Gemini API Key (`GEMINI_API_KEY` set in environment or Secrets panel)

### Development
```bash
npm run dev
```
Starts the full-stack server on `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```
Compiles Vite frontend and starts the Express production server.
