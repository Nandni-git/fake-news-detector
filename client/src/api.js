const j = async (url, opts) => {
  const r = await fetch(url, opts);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
};
const post = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const getLive = (cat) => j("/api/live" + (cat && cat !== "All" ? `?category=${encodeURIComponent(cat)}` : ""));
export const checkText = (text) => j("/api/check", post({ text }));
export const getQuiz = () => j("/api/quiz");
export const answerQuiz = (id, isFake) => j("/api/quiz", post({ id, isFake }));
