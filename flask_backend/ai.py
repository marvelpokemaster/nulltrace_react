import re
import emoji
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import nltk
from cleantext import clean
from transformers import pipeline

# ==========================================
# Setup NLTK and model
# ==========================================
print("🔧 Setting up NLP environment...")
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)

stop_words = set(stopwords.words("english"))

print("🚀 Loading Hugging Face model (CardiffNLP Twitter RoBERTa)...")
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)
print("✅ Model loaded successfully!\n")

# ==========================================
# Preprocessing function
# ==========================================
def preprocess_text(text: str) -> str:
    if not text:
        return ""

    text = text.lower()
    text = clean(
        text,
        fix_unicode=True,
        to_ascii=True,
        lower=True,
        no_urls=True,
        no_emails=True,
        no_phone_numbers=True,
        no_digits=False,
        no_currency_symbols=True,
        no_punct=False,
    )
    text = emoji.demojize(text)
    text = re.sub(r"[^a-zA-Z\s:]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stop_words]
    return " ".join(tokens)

# ==========================================
# Sentiment prediction
# ==========================================
def analyze_sentiment(text: str):
    processed = preprocess_text(text)
    print(f"🧹 Preprocessed: {processed}\n")

    result = sentiment_analyzer(processed[:512])[0]
    label = result["label"].lower()
    score = result["score"]

    sentiment, rating = "neutral", 3
    if "pos" in label:
        sentiment = "positive"
        rating = min(5, 3 + int(score * 2))
    elif "neg" in label:
        sentiment = "negative"
        rating = max(1, 3 - int(score * 2))

    print(f"🔍 Model output: {result}")
    print(f"✅ Final Sentiment: {sentiment}, Rating: {rating}/5 ({score:.2%} confidence)\n")

# ==========================================
# Tests
# ==========================================
if __name__ == "__main__":
    samples = [
        "This app is absolutely amazing 🔥🔥 I love the design!",
        "Ugh, it's so buggy and laggy 😡 hate it.",
        "The UI is okay, not too bad.",
        "Worst app ever. Crashes every time.",
        "Bro this is too good to be true 😂👏👏"
    ]

    for s in samples:
        print("💬 Input:", s)
        analyze_sentiment(s)
        print("=" * 60)
