function findAlmostEqualSubstring(s: string, pattern: string): number {
    const n = s.length;
    const m = pattern.length;
    for (let i = 0; i <= n - m; i++) {
        let diffCount = 0;
        for (let j = 0; j < m; j++) {
            if (s[i + j] !== pattern[j]) {
                diffCount++;
                if (diffCount > 1) break;
            }
        }
        if (diffCount <= 1) return i;
    }
    return -1;
}

// Test cases from the questions
const answer1 = findAlmostEqualSubstring("abcdefg", "bcdffg");
const answer2 = findAlmostEqualSubstring("ababbababa", "bacaba");

console.log(answer1);
console.log(answer2);