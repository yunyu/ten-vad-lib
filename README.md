# @gooney-001/ten-vad-lib

TEN-VAD WebAssembly module for Voice Activity Detection. A high-performance, low-latency VAD implementation suitable for real-time audio processing.

## Features

- ✅ WebAssembly-based for high performance
- ✅ Low latency (< 10ms processing time)
- ✅ Works with 16kHz audio
- ✅ TypeScript support
- ✅ Both CommonJS and ES Module support
- ✅ Node.js 14+ compatible
- ✅ Zero runtime dependencies

## Installation

```bash
npm install @gooney-001/ten-vad-lib
# or
yarn add @gooney-001/ten-vad-lib
# or
pnpm add @gooney-001/ten-vad-lib
# or
bun add @gooney-001/ten-vad-lib
```

## Quick Start

### ES Module

```javascript
import loadTENVAD from '@gooney-001/ten-vad-lib';

// Load the WebAssembly module
const VAD = await loadTENVAD();

// Get version
const versionPtr = VAD._ten_vad_get_version();
const version = VAD.UTF8ToString(versionPtr);
console.log(`TEN-VAD version: ${version}`);

// Create VAD instance
const HOP_SIZE = 256;  // 16ms at 16kHz
const THRESHOLD = 0.5;
const vadHandlePtr = VAD._malloc(4);
const result = VAD._ten_vad_create(vadHandlePtr, HOP_SIZE, THRESHOLD);

if (result === 0) {
    const vadHandle = VAD.getValue(vadHandlePtr, 'i32');
    
    // Process audio frame
    const audioData = new Int16Array(HOP_SIZE);
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
        console.log(`Speech probability: ${probability}, Is speech: ${isSpeech}`);
    }
    
    // Clean up
    VAD._free(audioPtr);
    VAD._free(probPtr);
    VAD._free(flagPtr);
    VAD._ten_vad_destroy(vadHandlePtr);
}

VAD._free(vadHandlePtr);
```

### CommonJS

```javascript
const loadTENVAD = require('@gooney-001/ten-vad-lib');

(async () => {
    const VAD = await loadTENVAD();
    // ... same usage as above
})();
```

### TypeScript

```typescript
import loadTENVAD, { ExtendedVADModule } from '@ten-vad/lib';

const VAD: ExtendedVADModule = await loadTENVAD();
// Full type support available
```

## API Reference

### `loadTENVAD(options?)`

Load the TEN-VAD WebAssembly module.

**Parameters:**
- `options` (optional): Configuration object
  - `wasmBinary`: Pre-loaded WASM binary (Uint8Array)
  - `locateFile`: Custom file locator function

**Returns:** Promise<ExtendedVADModule>

### VAD Module Methods

#### `_ten_vad_get_version()`
Get the version string of the VAD library.

#### `_ten_vad_create(vadHandlePtr, hopSize, threshold)`
Create a new VAD instance.

**Parameters:**
- `vadHandlePtr`: Pointer to store the VAD handle
- `hopSize`: Number of samples per frame (e.g., 256 for 16ms at 16kHz)
- `threshold`: Voice detection threshold (0.0 - 1.0)

**Returns:** 0 on success, error code otherwise

#### `_ten_vad_process(vadHandle, audioPtr, audioSize, probPtr, flagPtr)`
Process an audio frame.

**Parameters:**
- `vadHandle`: VAD instance handle
- `audioPtr`: Pointer to audio data (Int16Array)
- `audioSize`: Number of samples
- `probPtr`: Pointer to store probability result
- `flagPtr`: Pointer to store speech flag (0 or 1)

**Returns:** 0 on success, error code otherwise

#### `_ten_vad_destroy(vadHandlePtr)`
Destroy a VAD instance and free resources.

### Helper Methods

The module includes additional helper methods:

- `getValue(ptr, type)`: Read value from memory
- `setValue(ptr, value, type)`: Write value to memory
- `UTF8ToString(ptr)`: Convert C string to JavaScript string
- `_malloc(size)`: Allocate memory
- `_free(ptr)`: Free allocated memory

## Configuration

### Recommended Settings

```javascript
const HOP_SIZE = 256;        // 16ms per frame at 16kHz
const SAMPLE_RATE = 16000;   // 16kHz sample rate
const THRESHOLD = 0.5;       // Balanced threshold
```

### Performance Tuning

For optimal performance:
- Process audio in 16ms frames (256 samples at 16kHz)
- Reuse allocated memory buffers when possible
- Batch process multiple frames if latency allows

## Examples

### Real-time Audio Processing

```javascript
import loadTENVAD from '@gooney-001/ten-vad-lib';

class VADProcessor {
    constructor() {
        this.vad = null;
        this.vadHandle = null;
        this.vadHandlePtr = null;
    }
    
    async init() {
        this.vad = await loadTENVAD();
        this.vadHandlePtr = this.vad._malloc(4);
        
        const result = this.vad._ten_vad_create(this.vadHandlePtr, 256, 0.5);
        if (result === 0) {
            this.vadHandle = this.vad.getValue(this.vadHandlePtr, 'i32');
        } else {
            throw new Error('Failed to create VAD instance');
        }
    }
    
    processFrame(audioData) {
        // ... process audio frame
    }
    
    destroy() {
        if (this.vadHandlePtr) {
            this.vad._ten_vad_destroy(this.vadHandlePtr);
            this.vad._free(this.vadHandlePtr);
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **Module loading fails**
   - Ensure you're using Node.js 14 or higher
   - Check that the package is properly installed

2. **Memory leaks**
   - Always free allocated memory with `_free()`
   - Destroy VAD instances when done

3. **Poor detection accuracy**
   - Ensure audio is 16kHz sample rate
   - Adjust threshold based on your use case
   - Use appropriate frame size (256 samples recommended)

## License

MIT

## Contributing

Contributions are welcome! Please submit issues and pull requests on GitHub.

## Support

For issues and questions, please use the GitHub issue tracker.