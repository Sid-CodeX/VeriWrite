const { createHash } = require('crypto');
const seedrandom = require('seedrandom');

const K_SHINGLE_SIZE = 3; // Number of words per shingle
const NUM_PERMUTATIONS = 128; // MinHash signature size
const FIXED_MINHASH_SEED = 'a_unique_and_fixed_plagiarism_detection_seed_42'; // For deterministic hashing

// FNV-1a 32-bit non-cryptographic hash
function fnv1a_32bit(str) {
    const FNV_PRIME = 0x01000193;
    const FNV_OFFSET_BASIS = 0x811c9dc5;

    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
}

// Convert text to normalized k-shingles (set of unique k-word phrases)
function getKShingles(text, k) {
    if (!text || typeof text !== "string") return [];

    const normalized = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const words = normalized.split(' ').filter(w => w.length > 0);
    const shingles = new Set();

    for (let i = 0; i <= words.length - k; i++) {
        shingles.add(words.slice(i, i + k).join(' '));
    }
    return Array.from(shingles);
}

// Deterministic pseudo-random generators for hashing permutations
const largePrime = 2 ** 32 - 5;
const rng = seedrandom(FIXED_MINHASH_SEED);

const seeds = Array.from({ length: NUM_PERMUTATIONS }, () => Math.floor(rng() * (largePrime - 1)) + 1);
const offsets = Array.from({ length: NUM_PERMUTATIONS }, () => Math.floor(rng() * (largePrime - 1)) + 1);

// Generate MinHash signature for given text
function generateMinHashSignature(text, k = K_SHINGLE_SIZE, numPermutations = NUM_PERMUTATIONS) {
    const shingles = getKShingles(text, k);
    if (shingles.length === 0) return Array(numPermutations).fill(Infinity);

    const signature = Array(numPermutations).fill(Infinity);

    for (const shingle of shingles) {
        const baseHash = fnv1a_32bit(shingle);

        for (let i = 0; i < numPermutations; i++) {
            const permuted = (seeds[i] * baseHash + offsets[i]) % largePrime;
            signature[i] = Math.min(signature[i], permuted);
        }
    }
    return signature;
}

module.exports = { generateMinHashSignature, NUM_PERMUTATIONS };
