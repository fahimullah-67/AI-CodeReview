# 🤖 CodeReview AI

An AI-powered GitHub Pull Request reviewer that automatically analyzes code diffs, detects bugs, security issues, and improvement opportunities — then posts detailed feedback directly to your GitHub PR.

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)
![LangChain](https://img.shields.io/badge/LangChain-0.2+-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 📌 Problem Statement

Every day, thousands of developers submit Pull Requests that wait hours or days for review. Code reviews are:

- **Slow** — PRs sit unreviewed while reviewers are busy
- **Inconsistent** — different reviewers catch different things
- **Expensive** — senior developer time is a costly resource
- **Skipped** — small teams often merge without proper review

**CodeReview AI** solves this by delivering instant, consistent, and thorough AI-powered reviews the moment a PR is opened.

---

## ✨ Features

- 🔍 **Automatic PR diff analysis** — fetches and analyzes changed files from any GitHub repo
- 🐛 **Bug detection** — identifies runtime errors, logic bugs, and anti-patterns
- 🔐 **Security scanning** — catches SQL injection, insecure hashing, and other vulnerabilities
- 💡 **Improvement suggestions** — recommends better code structure and best practices
- ✅ **Positive feedback** — highlights what the developer did well
- 📊 **Scoring system** — gives each PR an overall quality score out of 100
- 💬 **GitHub integration** — posts AI review comments directly on the PR
- 🧠 **Multi-model support** — works with Google Gemini, Anthropic Claude, and OpenAI GPT
- 💾 **Review history** — saves all reviews locally for future reference
- ⭐ **User feedback** — rate the quality of each AI review
- 🗑️ **Review management** — delete individual or all saved reviews

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.11+ |
| AI/LLM | LangChain, Google Gemini / Anthropic Claude / OpenAI |
| GitHub Integration | PyGithub |
| Frontend | React 18, Vite, Tailwind CSS |
| Storage | Browser localStorage |
| HTTP Client | Axios |
| Icons | Lucide React |

---

## 📁 Project Structure

```
ai-code-reviewer/
│
├── backend/
│   ├── main.py              # FastAPI server + API routes
│   ├── reviewer.py          # Core AI review pipeline
│   ├── github_client.py     # GitHub API integration
│   ├── webhook.py           # GitHub webhook handler
│   ├── .env                 # API keys (never commit!)
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx    # Home + review history
        │   ├── PRDetail.jsx     # PR review results
        │   ├── PRList.jsx       # All reviews list
        │   └── Settings.jsx     # Model configuration
        ├── components/
        │   └── Navbar.jsx
        ├── utils/
        │   └── storage.js       # localStorage helpers
        └── App.jsx
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- GitHub account + personal access token
- API key from Google AI Studio, Anthropic, or OpenAI

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-code-reviewer.git
cd ai-code-reviewer
```

---

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:

```env
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
```

> Get your GitHub token at: **github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**
>
> Required scopes: `repo`, `write:discussion`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

---

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

### 5. Configure Your AI Model

1. Go to **Settings** in the app
2. Choose your AI provider (Gemini / Claude / OpenAI)
3. Select a model
4. Paste your API key
5. Click **Save Settings**

---

### 6. Run Your First Review

1. Go to **Dashboard**
2. Enter your GitHub repo as `owner/repo-name`
3. Enter the PR number
4. Click **Review PR**
5. Watch the AI analyze and review your code!

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/api/models` | List available AI models |
| `GET` | `/api/prs/{owner}/{repo}` | Get open PRs for a repo |
| `POST` | `/api/review/{owner}/{repo}/{pr_number}` | Run AI review on a PR |
| `POST` | `/webhook` | GitHub webhook receiver |

### Review Request Body

```json
{
  "provider": "google",
  "model": "gemini-2.0-flash",
  "api_key": "your_api_key",
  "post_to_github": true
}
```

### Review Response

```json
{
  "pr": {
    "number": 3,
    "title": "Fix payment bug",
    "author": "fahimullah-67",
    "url": "https://github.com/..."
  },
  "reviews": [
    {
      "filename": "payment.py",
      "review": {
        "summary": "Good improvements overall...",
        "overall_score": 72,
        "bugs": [],
        "improvements": [],
        "security_issues": [],
        "positive_points": []
      }
    }
  ],
  "total_files": 1,
  "model_used": "google/gemini-2.0-flash"
}
```

---

## 🤖 Supported AI Models

| Provider | Models |
|---|---|
| Google Gemini | `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash` |
| Anthropic Claude | `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`, `claude-opus-4-6` |
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |

---

## ⚠️ Challenges & Solutions

| Challenge | Solution |
|---|---|
| LLM token limits on large PRs | Chunk diffs per file, review each separately |
| LLM returning non-JSON | Prompt engineering + markdown backtick cleanup |
| GitHub API 403 errors | Token needs `repo` scope with write access |
| Diff returning `None` | Ensure both branches have different file content |
| Webhook needs public URL | Use ngrok locally, or deploy to Railway/Render |

---

## 🔮 Roadmap

- [ ] GitHub OAuth login
- [ ] Webhook auto-trigger on PR open
- [ ] Support for multiple repos
- [ ] Team dashboard with shared reviews
- [ ] Deploy to Railway / Render
- [ ] Custom review rules per repo
- [ ] Email notifications

---

## 📦 Requirements

### Backend (`requirements.txt`)

```
fastapi
uvicorn
python-dotenv
PyGithub
langchain-core
langchain-google-genai
langchain-anthropic
langchain-openai
```

Install all:
```bash
pip install -r requirements.txt
```

---

## 🔒 Security Notes

- API keys are stored only in your **browser's localStorage** — never sent to any external server other than the AI provider you choose
- GitHub token is stored in your backend `.env` file — never commit this file
- All webhook payloads are verified using HMAC SHA-256 signature

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👤 Author

**Fahimullah**
- GitHub: [@fahimullah-67](https://github.com/fahimullah-67)

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- [LangChain](https://langchain.com) — LLM orchestration framework
- [PyGithub](https://pygithub.readthedocs.io) — GitHub API wrapper
- [FastAPI](https://fastapi.tiangolo.com) — Modern Python web framework
- [Google AI Studio](https://aistudio.google.com) — Gemini API

---

> Built as a portfolio project to demonstrate AI integration, GitHub API usage, and full-stack development skills.
