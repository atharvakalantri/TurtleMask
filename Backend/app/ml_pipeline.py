import re
from transformers import pipeline
from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_analyzer.nlp_engine import NlpEngineProvider

print("⏳ Loading ML Guard 1: DeBERTa-v3 Prompt Injection Detector...")
injection_classifier = pipeline(
    "text-classification",
    model="protectai/deberta-v3-base-prompt-injection-v2",
    truncation=True,
    max_length=512
)

print("⏳ Loading ML Guard 2: Microsoft Presidio + spaCy PII Scanner...")
# Configure Presidio to use the small, fast spaCy model we downloaded
nlp_configuration = {
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
}
nlp_engine = NlpEngineProvider(nlp_configuration=nlp_configuration).create_engine()
analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])

# Add a Custom Regex Recognizer to catch secret API Keys (e.g., sk-..., AIza...)
api_key_pattern = Pattern(
    name="api_key_pattern",
    regex=r"(sk-[a-zA-Z0-9]{10,}|AIza[0-9A-Za-z\-_]{15,}|ghp_[a-zA-Z0-9]{15,})",
    score=0.95
)
api_key_recognizer = PatternRecognizer(supported_entity="API_KEY", patterns=[api_key_pattern])
analyzer.registry.add_recognizer(api_key_recognizer)


def check_prompt_injection(text: str) -> dict:
    """
    Runs DeBERTa-v3 and returns risk score (0.0 to 1.0) and Risk Level (LOW, MEDIUM, HIGH).
    """
    if not text.strip():
        return {"risk_score": 0.0, "risk_level": "LOW"}

    result = injection_classifier(text)[0]
    label = result["label"]       # Usually 'INJECTION' or 'SAFE'
    score = float(result["score"])

    # Calculate probability of injection (0.0 to 1.0)
    risk_score = score if label.upper() == "INJECTION" else (1.0 - score)
    risk_score = round(risk_score, 4)

    # Apply your PDF's exact probability thresholds!
    if risk_score < 0.4:
        risk_level = "LOW"
    elif risk_score <= 0.75:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level
    }


def scan_for_pii(text: str) -> list:
    """
    Uses Presidio + spaCy + Regex to spot Names, Emails, Phone Numbers, Locations, and API Keys.
    """
    results = analyzer.analyze(
        text=text,
        entities=["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "LOCATION", "CREDIT_CARD", "API_KEY"],
        language="en"
    )

    found_items = []
    for r in results:
        actual_word = text[r.start:r.end]
        found_items.append({
            "entity_type": r.entity_type,
            "word": actual_word,
            "score": round(r.score, 2)
        })
    return found_items