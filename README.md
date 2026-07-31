# AI-Powered Resume Builder & Automated Tracking System (ATS) Optimizer

An intelligent, full-stack web application designed to eliminate resume rejection rates. Built using the **MERN Stack** and powered by the **Google Gemini 1.5 Flash API**, this platform enables users to build ATS-compliant resumes, receive real-time structural scoring, and execute precise match-gap analysis against target job descriptions.

---

## 🚀 Key Features

* **🛠️ Interactive MERN Resume Builder:** Drag-and-drop sections with a live-preview responsive editing canvas.
* **🤖 Google Gemini AI Engine:** Automated bullet point rewriting, contextual skill extraction, and tailored objective line generation.
* **📊 Dynamic ATS Scoring System:** Real-time analysis evaluating keyword density, formatting compliance, section depth, and syntax validity.
* **🎯 Job Description (JD) Matcher:** Natural Language Processing (NLP) match-gap analysis engine delivering percentage scores and missing skill checklists.
* **📄 Clean-Scrape PDF Pipeline:** Custom DOM-to-PDF rendering engineered specifically to preserve raw underlying text paths for external ATS parsers.

---

## 🏗️ System Architecture & Workflow

```plaintext
  [ React Client ]  <--->  [ REST API (Node/Express) ]  <--->  [ MongoDB Atlas ]

         |                            |
  (JWT Auth & State)          (Multer File Upload)
                              (Gemini AI Engine via JSON Prompts)
```

1. **Authentication Layer:** Secure route access managed via JSON Web Tokens (JWT) coupled with local `bcryptjs` password hashing.
2. **AI Enhancement Pipeline:** Prompt-engineered payloads query Gemini 1.5 Flash to format raw text inputs into high-impact, quantifiable JSON matrices.
3. **ATS Scoring Engine:** Combines explicit heuristic checks (contact parsing, layout traps) with structural parsing to generate a dynamic dashboard profile.

---

## 🗄️ Database Schema Design (MongoDB/Mongoose)

### Users Schema
```javascript
{
  _id: ObjectId,
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

### Resumes Schema
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'Users', required: true },
  title: String,
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    linkedin: String,
    github: String,
    portfolio: String
  },
  education: [{
    school: String,
    degree: String,
    startDate: Date,
    endDate: Date,
    gpa: String
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: [String] // Array of AI-optimized bullet points
  }],
  skills: [String],
  projects: [{
    title: String,
    description: String,
    techStack: [String],
    link: String
  }],
  atsScore: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}
```

---

## 💻 Tech Stack & Requirements

### Software Stack
* **Frontend:** React.js, TailwindCSS, Axios
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (Cloud Instance)
* **Core Dependencies:** `jsonwebtoken`, `bcryptjs`, `@google/generative-ai`, `mongoose`, `multer`

### Hardware Specifications
* **OS:** Windows 10/11, macOS, or Linux
* **Runtime Environment:** Node.js (v18+)
* **Recommended Hardware:** Intel i3 / Ryzen 3 or higher, 8 GB RAM, 500 MB Free SSD Space.

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com
cd ai-resume-ats-optimizer
```

### 2. Configure Environment Variables
Create a `.env` file in the **root of your backend directory**:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ats_db
JWT_SECRET=your_ultra_secure_jwt_token_secret
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Setup the Backend Server
```bash
cd backend
npm install
npm run dev
```

### 4. Setup the Frontend Client
```bash
cd ../frontend
npm install
npm start
```

---

## 🔮 Roadmap / Future Enhancements

* [ ] **🌍 Localization:** Multi-language system translation tools for international resumes.
* [ ] **🔌 Extension Parsing:** Chrome/Firefox browser extension to auto-import LinkedIn profiles into data models.
* [ ] **🔄 Real-Time Collaboration:** Integrating WebSockets to allow shared peer and mentor review channels.
* [ ] **🎤 AI Mock Interviews:** Generative audio simulator matching custom job description profiles.

---

## 📄 Author
Mythri HN
Harshika N
