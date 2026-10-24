import { useEffect, useState } from "react";
import { getLive, checkText, getQuiz, answerQuiz } from "./api";

const Badge = ({ isFake, confidence }) => (
  <span className={"badge " + (isFake ? "fake" : "real")}>
    {isFake ? "✗ Predicted Fake" : "✓ Predicted Real"}{confidence != null && ` · ${(confidence * 100).toFixed(0)}%`}
  </span>
);

function Live() {
  const cats = ["All", "News", "Sport", "Lifestyle", "Arts", "Opinion"];
  const [cat, setCat] = useState("All");
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    let on = true;
    const load = () => getLive(cat).then((d) => on && (setItems(d), setErr(""))).catch((e) => on && setErr(e.message));
    load();
    const t = setInterval(load, 60000);
    return () => { on = false; clearInterval(t); };
  }, [cat]);
  return (
    <section>
      <div className="chips">{cats.map((c) => <button key={c} className={c === cat ? "chip on" : "chip"} onClick={() => setCat(c)}>{c}</button>)}</div>
      {err && <p className="err">{err}</p>}
      <div className="grid">
        {items.map((n) => (
          <a key={n.id} className="card" href={n.url} target="_blank" rel="noreferrer">
            {n.image && <img src={n.image} alt="" />}
            <h4>{n.title}</h4>
            <small>{n.section} · {new Date(n.date).toLocaleString()}</small>
            <Badge isFake={n.isFake} confidence={n.confidence} />
          </a>
        ))}
      </div>
    </section>
  );
}

function Check() {
  const [text, setText] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const go = async () => {
    setErr(""); setRes(null);
    try { setRes(await checkText(text)); } catch (e) { setErr(e.message); }
  };
  return (
    <section className="narrow">
      <textarea rows={4} placeholder="Paste a news headline…" value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn" disabled={!text.trim()} onClick={go}>Check</button>
      {err && <p className="err">{err}</p>}
      {res && <p><Badge isFake={res.isFake} confidence={res.confidence} /></p>}
      {res && res.known < 3 && <p className="muted">Few known words in this text, so the prediction is unreliable.</p>}
    </section>
  );
}

function Quiz() {
  const [q, setQ] = useState(null);
  const [r, setR] = useState(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const next = () => { setR(null); getQuiz().then(setQ); };
  useEffect(next, []);
  const pick = async (isFake) => {
    const d = await answerQuiz(q.id, isFake);
    setR(d); setScore((s) => ({ ok: s.ok + (d.correct ? 1 : 0), total: s.total + 1 }));
  };
  if (!q) return <p>Loading…</p>;
  return (
    <section className="narrow">
      <p className="muted">Score: {score.ok}/{score.total}</p>
      <h3>{q.title}</h3>
      <p>{q.text}…</p>
      {!r ? (
        <div className="row"><button className="btn real" onClick={() => pick(false)}>Real</button><button className="btn fake" onClick={() => pick(true)}>Fake</button></div>
      ) : (
        <>
          <p className={r.correct ? "ok" : "err"}>{r.correct ? "Correct!" : "Wrong."} This article is {r.answer}.</p>
          <button className="btn" onClick={next}>Next</button>
        </>
      )}
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState("live");
  const tabs = { live: ["Live News", Live], check: ["Check Title", Check], quiz: ["News Quiz", Quiz] };
  const View = tabs[tab][1];
  return (
    <>
      <header><h2>News Guardian</h2><nav>{Object.entries(tabs).map(([k, [l]]) => <button key={k} className={k === tab ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</nav></header>
      <main><View /></main>
    </>
  );
}
