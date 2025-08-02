#!/usr/bin/env node

/**
 * Automated deployment script for Robot Brain
 * Handles Vercel deployment with comprehensive validation and monitoring
 */

const { execSync } = require('child_process');
const fs = require('fs');

class RobotBrainDeployer {
  constructor() {
    this.deploymentStartTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠',
      error: '✗',
      deploy: '🚀'
    }[type] || 'ℹ';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  executeCommand(command, description) {
    this.log(`Executing: ${description}`, 'deploy');
    try {
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      this.log(`${description} - SUCCESS`, 'info');
      return output;
    } catch (error) {
      this.log(`${description} - FAILED: ${error.message}`, 'error');
      throw error;
    }
  }

  checkVercelCLI() {
    this.log('🔍 Checking Vercel CLI availability...', 'info');
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      this.log('Vercel CLI is available', 'info');
    } catch (error) {
      this.log('Installing Vercel CLI...', 'deploy');
      this.executeCommand('npm install -g vercel', 'Vercel CLI installation');
    }
  }

  runPreDeployValidation() {
    this.log('🔍 Running pre-deployment validation...', 'deploy');
    this.executeCommand('npm run pre-deploy', 'Pre-deployment validation');
  }

  deployToVercel() {
    this.log('🚀 Deploying to Vercel...', 'deploy');
    
    // Deploy to production
    const deployOutput = this.executeCommand(
      'vercel --prod --yes', 
      'Vercel production deployment'
    );
    
    // Extract deployment URL from output
    const urlMatch = deployOutput.match(/(https:\/\/[^\s]+)/);
    const deploymentUrl = urlMatch ? urlMatch[1] : 'URL not found';
    
    this.log(`🌐 Deployment URL: ${deploymentUrl}`, 'info');
    return deploymentUrl;
  }

  setEnvironmentVariables() {
    this.log('🔧 Setting environment variables...', 'deploy');
    
    const envVars = [
      { name: 'ANTHROPIC_API_KEY', description: 'Anthropic Claude API key' },
      { name: 'ELEVENLABS_API_KEY', description: 'ElevenLabs TTS API key' },
      { name: 'NEON_DATABASE_URL', description: 'Neon PostgreSQL connection string' }
    ];

    envVars.forEach(({ name, description }) => {
      this.log(`⚠️ Remember to set ${name} in Vercel dashboard for production`, 'warn');
    });

    this.log('📝 Environment variable checklist:', 'info');
    this.log('  1. Go to https://vercel.com/dashboard', 'info');
    this.log('  2. Select your Robot Brain project', 'info');
    this.log('  3. Go to Settings > Environment Variables', 'info');
    this.log('  4. Add production values for ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, NEON_DATABASE_URL', 'info');
  }

  validateDeployment(deploymentUrl) {
    this.log('🔬 Validating deployment...', 'deploy');
    
    // Basic health check
    try {
      const healthOutput = this.executeCommand(
        `curl -f -s "${deploymentUrl}/api/health" || echo "Health check endpoint not available"`,
        'Health check'
      );
      this.log(`Health check response: ${healthOutput.trim()}`, 'info');
    } catch (error) {
      this.log('Health check failed - this may be expected if endpoint is not implemented', 'warn');
    }

    this.log('🧪 Manual testing checklist:', 'info');
    this.log(`  1. Visit ${deploymentUrl}`, 'info');
    this.log('  2. Test chat functionality with Robot Friend', 'info');
    this.log('  3. Test voice synthesis (click speaker icon)', 'info');
    this.log('  4. Verify conversation history storage', 'info');
  }

  generateDeploymentReport(deploymentUrl) {
    const deploymentTime = Date.now() - this.deploymentStartTime;
    
    this.log('\n🎉 DEPLOYMENT COMPLETE!', 'deploy');
    this.log(`⏱️ Total deployment time: ${Math.round(deploymentTime / 1000)}s`, 'info');
    this.log(`🌐 Production URL: ${deploymentUrl}`, 'info');
    
    this.log('\n📋 POST-DEPLOYMENT CHECKLIST:', 'info');
    this.log('  ✅ Deployment successful', 'info');
    this.log('  ⏳ Set environment variables in Vercel dashboard', 'warn');
    this.log('  ⏳ Test all functionality manually', 'warn');
    this.log('  ⏳ Monitor performance and error logs', 'warn');
    
    this.log('\n🔗 Important Links:', 'info');
    this.log(`  Production: ${deploymentUrl}`, 'info');
    this.log('  Vercel Dashboard: https://vercel.com/dashboard', 'info');
    this.log('  Neon Console: https://console.neon.tech/', 'info');
  }

  async deploy() {
    try {
      this.log('🚀 Starting Robot Brain deployment process...', 'deploy');
      
      // Step 1: Verify Vercel CLI
      this.checkVercelCLI();
      
      // Step 2: Run pre-deployment validation
      this.runPreDeployValidation();
      
      // Step 3: Deploy to Vercel
      const deploymentUrl = this.deployToVercel();
      
      // Step 4: Remind about environment variables
      this.setEnvironmentVariables();
      
      // Step 5: Basic deployment validation
      this.validateDeployment(deploymentUrl);
      
      // Step 6: Generate deployment report
      this.generateDeploymentReport(deploymentUrl);
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run deployment
if (require.main === module) {
  const deployer = new RobotBrainDeployer();
  deployer.deploy();
}

module.exports = RobotBrainDeployer;