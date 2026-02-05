import fs from 'fs';
import path from 'path';

export const updateEnv = ({ projectId, publishableKey, url, customerSource }) => {
  const envFile = path.resolve('./.env'); // adjust path if needed
  let content = fs.readFileSync(envFile, 'utf-8');

  content = content
    .replace(/^VITE_SUPABASE_PROJECT_ID=.*$/m, `VITE_SUPABASE_PROJECT_ID="${projectId}"`)
    .replace(/^VITE_SUPABASE_PUBLISHABLE_KEY=.*$/m, `VITE_SUPABASE_PUBLISHABLE_KEY="${publishableKey}"`)
    .replace(/^VITE_SUPABASE_URL=.*$/m, `VITE_SUPABASE_URL="${url}"`)
    .replace(/^VITE_CUSTOMER_SOURCE=.*$/m, `VITE_CUSTOMER_SOURCE=${customerSource}`);

  fs.writeFileSync(envFile, content);
  return '.env updated successfully';
};
