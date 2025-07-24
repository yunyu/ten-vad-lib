/**
 * TEN-VAD WebAssembly Module Loader
 * 
 * This module provides a unified interface for loading and using the TEN-VAD
 * WebAssembly module in Node.js environments.
 */

const fs = require('fs');
const path = require('path');

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
async function loadTENVAD(options = {}) {
    try {
        // Get the directory where this package is installed
        const packageDir = __dirname;
        const wasmPath = path.join(packageDir, 'ten_vad.wasm');
        const jsPath = path.join(packageDir, 'ten_vad.js');
        
        // Check if files exist
        if (!fs.existsSync(jsPath)) {
            throw new Error(`ten_vad.js not found at ${jsPath}`);
        }
        
        if (!fs.existsSync(wasmPath)) {
            throw new Error(`ten_vad.wasm not found at ${wasmPath}`);
        }
        
        // Read and modify the JS file for Node.js compatibility
        let jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Replace import.meta.url with the actual file path
        jsContent = jsContent.replace(/import\.meta\.url/g, `"file://${jsPath.replace(/\\/g, '/')}"`);
        
        // Convert ES module to CommonJS
        jsContent = jsContent.replace(/export default createVADModule;/, 'module.exports = createVADModule;');
        
        // Create a temporary file with the modified content
        const tempPath = path.join(packageDir, '.ten_vad_temp.js');
        fs.writeFileSync(tempPath, jsContent);
        
        // Load the WASM binary
        const wasmBinary = options.wasmBinary || fs.readFileSync(wasmPath);
        
        // Clear module cache to ensure fresh load
        delete require.cache[path.resolve(tempPath)];
        
        // Load the module
        const createVADModule = require(path.resolve(tempPath));
        
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
            fs.unlinkSync(tempPath);
        } catch (e) {
            // Ignore cleanup errors
        }
        
        // Add helper functions
        addHelperFunctions(vadModule);
        
        return vadModule;
        
    } catch (error) {
        throw new Error(`Failed to load TEN-VAD module: ${error.message}`);
    }
}

// Export for CommonJS
module.exports = loadTENVAD;
module.exports.default = loadTENVAD;
module.exports.loadTENVAD = loadTENVAD;