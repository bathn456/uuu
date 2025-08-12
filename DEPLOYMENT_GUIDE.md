# Deep Learning Platform - Deployment Guide

This guide explains how to deploy your deep learning educational platform to your own hosting environment.

## Prerequisites

Before deployment, you'll need:
- Node.js (v18 or higher)
- PostgreSQL database
- A hosting platform (Vercel, Netlify, Railway, DigitalOcean, etc.)

## Option 1: Deploy to Vercel (Recommended for Full-Stack)

### Step 1: Prepare Your Code
```bash
# Clone or download your project files
git clone <your-repository-url>
cd your-project-name

# Install dependencies
npm install
```

### Step 2: Configure Database
1. Create a PostgreSQL database on:
   - **Neon** (free tier available): https://neon.tech
   - **Supabase**: https://supabase.com
   - **Railway**: https://railway.app
   - **PlanetScale**: https://planetscale.com

2. Set environment variables in your hosting platform:
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### Step 3: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to configure your project
```

## Option 2: Deploy to Railway

### Step 1: Setup Railway
1. Go to https://railway.app
2. Connect your GitHub repository
3. Railway will auto-detect your Node.js project

### Step 2: Configure Environment
Add these environment variables in Railway dashboard:
```
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

### Step 3: Deploy
Railway will automatically deploy when you push to your repository.

## Option 3: Deploy to Your Own Server (VPS/Dedicated)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 2: Database Setup
```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE your_app_db;
CREATE USER your_app_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE your_app_db TO your_app_user;
\q
```

### Step 3: Deploy Application
```bash
# Upload your code to server
scp -r ./your-project user@your-server:/var/www/

# Navigate to project
cd /var/www/your-project

# Install dependencies
npm install --production

# Build the project
npm run build

# Set environment variables
export DATABASE_URL="postgresql://your_app_user:your_secure_password@localhost/your_app_db"
export NODE_ENV=production

# Run database migrations
npm run db:push

# Start with PM2
pm2 start server/index.ts --name "deep-learning-platform"
pm2 save
pm2 startup
```

### Step 4: Setup Nginx (Reverse Proxy)
```nginx
# /etc/nginx/sites-available/your-domain
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Option 4: Docker Deployment

### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Create docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/deeplearning
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=deeplearning
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:push
```

## Environment Variables Required

Make sure to set these environment variables in your hosting platform:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-database-host
PGDATABASE=your-database-name
PGUSER=your-database-user
PGPASSWORD=your-database-password
PGPORT=5432

# Application
NODE_ENV=production
PORT=5000

# Security (generate new values)
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-super-secure-session-secret-here
```

## File Upload Configuration

Your application supports file uploads up to 2GB. Make sure your hosting platform supports:
- Sufficient disk space for uploads
- Proper MIME type handling
- File serving capabilities

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Database Security**: Use strong passwords and restrict access
3. **HTTPS**: Enable SSL certificates (Let's Encrypt for free SSL)
4. **Firewall**: Configure firewall rules to restrict unnecessary access
5. **Updates**: Keep dependencies and system packages updated

## Post-Deployment Setup

After deployment:

1. **Create Admin Account**: Use the admin login with your configured password
2. **Upload Content**: Add algorithms and projects through the admin interface
3. **Test Features**: Verify file uploads, downloads, and all functionality
4. **Monitor**: Set up monitoring for your application and database

## Troubleshooting

### Common Issues:
- **Database Connection**: Check DATABASE_URL format and credentials
- **File Uploads**: Verify upload directory permissions and disk space
- **Build Errors**: Ensure all dependencies are installed correctly
- **Port Issues**: Check if your hosting platform requires specific port configuration

### Logs:
```bash
# PM2 logs (if using PM2)
pm2 logs

# Docker logs
docker-compose logs -f

# Railway/Vercel logs
Check your platform's dashboard for deployment logs
```

## Monitoring and Maintenance

- Set up database backups
- Monitor application performance
- Keep dependencies updated
- Monitor disk space for file uploads
- Set up alerts for errors or downtime

Your deep learning educational platform is now ready for independent deployment!