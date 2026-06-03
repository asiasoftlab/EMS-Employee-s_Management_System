import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Check if a command line argument specifies production
const isProdArg = process.argv.includes('--production');
if (isProdArg) {
  process.env.NODE_ENV = 'production';
}

// Default to development if not set
const env = process.env.NODE_ENV || 'development';
process.env.NODE_ENV = env;

const envFile = env === 'production' ? '.env.production' : '.env.development';

// Since this might be executed from different working directories,
// we'll try to find the .env file in the current directory or fallback
let envPath = path.resolve(process.cwd(), envFile);

// Check if the file exists at cwd, otherwise fall back to __dirname
if (!fs.existsSync(envPath)) {
  const possibleDir = path.resolve(process.cwd(), 'BackEnd');
  if (fs.existsSync(path.resolve(possibleDir, envFile))) {
    envPath = path.resolve(possibleDir, envFile);
  }
}

dotenv.config({ path: envPath });

console.log(`Loaded environment configuration from ${envFile} for ${env} mode.`);
