const express = require('express');
const { Logging } = require('@google-cloud/logging');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Initialize Google Cloud Logging
const logging = new Logging();
const log = logging.log('electoquest-events');

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

// Endpoint to handle logging from frontend
app.post('/api/log', async (req, res) => {
    try {
        const { event, details } = req.body;
        
        const metadata = {
            resource: { type: 'global' },
            severity: 'INFO',
        };

        const logEntry = log.entry(metadata, {
            event,
            details,
            timestamp: new Date().toISOString()
        });

        await log.write(logEntry);
        console.log(`Logged event: ${event}`, details);
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error writing to Cloud Logging:', error);
        // Don't fail the frontend if logging fails
        res.status(500).json({ success: false, error: 'Logging failed' });
    }
});

// Fallback to index.html for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize Secret Manager
const secretClient = new SecretManagerServiceClient();

async function accessSecret() {
    try {
        const projectId = 'silicon-garage-494118-a1';
        const secretName = `projects/${projectId}/secrets/ELECTOQUEST_APP_SECRET/versions/latest`;
        const [version] = await secretClient.accessSecretVersion({ name: secretName });
        const payload = version.payload.data.toString('utf8');
        console.log(`[Secret Manager] Successfully fetched secret! Value: ${payload}`);
        return payload;
    } catch (error) {
        console.error('[Secret Manager] Error fetching secret:', error);
    }
}

app.listen(port, async () => {
    console.log(`ElectoQuest server running on port ${port}`);
    await accessSecret();
});
