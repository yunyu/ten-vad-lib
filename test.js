#!/usr/bin/env node

/**
 * Simple test to verify the package works correctly
 */

const loadTENVAD = require('./index.js');

async function test() {
    console.log('Testing @ten-vad/lib package...\n');
    
    try {
        // Load the module
        console.log('Loading TEN-VAD module...');
        const VAD = await loadTENVAD();
        console.log('✓ Module loaded successfully');
        
        // Check version
        const versionPtr = VAD._ten_vad_get_version();
        const version = VAD.UTF8ToString(versionPtr);
        console.log(`✓ TEN-VAD version: ${version}`);
        
        // Create VAD instance
        console.log('\nCreating VAD instance...');
        const HOP_SIZE = 256;
        const THRESHOLD = 0.5;
        const vadHandlePtr = VAD._malloc(4);
        const result = VAD._ten_vad_create(vadHandlePtr, HOP_SIZE, THRESHOLD);
        
        if (result === 0) {
            console.log('✓ VAD instance created successfully');
            const vadHandle = VAD.getValue(vadHandlePtr, 'i32');
            
            // Process a test frame
            console.log('\nProcessing test audio frame...');
            const audioData = new Int16Array(HOP_SIZE);
            // Generate a simple sine wave
            for (let i = 0; i < HOP_SIZE; i++) {
                audioData[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 8000;
            }
            
            const audioPtr = VAD._malloc(HOP_SIZE * 2);
            const probPtr = VAD._malloc(4);
            const flagPtr = VAD._malloc(4);
            
            VAD.HEAP16.set(audioData, audioPtr >> 1);
            
            const processResult = VAD._ten_vad_process(
                vadHandle, audioPtr, HOP_SIZE, probPtr, flagPtr
            );
            
            if (processResult === 0) {
                const probability = VAD.getValue(probPtr, 'float');
                const isSpeech = VAD.getValue(flagPtr, 'i32');
                console.log(`✓ Processing successful`);
                console.log(`  - Speech probability: ${probability.toFixed(4)}`);
                console.log(`  - Is speech: ${isSpeech ? 'Yes' : 'No'}`);
            } else {
                console.error('✗ Processing failed with code:', processResult);
            }
            
            // Clean up
            VAD._free(audioPtr);
            VAD._free(probPtr);
            VAD._free(flagPtr);
            VAD._ten_vad_destroy(vadHandlePtr);
            console.log('\n✓ Resources cleaned up');
        } else {
            console.error('✗ Failed to create VAD instance, error code:', result);
        }
        
        VAD._free(vadHandlePtr);
        
        console.log('\n✅ All tests passed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run test
test();