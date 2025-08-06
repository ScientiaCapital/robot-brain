# AI Voice Agent Template - Database Setup Guide

## Overview
This guide provides complete instructions for setting up the database for your AI Voice Agent, whether you're building a BDR agent, construction management system, healthcare assistant, or any custom agent type.

**Setup Time: Under 5 minutes** ⚡

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Neon database URL
# Get your free database at: https://neon.tech/
```

### 3. Run Setup
```bash
npm run setup:database
```

That's it! Your database is ready for any agent type.

## Database Schema

The template uses a **generic, extensible schema** that works with all agent types:

### Core Tables

#### `sessions`
- Manages user sessions across all agent types
- Stores agent configuration and user preferences
- Supports multiple agent types (sales, support, operations, custom)

#### `conversations`
- Records all agent-user interactions
- Configurable agent personality
- Extensible metadata for industry-specific data

#### `agent_interactions`
- Tracks specific agent actions and events
- Performance monitoring
- Error tracking and recovery

#### `tool_usage`
- Monitors API and tool usage
- Performance metrics
- Cost tracking capabilities

#### `analytics`
- Usage statistics
- Performance metrics
- Business intelligence data

## NPM Commands

### Setup & Maintenance
- `npm run setup:database` - Initial database setup (interactive)
- `npm run db:setup` - Alias for setup:database
- `npm run setup` - Complete project setup including database

### Migration Management
- `npm run db:migrate` - Run pending migrations
- `npm run db:migrate:list` - List migration status

### Testing & Health
- `npm run db:test` - Test database setup (verifies <5 min setup)
- `npm run db:health` - Check database health and performance

## Agent Type Examples

### BDR/Sales Agent
```json
{
  "agent_type": "sales",
  "agent_config": {
    "industry": "technology",
    "products": ["SaaS", "Enterprise"],
    "qualification_criteria": {...}
  }
}
```

### Construction Management
```json
{
  "agent_type": "operations",
  "agent_config": {
    "industry": "construction",
    "project_types": ["commercial", "residential"],
    "compliance_standards": ["OSHA", "ISO"]
  }
}
```

### Healthcare Assistant
```json
{
  "agent_type": "support",
  "agent_config": {
    "industry": "healthcare",
    "specialties": ["appointments", "medication"],
    "hipaa_compliant": true
  }
}
```

### Custom Agent
```json
{
  "agent_type": "custom",
  "agent_config": {
    "industry": "your-industry",
    "custom_fields": {...}
  }
}
```

## Database Features

### Automatic Features
- ✅ Transaction support with rollback
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ UUID primary keys for distributed systems
- ✅ JSONB fields for flexible data storage
- ✅ Comprehensive indexing for performance

### Optional Features
- 🔍 pgvector extension for semantic search
- 📊 Analytics and reporting views
- 🔄 Real-time synchronization support
- 🌍 Multi-region replication ready

## Migration System

The template includes a robust migration system for schema updates:

### Creating a Migration
1. Create a new SQL file in `migrations/`:
   ```bash
   migrations/002_add_custom_fields.sql
   ```

2. Add your SQL changes:
   ```sql
   -- Add custom fields for your industry
   ALTER TABLE conversations 
   ADD COLUMN industry_data JSONB DEFAULT '{}';
   ```

3. Run the migration:
   ```bash
   npm run db:migrate
   ```

### Migration Features
- Version tracking
- Checksum validation
- Rollback support
- Atomic transactions
- Automatic retry on failure

## Troubleshooting

### Common Issues

#### Connection Failed
```bash
Error: Connection failed
```
**Solution**: Check your NEON_DATABASE_URL in .env.local

#### Permission Denied
```bash
Error: permission denied for schema public
```
**Solution**: Ensure your database user has CREATE permissions

#### Table Already Exists
```bash
Error: relation "sessions" already exists
```
**Solution**: This is normal - the setup script handles existing tables gracefully

### Performance Optimization

For production deployments:

1. **Connection Pooling**: Already configured in the template
2. **Indexes**: Automatically created for common queries
3. **Query Optimization**: Use the built-in performance monitor
4. **Caching**: Redis support available (optional)

## Production Checklist

Before deploying to production:

- [ ] Database URL configured in production environment
- [ ] SSL mode enabled (automatic with Neon)
- [ ] Backup strategy configured
- [ ] Monitoring alerts set up
- [ ] Connection pool sized appropriately
- [ ] Migrations tested in staging
- [ ] Performance benchmarks met

## Advanced Configuration

### Custom Extensions
```sql
-- Enable additional PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Text search
CREATE EXTENSION IF NOT EXISTS btree_gin; -- Advanced indexing
```

### Industry-Specific Tables
```sql
-- Example: Add compliance tracking for healthcare
CREATE TABLE compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  regulation VARCHAR(50),
  action VARCHAR(255),
  compliant BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Support

### Resources
- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Template Repository](https://github.com/your-repo/ai-voice-agent-template)

### Getting Help
1. Check the troubleshooting section above
2. Run `npm run db:health` for diagnostics
3. Review logs in the console output
4. Open an issue in the repository

## Performance Guarantee

This setup is tested to complete in **under 5 minutes** on:
- Standard internet connection (10+ Mbps)
- Modern hardware (2019 or newer)
- Neon free tier database

Actual setup time: typically 1-2 minutes ⚡

---

Built with flexibility in mind - works with any agent type, any industry, any use case.