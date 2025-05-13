# Business Intelligence Dashboard

A modern business intelligence dashboard built with React, Express, and TypeScript. This application provides a comprehensive view of business metrics, sales data, customer information, and more.

![Dashboard Screenshot](https://via.placeholder.com/800x450.png?text=Business+Intelligence+Dashboard)

## Features

- **Interactive Dashboard**: Real-time overview of key business metrics
- **Sales Analytics**: Track revenue, orders, and sales performance
- **Customer Management**: View and manage customer information
- **Product Tracking**: Monitor product performance and inventory
- **Traffic Analysis**: Analyze website traffic and user behavior
- **User Authentication**: Secure login and role-based access control
- **Multi-tenant Support**: Manage multiple businesses with separate database isolation
- **Flexible Database Architecture**: Support for both single database and multiple database deployments

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js
- **Analytics**: Google Analytics integration
- **Payment Processing**: Stripe integration

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)
- MongoDB access (Atlas cluster recommended)

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/BusinessIntelligenceDashboard.git
   cd BusinessIntelligenceDashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file in the root directory with the following variables:
   ```
   # MongoDB Configuration
   MONGODB_USERNAME=your_mongodb_username
   MONGODB_PASSWORD=your_mongodb_password
   MONGODB_CLUSTER=your_cluster.mongodb.net
   MONGODB_DATABASE=businessdash

   # Authentication
   SESSION_SECRET=your_session_secret

   # Optional: Stripe Integration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

   # Optional: Google Analytics
   VITE_GA_MEASUREMENT_ID=your_ga_measurement_id
   ```

   Note: If you don't have MongoDB set up, the application will use in-memory storage for demonstration purposes.

### Running the Application

#### Development Mode

To run the application in development mode:

```bash
# On all platforms (Windows, macOS, Linux)
npm run dev
```

The application will be available at [http://localhost:5000](http://localhost:5000).

#### Production Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Database Setup

### MongoDB Setup

The application uses MongoDB for data storage. We support two deployment modes:

1. **Single Database Mode**: All clients share the same database with tenant isolation
2. **Multiple Database Mode**: Each client gets their own dedicated database

#### Setting up MongoDB

1. **Create a MongoDB Atlas account** (recommended):
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier is sufficient for development)
   - Set up network access to allow connections from your IP address
   - Create a database user with read/write privileges

2. **Configure your environment variables**:
   - Update the MongoDB configuration in your `.env` file
   - The application will automatically create databases and collections as needed

3. **Multi-Client Setup**:
   - For multiple clients, the system will create separate databases named `client_[clientId]`
   - Each client's data is completely isolated in its own database
   - No additional configuration is needed - the system handles this automatically

For more information on the database architecture, see `database.md`.

## Demo Login

You can use the following credentials to log in to the demo:

- **Email**: admin@businessdash.com
- **Password**: password123

## Project Structure

```text
BusinessIntelligenceDashboard/
├── client/                 # Frontend React application
│   ├── public/             # Static assets
│   ├── src/                # React source code
│   │   ├── components/     # UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main application component
├── server/                 # Backend Express application
│   ├── routes/             # API routes
│   ├── models.ts           # MongoDB schema models
│   ├── db.ts               # Database connection handling
│   ├── mongoStorage.ts     # MongoDB storage implementation
│   ├── storage.ts          # In-memory storage fallback
│   ├── storageFactory.ts   # Factory for storage implementation
│   └── index.ts            # Server entry point
├── shared/                 # Shared code between client and server
├── package.json            # Project dependencies
├── database.md             # Database documentation
└── README.md               # Project documentation
```

## Current Development Status

The application is currently in development with the following components implemented:

- ✅ User authentication (login/logout)
- ✅ Main dashboard overview
- ✅ Sales dashboard
- ✅ MongoDB multi-tenant support
- ✅ Client-specific database isolation
- ❌ Customer management (in progress)
- ❌ Product management (in progress)
- ❌ Traffic analysis (in progress)

Some pages may display mock data or be unavailable as development continues.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
