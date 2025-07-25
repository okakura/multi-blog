# pgAdmin Database Visualizer Setup

## Accessing pgAdmin

pgAdmin is now running and accessible at: **http://localhost:8080**

### Login Credentials

- **Email**: admin@admin.com
- **Password**: admin

## Setting Up Database Connection

Once you're logged into pgAdmin, follow these steps to connect to your PostgreSQL database:

### 1. Add New Server

1. Right-click on "Servers" in the left panel
2. Select "Register" → "Server..."

### 2. General Tab

- **Name**: Multi Blog Database (or any name you prefer)

### 3. Connection Tab

- **Host name/address**: postgres (this is the Docker service name)
- **Port**: 5432
- **Maintenance database**: multi_blog_dev
- **Username**: blog_user
- **Password**: blog_password

### 4. Save and Connect

Click "Save" and pgAdmin will connect to your database.

## What You'll See

After connecting, you'll be able to explore:

### Tables

- **domains** - Blog domains/subdomains
- **users** - User accounts
- **user_domain_permissions** - User permissions per domain
- **posts** - Blog posts
- **analytics_events** - Analytics tracking data

### Features Available

- **Browse Data**: Click on any table → Right-click → "View/Edit Data" → "All Rows"
- **Run Queries**: Tools → Query Tool (or click the query icon)
- **Database Diagram**: Right-click on database → "Generate ERD"
- **Export Data**: Right-click on table → "Import/Export Data"

## Sample Queries to Try

```sql
-- View all domains
SELECT * FROM domains;

-- View all posts with their domain
SELECT p.title, p.author, d.hostname, p.created_at
FROM posts p
JOIN domains d ON p.domain_id = d.id;

-- View analytics summary
SELECT
    event_type,
    COUNT(*) as count,
    COUNT(DISTINCT ip_address) as unique_visitors
FROM analytics_events
GROUP BY event_type;
```

## Stopping Services

When you're done, you can stop all services with:

```bash
docker-compose down
```

## Alternative Database Visualizers

If you prefer other tools, here are some alternatives:

### 1. DBeaver (Free Desktop App)

- Download from: https://dbeaver.io/
- Connection details same as above, but use `localhost` instead of `postgres`

### 2. Adminer (Lightweight Web Interface)

Add to docker-compose.yml:

```yaml
adminer:
  image: adminer
  restart: always
  ports:
    - 8081:8080
```

### 3. VS Code Extensions

- **PostgreSQL** by Chris Kolkman
- **Database Client** by Weijan Chen

## Troubleshooting

### Can't Connect to Database

1. Make sure Docker services are running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Verify database is accessible:
   ```bash
   docker exec -it api-postgres-1 psql -U blog_user -d multi_blog_dev
   ```

### pgAdmin Won't Load

1. Check if pgAdmin is running: `docker-compose ps`
2. Try restarting: `docker-compose restart pgadmin`
3. Check logs: `docker-compose logs pgadmin`
