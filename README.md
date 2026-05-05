# Team Task Manager (TaskFlow)

A full-stack team collaboration app built using the MERN stack that allows users to manage projects, assign tasks, and track progress efficiently.

## 🚀 Features
- User authentication (JWT-based login/signup)
- Role-based access (Admin & Member)
- Project creation and management
- Task assignment and tracking
- Dashboard with task status (To Do, In Progress, Done, Overdue)
- Responsive UI

## 🛠 Tech Stack
Frontend:
- React (Vite)
- Axios
- React Router

Backend:
- Node.js
- Express.js
- MongoDB (Mongoose)

Deployment:
- Railway (Frontend + Backend)

## 🌐 Live Demo
Frontend: https://poetic-mindfulness-production-c3b8.up.railway.app  
Backend: https://team-task-manager-production-926d.up.railway.app  

## ⚙️ Setup Instructions

1. Clone repo:
git clone <your-repo-link>

2. Install dependencies:
cd backend && npm install  
cd frontend && npm install  

3. Add environment variables:
MONGO_URI=your_mongo_uri  
JWT_SECRET=your_secret  

4. Run locally:
cd backend → npm start  
cd frontend → npm run dev  

## 📌 Future Improvements
- Notifications system
- Real-time updates (Socket.io)
- File attachments
- Better UI/UX
