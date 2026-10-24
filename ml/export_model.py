"""Export the pickled CountVectorizer + MultinomialNB to JSON so Node can run inference.
LABEL FIX: in the training data, label 1 = FAKE and 0 = REAL (the original app had this inverted)."""
import json, pickle, warnings
from sklearn.feature_extraction import _stop_words
warnings.simplefilter("ignore")
v = pickle.load(open("vectorizer_model.pkl", "rb"))
m = pickle.load(open("nb_model.pkl", "rb"))
assert list(m.classes_) == [0, 1]
out = {
    "labels": {"0": "real", "1": "fake"},
    "vocab": {w: int(i) for w, i in v.vocabulary_.items()},
    "stopWords": sorted(_stop_words.ENGLISH_STOP_WORDS),
    "logPrior": m.class_log_prior_.tolist(),
    "logProb": [[round(x, 6) for x in row] for row in m.feature_log_prob_.tolist()],
}
json.dump(out, open("../server/model/nb_model.json", "w"))
print("exported", len(out["vocab"]), "features")
