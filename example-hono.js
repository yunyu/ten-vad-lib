/**
 * Example: Using @ten-vad/lib in a Hono application
 */

import { Hono } from 'hono';
import loadTENVAD from '@ten-vad/lib';

const app = new Hono();

// Global VAD instance
let VAD = null;
let vadHandle = null;
let vadHandlePtr = null;

// Initialize VAD on startup
async function initializeVAD() {
    VAD = await loadTENVAD();
    console.log('VAD module loaded');
    
    const versionPtr = VAD._ten_vad_get_version();
    const version = VAD.UTF8ToString(versionPtr);
    console.log(`TEN-VAD version: ${version}`);
    
    // Create VAD instance
    vadHandlePtr = VAD._malloc(4);
    const result = VAD._ten_vad_create(vadHandlePtr, 256, 0.5);
    
    if (result === 0) {
        vadHandle = VAD.getValue(vadHandlePtr, 'i32');
        console.log('VAD instance created');
    } else {
        throw new Error('Failed to create VAD instance');
    }
}

// VAD detection endpoint
app.post('/api/vad/detect', async (c) => {
    try {
        const { audioData, sampleRate = 16000 } = await c.req.json();
        
        if (!audioData || !Array.isArray(audioData)) {
            return c.json({ error: 'Invalid audio data' }, 400);
        }
        
        // Ensure we have 256 samples (16ms at 16kHz)
        if (audioData.length !== 256) {
            return c.json({ error: 'Audio must be exactly 256 samples' }, 400);
        }
        
        // Convert to Int16Array
        const audioInt16 = new Int16Array(audioData);
        
        // Allocate memory
        const audioPtr = VAD._malloc(256 * 2);
        const probPtr = VAD._malloc(4);
        const flagPtr = VAD._malloc(4);
        
        try {
            // Copy audio data to WASM memory
            VAD.HEAP16.set(audioInt16, audioPtr >> 1);
            
            // Process audio
            const result = VAD._ten_vad_process(
                vadHandle, audioPtr, 256, probPtr, flagPtr
            );
            
            if (result === 0) {
                const probability = VAD.getValue(probPtr, 'float');
                const isSpeech = VAD.getValue(flagPtr, 'i32');
                
                return c.json({
                    success: true,
                    probability: probability,
                    isSpeech: isSpeech === 1,
                    timestamp: Date.now()
                });
            } else {
                return c.json({ error: 'VAD processing failed' }, 500);
            }
        } finally {
            // Always free memory
            VAD._free(audioPtr);
            VAD._free(probPtr);
            VAD._free(flagPtr);
        }
    } catch (error) {
        console.error('VAD error:', error);
        return c.json({ error: error.message }, 500);
    }
});

// Health check endpoint
app.get('/api/vad/health', (c) => {
    return c.json({
        status: vadHandle ? 'ready' : 'not initialized',
        version: VAD ? VAD.UTF8ToString(VAD._ten_vad_get_version()) : null
    });
});

// Start server
async function start() {
    try {
        await initializeVAD();
        
        const port = process.env.PORT || 3000;
        console.log(`Server running on port ${port}`);
        
        return app;
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Export for Bun/Node.js
export default await start();

// Cleanup on exit
process.on('SIGINT', () => {
    if (vadHandlePtr && VAD) {
        VAD._ten_vad_destroy(vadHandlePtr);
        VAD._free(vadHandlePtr);
        console.log('VAD cleaned up');
    }
    process.exit(0);
});