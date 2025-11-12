/**
 * TEN-VAD WebAssembly Module Loader (ES Module)
 * 
 * This module provides a unified interface for loading and using the TEN-VAD
 * WebAssembly module in ES Module environments.
 */

/* PATCHED FOR CLOUDFLARE WORKERS: Original Node.js implementation commented out
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
*/

import wasmModule from './ten_vad.wasm';
import createVADModuleFactory from './ten_vad.js';

console.log('[TEN-VAD-INIT] Module loaded');
console.log('[TEN-VAD-INIT] wasmModule:', typeof wasmModule, wasmModule);

// Helper functions to add to the module
function addHelperFunctions(module) {
    // The module already has HEAP arrays from Emscripten, but we need to ensure they're all available
    // These are typically created by Emscripten but let's make sure they exist
    
    if (!module.getValue) {
        module.getValue = function(ptr, type) {
            switch (type) {
                case 'i32': return module.HEAP32[ptr >> 2];
                case 'i16': return module.HEAP16[ptr >> 1];
                case 'i8': return module.HEAP8[ptr];
                case 'float': return module.HEAPF32[ptr >> 2];
                case 'double': return module.HEAPF64[ptr >> 3];
                default: throw new Error(`Unsupported type: ${type}`);
            }
        };
    }
    
    if (!module.setValue) {
        module.setValue = function(ptr, value, type) {
            switch (type) {
                case 'i32': module.HEAP32[ptr >> 2] = value; break;
                case 'i16': module.HEAP16[ptr >> 1] = value; break;
                case 'i8': module.HEAP8[ptr] = value; break;
                case 'float': module.HEAPF32[ptr >> 2] = value; break;
                case 'double': module.HEAPF64[ptr >> 3] = value; break;
                default: throw new Error(`Unsupported type: ${type}`);
            }
        };
    }
    
    if (!module.UTF8ToString) {
        module.UTF8ToString = function(ptr) {
            if (!ptr) return '';
            let result = '';
            let i = ptr;
            while (module.HEAPU8[i]) {
                result += String.fromCharCode(module.HEAPU8[i++]);
            }
            return result;
        };
    }
    
    // Ensure all HEAP arrays are exposed (they should already exist from Emscripten)
    // This is just for documentation/clarity - Emscripten creates these
    const heapArrays = ['HEAP8', 'HEAPU8', 'HEAP16', 'HEAPU16', 'HEAP32', 'HEAPU32', 'HEAPF32', 'HEAPF64'];
    for (const heapName of heapArrays) {
        if (!module[heapName]) {
            console.warn(`Warning: ${heapName} not found in module. This might cause issues.`);
        }
    }
}

/**
 * Load the TEN-VAD WebAssembly module
 * 
 * @param {Object} options - Optional configuration
 * @param {Uint8Array} options.wasmBinary - Pre-loaded WASM binary
 * @param {Function} options.locateFile - Custom file locator function
 * @returns {Promise} Promise that resolves to the loaded module
 */
export async function loadTENVAD(options = {}) {
    // PATCHED FOR CLOUDFLARE WORKERS: Original Node.js implementation commented out
    /*
    try {
        // Get the directory where this package is installed
        const packageDir = __dirname;
        const wasmPath = join(packageDir, 'ten_vad.wasm');
        const jsPath = join(packageDir, 'ten_vad.js');
        
        // Check if files exist
        if (!existsSync(jsPath)) {
            throw new Error(`ten_vad.js not found at ${jsPath}`);
        }
        
        if (!existsSync(wasmPath)) {
            throw new Error(`ten_vad.wasm not found at ${wasmPath}`);
        }
        
        // For ES modules, we can directly import the original file
        // if it's already an ES module
        try {
            // Try to import directly
            const { default: createVADModule } = await import('./ten_vad.js');
            
            // Load the WASM binary
            const wasmBinary = options.wasmBinary || readFileSync(wasmPath);
            
            // Create the module instance
            const moduleOptions = {
                wasmBinary: wasmBinary,
                locateFile: options.locateFile || ((filename) => {
                    if (filename.endsWith('.wasm')) {
                        return wasmPath;
                    }
                    return filename;
                }),
                noInitialRun: false,
                noExitRuntime: true,
                ...options
            };
            
            const vadModule = await createVADModule(moduleOptions);
            
            // Add helper functions
            addHelperFunctions(vadModule);
            
            return vadModule;
            
        } catch (e) {
            // If direct import fails, fall back to the CommonJS approach
            // Read and modify the JS file for compatibility
            let jsContent = readFileSync(jsPath, 'utf8');
            
            // Replace import.meta.url with the actual file path
            jsContent = jsContent.replace(/import\.meta\.url/g, `"file://${jsPath.replace(/\\/g, '/')}"`);
            
            // Convert ES module to CommonJS
            jsContent = jsContent.replace(/export default createVADModule;/, 'module.exports = createVADModule;');
            
            // Create a temporary file with the modified content
            const tempPath = join(packageDir, '.ten_vad_temp_esm.js');
            writeFileSync(tempPath, jsContent);
            
            // Load the WASM binary
            const wasmBinary = options.wasmBinary || readFileSync(wasmPath);
            
            // Load the module using createRequire
            const createVADModule = require(tempPath);
            
            // Create the module instance
            const moduleOptions = {
                wasmBinary: wasmBinary,
                locateFile: options.locateFile || ((filename) => {
                    if (filename.endsWith('.wasm')) {
                        return wasmPath;
                    }
                    return filename;
                }),
                noInitialRun: false,
                noExitRuntime: true,
                ...options
            };
            
            const vadModule = await createVADModule(moduleOptions);
            
            // Clean up temporary file
            try {
                unlinkSync(tempPath);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            // Add helper functions
            addHelperFunctions(vadModule);
            
            return vadModule;
        }
        
    } catch (error) {
        throw new Error(`Failed to load TEN-VAD module: ${error.message}`);
    }
    */
    
    // PATCHED FOR CLOUDFLARE WORKERS: New implementation below
    try {
        // For Cloudflare Workers, wasmModule is a precompiled WebAssembly.Module
        // Use instantiateWasm to handle it properly
        const moduleOptions = {
            instantiateWasm: (info, receiveInstance) => {
                // Instantiate async but return empty object to signal we're handling it
                WebAssembly.instantiate(wasmModule, info).then(instance => {
                    receiveInstance(instance, wasmModule);
                }).catch(err => {
                    console.error('Failed to instantiate WASM:', err);
                });
                return {};
            },
            noInitialRun: true,  // Don't run until WASM is ready
            noExitRuntime: true,
            ...options
        };
        
        const vadModule = await createVADModuleFactory(moduleOptions);
        
        // Add helper functions
        addHelperFunctions(vadModule);
        
        // Now manually run initialization since we set noInitialRun: true
        if (vadModule.calledRun !== true && typeof vadModule._main === 'function') {
            vadModule._main();
        }
        
        return vadModule;
    } catch (error) {
        throw new Error(`Failed to load TEN-VAD module: ${error.message}`);
    }
}

// Default export
export default loadTENVAD;
