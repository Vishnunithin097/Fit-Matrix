# ML File Roles — FitMind ml_service

This document maps trained model and pipeline files in `ml_service/` to their purpose and where they are used.

- `6000foodarchieve.joblib` — Food Image Model
  - Purpose: Identifies food items from uploaded food images.
  - Used by: food image inference and nutrition pipeline.

- `preprocessor.joblib` — Food Image Preprocessor
  - Purpose: Prepares uploaded food images for the food model.

- `28kproductimage.joblib` — Product Image Model
  - Purpose: Identifies packaged food / product images.

- `28kpreprocessor.joblib` — Product Image Preprocessor
  - Purpose: Prepares product-images for the 28K product model.

- `nutrition_pipeline.joblib` — Nutrition Pipeline
  - Purpose: Converts model predictions into nutrition information and recommendations.

- `gym_pipeline.joblib` — Gym / Exercise Recommendation Pipeline
  - Purpose: Produces workout recommendations from user profile and context.

- `megaGymDataset.joblib` — Exercise Dataset
  - Purpose: Contains exercise/workout data used by the gym recommendation pipeline.

- `aichatbot.joblib` — Chatbot Model
  - Purpose: ML model that interprets user text queries for FitMind chatbot.

- `aipreprocessor.joblib` — Chatbot Preprocessor
  - Purpose: Prepares/encodes user text before `aichatbot.joblib` inference.

- `train_data.joblib` — Chatbot Training Data
  - Purpose: Processed training data used during chatbot model development; referenced for context/lookup.


Notes
- These files are present in the repository at `ml_service/`.
- The backend and `ml_service/app.py` already reference these filenames; do not rename them without updating code.
- If you want, I can add a lightweight backend endpoint to verify model file availability at runtime and fail fast when missing.

Contact
- For changes to model behavior, update the Python service `ml_service/app.py` or re-train the models separately.
