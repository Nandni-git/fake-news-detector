// Pure-JS Multinomial Naive Bayes (same maths as sklearn CountVectorizer + MultinomialNB).
// LABEL FIX: 1 = FAKE, 0 = REAL.
import fs from "fs";
const M = JSON.parse(fs.readFileSync(new URL("./model/nb_model.json", import.meta.url)));
const stop = new Set(M.stopWords);

// sklearn default token_pattern (?u)\b\w\w+\b, lowercase, english stop words
const tokenize = (t) => (String(t).toLowerCase().match(/\p{L}[\p{L}\p{N}_]+|\p{N}[\p{L}\p{N}_]+/gu) || []).filter((w) => !stop.has(w));

export function predict(text) {
  const counts = new Map();
  for (const w of tokenize(text)) {
    const i = M.vocab[w];
    if (i !== undefined) counts.set(i, (counts.get(i) || 0) + 1);
  }
  const scores = M.logPrior.map((p, c) => {
    let s = p;
    for (const [i, n] of counts) s += n * M.logProb[c][i];
    return s;
  });
  const max = Math.max(...scores);
  const exp = scores.map((s) => Math.exp(s - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  const pFake = exp[1] / sum;
  return { label: pFake >= 0.5 ? "fake" : "real", isFake: pFake >= 0.5, confidence: Math.max(pFake, 1 - pFake), known: counts.size };
}
