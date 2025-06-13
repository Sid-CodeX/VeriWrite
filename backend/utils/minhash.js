const { createHash } = require('crypto'); // Node.js built-in for hashing

// --- Configuration Parameters ---
const K_SHINGLE_SIZE = 5; // Number of words in a shingle
const NUM_PERMUTATIONS = 128; // Size of the MinHash signature

// A simple (non-cryptographic) hash function for shingles
// FNV-1a hash is a good choice for non-cryptographic string hashing
function fnv1a_32bit(str) {
    const FNV_PRIME = 0x01000193; // 16777619
    const FNV_OFFSET_BASIS = 0x811c9dc5; // 2166136261

    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0; // Convert to unsigned 32-bit integer
}


// Generate k-shingles from text
function getKShingles(text, k) {
    if (!text || typeof text !== "string") return [];
    // Tokenize words, convert to lowercase, remove punctuation
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const shingles = new Set();
    for (let i = 0; i <= words.length - k; i++) {
        shingles.add(words.slice(i, i + k).join(' '));
    }
    return Array.from(shingles); // Return as an array for processing
}

// Generate a set of 'num' pseudo-random hash functions
// In a real scenario, you'd use a universal hash family.
// For demonstration, we'll simulate by creating a list of prime numbers
// and using them for simple 'a*x + b' type hashes or similar transforms.
// For more robustness, consider a dedicated library or a better pseudo-random generator.
const largePrime = 2**32 - 5; // A large prime for modulo operations
const seeds = Array.from({ length: NUM_PERMUTATIONS }, (_, i) => Math.floor(Math.random() * (largePrime - 1)) + 1);
const offsets = Array.from({ length: NUM_PERMUTATIONS }, (_, i) => Math.floor(Math.random() * (largePrime - 1)) + 1);


function generateMinHashSignature(text, k = K_SHINGLE_SIZE, numPermutations = NUM_PERMUTATIONS) {
    const shingles = getKShingles(text, k);
    if (shingles.length === 0) {
        // Return a signature indicating an empty document
        return Array(numPermutations).fill(Infinity);
    }

    const signature = Array(numPermutations).fill(Infinity);

    for (const shingle of shingles) {
        const shingleHash = fnv1a_32bit(shingle); // Get a base hash for the shingle

        for (let i = 0; i < numPermutations; i++) {
            // Apply a "permutation" to the shingle hash
            // This simulates different hash functions
            const permutedHash = (seeds[i] * shingleHash + offsets[i]) % largePrime;
            signature[i] = Math.min(signature[i], permutedHash);
        }
    }
    return signature;
}

module.exports = {
  generateMinHashSignature,
  K_SHINGLE_SIZE,
  NUM_PERMUTATIONS,
};
