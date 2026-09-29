# Production deployment

## Build

Set production environment variables from `backend/.env.example`, then run:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
npm run build
```

## Run

Run the ML service separately:

```powershell
python -m pip install -r ml_service/requirements.txt
npm run start:ml
```

Then start the compiled backend:

```powershell
npm start
```

Use `GET /api/health` for liveness and `GET /api/ready` for database and ML dependency status. Text chat has a local fallback when the ML service is unavailable; image analysis requires the ML service.