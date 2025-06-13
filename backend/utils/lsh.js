const { createHash } = require('crypto'); // For consistent band hashing
const { NUM_PERMUTATIONS } = require('./minhash'); // Import NUM_PERMUTATIONS for consistency

// --- Configuration Parameters ---
const NUM_BANDS = 32; // Number of bands to divide the signature into
const ROWS_PER_BAND = NUM_PERMUTATIONS / NUM_BANDS; // Number of rows (hash values) per band

// Ensure parameters are consistent
if (NUM_PERMUTATIONS % NUM_BANDS !== 0) {
    console.error("LSH Configuration Error: NUM_PERMUTATIONS must be perfectly divisible by NUM_BANDS.");
    process.exit(1); // Exit or throw error if configuration is invalid
}

// Function to get LSH buckets
// Takes an array of objects: [{ submissionId, signature }, ...]
function getLSHBuckets(signaturesWithIds) {
    const buckets = new Map(); // Map: bandIndex_bucketKey -> [submissionId1, submissionId2, ...]

    for (const { submissionId, signature } of signaturesWithIds) {
        for (let b = 0; b < NUM_BANDS; b++) {
            const startIndex = b * ROWS_PER_BAND;
            const endIndex = startIndex + ROWS_PER_BAND;
            const band = signature.slice(startIndex, endIndex);

            // Hash the band to create a unique key for the bucket
            // Using JSON.stringify ensures consistent hashing for identical arrays
            const bandKey = createHash('md5').update(JSON.stringify(band)).digest('hex');

            // Create a unique identifier for this bucket within this band
            const bucketIdentifier = `${b}-${bandKey}`;

            if (!buckets.has(bucketIdentifier)) {
                buckets.set(bucketIdentifier, []);
            }
            buckets.get(bucketIdentifier).push(submissionId);
        }
    }
    return buckets;
}

// Function to find candidate pairs from the LSH buckets
// Returns an array of arrays: [[id1, id2], [id3, id4], ...]
function findCandidatePairs(signaturesWithIds) {
    const buckets = getLSHBuckets(signaturesWithIds);
    const candidatePairs = new Set(); // Using a Set to store unique pairs (e.g., "id1-id2")

    for (const [bucketIdentifier, submissionIdsInBucket] of buckets.entries()) {
        if (submissionIdsInBucket.length > 1) {
            // If there's more than one submission in a bucket, they are candidates
            // Generate all unique pairs within this bucket
            for (let i = 0; i < submissionIdsInBucket.length; i++) {
                for (let j = i + 1; j < submissionIdsInBucket.length; j++) {
                    // Sort IDs to ensure consistent key (e.g., "id1-id2" always, not "id2-id1")
                    const id1 = submissionIdsInBucket[i].toString();
                    const id2 = submissionIdsInBucket[j].toString();
                    const pairKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
                    candidatePairs.add(pairKey);
                }
            }
        }
    }
    // Convert the Set of string keys back to an array of ID arrays
    return Array.from(candidatePairs).map(key => key.split('-'));
}

module.exports = {
  findCandidatePairs,
  NUM_BANDS,
  ROWS_PER_BAND,
};
