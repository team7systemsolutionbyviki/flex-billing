const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DEFAULT_DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DEFAULT_DATA_DIR)) {
    fs.mkdirSync(DEFAULT_DATA_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const targetDir = parsedUrl.query.path || DEFAULT_DATA_DIR;

    // GET /api/data -> return all collections
    if (req.method === 'GET' && parsedUrl.pathname === '/api/data') {
        const result = {};
        try {
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            
            const files = fs.readdirSync(targetDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const colName = file.replace('.json', '');
                    const content = fs.readFileSync(path.join(targetDir, file), 'utf8');
                    try {
                        result[colName] = JSON.parse(content);
                    } catch(e) {}
                }
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: result }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
        return;
    }

    // POST /api/collection/:name
    if (req.method === 'POST' && parsedUrl.pathname.startsWith('/api/collection/')) {
        const colName = parsedUrl.pathname.split('/api/collection/')[1];
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        
        req.on('end', () => {
            try {
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                const data = JSON.parse(body);
                fs.writeFileSync(path.join(targetDir, `${colName}.json`), JSON.stringify(data, null, 2), 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }
    
    // Fallback for previous backup endpoint
    if (req.method === 'POST' && parsedUrl.pathname === '/api/backup') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const targetPath = data.path || './backups';
                const fileContent = data.content;
                const fileName = data.filename || `backup-${Date.now()}.json`;
                if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
                fs.writeFileSync(path.join(targetPath, fileName), fileContent, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        });
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log('====================================================');
    console.log(` T7 PRINT BILLING - API BACKEND SERVER`);
    console.log(` Running on http://localhost:${PORT}`);
    console.log(` Data is being read from and written to: ${DEFAULT_DATA_DIR}`);
    console.log('====================================================');
});
