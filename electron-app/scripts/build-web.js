const { execSync } = require('child_process');
const { cpSync, rmSync, existsSync, readFileSync, writeFileSync } = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const electronDir = path.join(__dirname, '..');

// ==================== READ .env.local & EMBED KEYS ====================
function parseEnv(filePath) {
    const result = {};
    try {
        const content = readFileSync(filePath, 'utf8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const idx = trimmed.indexOf('=');
            if (idx === -1) continue;
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            result[key] = val;
        }
    } catch (e) {
        console.error('[build-web] ERROR: could not read .env.local:', e.message);
        process.exit(1);
    }
    return result;
}

const env = parseEnv(path.join(root, '.env.local'));

if (!env.OPENROUTER_API_KEY) {
    console.warn('[build-web] WARNING: OPENROUTER_API_KEY not found in .env.local');
}

const configContent = `// Auto-generated at build time — do not commit\nmodule.exports = ${JSON.stringify({
    OPENROUTER_API_KEY: env.OPENROUTER_API_KEY || '',
}, null, 2)};\n`;

writeFileSync(path.join(electronDir, 'config.generated.js'), configContent);
console.log('[build-web] config.generated.js written.');

// ==================== BUILD REACT APP ====================
console.log('[build-web] Building React app...');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

// ==================== COPY DIST ====================
console.log('[build-web] Copying dist...');
const src = path.join(root, 'dist');
const dest = path.join(electronDir, 'dist');
if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log('[build-web] Done.');
