// Vite plugin to handle environment variables
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default function envPlugin() {
  return {
    name: 'env-plugin',
    configResolved(config) {
      // Only run in production
      if (config.command === 'build') {
        // Read the env file
        const envPath = join(process.cwd(), '.env');
        const envContent = readFileSync(envPath, 'utf-8');
        
        // Parse the env file
        const envVars = envContent
          .split('\n')
          .filter(line => line && !line.startsWith('#'))
          .reduce((acc, line) => {
            const [key, ...value] = line.split('=');
            acc[key.trim()] = value.join('=').trim();
            return acc;
          }, {});

        // Update the env-config.js file
        const envConfigPath = join(process.cwd(), 'public', 'env-config.js');
        let envConfig = readFileSync(envConfigPath, 'utf-8');
        
        // Replace placeholders with actual values
        envConfig = envConfig.replace(
          /%VITE_SUPABASE_URL%/g,
          envVars.VITE_SUPABASE_URL || ''
        );
        envConfig = envConfig.replace(
          /%VITE_SUPABASE_ANON_KEY%/g,
          envVars.VITE_SUPABASE_ANON_KEY || ''
        );
        
        // Write the updated config file
        writeFileSync(envConfigPath, envConfig, 'utf-8');
        
        console.log('Environment configuration updated for production');
      }
    },
  };
}
