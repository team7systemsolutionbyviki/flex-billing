const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Add CORS headers to allow browser to communicate with this server
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/backup') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // accumulate data
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const targetPath = data.path || './backups';
                const fileContent = data.content;
                const fileName = data.filename || `backup-${Date.now()}.json`;
                
                // Ensure directory exists
                if (!fs.existsSync(targetPath)) {
                    fs.mkdirSync(targetPath, { recursive: true });
                }
                
                const fullFilePath = path.join(targetPath, fileName);
                fs.writeFileSync(fullFilePath, fileContent, 'utf8');
                
                console.log(`[${new Date().toISOString()}] Successfully saved backup to: ${fullFilePath}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: `Saved to ${fullFilePath}` }));
            } catch (error) {
                console.error(`Error saving backup: ${error.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log('====================================================');
    console.log(` T7 PRINT BILLING - BACKUP SERVER`);
    console.log(` Running on http://localhost:${PORT}`);
    console.log('====================================================');
    console.log(` Keep this window open. Your browser will automatically`);
    console.log(` send backup files here on Login and Logout.`);
    console.log(` Press Ctrl+C to stop the server.`);
    console.log('====================================================');
});
