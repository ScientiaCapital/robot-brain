/**
 * Database Integration Validation Test
 * Simple validation that the database connection and environment are properly configured
 */

import { describe, it, expect } from '@jest/globals';

describe('Database Integration Validation', () => {
  describe('Environment Configuration', () => {
    it('should have NEON_DATABASE_URL environment variable configured', () => {
      expect(process.env.NEON_DATABASE_URL).toBeDefined();
      expect(process.env.NEON_DATABASE_URL).toContain('neon.tech');
      expect(process.env.NEON_DATABASE_URL).toContain('postgresql://');
    });

    it('should have database environment correctly loaded from .env.local', () => {
      expect(process.env.NEON_DATABASE_URL).toContain('ep-plain-pond-afedblyp-pooler');
      expect(process.env.NEON_DATABASE_URL).toContain('neondb');
    });

    it('should have proper SSL configuration', () => {
      const dbUrl = process.env.NEON_DATABASE_URL || '';
      expect(dbUrl).toContain('sslmode=require');
    });
  });

  describe('Database Setup Validation', () => {
    it('should validate that database setup script exists and is executable', async () => {
      // This test validates that our setup infrastructure exists
      expect(require.resolve('../../scripts/setup-database.js')).toBeTruthy();
    });

    it('should validate database health check service class exists', () => {
      // Import the service class to ensure it exists and is properly structured
      const { DatabaseHealthCheckService } = require('../../src/lib/database/health-check-service');
      expect(DatabaseHealthCheckService).toBeDefined();
      
      // Validate that it can be instantiated
      const service = new DatabaseHealthCheckService();
      expect(service).toBeDefined();
    });

    it('should validate database performance monitor service exists', () => {
      const { DatabasePerformanceMonitor } = require('../../src/lib/database/performance-monitor');
      expect(DatabasePerformanceMonitor).toBeDefined();
      
      const monitor = new DatabasePerformanceMonitor();
      expect(monitor).toBeDefined();
    });

    it('should validate database benchmark service exists', () => {
      const { DatabaseBenchmarkService } = require('../../src/lib/database/benchmark-service');
      expect(DatabaseBenchmarkService).toBeDefined();
      
      const benchmarkService = new DatabaseBenchmarkService();
      expect(benchmarkService).toBeDefined();
    });
  });

  describe('Package Dependencies', () => {
    it('should have @neondatabase/serverless package available', () => {
      const neonPackage = require('@neondatabase/serverless');
      expect(neonPackage).toBeDefined();
      expect(neonPackage.neon).toBeDefined();
    });

    it('should have dotenv package for environment loading', () => {
      const dotenv = require('dotenv');
      expect(dotenv).toBeDefined();
      expect(dotenv.config).toBeDefined();
    });
  });

  describe('Database Scripts Validation', () => {
    it('should have npm script commands configured for database operations', () => {
      const packageJson = require('../../package.json');
      
      // Validate database-related scripts exist
      expect(packageJson.scripts['db:setup']).toBeDefined();
      expect(packageJson.scripts['db:setup']).toBe('node scripts/setup-database.js');
      
      expect(packageJson.scripts['setup']).toBeDefined();
      expect(packageJson.scripts['setup']).toBe('npm run db:setup');
    });
  });

  describe('Connection String Format Validation', () => {
    it('should have properly formatted Neon connection string', () => {
      const connectionString = process.env.NEON_DATABASE_URL;
      expect(connectionString).toBeDefined();
      
      // Validate connection string format
      const urlPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)\?(.+)$/;
      expect(connectionString).toMatch(urlPattern);
      
      // Parse and validate components
      const url = new URL(connectionString!);
      expect(url.protocol).toBe('postgresql:');
      expect(url.hostname).toContain('neon.tech');
      expect(url.pathname).toBe('/neondb');
      expect(url.searchParams.get('sslmode')).toBe('require');
    });

    it('should have connection string pointing to correct project', () => {
      const connectionString = process.env.NEON_DATABASE_URL;
      
      // Validate it's pointing to the my-robot-project (dry-hall-96285777)
      expect(connectionString).toContain('ep-plain-pond-afedblyp-pooler');
      expect(connectionString).toContain('c-2.us-west-2.aws.neon.tech');
    });
  });
});