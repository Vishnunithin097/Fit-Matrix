import os
import sys

ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from chatbot_engine import FitMindChatbot


_engine = None


def engine():
    global _engine
    if _engine is None:
        _engine = FitMindChatbot(ROOT)
    return _engine


def test_existing_chatbot_artifacts_and_complete_dataset_are_loaded():
    chatbot = engine()
    assert chatbot.preprocessor is not None
    assert chatbot.classifier is not None
    assert len(chatbot.dataset) == 16407
    assert set(chatbot.dataset.columns) == {"qtype", "Question", "Answer"}
    assert chatbot.question_vectors.shape[0] == 16407


def test_local_fallback_retrieves_grounded_hydration_answer():
    result = engine().respond("How much water should I drink?")
    assert result["response_method"] == "local"
    assert result["records"]
    assert "water" in result["records"][0]["answer"].lower()
    assert "pollution" not in result["records"][0]["question"].lower()
    assert {"semantic_score", "keyword_score", "token_score", "intent_score", "fuzzy_score"}.issubset(result["records"][0])
    assert result["metadata"]["confidence_band"] in {"high", "medium"}


def test_unrelated_question_is_domain_restricted():
    result = engine().respond("Who won yesterday's football match?")
    assert result["metadata"]["domain_allowed"] is False
    assert not result["records"]
    assert "FitMind" in result["reply"]


def test_safety_response_does_not_diagnose_emergency_symptoms():
    result = engine().respond("I have chest pain and trouble breathing")
    assert "emergency" in result["reply"].lower()
    assert "diagnos" not in result["reply"].lower()


def test_gemini_disabled_local_queries_do_not_crash():
    queries = [
        "How can I build muscle?",
        "What foods are high in protein?",
        "What exercises should I do?",
        "How many hours should I sleep?",
        "Why is recovery important?",
    ]
    replies = [engine().respond(query)["reply"] for query in queries]
    assert all(reply.strip() for reply in replies)
    assert len(set(replies)) >= 2


def test_follow_up_query_keeps_conversation_context():
    records, metadata = engine().retrieve(
        "What should I eat?",
        [{"role": "user", "text": "I want to gain muscle."}],
    )
    assert "gain muscle" in metadata["contextual_query"]
    assert metadata["domain_allowed"] is True
    assert not records or all(record["score"] >= 0 for record in records)


def test_profile_context_is_used_for_relevant_personalization():
    result = engine().respond(
        "How much water should I drink?",
        profile={"goal": "weight loss", "waterTarget": 2500},
    )
    assert "water target: 2500 ml" in result["reply"]


def test_gym_query_uses_existing_gym_model_and_exercise_dataset():
    chatbot = engine()
    result = chatbot.respond("Suggest a strength routine")
    assert result["response_method"] == "local_specialized"
    assert result["specialized"]["gym"]["exercises"]
    assert chatbot.gym_model is not None
    assert len(chatbot.gym_dataset) == 2918


def test_nutrition_query_uses_existing_nutrition_pipeline():
    chatbot = engine()
    result = chatbot.respond(
        "What should I eat to gain muscle?",
        profile={"goal": "Muscle Gain", "proteinTarget": 120, "calorieTarget": 2400},
    )
    assert result["response_method"] == "local_specialized"
    assert result["specialized"]["nutrition"]["class"]
    assert chatbot.nutrition_model is not None
    assert chatbot.nutrition_preprocessor is not None
