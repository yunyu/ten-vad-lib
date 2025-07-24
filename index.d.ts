/**
 * TEN-VAD WebAssembly Module TypeScript Declarations
 */

import type { TenVADModule } from './ten_vad';

export interface LoadOptions {
    /**
     * Pre-loaded WASM binary data
     */
    wasmBinary?: Uint8Array;
    
    /**
     * Custom file locator function
     */
    locateFile?: (filename: string) => string;
    
    /**
     * Additional Emscripten module options
     */
    [key: string]: any;
}

/**
 * Extended VAD Module with all TEN-VAD methods and helper functions
 */
export interface ExtendedVADModule extends TenVADModule {
    // The base TenVADModule already includes all necessary methods:
    // - _ten_vad_create
    // - _ten_vad_process
    // - _ten_vad_destroy
    // - _ten_vad_get_version
    // - _malloc
    // - _free
    // - HEAP8, HEAP16, HEAP32, HEAPU8, HEAPU16, HEAPU32, HEAPF32, HEAPF64
    // - getValue
    // - setValue
    // - UTF8ToString
    
    // Additional Emscripten memory arrays
    HEAP8: Int8Array;
    HEAPU16: Uint16Array;
    HEAPU32: Uint32Array;
    HEAPF64: Float64Array;
}

/**
 * Load the TEN-VAD WebAssembly module
 * 
 * @param options - Optional configuration
 * @returns Promise that resolves to the loaded module with helper functions
 * 
 * @example
 * ```javascript
 * import loadTENVAD from '@ten-vad/lib';
 * 
 * const VAD = await loadTENVAD();
 * const vadHandlePtr = VAD._malloc(4);
 * const result = VAD._ten_vad_create(vadHandlePtr, 256, 0.5);
 * if (result === 0) {
 *   const vadHandle = VAD.getValue(vadHandlePtr, 'i32');
 *   // Use the VAD handle...
 * }
 * ```
 */
export function loadTENVAD(options?: LoadOptions): Promise<ExtendedVADModule>;

/**
 * Default export
 */
export default loadTENVAD;