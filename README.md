# dinner-system-front

Next.js (App Router) frontend for dinner reservation operations.

## Local development

```bash
cp .env.example .env.local
# edit .env.local
npm install
npm run dev
```

## Cloud Run deployment

This repository is configured for container deployment to Cloud Run.

### Quick deploy with Makefile

```bash
cp .env.production.example .env.production
# edit .env.production
make deploy
```

`Makefile` is configured to require all deploy variables from `.env.production`.
It also binds Firebase Admin SDK runtime envs via Secret Manager using `--set-secrets`.

### 1. Required runtime environment variables

Set these on Cloud Run service:

- `FIRESTORE_DATABASE_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

`firebase-admin` initialization uses ADC first and falls back to the env-based service account values above.

Build-time variable (required in `.env.production` / Makefile):

- `NEXT_PUBLIC_FIREBASE_API_KEY`

### Secret Manager prerequisites

Create these secrets in the target project (or adjust names in `.env.production`):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### 2. Build and push image

```bash
PROJECT_ID=<your-gcp-project>
REGION=asia-northeast1
SERVICE=dinner-system-front

gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _IMAGE=gcr.io/$PROJECT_ID/$SERVICE,_NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
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
