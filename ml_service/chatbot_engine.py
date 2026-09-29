"""Grounded FitMind retrieval over the existing chatbot artifacts."""

from __future__ import annotations

import hashlib
import logging
import os
import re
import sys
from difflib import SequenceMatcher
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger("ML_MICROSERVICE")

TOKEN_PATTERN = re.compile(r"[a-z0-9]+(?:'[a-z0-9]+)?")
STOP_WORDS = {
    "a", "an", "and", "are", "can", "do", "for", "how", "i", "is", "me",
    "my", "of", "should", "the", "to", "what", "when", "where", "which",
    "with", "would", "you", "your",
}
DOMAIN_TERMS = {
    "fitness", "gym", "exercise", "workout", "training", "strength", "muscle",
    "protein", "calorie", "calories", "nutrition", "food", "meal", "diet",
    "carb", "carbs", "carbohydrate", "carbohydrates", "fat", "weight", "lose", "loss", "gain", "bulk", "cut",
    "water", "hydration", "sleep", "recovery", "rest", "motivation", "healthy",
    "health", "wellness", "stress", "pain", "injury", "symptom", "body", "bmi",
}
DOMAIN_SYNONYMS = {
    "muscle": {"muscle", "muscles", "hypertrophy", "strength", "strong", "stronger", "resistance", "lifting"},
    "weight": {"weight", "fat", "cut", "cutting", "slim", "lose", "loss"},
    "nutrition": {"nutrition", "food", "foods", "meal", "meals", "diet", "eating"},
    "protein": {"protein", "amino", "lean", "muscle"},
    "hydration": {"water", "hydration", "fluid", "drink", "thirst"},
    "sleep": {"sleep", "rest", "insomnia", "tired", "fatigue"},
    "recovery": {"recovery", "recover", "rest", "soreness", "injury"},
}
FUZZY_DOMAIN_VOCABULARY = DOMAIN_TERMS | {
    synonym for synonyms in DOMAIN_SYNONYMS.values() for synonym in synonyms
} | {
    "build", "built", "strong", "stronger", "strength", "eat", "eating", "drink",
    "drinking", "hours", "important", "improve", "better", "become", "healthy",
}
GENERIC_QUERY_TOKENS = {
    "build", "built", "become", "better", "can", "get", "give", "help", "improve", "days", "work",
    "make", "need", "should", "want", "way", "ways",
}
EMBEDDING_MODEL_NAME = os.getenv("FITMIND_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
HIGH_CONFIDENCE = float(os.getenv("FITMIND_HIGH_CONFIDENCE", "0.58"))
MEDIUM_CONFIDENCE = float(os.getenv("FITMIND_MEDIUM_CONFIDENCE", "0.24"))

if not hasattr(SimpleImputer, "_fill_dtype"):
    SimpleImputer._fill_dtype = np.dtype("O")
try:
    import sklearn.compose._column_transformer as _column_transformer
    if not hasattr(_column_transformer, "_RemainderColsList"):
        class _RemainderColsList(list):
            pass
        _column_transformer._RemainderColsList = _RemainderColsList
    import sklearn._loss as _sklearn_loss
    if not hasattr(_sklearn_loss, "CyHalfSquaredError"):
        _sklearn_loss.CyHalfSquaredError = _sklearn_loss.HalfSquaredError
    sys.modules.setdefault("_loss", _sklearn_loss)
except Exception:
    pass


@dataclass(frozen=True)
class RetrievedRecord:
    index: int
    question: str
    answer: str
    qtype: str
    score: float
    semantic_score: float
    keyword_score: float
    token_score: float
    intent_score: float
    fuzzy_score: float



def clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").lower().strip())


def tokenize(value: Any) -> List[str]:
    return [token for token in TOKEN_PATTERN.findall(clean_text(value)) if token not in STOP_WORDS]


def fuzzy_normalize_tokens(tokens: Iterable[str]) -> List[str]:
    normalized = []
    for token in tokens:
        if token in FUZZY_DOMAIN_VOCABULARY:
            normalized.append(token)
            continue
        nearest = max(
            FUZZY_DOMAIN_VOCABULARY,
            key=lambda candidate: SequenceMatcher(None, token, candidate).ratio(),
        )
        normalized.append(nearest if SequenceMatcher(None, token, nearest).ratio() >= 0.78 else token)
    return normalized


def _expanded_tokens(tokens: Iterable[str]) -> set[str]:
    expanded = set(tokens)
    for canonical, synonyms in DOMAIN_SYNONYMS.items():
        if expanded.intersection(synonyms):
            expanded.add(canonical)
            expanded.update(synonyms)
    return expanded


def _stem_token(token: str) -> str:
    for suffix in ("ingly", "edly", "ing", "ed", "es", "s"):
        if len(token) > len(suffix) + 3 and token.endswith(suffix):
            return token[:-len(suffix)]
    return token


def _domain_concepts(tokens: Iterable[str]) -> set[str]:
    values = set(tokens)
    return {
        canonical
        for canonical, synonyms in DOMAIN_SYNONYMS.items()
        if values.intersection(synonyms | {canonical})
    }


def _profile_text(profile: Optional[Dict[str, Any]]) -> str:
    if not profile:
        return ""
    fields = {
        "goal": profile.get("goal") or profile.get("fitness_goal"),
        "diet": profile.get("diet") or profile.get("food_preference"),
        "age": profile.get("age"),
        "weight": profile.get("weight"),
        "bmi": profile.get("bmi"),
        "activity": profile.get("activity_level") or profile.get("workoutFrequency"),
            "calorie_target": profile.get("calorieTarget") or profile.get("calorie_target"),
            "protein_target": profile.get("proteinTarget") or profile.get("protein_target"),
            "water_target": profile.get("waterTarget") or profile.get("water_target"),
            "calories_logged": profile.get("caloriesLogged") or profile.get("calories_logged"),
            "protein_logged": profile.get("proteinLogged") or profile.get("protein_logged"),
            "water_logged": profile.get("waterLogged") or profile.get("water_logged"),
    }
    return " ".join(f"{key} {value}" for key, value in fields.items() if value not in (None, ""))


class FitMindChatbot:
    def __init__(self, base_dir: Optional[str] = None) -> None:
        self.base_dir = Path(base_dir or Path(__file__).resolve().parent)
        self.cache_dir = Path(os.getenv("FITMIND_CACHE_DIR", self.base_dir / ".cache"))
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.preprocessor: Any = None
        self.classifier: Any = None
        self.dataset: pd.DataFrame = pd.DataFrame()
        self.questions: List[str] = []
        self.answers: List[str] = []
        self.qtypes: List[str] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.question_vectors: Any = None
        self.embedding_backend = "tfidf"
        self.sentence_encoder: Any = None
        self.gym_model: Any = None
        self.gym_dataset: pd.DataFrame = pd.DataFrame()
        self.gym_vectorizer: Optional[TfidfVectorizer] = None
        self.gym_vectors: Any = None
        self.nutrition_model: Any = None
        self.nutrition_preprocessor: Any = None
        self._load_artifacts()
        self._build_index()
        self._load_specialized_assets()

    def _load_artifacts(self) -> None:
        self.preprocessor = joblib.load(self.base_dir / "aipreprocessor.joblib")
        self.classifier = joblib.load(self.base_dir / "aichatbot.joblib")
        self.dataset = joblib.load(self.base_dir / "train_data.joblib")
        if not isinstance(self.dataset, pd.DataFrame):
            self.dataset = pd.DataFrame(self.dataset)
        required = {"qtype", "Question", "Answer"}
        missing = required.difference(self.dataset.columns)
        if missing:
            raise ValueError(f"train_data.joblib is missing columns: {sorted(missing)}")
        self.dataset = self.dataset[list(required)].fillna("").reset_index(drop=True)
        self.questions = self.dataset["Question"].astype(str).tolist()
        self.answers = self.dataset["Answer"].astype(str).tolist()
        self.qtypes = self.dataset["qtype"].astype(str).tolist()
        logger.info(
            "FitMind artifacts loaded: aipreprocessor.joblib, aichatbot.joblib, train_data.joblib records=%d",
            len(self.dataset),
        )

    def _load_specialized_assets(self) -> None:
        try:
            self.gym_model = joblib.load(self.base_dir / "gym_pipeline.joblib")
            self.gym_dataset = joblib.load(self.base_dir / "megaGymDataset.joblib")
            if not isinstance(self.gym_dataset, pd.DataFrame):
                self.gym_dataset = pd.DataFrame(self.gym_dataset)
            self.gym_dataset = self.gym_dataset.fillna("").reset_index(drop=True)
            gym_text = self.gym_dataset[["Title", "Desc", "Type", "BodyPart", "Equipment", "Level"]].astype(str).agg(" ".join, axis=1)
            self.gym_vectorizer = TfidfVectorizer(lowercase=True, strip_accents="unicode", ngram_range=(1, 2), sublinear_tf=True)
            self.gym_vectors = self.gym_vectorizer.fit_transform(gym_text)
            logger.info("FitMind gym assets loaded: gym_pipeline.joblib, megaGymDataset.joblib exercises=%d", len(self.gym_dataset))
        except Exception as error:
            logger.warning("FitMind gym assets unavailable: %s", error)

        try:
            self.nutrition_model = joblib.load(self.base_dir / "nutrition_pipeline.joblib")
            self.nutrition_preprocessor = joblib.load(self.base_dir / "preprocessor.joblib")
            logger.info("FitMind nutrition assets loaded: nutrition_pipeline.joblib, preprocessor.joblib")
        except Exception as error:
            logger.warning("FitMind nutrition assets unavailable: %s", error)

    def _dataset_signature(self) -> str:
        source = self.base_dir / "train_data.joblib"
        stat = source.stat()
        return hashlib.sha256(f"{stat.st_size}:{stat.st_mtime_ns}:{len(self.questions)}".encode()).hexdigest()[:16]

    def _build_index(self) -> None:
        signature = self._dataset_signature()
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            self.sentence_encoder = SentenceTransformer(EMBEDDING_MODEL_NAME)
            self.embedding_backend = f"sentence-transformers:{EMBEDDING_MODEL_NAME}"
        except Exception as error:
            logger.warning("SentenceTransformer unavailable; using local TF-IDF embeddings: %s", error)
            self.embedding_backend = "tfidf"

        backend_key = re.sub(r"[^a-zA-Z0-9]+", "-", self.embedding_backend).strip("-").lower()
        cache_path = self.cache_dir / f"chatbot-{backend_key}-{signature}.joblib"
        if cache_path.exists():
            cached = joblib.load(cache_path)
            if cached.get("embedding_backend") == self.embedding_backend:
                self.vectorizer = cached.get("vectorizer")
                self.question_vectors = cached["question_vectors"]
                logger.info("FitMind embedding index loaded from cache: records=%d backend=%s", len(self.questions), self.embedding_backend)
                return

        if self.sentence_encoder is not None:
            self.question_vectors = self.sentence_encoder.encode(
                self.questions, normalize_embeddings=True, show_progress_bar=False
            )
        else:
            self.vectorizer = TfidfVectorizer(
                lowercase=True,
                strip_accents="unicode",
                ngram_range=(1, 2),
                min_df=1,
                max_features=120000,
                sublinear_tf=True,
            )
            self.question_vectors = self.vectorizer.fit_transform(self.questions)

        joblib.dump(
            {
                "vectorizer": self.vectorizer,
                "question_vectors": self.question_vectors,
                "embedding_backend": self.embedding_backend,
            },
            cache_path,
            compress=3,
        )
        logger.info(
            "FitMind embedding index created: records=%d backend=%s cache=%s",
            len(self.questions), self.embedding_backend, cache_path,
        )

    def _embed_query(self, query: str) -> Any:
        if self.sentence_encoder is not None:
            return self.sentence_encoder.encode([query], normalize_embeddings=True)
        if self.vectorizer is None:
            raise RuntimeError("FitMind embedding vectorizer is not initialized")
        return self.vectorizer.transform([query])

    def _classify(self, query: str, profile: Optional[Dict[str, Any]]) -> Tuple[str, float, Optional[str]]:
        frame = pd.DataFrame([{
            "Description": query,
            "Patient": "fitmind-user",
        }])
        try:
            transformed = self.preprocessor.transform(frame)
            logger.info("FitMind preprocessor used: shape=%s", getattr(transformed, "shape", None))
            prediction = self.classifier.predict(frame)
            label = str(prediction[0]) if len(prediction) else "Other"
            confidence = 0.0
            if hasattr(self.classifier, "predict_proba"):
                probabilities = self.classifier.predict_proba(frame)[0]
                confidence = float(np.max(probabilities))
            matching_qtypes = self.dataset.loc[
                self.dataset["Answer"].map(clean_text) == clean_text(label), "qtype"
            ].astype(str).unique()
            predicted_qtype = str(matching_qtypes[0]) if len(matching_qtypes) else None
            logger.info(
                "FitMind classifier used: label=%s qtype=%s confidence=%.4f",
                label[:120], predicted_qtype, confidence,
            )
            return label, confidence, predicted_qtype
        except Exception as error:
            logger.warning("FitMind classifier failed; retrieval continues: %s", error)
            return "Other", 0.0, None

    def _domain_allowed(self, query: str, contextual_query: str) -> bool:
        if re.search(r"\bwork\s*out\b|\bcarbohydrates?\b", clean_text(query)):
            return True
        query_tokens = set(fuzzy_normalize_tokens(tokenize(query)))
        expanded_query_tokens = _expanded_tokens(query_tokens)
        if expanded_query_tokens.intersection(DOMAIN_TERMS):
            return True
        if not re.search(r"\b(it|that|this|they|them|those|enough|often|frequently|times)\b", clean_text(query)):
            return False
        history_tokens = set(tokenize(contextual_query)) - query_tokens
        return bool(_expanded_tokens(history_tokens).intersection(DOMAIN_TERMS))

    def _intent_score(self, qtype: str, predicted_qtype: Optional[str], classifier_confidence: float) -> float:
        if not predicted_qtype or predicted_qtype.lower() == "other":
            return 0.0
        return classifier_confidence if clean_text(qtype) == clean_text(predicted_qtype) else 0.0

    def retrieve(
        self,
        query: str,
        chat_history: Optional[Sequence[Dict[str, Any]]] = None,
        profile: Optional[Dict[str, Any]] = None,
        limit: int = 5,
    ) -> Tuple[List[RetrievedRecord], Dict[str, Any]]:
        history = list(chat_history or [])[-6:]
        previous_user_queries = [
            str(item.get("text") or item.get("message") or "").strip()
            for item in history
            if str(item.get("role") or "user").lower() == "user"
        ][-3:]
        contextual_query = " ".join((*previous_user_queries, query.strip(), query.strip())).strip()
        classifier_label, classifier_confidence, predicted_qtype = self._classify(contextual_query, profile)
        if not self._domain_allowed(query, contextual_query):
            return [], {
                "contextual_query": contextual_query,
                "classifier_label": classifier_label,
                "classifier_confidence": classifier_confidence,
                "domain_allowed": False,
            }

        normalized_query = " ".join(fuzzy_normalize_tokens(tokenize(query)))
        active_query_is_domain_specific = bool(set(normalized_query.split()).intersection(DOMAIN_TERMS))
        query_vector_text = normalized_query if active_query_is_domain_specific else contextual_query
        query_vector = self._embed_query(query_vector_text)
        semantic = cosine_similarity(query_vector, self.question_vectors)[0]
        ranking_text = query if active_query_is_domain_specific else contextual_query
        query_tokens = _expanded_tokens(tokenize(ranking_text))
        query_terms = set(fuzzy_normalize_tokens(tokenize(ranking_text)))
        query_concepts = _domain_concepts(query_terms)
        query_content = {
            _stem_token(token)
            for token in query_terms
            if token not in DOMAIN_TERMS
            and token not in query_concepts
            and token not in GENERIC_QUERY_TOKENS
        }
        candidates: List[RetrievedRecord] = []
        for index, question in enumerate(self.questions):
            question_tokens = set(tokenize(question))
            expanded_question_tokens = _expanded_tokens(question_tokens)
            question_concepts = _domain_concepts(question_tokens)
            question_content = {_stem_token(token) for token in question_tokens if token not in DOMAIN_TERMS and token not in question_concepts}
            token_score = len(query_terms.intersection(question_tokens)) / max(1, len(query_terms))
            keyword_score = len(query_tokens.intersection(expanded_question_tokens)) / max(1, len(query_tokens))
            intent_score = self._intent_score(self.qtypes[index], predicted_qtype, classifier_confidence)
            fuzzy_score = SequenceMatcher(
                None,
                clean_text(contextual_query),
                clean_text(question),
            ).ratio()
            final_score = (
                float(semantic[index]) * 0.70
                + keyword_score * 0.12
                + token_score * 0.08
                + intent_score * 0.05
                + fuzzy_score * 0.05
            )
            candidates.append(RetrievedRecord(
                index=index,
                question=question,
                answer=self.answers[index],
                qtype=self.qtypes[index],
                score=final_score,
                semantic_score=float(semantic[index]),
                keyword_score=keyword_score,
                token_score=token_score,
                intent_score=intent_score,
                fuzzy_score=fuzzy_score,
            ))
        candidates.sort(key=lambda item: item.score, reverse=True)
        selected = candidates[:limit]
        logger.info("[CHATBOT] Query: %s", query)
        logger.info("[CHATBOT] Intent: %s", predicted_qtype or classifier_label[:120])
        for position, item in enumerate(selected[:3], start=1):
            logger.info("[CHATBOT] Top Match %d: %s", position, item.question[:160])
            logger.info("[CHATBOT] Score %d: %.4f", position, item.score)
        return selected, {
            "contextual_query": contextual_query,
            "classifier_label": classifier_label,
            "classifier_confidence": classifier_confidence,
            "predicted_qtype": predicted_qtype,
            "domain_allowed": True,
            "embedding_backend": self.embedding_backend,
        }

    @staticmethod
    def _complexity(query: str) -> str:
        words = len(tokenize(query))
        if words <= 8 and not re.search(r"plan|routine|difference|compare|list|steps", query, re.I):
            return "simple"
        if words <= 18:
            return "medium"
        return "complex"

    def _specialized_context(self, query: str, profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        normalized = clean_text(query)
        is_nutrition = bool(re.search(r"food|eat|meal|protein|calorie|nutrition|diet|carb|fat|hydration|water|before|after", normalized))
        is_gym = bool(re.search(r"gym|workout|exercise|strength|routine|lift|lifting|beginner", normalized))
        if re.search(r"motivation|motivated|motivate", normalized) and not re.search(r"routine|gym plan|workout plan", normalized):
            is_gym = False
        if is_nutrition and re.search(r"eat|food|meal|protein|calorie|nutrition|diet|carb|fat|hydration|water", normalized):
            is_gym = False
        context: Dict[str, Any] = {}

        if is_gym and self.gym_model is not None and self.gym_vectorizer is not None:
            gym_query_vector = self.gym_vectorizer.transform([normalized])
            gym_scores = cosine_similarity(gym_query_vector, self.gym_vectors)[0]
            top_indices = np.argsort(gym_scores)[-5:][::-1]
            selected = self.gym_dataset.iloc[top_indices].copy()
            level = "Beginner" if "beginner" in normalized else None
            if level and "Level" in selected:
                level_matches = selected[selected["Level"].astype(str).str.contains(level, case=False, na=False)]
                if not level_matches.empty:
                    selected = level_matches
            model_score: Optional[float] = None
            try:
                gym_row = pd.DataFrame([{
                    "Unnamed: 0": 0,
                    "Title": normalized,
                    "Desc": normalized,
                    "Type": "Strength" if "strength" in normalized or "muscle" in normalized else "Cardio",
                    "BodyPart": "Full Body",
                    "Equipment": "Bodyweight",
                    "Level": level or "Intermediate",
                    "RatingDesc": "Average",
                }])
                model_score = float(np.asarray(self.gym_model.predict(gym_row)).reshape(-1)[0])
            except Exception as error:
                logger.warning("FitMind gym model inference failed: %s", error)
            context["gym"] = {
                "model_score": model_score,
                "exercises": [
                    {
                        "title": str(row.get("Title", "")),
                        "description": str(row.get("Desc", "")),
                        "type": str(row.get("Type", "")),
                        "body_part": str(row.get("BodyPart", "")),
                        "equipment": str(row.get("Equipment", "")),
                        "level": str(row.get("Level", "")),
                        "similarity": float(gym_scores[index]),
                    }
                    for index, (_, row) in zip(top_indices, selected.iterrows())
                ],
            }
            logger.info("FitMind gym route selected: model_score=%s exercises=%s", model_score, [item["title"] for item in context["gym"]["exercises"][:3]])

        if is_nutrition and self.nutrition_model is not None:
            try:
                feature_names = list(getattr(self.nutrition_model, "feature_names_in_", []))
                nutrition_row = {name: 0 for name in feature_names}
                nutrition_row.update({
                    "creator": "FitMind",
                    "serving_size": "100g",
                    "proteins_100g": float(profile.get("proteinTarget", 0) or 0) if profile else 0,
                    "energy_100g": float(profile.get("calorieTarget", 0) or 0) if profile else 0,
                })
                frame = pd.DataFrame([nutrition_row])
                prediction = self.nutrition_model.predict(frame)
                probability = self.nutrition_model.predict_proba(frame) if hasattr(self.nutrition_model, "predict_proba") else None
                context["nutrition"] = {
                    "class": str(np.asarray(prediction).reshape(-1)[0]),
                    "confidence": float(np.max(probability)) if probability is not None else None,
                    "meal_plan": (profile or {}).get("mealsPlan") or (profile or {}).get("meals_plan"),
                }
                logger.info("FitMind nutrition route selected: class=%s confidence=%s", context["nutrition"]["class"], context["nutrition"]["confidence"])
            except Exception as error:
                logger.warning("FitMind nutrition model inference failed: %s", error)

        return context

    @staticmethod
    def _specialized_answer(context: Dict[str, Any], query: str) -> str:
        sections = []
        gym = context.get("gym")
        if gym and gym.get("exercises"):
            lines = ["### Local gym recommendations"]
            for exercise in gym["exercises"][:4]:
                lines.append(f"- {exercise['title']} ({exercise['level']}, {exercise['equipment']})")
            sections.append("\n".join(lines))
        nutrition = context.get("nutrition")
        if nutrition:
            meal_plan = nutrition.get("meal_plan")
            section = ["### Local nutrition model"]
            if meal_plan:
                section.append(f"Profile meal plan available: {str(meal_plan)[:900]}")
            else:
                section.append("No saved meal plan is attached to the current profile.")
            section.append(f"The nutrition pipeline classified this request as class {nutrition['class']}.")
            if nutrition.get("confidence") is not None:
                section.append(f"Model confidence: {nutrition['confidence']:.2f}.")
            sections.append("\n".join(section))
        return "\n\n".join(sections)

    @staticmethod
    def _local_guidance(query: str, contextual_query: str, profile: Optional[Dict[str, Any]]) -> str:
        current_text = clean_text(query)
        current_tokens = tokenize(current_text)
        is_vague_follow_up = len(current_tokens) <= 5 and not _domain_concepts(current_tokens) and not re.search(
            r"protein|water|hydration|sleep|recover|motivat|strong|muscle|workout|exercise|gym|eat|food|meal|calorie|fat|healthy|health",
            current_text,
            re.I,
        )
        text = clean_text(f"{contextual_query} {query}") if is_vague_follow_up else current_text
        goal = str((profile or {}).get("goal") or (profile or {}).get("fitness_goal") or "your goal")
        protein_target = (profile or {}).get("proteinTarget") or (profile or {}).get("protein_target")
        water_target = (profile or {}).get("waterTarget") or (profile or {}).get("water_target")
        lead = f"For your {goal.lower()} focus, "
        if re.search(r"how often|how many times|frequency", current_text) and re.search(r"strong|muscle|strength|workout|exercise|gym|train", contextual_query, re.I):
            return "For the strength goal we discussed, train the major movement patterns about 2-4 times per week, leaving at least a day between hard sessions for the same muscle groups."
        if re.search(r"is that enough|is this enough|enough", current_text) and re.search(r"sleep", contextual_query, re.I):
            return "That is a good sleep foundation, but keep it consistent for several weeks and pair it with regular meals, hydration, and manageable training. Seek clinical advice if poor sleep or daytime sleepiness persists."
        if is_vague_follow_up and re.search(r"strong|muscle|strength|workout|exercise|gym|train", text):
            return "For the strength goal we discussed, train the major movement patterns about 2-4 times per week, leaving at least a day between hard sessions for the same muscle groups."
        if re.search(r"muscle|strength", current_text) and re.search(r"vegetarian|vegan|meal|food|eat", current_text):
            return f"{lead}combine progressive strength training with vegetarian protein at each meal: Greek yogurt, milk, paneer, tofu, tempeh, lentils, beans, or eggs if you eat them. Add rice, oats, potatoes, or whole grains for training energy and recover with consistent sleep."
        if re.search(r"before.{0,24}(workout|working out|train)|pre.?workout", text):
            return f"{lead}choose an easy-to-digest carbohydrate with some protein 60-90 minutes before training, such as oats with yogurt, a banana with yogurt, or toast with paneer/tofu. Keep the portion light and hydrate."
        if re.search(r"after.{0,20}(workout|train)|post.?workout|eat", text) and re.search(r"eat|food|meal|protein", text):
            return f"{lead}after training, combine protein with carbohydrates: try Greek yogurt and fruit, tofu or paneer with rice, or lentils with quinoa. A normal balanced meal within a couple of hours is enough; drink water as well."
        if re.search(r"protein", text):
            target = f" Your saved profile target is {protein_target} g/day." if protein_target else " A practical starting range for active adults is roughly 1.2-1.6 g/kg/day, adjusted for your body size and goals."
            return f"{lead}spread protein across meals using yogurt, milk, eggs if you eat them, paneer, tofu, lentils, beans, or fish/chicken. Protein supports muscle repair and satiety.{target}"
        if re.search(r"fat|weight loss|lose weight|cut", text):
            return f"{lead}use a modest calorie deficit, keep protein and fiber high, strength-train consistently, and track progress over several weeks rather than chasing rapid changes. Keep meals built around vegetables, legumes or another protein, and minimally processed carbohydrates."
        if re.search(r"sleep", text):
            return "Improve sleep by keeping a consistent wake time, getting morning light, stopping caffeine well before bed, dimming screens late, and allowing about 7-9 hours. If loud snoring or persistent daytime sleepiness is present, seek clinical advice."
        if re.search(r"motivat", text):
            return "When motivation is low, reduce the starting point: schedule a 10-minute walk or one easy set, attach it to an existing routine, and track consistency rather than intensity. A small completed session keeps the habit alive."
        if re.search(r"water|hydration|drink", text):
            target = f" Your saved profile target is {water_target} ml/day." if water_target else " Increase intake with heat and exercise, and use thirst and pale-yellow urine as practical checks."
            return f"Hydrate regularly across the day and drink around training rather than waiting until you are very thirsty.{target}"
        if re.search(r"recover|sore|rest", text):
            return "Support recovery with sufficient sleep, regular meals containing protein and carbohydrates, hydration, and easy movement. Keep hard sessions separated and reduce intensity if fatigue or soreness keeps worsening."
        if re.search(r"strong|muscle|strength", text):
            return f"{lead}use 2-4 weekly strength sessions built around squat, hinge, push, pull, and carry patterns. Start with manageable loads, use controlled form, add repetitions or small weight increases gradually, and leave time for recovery."
        if re.search(r"health|healthy|lifestyle|wellness", text):
            return "Build health from repeatable basics: move most days, strength-train regularly, eat mostly whole foods with protein and fiber, hydrate, sleep consistently, and make changes gradually enough to sustain."
        return "Start with a balanced routine of movement, protein-rich meals, hydration, and consistent sleep, then adjust one habit at a time based on your progress."

    @staticmethod
    def _format_grounded_answer(answer: str, complexity: str) -> str:
        normalized = re.sub(r"\s+", " ", answer).strip()
        if complexity == "simple":
            return normalized[:900]
        sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", normalized) if part.strip()]
        if complexity == "medium":
            return "\n".join(f"- {sentence}" for sentence in sentences[:6])[:1600]
        return f"### FitMind guidance\n\n{normalized[:2400]}"

    @staticmethod
    def _safety_prefix(query: str) -> str:
        if re.search(r"\b(chest pain|trouble breathing|cannot breathe|fainting|unconscious|stroke|severe bleeding|suicid|overdose)\b", query, re.I):
            return "This may be an emergency. Contact local emergency medical services now; do not rely on chat guidance.\n\n"
        if re.search(r"\b(severe pain|persistent pain|blood|vomit|injury|swelling|dizzy|shortness of breath|symptom)\b", query, re.I):
            return "I cannot diagnose symptoms. Please arrange prompt evaluation by a qualified healthcare professional, especially if this is severe or worsening.\n\n"
        return ""

    def respond(
        self,
        query: str,
        chat_history: Optional[Sequence[Dict[str, Any]]] = None,
        profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        records, metadata = self.retrieve(query, chat_history, profile)
        specialized = self._specialized_context(query, profile)
        specialized_answer = self._specialized_answer(specialized, query)
        safety = self._safety_prefix(query)
        if not metadata.get("domain_allowed"):
            if re.search(r"strong|muscle|fitness|workout|work\s+out|train|exercise|gym|eat|food|meal|protein|calorie|fat|water|hydration|sleep|recover|motivat|health|healthy|lifestyle", query, re.I):
                reply = self._local_guidance(query, metadata.get("contextual_query", query), profile)
                return {
                    "reply": safety + reply,
                    "records": [],
                    "specialized": specialized,
                    "metadata": {**metadata, "domain_allowed": True, "confidence_band": "local_guidance", "source_assets": self._source_assets()},
                    "response_method": "local_guidance",
                }
            reply = "I’m FitMind, focused on fitness, nutrition, exercise, recovery, sleep, hydration, motivation, and healthy lifestyle topics."
            return {"reply": safety + reply, "records": [], "metadata": metadata, "response_method": "local"}
        if not records or records[0].score < MEDIUM_CONFIDENCE:
            if specialized_answer:
                return {
                    "reply": safety + self._local_guidance(query, metadata.get("contextual_query", query), profile) + "\n\n" + specialized_answer,
                    "records": [],
                    "specialized": specialized,
                    "metadata": {**metadata, "confidence": records[0].score if records else 0.0, "confidence_band": "specialized"},
                    "response_method": "local_specialized",
                }
            return {
                "reply": safety + self._local_guidance(query, metadata.get("contextual_query", query), profile),
                "records": [],
                "specialized": specialized,
                "metadata": {**metadata, "confidence": records[0].score if records else 0.0, "confidence_band": "local_guidance", "source_assets": self._source_assets()},
                "response_method": "local_guidance",
            }
            reply = safety + "I don’t have enough relevant FitMind knowledge to answer that confidently. Try asking about fitness, nutrition, exercise, sleep, hydration, recovery, or healthy lifestyle habits."
            return {
                "reply": reply,
                "records": [],
                "metadata": {**metadata, "confidence": records[0].score if records else 0.0, "confidence_band": "low"},
                "response_method": "local",
            }

        best = records[0]
        answer = re.sub(r"\s+", " ", best.answer).strip()
        complexity = self._complexity(query)
        answer = self._format_grounded_answer(answer, complexity)
        profile_hint = ""
        if profile and re.search(r"protein|calorie|weight|diet|meal|workout|water|hydration", query, re.I):
            goal = profile.get("goal") or profile.get("fitness_goal")
            details = []
            if goal:
                details.append(f"goal: {goal}")
            if re.search(r"calorie", query, re.I) and profile.get("calorieTarget"):
                details.append(f"calorie target: {profile['calorieTarget']} kcal")
            if re.search(r"protein", query, re.I) and profile.get("proteinTarget"):
                details.append(f"protein target: {profile['proteinTarget']} g")
            if re.search(r"water|hydration", query, re.I) and profile.get("waterTarget"):
                details.append(f"water target: {profile['waterTarget']} ml")
            if details:
                profile_hint = f"\n\nYour available Fit Matrix context: {', '.join(details)}. Use this as a starting point and adjust it with a qualified professional when needed."
        reply = safety + answer + profile_hint
        if specialized_answer:
            reply = f"{reply}\n\n{specialized_answer}"
        confidence_band = "high" if best.score >= HIGH_CONFIDENCE else "medium"
        if confidence_band == "medium":
            reply = "Based on the closest FitMind knowledge:\n\n" + reply
        logger.info("FitMind local response selected: score=%.4f question=%s", best.score, best.question[:120])
        logger.info("[CHATBOT] Response Source: TRAINED_DATA")
        logger.info("[CHATBOT] Response Preview: %s", answer[:240])
        return {
            "reply": reply,
            "records": [record.__dict__ for record in records],
            "specialized": specialized,
            "metadata": {
                **metadata,
                "confidence": best.score,
                "confidence_band": confidence_band,
                "complexity": complexity,
            },
            "response_method": "local",
        }

    def _source_assets(self) -> List[str]:
        assets = ["aipreprocessor.joblib", "aichatbot.joblib", "train_data.joblib"]
        if self.gym_model is not None and not self.gym_dataset.empty:
            assets.extend(["gym_pipeline.joblib", "megaGymDataset.joblib"])
        if self.nutrition_model is not None:
            assets.extend(["nutrition_pipeline.joblib", "preprocessor.joblib"])
        return assets


_ENGINE: Optional[FitMindChatbot] = None


def get_chatbot_engine() -> FitMindChatbot:
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = FitMindChatbot()
    return _ENGINE
