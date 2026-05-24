# PostgreSQL Database Setup Guide

This document explains how to set up and configure the PostgreSQL database for the cryptocurrency prediction website.

## Prerequisites

- PostgreSQL installed and running on your system
- Node.js and npm installed

## Environment Configuration

Create a `.env.local` file in the project root with the following configuration:

```bash
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=coin_iq
DB_PASSWORD=postgres
DB_PORT=5432

# JWT Secret
JWT_SECRET=coin_iq_secret_key_change_this_in_production

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Database Initialization

### 1. Verify PostgreSQL Installation

First, make sure PostgreSQL is installed and running on your system:

**For Windows users:**
- Make sure PostgreSQL service is running (check Services.msc)
- Default username is usually `postgres`
- Default password is typically set during installation

**For Mac/Linux users:**
- Install PostgreSQL using package manager
- Start the PostgreSQL service

### 2. Update Environment Variables

Verify your `.env.local` file has the correct credentials:

```bash
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=coin_iq
DB_PASSWORD=your_actual_postgres_password
DB_PORT=5432
```

Replace `your_actual_postgres_password` with the actual password you set during PostgreSQL installation.

### 3. Install Dependencies

```bash
npm install
```

### 4. Create Database

Run the following command to create the database:

```bash
npm run db:create
```

This command will:
- Connect to PostgreSQL server
- Create the `coin_iq` database if it doesn't exist
- Set up the required tables and indexes

### 5. Run Migrations

After creating the database, run the migrations to set up the schema:

```bash
npm run db:migrate
```

This command will:
- Connect to the `coin_iq` database
- Execute the schema SQL to create tables and indexes
- Set up triggers for automatic timestamp updates

## Database Schema

The database includes the following table:

### users table
- `id` (SERIAL, PRIMARY KEY): Auto-incrementing user ID
- `name` (VARCHAR(255), NOT NULL): User's full name
- `email` (VARCHAR(255), UNIQUE, NOT NULL): User's email address
- `password_hash` (TEXT, NOT NULL): Hashed password using bcrypt
- `created_at` (TIMESTAMP WITH TIME ZONE): Record creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE): Record update timestamp (auto-updating)

## API Endpoints

The application provides the following authentication endpoints:

### POST /api/auth/signup
- Creates a new user account
- Requires: name, email, password
- Returns: JWT token and user data
- Sets authentication cookie

### POST /api/auth/login
- Authenticates existing user
- Requires: email, password
- Returns: JWT token and user data
- Sets authentication cookie

### GET /api/auth/me
- Retrieves current user data
- Requires valid authentication token
- Returns: User data without sensitive information

### POST /api/auth/logout
- Clears authentication token
- Invalidates user session

## Security Features

- Passwords are securely hashed using bcrypt
- JWT tokens for session management
- HttpOnly cookies to prevent XSS attacks
- Input validation on all endpoints
- SQL injection prevention through parameterized queries

## Running the Application

After setting up the database, start the application:

```bash
npm run dev
```

## Troubleshooting

### Common Issues:

1. **Cannot connect to PostgreSQL**:
   - Ensure PostgreSQL is running
   - Check credentials in `.env.local`
   - Verify the database server is accessible

2. **Password authentication failed**:
   - Verify your PostgreSQL password in `.env.local`
   - Make sure you're using the correct database user password
   - On Windows, check if PostgreSQL service is running in Services.msc
   - Test your credentials by connecting directly to PostgreSQL: `psql -U postgres -h localhost -p 5432`

3. **Permission denied**:
   - Ensure the database user has CREATE DATABASE permissions
   - Check if the user can create tables in the database

4. **Database does not exist**:
   - Run `npm run db:create` to create the database
   - Verify the database name in your environment variables

### Testing Database Connection:

You can test your PostgreSQL connection directly using the command line:

```bash
psql -U postgres -h localhost -p 5432 -W
```

If this command works, enter your password when prompted. If it connects successfully, your PostgreSQL server is running and accessible.