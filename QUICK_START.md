# MedFlix Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cd server
cp .env.example .env
# Add your API keys to server/.env
```

3. **Start the development servers**

In one terminal (Backend):
```bash
cd server
node index.js
```

In another terminal (Frontend):
```bash
npm run dev
```

4. **Open the application**
Navigate to `http://localhost:5177` in your browser

## 🎨 Design System

MedFlix uses a consistent purple color scheme throughout:

- **Purple-600** (#9333ea) - Primary brand color
- **Purple gradients** - Buttons and CTAs
- **Green** - Success and completion states
- **Orange** - Processing and warnings
- **Red** - Errors and critical actions

## 📁 Project Structure

```
medflix/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── data/           # Mock data and constants
│   └── api/            # API utilities
├── server/             # Node.js backend
│   ├── index.js        # Main server file
│   └── *.js           # API integrations
└── public/            # Static assets
```

## 🔑 Key Features

### For Patients
- 📺 Watch daily educational video episodes
- ✅ Track recovery progress with checklists
- 💬 Chat with AI health assistant
- 🎥 Connect with live AI health guide

### For Doctors
- 📝 Create personalized content for patients
- 👥 Manage patient profiles
- 📊 Track patient progress
- 🎨 Customize visual styles

## 🎯 User Roles

### Patient Login
1. Select "Patient" role
2. Choose from existing patient profiles
3. View personalized care plan

### Doctor Login
1. Select "Doctor" role
2. Access all patient profiles
3. Create and send educational content

## 📚 Documentation

- [Design System](./DESIGN_SYSTEM.md) - Complete UI guidelines
- [Color System](./COLOR_SYSTEM.md) - Color palette and usage
- [Product Design](./README.md) - Product overview and architecture

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **AI Integration**: HeyGen, Perplexity, LiveKit
- **Icons**: Lucide React
- **Routing**: React Router v6

## 🌐 Available Routes

- `/` - Landing page
- `/login` - Authentication
- `/portal` - Patient portal
- `/doctor` - Doctor portal

## 🎨 Color Usage Examples

### Primary Button
\`\`\`jsx
<button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl px-6 py-4 font-semibold shadow-lg shadow-purple-500/30">
  Get Started
</button>
\`\`\`

### Success State
\`\`\`jsx
<div className="bg-green-500 text-white rounded-lg px-4 py-2">
  ✓ Complete
</div>
\`\`\`

### Card with Hover
\`\`\`jsx
<div className="bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all p-6">
  Content
</div>
\`\`\`

## 🐛 Common Issues

### Port already in use
```bash
# Kill process on port 5177 (frontend)
lsof -ti:5177 | xargs kill

# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill
```

### Missing dependencies
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For issues or questions, please refer to the documentation or create an issue in the repository.
