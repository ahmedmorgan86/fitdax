import fs from 'node:fs';
fs.writeFileSync('public/app-version.json',JSON.stringify({version:process.env.VERCEL_GIT_COMMIT_SHA||'local-'+Date.now(),builtAt:new Date().toISOString()}));
