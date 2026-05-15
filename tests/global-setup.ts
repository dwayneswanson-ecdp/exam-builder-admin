import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup(): Promise<void> {
  console.log('\n[global-setup] Seeding test database…');
  try {
    execSync(`node ${path.join(__dirname, 'seed.js')}`, { stdio: 'inherit' });
    console.log('[global-setup] Seed complete.\n');
  } catch (err) {
    console.error('[global-setup] Seed failed:', err);
    throw err;
  }
}
