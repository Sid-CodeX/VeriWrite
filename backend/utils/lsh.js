const { createHash } = require('crypto');
const { NUM_PERMUTATIONS } = require('./minhash');

const NUM_BANDS = NUM_PERMUTATIONS;
const ROWS_PER_BAND = 1;

// Validate LSH configuration
if (NUM_PERMUTATIONS % NUM_BANDS !== 0) {
    console.error("LSH Configuration Error: NUM_PERMUTATIONS must be divisible by NUM_BANDS.");
    process.exit(1);
}

/*
 * Groups submissions into LSH buckets.
 * Submissions with the same band hash go into the same bucket,
 * indicating they are potential plagiarism candidates.
 *
 * @param {Array<{submissionId: string, signature: number[]}>} signaturesWithIds
 * @returns {Map<string, string[]>} Map of bucketKey → array of submission IDs
 */
function getLSHBuckets(signaturesWithIds) {
    const buckets = new Map();

    for (const { submissionId, signature } of signaturesWithIds) {
        for (let b = 0; b < NUM_BANDS; b++) {
            const band = signature.slice(b, b + ROWS_PER_BAND); // Extract one hash per band
            const bandKey = createHash('md5')
                .update(JSON.stringify(band))
                .digest('hex');                  // Hash the band to get a unique bucket key
            const bucketKey = `${b}-${bandKey}`; // Combine band index for uniqueness

            if (!buckets.has(bucketKey)) {
                buckets.set(bucketKey, []);
            }
            buckets.get(bucketKey).push(submissionId);
        }
    }

    return buckets;
}

/*
 * Identifies unique candidate pairs from LSH buckets.
 * Any two submissions in the same bucket are treated as potential matches.
 *
 * @param {Array<{submissionId: string, signature: number[]}>} signaturesWithIds
 * @returns {Array<[string, string]>} Array of unique candidate ID pairs
 */
function findCandidatePairs(signaturesWithIds) {
    const buckets = getLSHBuckets(signaturesWithIds);
    const candidatePairs = new Set();

    for (const submissionIds of buckets.values()) {
        if (submissionIds.length > 1) {
            // Generate all unique pairs in this bucket
            for (let i = 0; i < submissionIds.length; i++) {
                for (let j = i + 1; j < submissionIds.length; j++) {
                    const [id1, id2] = [submissionIds[i], submissionIds[j]].sort();
                    candidatePairs.add(`${id1}-${id2}`); // Use sorted IDs to avoid duplicates
                }
            }
        }
    }
    // Convert "id1-id2" back to [id1, id2]
    return Array.from(candidatePairs).map(pair => pair.split('-'));
}

module.exports = { findCandidatePairs, NUM_BANDS, ROWS_PER_BAND };
