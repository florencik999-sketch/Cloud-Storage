# ☁️ Cloud Storage

A modern, secure cloud storage application with user authentication, file uploads, and private user directories.

## ✨ Features

- 🔐 **JWT Authentication** with bcrypt password hashing
- 👥 **Multi-user support** with isolated storage
- 📁 **Private directories** for each user
- 🖼️ **Image & Video uploads** with preview
- 📱 **Responsive design** with modern UI
- 🚀 **Deployed on Vercel**

## 🏗️ Architecture

- **Frontend**: HTML/CSS/JavaScript (deployed on Vercel)
- **Backend**: Node.js/Express (runs locally or on your server)
- **Storage**: Local file system with user isolation
- **Database**: JSON file for user management

## 🚀 Quick Start

### Prerequisites

- Node.js installed
- GitHub account
- Vercel account

### 1. Clone & Setup Backend

```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

### 2. Deploy Frontend to Vercel

```bash
cd frontend
npm install
vercel --prod
```

### 3. Configure API URL

Update `frontend/app.js` with your backend URL:

```javascript
const API = "https://your-backend-url.com";
```

## 📁 Project Structure

```
cloud-storage/
├── frontend/           # Vercel-deployed frontend
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── package.json
│   └── vercel.json
├── backend/            # Local backend server
│   ├── server.js
│   ├── package.json
│   └── .env
├── data/               # User data & files
└── README.md
```

## 🔧 Environment Variables

Create `.env` in backend directory:

```
AUTH_SECRET=your-jwt-secret-here
```

## 👤 User Management

### Register New Users

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username": "username", "password": "password"}'
```

### Login

Use the web interface or API:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "username", "password": "password"}'
```

## 🚀 Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Backend (Local/Server)

- Run locally: `npm start`
- Deploy to Heroku/Railway for production
- Update frontend API URL accordingly

## 🛡️ Security

- Passwords hashed with bcrypt
- JWT tokens with expiration
- User isolation (private directories)
- Path traversal protection

## 📝 API Endpoints

- `POST /register` - Register new user
- `POST /login` - User authentication
- `GET /list` - List files/folders
- `POST /create-folder` - Create directory
- `POST /upload` - Upload files
- `POST /delete` - Delete files/folders
- `GET /files/*` - Serve files

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - feel free to use this project!

---

Built with ❤️ using Node.js, Express, and modern web technologies.
