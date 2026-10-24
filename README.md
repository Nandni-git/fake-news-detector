# News Guardian – Fake News Detector (React + Node + Express)

Clone of DJDarkCyber/Fake-News-Detector, rebuilt without Django.

## Run
```bash
cd server && npm install && npm start          # API on :5000  (optional: GUARDIAN_API_KEY=your_key)
cd client && npm install && npm run dev        # UI on :3000 (proxies /api to :5000)
```

## ML bug fixed
Training data uses **label 1 = FAKE, 0 = REAL**, but the original code treated `prediction == 1` as "Real News",
so every prediction (live news + check-by-title) was inverted. Now `1 -> fake`.
Other fixes: model runs in Node (`ml/export_model.py` exports the pickles to JSON; outputs verified identical to sklearn,
90.7% on the quiz CSV titles); quiz answers no longer leak to the client (original returned `label` with the question);
`__str__` returning a set; hardcoded Guardian key removed (uses env, falls back to the public `test` key);
10-second polling thread + HTML scraping replaced by 60s cache + `show-fields=thumbnail`; wrong date formatting (`getDay/getMonth`).

## Note
The model is a small Naive Bayes trained on 1000 articles, so treat predictions as a demo, not a fact-check.
