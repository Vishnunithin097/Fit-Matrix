import importlib.util
import os
import sys

import joblib

ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

spec = importlib.util.spec_from_file_location('fitmatrix_ml_app', os.path.join(ROOT, 'app.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_legacy_numpy_compatibility_hook_is_applied():
    assert getattr(module, '_apply_legacy_numpy_pickle_compatibility', None) is not None
    assert getattr(module.np.random._pickle, '_fitmatrix_compat_applied', False) is True


def test_legacy_image_model_loads_with_numpy_compatibility():
    model_path = os.path.join(ROOT, '28kproductimage.joblib')
    assert os.path.exists(model_path)
    model = joblib.load(model_path)
    assert model is not None
