#!/usr/bin/env node

/**
 * Automated Environment Variable Setup for Vercel Deployment
 * Sets up production environment variables automatically using Vercel CLI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

class VercelEnvSetup {
  constructor() {
    this.requiredVars = [
      { 
        name: 'ANTHROPIC_API_KEY', 
        description: 'Anthropic Claude API key (starts with sk-ant-api03-)',
        validation: (value) => value.startsWith('sk-ant-api03-')
      },
      { 
        name: 'ELEVENLABS_API_KEY', 
        description: 'ElevenLabs API key (starts with sk_)',
        validation: (value) => value.startsWith('sk_')
      },
      { 
        name: 'NEON_DATABASE_URL', 
        description: 'Neon PostgreSQL connection string (starts with postgresql://)',
        validation: (value) => value.startsWith('postgresql://') && value.includes('neon.tech')
      }
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠',
      error: '✗',
      setup: '🔧'
    }[type] || 'ℹ';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  executeCommand(command, description, silent = true) {
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: silent ? 'pipe' : 'inherit' 
      });
      return output;
    } catch (error) {
      this.log(`${description} failed: ${error.message}`, 'error');
      throw error;
    }
  }

  checkVercelCLI() {
    this.log('Checking Vercel CLI...', 'setup');
    try {
      this.executeCommand('vercel --version', 'Vercel CLI check');
      this.log('Vercel CLI is available', 'info');
    } catch (error) {
      this.log('Installing Vercel CLI...', 'setup');
      this.executeCommand('npm install -g vercel@latest', 'Vercel CLI installation', false);
    }
  }

  checkVercelAuth() {
    this.log('Checking Vercel authentication...', 'setup');
    try {
      const whoami = this.executeCommand('vercel whoami', 'Vercel auth check');
      this.log(`Logged in as: ${whoami.trim()}`, 'info');
    } catch (error) {
      this.log('Please log in to Vercel...', 'setup');
      this.executeCommand('vercel login', 'Vercel login', false);
    }
  }

  async promptForValue(envVar) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`Enter ${envVar.name} (${envVar.description}): `, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  loadLocalEnvValues() {
    const localEnvValues = {};
    
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          
          // Only use if it's not a demo value
          if (!value.includes('demo_') && !value.includes('your_') && value.length > 10) {
            localEnvValues[key.trim()] = value.trim();
          }
        }
      }
    }
    
    return localEnvValues;
  }

  async setEnvironmentVariable(name, value, environments = ['production', 'preview']) {
    for (const env of environments) {
      try {
        const command = `vercel env add ${name} ${env} --yes`;
        
        // Use stdin to provide the value
        const child = require('child_process').spawn('sh', ['-c', command], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        child.stdin.write(value + '\n');
        child.stdin.end();
        
        await new Promise((resolve, reject) => {
          child.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Command failed with code ${code}`));
            }
          });
        });
        
        this.log(`Set ${name} for ${env} environment`, 'info');
      } catch (error) {
        this.log(`Failed to set ${name} for ${env}: ${error.message}`, 'warn');
      }
    }
  }

  async setupEnvironmentVariables() {
    this.log('Setting up environment variables...', 'setup');
    
    const localValues = this.loadLocalEnvValues();
    this.log(`Found ${Object.keys(localValues).length} local environment values`, 'info');

    for (const envVar of this.requiredVars) {
      let value = localValues[envVar.name];
      
      if (!value) {
        this.log(`${envVar.name} not found in local environment`, 'warn');
        value = await this.promptForValue(envVar);
      }

      if (!value) {
        this.log(`Skipping ${envVar.name} - no value provided`, 'warn');
        continue;
      }

      if (!envVar.validation(value)) {
        this.log(`Invalid format for ${envVar.name}`, 'warn');
        value = await this.promptForValue(envVar);
        
        if (!envVar.validation(value)) {
          this.log(`Still invalid format for ${envVar.name} - skipping`, 'error');
          continue;
        }
      }

      await this.setEnvironmentVariable(envVar.name, value);
    }
  }

  verifyEnvironmentVariables() {
    this.log('Verifying environment variables...', 'setup');
    
    try {
      const envList = this.executeCommand('vercel env ls', 'List environment variables');
      
      for (const envVar of this.requiredVars) {
        if (envList.includes(envVar.name)) {
          this.log(`✓ ${envVar.name} is configured`, 'info');
        } else {
          this.log(`✗ ${envVar.name} is missing`, 'error');
        }
      }
    } catch (error) {
      this.log('Could not verify environment variables', 'warn');
    }
  }

  generateSummary() {
    this.log('\n🎉 Environment Variable Setup Complete!', 'setup');
    this.log('\n📋 Next Steps:', 'info');
    this.log('  1. Run: npm run deploy', 'info');
    this.log('  2. Test the deployment health endpoint', 'info');
    this.log('  3. Verify voice functionality works', 'info');
    
    this.log('\n🔗 Useful Links:', 'info');
    this.log('  Vercel Dashboard: https://vercel.com/dashboard', 'info');
    this.log('  Environment Variables: vercel env ls', 'info');
  }

  async setup() {
    try {
      this.log('🚀 Starting Vercel Environment Setup...', 'setup');
      
      // Step 1: Verify Vercel CLI and auth
      this.checkVercelCLI();
      this.checkVercelAuth();
      
      // Step 2: Set up environment variables
      await this.setupEnvironmentVariables();
      
      // Step 3: Verify setup
      this.verifyEnvironmentVariables();
      
      // Step 4: Generate summary
      this.generateSummary();
      
    } catch (error) {
      this.log(`❌ Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 Vercel Environment Variable Setup

Usage: node scripts/setup-env-vars.js [options]

Options:
  --help, -h    Show this help message
  
This script will:
1. Check for Vercel CLI and authentication
2. Set up required environment variables for production
3. Verify the setup was successful

Required Environment Variables:
- ANTHROPIC_API_KEY: Claude AI API key
- ELEVENLABS_API_KEY: ElevenLabs TTS API key  
- NEON_DATABASE_URL: PostgreSQL connection string

The script will first try to use values from .env.local,
then prompt for any missing values.
    `);
    process.exit(0);
  }
  
  const setup = new VercelEnvSetup();
  setup.setup();
}

module.exports = VercelEnvSetup;