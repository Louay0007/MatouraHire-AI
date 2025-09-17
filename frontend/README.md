# AI Career Platform

A comprehensive AI-powered career development platform built with React, TypeScript, and modern web technologies.

## 🚀 Features

- **AI Resume Rewriter**: Transform your resume with AI-powered optimization
- **AI Interview Coach**: Practice with AI-generated questions and get feedback
- **Smart Job Matcher**: Find perfect job matches with market insights
- **Digital Footprint Analysis**: Analyze GitHub, LinkedIn, and StackOverflow profiles
- **Career Reports**: Generate comprehensive career development reports
- **Career Insights Stash**: Track and aggregate your career data

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Authentication**: Mock authentication system
- **Theme**: Dark/Light mode support
- **Icons**: Lucide React

## 🎨 Design System

Beautiful, modern design with:
- Professional AI/tech color palette
- Gradient backgrounds and glow effects
- Smooth animations and transitions
- Responsive design for all devices
- Accessible components with proper ARIA labels

## 📦 Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL (default: http://127.0.0.1:3000)
- `VITE_MOCK_MODE`: Enable mock mode for development (true/false)

### Mock Mode

The application includes a comprehensive mock mode for development and testing:
- Toggle mock mode from the navigation bar
- All API calls return realistic mock data
- Perfect for development without backend setup

## 🎯 Key Features

### Authentication
- Mock email/password authentication
- Social login UI (Google/GitHub - UI only)
- Protected routes with automatic redirects
- Persistent auth state

### Resume Rewriter
- PDF upload and processing
- AI-powered content optimization
- Download rewritten resume
- Save insights to career profile

### Career Insights
- Local storage of career data
- Aggregate insights across all tools
- Dashboard metrics and progress tracking
- Export capability for reports

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Accessible navigation

## 🚀 Deployment

The app is ready for deployment on any static hosting platform:

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

## 🔗 API Integration

The app is designed to work with the specified backend API:

### Endpoints
- `POST /resume_writer` - Resume rewriting
- `POST /create_report` - Generate reports
- `POST /ai_interviewer/*` - Interview features
- `POST /job_matcher/*` - Job matching
- `POST /footprint_scanner/*` - Profile analysis

### Mock Data
Comprehensive mock data is provided for all endpoints, matching the exact API response shapes.

## 🎨 Customization

### Design System
The design system is fully customizable through:
- `src/index.css` - Color tokens and CSS variables
- `tailwind.config.ts` - Tailwind configuration
- Component variants for different use cases

### Theme Support
- Automatic dark/light mode detection
- Manual theme switching
- Consistent theming across all components

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

Built with ❤️ using modern web technologies for the next generation of career development tools.