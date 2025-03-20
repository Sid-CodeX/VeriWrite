const natural = require('natural');

function calculateJaccardSimilarity(text1, text2) {
    const tokenizer = new natural.WordTokenizer();
    const words1 = new Set(tokenizer.tokenize(text1.toLowerCase()));
    const words2 = new Set(tokenizer.tokenize(text2.toLowerCase()));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

module.exports = { calculateJaccardSimilarity };
