# dinner-system-front

Next.js (App Router) frontend for dinner reservation operations.

## Local development

```bash
npm install
npm run dev
```

## Cloud Run deployment

This repository is configured for container deployment to Cloud Run.

### Quick deploy with Makefile

```bash
cp config.mk.example config.mk
# edit config.mk
make deploy
```

Optional variables:

```bash
make deploy \
  PROJECT_ID=<your-gcp-project> \
  REGION=asia-northeast1 \
  SERVICE=dinner-system-front \
  FIRESTORE_DATABASE_ID='(default)'
```

### 1. Required runtime environment variables

Set these on Cloud Run service:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `FIRESTORE_DATABASE_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

`firebase-admin` initialization uses ADC first and falls back to the env-based service account values above.

### 2. Build and push image

```bash
PROJECT_ID=<your-gcp-project>
REGION=asia-northeast1
SERVICE=dinner-system-front

gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy $SERVICE \
  --image gcr.io/$PROJECT_ID/$SERVICE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars FIRESTORE_DATABASE_ID=(default)
```

Add secret/environment bindings in Cloud Run for Firebase credentials and API key.

## Container notes

- `next.config.ts` uses `output: "standalone"`
- `Dockerfile` starts the app with `node server.js` on `PORT=8080`
