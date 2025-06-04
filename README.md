<div align="center">

# 🔥 Business Intelligence Dashboard

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

*A comprehensive, modern business intelligence platform built with cutting-edge technologies*

**🚧 Currently in Development for Production Clients**

[🚀 Live Demo](#demo) • [📖 Documentation](#installation) • [🎯 Features](#features) • [🛠️ Tech Stack](#technologies-used)

</div>

---

## 🌟 Introduction

The **Business Intelligence Dashboard** is a sophisticated, full-stack e-commerce platform currently being developed for production clients as a comprehensive **Shopify replacement**. This enterprise-grade solution combines powerful business intelligence with a complete e-commerce management system, designed to provide clients with a unified platform for managing their online businesses.

**🎯 Commercial Development**: This project is actively being built for real clients who have chosen to work with Tom for a complete e-commerce solution. The platform will replace their current Shopify setup with a custom, more powerful alternative that includes advanced analytics, multi-tenant architecture, and custom business logic tailored to each client's needs.

**🚀 Upcoming Features in Development**:
- **AI-Powered Admin Assistant** - Intelligent system to assist administrators with daily tasks and decision-making
- **Shipping Provider Integration** - Seamless integration with major shipping carriers and logistics providers
- **Custom Business Logic Engine** - Tailored workflows and automations specific to each client's requirements
- **Advanced Inventory Management** - Real-time stock tracking with predictive analytics

**💡 Production Impact**: 
- Eliminates Shopify's transaction fees and limitations
- Provides complete control over e-commerce functionality
- Scales with business growth without platform restrictions
- Offers unlimited customization possibilities for unique business requirements

**🔧 Technical Excellence**: Built with modern TypeScript, leveraging React 18 with concurrent features, Express.js with middleware architecture, and MongoDB with optimized aggregation pipelines for superior performance and scalability.

---

## ✨ Features

- 📊 **Real-Time Analytics Dashboard** - Live KPI monitoring with WebSocket updates and interactive charts powered by Recharts
- 👥 **Customer Relationship Management** - Comprehensive customer profiles with order history and behavioral analytics
- 🛍️ **E-commerce Integration** - Product catalog management with Stripe payment processing and inventory tracking
- 📈 **Sales Performance Tracking** - Revenue analytics, conversion funnels, and predictive forecasting
- 🌐 **Traffic Analytics** - Google Analytics 4 integration with custom event tracking and user journey mapping
- 🔐 **Enterprise Security** - JWT-based authentication with Passport.js and role-based access control (RBAC)
- 🏢 **Multi-Tenant Architecture** - Scalable SaaS platform with database isolation and tenant-specific configurations
- 📱 **Responsive Design** - Mobile-first approach using Tailwind CSS and Radix UI components

---

## 🖼️ Demo/Screenshots

### Dashboard Overview
![Dashboard Screenshot](images/dashboard-overview.png)
*Main dashboard showcasing real-time metrics and interactive visualizations*

### Analytics Deep Dive
![Analytics Screenshot](images/analytics-dashboard.png)
*Comprehensive analytics view with drill-down capabilities*

> **📁 Asset Placement**: Place screenshot images in the `images/` directory in your repository root. For animated demos, use `images/demo.gif`.

---

## 🚀 Installation

### Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **MongoDB** - [Atlas cluster](https://www.mongodb.com/cloud/atlas) recommended
- **Git** - [Download here](https://git-scm.com/)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tommybroomhall/BusinessIntelligenceDashboard.git
   cd BusinessIntelligenceDashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   # Create environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Configure environment variables**
   ```env
   # Database Configuration
   MONGODB_USERNAME=your_mongodb_username
   MONGODB_PASSWORD=your_mongodb_password
   MONGODB_CLUSTER=your_cluster.mongodb.net
   MONGODB_DATABASE=businessdash
   
   # Authentication
   SESSION_SECRET=your_super_secure_session_secret
   
   # Optional Integrations
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   VITE_GA_MEASUREMENT_ID=your_ga_measurement_id
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Navigate to `http://localhost:5000`
   - Use demo credentials: `admin@businessdash.com` / `password123`

---

## 💻 Usage

### Basic Navigation
```typescript
// Access the dashboard API programmatically
const dashboardData = await fetch('/api/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Real-time updates via WebSocket
const socket = io('ws://localhost:5000');
socket.on('dashboard-update', (data) => {
  updateDashboard(data);
});
```

### API Integration Example
```javascript
// Create a new customer
const newCustomer = await fetch('/api/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp'
  })
});
```

### Multi-Tenant Usage
The platform automatically handles tenant isolation - simply configure your tenant settings in the admin panel, and the system will create isolated database environments for each client.

---

## 🛠️ Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.3.1 | Frontend framework with concurrent features |
| **TypeScript** | ^5.6.3 | Type-safe development and enhanced DX |
| **Express.js** | ^4.21.2 | Backend API server with middleware architecture |
| **MongoDB** | ^6.16.0 | Primary database with aggregation pipelines |
| **Mongoose** | ^8.14.2 | ODM with schema validation and middleware |
| **Vite** | ^5.4.14 | Build tool with HMR and optimized bundling |
| **Tailwind CSS** | ^3.4.17 | Utility-first CSS framework |
| **Radix UI** | ^1.2.x | Headless UI components for accessibility |
| **Recharts** | ^2.15.3 | Data visualization and charting library |
| **Socket.io** | ^4.8.1 | Real-time bidirectional communication |
| **Stripe** | ^18.1.0 | Payment processing and subscription management |
| **Google Analytics** | ^5.1.0 | Traffic analytics and user behavior tracking |
| **JWT** | ^9.0.2 | Stateless authentication and authorization |
| **Zod** | ^3.24.2 | Runtime schema validation |
| **Framer Motion** | ^11.18.2 | Animation library for smooth UX |

---

## 📁 Project Structure

```
BusinessIntelligenceDashboard/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── dashboard/           # Dashboard-specific components
│   │   │   ├── customers/           # Customer management UI
│   │   │   ├── products/            # Product catalog interface
│   │   │   ├── orders/              # Order management system
│   │   │   └── ui/                  # Base UI components (Radix + Tailwind)
│   │   ├── context/                 # React Context providers
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility functions and API client
│   │   └── pages/                   # Route-level page components
│   └── public/                      # Static assets and PWA manifest
├── server/                          # Backend Express application
│   ├── routes/                      # API endpoint definitions
│   │   ├── auth/                    # Authentication routes
│   │   ├── dashboard/               # Dashboard data endpoints
│   │   ├── customers/               # Customer CRUD operations
│   │   └── products/                # Product management API
│   ├── models/                      # MongoDB schema definitions
│   ├── middleware/                  # Express middleware functions
│   ├── services/                    # Business logic layer
│   └── types/                       # TypeScript type definitions
├── shared/                          # Shared code between client/server
│   └── types/                       # Common TypeScript interfaces
├── scripts/                         # Database and utility scripts
│   ├── db/                          # Database seeding and migration
│   └── test/                        # Integration test scripts
└── docs/                           # Additional documentation
```

### Key Architectural Decisions

- **Monorepo Structure**: Unified codebase for easier dependency management and shared types
- **API-First Design**: RESTful endpoints with comprehensive OpenAPI documentation
- **Service Layer Pattern**: Business logic abstraction for testability and maintainability
- **Database-per-Tenant**: Scalable multi-tenancy with complete data isolation

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and TypeScript conventions
- Write comprehensive tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

For detailed contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - Permission is hereby granted, free of charge, to any person obtaining a copy...
```

---

## 🌐 Connect & Contact

<div align="center">

### 💼 Professional Links

[![GitHub](https://img.shields.io/badge/GitHub-Tommybroomhall-181717?style=for-the-badge&logo=github)](https://github.com/Tommybroomhall)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Tom_Broomhall-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/tom-b-80ab43165/)
[![Email](https://img.shields.io/badge/Email-hello@tbroomhall.com-D14836?style=for-the-badge&logo=gmail)](mailto:hello@tbroomhall.com)

### 🚀 Interested in my work? Let's connect!

*I'm passionate about building scalable, user-centric e-commerce solutions that solve real business problems. Currently accepting new clients for custom e-commerce platform development. Looking to replace Shopify with something more powerful? Let's discuss your project!*

</div>

---

<div align="center">

**⭐ If this project helped you, please consider giving it a star! ⭐**

*Made with ❤️ and lots of ☕*

</div>
