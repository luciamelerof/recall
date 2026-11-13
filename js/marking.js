function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '')     // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Minimum number of edits to turn a into b
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // delete
        dp[i][j - 1] + 1,       // insert
        dp[i - 1][j - 1] + cost // replace
      );
    }
  }
  return dp[a.length][b.length];
}

function autoMark(given, expected) {
  const a = normalize(given);
  const b = normalize(expected);

  if (a === '') return 'incorrect';
  if (a === b) return 'correct';

  const similarity = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  return similarity >= 0.8 ? 'close' : 'incorrect';
}