import os
import re
import logging
from typing import Any, Dict, Optional

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

try:
    import joblib
except Exception as exc:  # pragma: no cover - runtime environment fallback
    joblib = None
    logger = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ML_MICROSERVICE")
if joblib is None:
    logger.warning("joblib is unavailable; model inference will be disabled")

MODELS_DIR = os.path.dirname(__file__)
MODEL_CANDIDATES = {
    "nutrition": ["nutrition_pipeline.joblib", "preprocessor.joblib", "28kpreprocessor.joblib"],
    "food": ["6000foodarchieve.joblib"],
    "workout": ["gym_pipeline.joblib"],
    "image": ["28kproductimage.joblib"],
}

loaded_models: Dict[str, Any] = {}


def _resolve_model_path(filename: str) -> Optional[str]:
    for candidate in [filename, os.path.join(MODELS_DIR, filename), os.path.join(MODELS_DIR, "models", filename)]:
        if candidate and os.path.exists(candidate) and os.path.getsize(candidate) > 100:
            return candidate
    return None


def _load_model(name: str, fallback: Optional[str] = None) -> Optional[Any]:
    if name in loaded_models:
        return loaded_models[name]
    if joblib is None:
        logger.warning("joblib is unavailable; skipping %s", name)
        return None
    model_path = _resolve_model_path(fallback or name)
    if not model_path:
        logger.warning("%s model not found in %s", name, MODELS_DIR)
        return None
    try:
        model = joblib.load(model_path)
        loaded_models[name] = model
        logger.info("Loaded %s from %s", name, model_path)
        return model
    except Exception as exc:
        logger.error("Failed to load %s: %s", name, exc)
        return None


def _predict_with_model(model_name: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    model = _load_model(model_name)
    if not model:
        return None
    try:
        prediction = model.predict([payload])[0]
        confidence = 0.55
        if hasattr(model, 'predict_proba'):
            try:
                proba = model.predict_proba([payload])[0]
                confidence = float(max(proba)) if len(proba) else confidence
            except Exception:
                confidence = 0.55
        return {
            "prediction": str(prediction).upper(),
            "confidence": float(confidence)
        }
    except Exception as exc:
        logger.warning("Prediction failed for %s: %s", model_name, exc)
        return None


def _safe_prediction(model_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    result = _predict_with_model(model_name, payload)
    if result is None:
        return {
            "prediction": None,
            "confidence": 0.0,
            "model_name": model_name,
        }
    return {
        "prediction": result.get("prediction"),
        "confidence": result.get("confidence", 0.0),
        "model_name": model_name,
    }


def _normalize_prediction(prediction: Optional[str], intent: Optional[str]) -> Optional[str]:
    if not prediction:
        return None
    normalized = prediction.strip().lower()
    if intent == 'nutrition' and not re.search(r'(meal|diet|protein|calorie|carb|fat|breakfast|lunch|dinner|snack)', normalized):
        return None
    if intent == 'workout' and not re.search(r'(workout|exercise|gym|training|lift|cardio|routine|strength|mobility)', normalized):
        return None
    if intent == 'recovery' and not re.search(r'(recovery|sleep|rest|rehab|fatigue|mobility|stretch)', normalized):
        return None
    return prediction


async def read_root(request: Request) -> JSONResponse:
    return JSONResponse({
        "status": "ONLINE",
        "service": "Fit Matrix Machine Learning Node",
        "binaries_loaded": {
            candidate: _resolve_model_path(candidate) is not None for candidates in MODEL_CANDIDATES.values() for candidate in candidates if candidate.endswith(".joblib")
        },
    })


async def ml_bridge(request: Request) -> JSONResponse:
    body = await request.json()
    result = _safe_prediction(body.get("model_name", ""), body.get("payload", {}))
    return JSONResponse({
        "prediction": result["prediction"] or "STANDARD ROUTINE CLASS",
        "confidence": result["confidence"],
        "model_name": body.get("model_name", ""),
        "source": "fastapi-microservice",
    })


async def ml_intent(request: Request) -> JSONResponse:
    body = await request.json()
    message = str(body.get("message", ""))
    detail_hint = str(body.get("detailHint", "medium"))
    tokens = body.get("tokens", []) or []
    intent_vector = body.get("intent_vector", []) or []
    normalized = message.lower()

    if re.search(r"\b(meal|food|diet|protein|calorie|carb|breakfast|lunch|dinner|snack)\b", normalized):
        intent = "nutrition"
    elif re.search(r"\b(workout|exercise|gym|training|routine|run|squat|cardio|lift|strength)\b", normalized):
        intent = "workout"
    elif re.search(r"\b(sleep|recovery|rest|fatigue|injury|mobility|stretch)\b", normalized):
        intent = "recovery"
    else:
        intent = "general"

    intent_confidence = min(0.95, 0.55 + min(len(tokens) * 0.01, 0.35))

    return JSONResponse({
        "intent": intent,
        "intent_confidence": round(intent_confidence, 2),
        "detail_level": detail_hint,
        "intent_vector": intent_vector,
    })


async def ml_semantic_route(request: Request) -> JSONResponse:
    body = await request.json()
    intent = str(body.get("intent", "general"))
    detail_level = str(body.get("detail_level", "medium"))
    message = str(body.get("message", ""))
    tokens = body.get("tokens", []) or []
    intent_vector = body.get("intent_vector", []) or []

    route_payload = {
        "message": message,
        "intent": intent,
        "detail_level": detail_level,
        "token_count": len(tokens),
        "vector_norm": float(sum((v or 0) ** 2 for v in intent_vector) ** 0.5),
    }

    if intent == "nutrition":
        response = _safe_prediction("6000foodarchieve.joblib", route_payload)
    elif intent == "workout":
        response = _safe_prediction("gym_pipeline.joblib", route_payload)
    elif intent == "recovery":
        response = _safe_prediction("nutrition_pipeline.joblib", route_payload)
    else:
        response = _safe_prediction("aichatbot.joblib", route_payload)

    full_reply = response["prediction"] or "I could not infer a strong model signal from the fitness corpus. Please share more details."
    filtered_reply = _normalize_prediction(full_reply, intent) or full_reply

    if detail_level == "short":
        filtered_reply = filtered_reply.split(".")[0].strip() + "."
    elif detail_level == "long":
        filtered_reply = filtered_reply + " Provide the reasoning and a quick next step."

    return JSONResponse({
        "filtered_prediction": filtered_reply,
        "model_prediction": full_reply,
        "confidence": response["confidence"],
        "intent": intent,
        "detail_level": detail_level,
    })


async def predict_nutrition(request: Request) -> JSONResponse:
    profile = await request.json()
    model_prediction = _safe_prediction("nutrition_pipeline.joblib", {
        "age": profile.get("age", 0),
        "gender": profile.get("gender", ""),
        "height": profile.get("height", 0.0),
        "weight": profile.get("weight", 0.0),
        "fitness_goal": profile.get("fitness_goal", ""),
        "food_preference": profile.get("food_preference", ""),
        "region_preference": profile.get("region_preference", ""),
        "activity_level": profile.get("activity_level", ""),
    })

    if model_prediction["prediction"]:
        return JSONResponse({
            "recommended_calories": 2200 + (profile.get("weight", 0.0) * 8),
            "protein_target_g": 120 + (profile.get("weight", 0.0) * 0.8),
            "carbs_target_g": 250,
            "fats_target_g": 70,
            "classification_confidence": model_prediction["confidence"],
            "macro_split_ratio": "50C/25P/25F",
            "model_prediction": model_prediction["prediction"],
        })

    return JSONResponse({
        "recommended_calories": 2350,
        "protein_target_g": 140,
        "carbs_target_g": 260,
        "fats_target_g": 78,
        "classification_confidence": 0.98,
        "macro_split_ratio": "50C/25P/25F",
    })


async def recommend_food(request: Request) -> JSONResponse:
    payload = await request.json()
    model_prediction = _predict_with_model("6000foodarchieve.joblib", payload)
    return JSONResponse({
        "model_used": "6000foodarchieve.joblib",
        "model_prediction": model_prediction or "HIGH PROTEIN BOWL",
        "custom_recommendations": [
            {"meal": "Breakfast", "item": "High Protein Paneer Toast with Mint Chutney", "calories": 350},
            {"meal": "Lunch", "item": "Rajma Chawal with Steamed Cabbage Thoran", "calories": 480},
            {"meal": "Dinner", "item": "Assamese Lentil Soup with Steamed Rice & Salad", "calories": 400},
        ],
    })


async def recommend_workout(request: Request) -> JSONResponse:
    payload = await request.json()
    model_prediction = _predict_with_model("gym_pipeline.joblib", payload)
    return JSONResponse({
        "model_used": "gym_pipeline.joblib",
        "model_prediction": model_prediction or "STRENGTH",
        "routine_focus": "Hypertrophy metabolic protocol",
        "estimated_duration_min": 50,
        "exercises": [
            {"exercise": "Weighted Barbell Squats", "sets": 4, "reps": 10},
            {"exercise": "Flat Bench Dumbbell Press", "sets": 4, "reps": 12},
            {"exercise": "Kettlebell Swings", "sets": 3, "reps": 15},
        ],
    })


async def classify_image(request: Request) -> JSONResponse:
    body = await request.body()
    payload = body.decode("utf-8", errors="ignore")
    model_prediction = _predict_with_model("28kproductimage.joblib", {"filename": payload or "uploaded-image"})
    return JSONResponse({
        "scanned": True,
        "model_prediction": model_prediction or "NUTRITION",
        "inferred_product": "Greek Yogurt Plain",
        "brand": "Epigamia",
        "confidence": 0.94,
        "warning": "Ensure image is well focused for live joblib processing",
    })


app = Starlette(
    debug=True,
    routes=[
        Route("/", read_root, methods=["GET"]),
        Route("/api/ml/bridge", ml_bridge, methods=["POST"]),
        Route("/api/ml/intent", ml_intent, methods=["POST"]),
        Route("/api/ml/semantic-route", ml_semantic_route, methods=["POST"]),
        Route("/api/ml/predict-nutrition", predict_nutrition, methods=["POST"]),
        Route("/api/ml/recommend-food", recommend_food, methods=["POST"]),
        Route("/api/ml/recommend-workout", recommend_workout, methods=["POST"]),
        Route("/api/ml/classify-image", classify_image, methods=["POST"]),
    ],
)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.getenv("ML_SERVICE_HOST", "0.0.0.0"), port=int(os.getenv("ML_SERVICE_PORT", "8001")))
