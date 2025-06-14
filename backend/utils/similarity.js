// This method is used for precise plagiarism percentage calculation after LSH has identified candidates.
// Formula: |Intersection(Words1, Words2)| / max(|Words1|, |Words2|) 

function calculateJaccardSimilarity(text1, text2) {
    // Tokenize text into words, convert to lowercase, and create a Set of unique words.
    const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);

    // if both texts are empty, 100% similar.
    if (words1.size === 0 && words2.size === 0) {
        return 1.0;
    }
    // if one text is empty and the other is not, 0% similar.
    if (words1.size === 0 || words2.size === 0) {
        return 0.0;
    }

    // Number of intersection words
    const commonWords = [...words1].filter(word => words2.has(word));
    
    // (Size of Intersection) / (Size of the larger of the two sets).
    const overlapSimilarity = commonWords.length / Math.max(words1.size, words2.size);

    return overlapSimilarity; // Returns a decimal between 0 and 1
}

module.exports = { calculateJaccardSimilarity };
