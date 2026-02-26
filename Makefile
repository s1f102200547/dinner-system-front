ifeq (,$(wildcard .env.production))
ifneq ($(MAKECMDGOALS),help)
$(error .env.production is required. Run: cp .env.production.example .env.production and fill all values)
endif
endif

ifneq (,$(wildcard .env.production))
include .env.production
endif

IMAGE ?= gcr.io/$(PROJECT_ID)/$(SERVICE)
BUILD_CONFIG ?= cloudbuild.yaml
SECRETS_BINDINGS ?= FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID_SECRET),FIREBASE_CLIENT_EMAIL=$(FIREBASE_CLIENT_EMAIL_SECRET),FIREBASE_PRIVATE_KEY=$(FIREBASE_PRIVATE_KEY_SECRET)

.PHONY: help check-vars check-build-vars build-image deploy logs describe

help:
	@echo "Usage:"
	@echo "  cp .env.production.example .env.production"
	@echo "  edit .env.production"
	@echo "  make deploy"
	@echo "All required values must be set in .env.production."

check-vars:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "ERROR: PROJECT_ID is required in .env.production"; \
		exit 1; \
	fi
	@if [ -z "$(REGION)" ]; then \
		echo "ERROR: REGION is required in .env.production"; \
		exit 1; \
	fi
	@if [ -z "$(SERVICE)" ]; then \
		echo "ERROR: SERVICE is required in .env.production"; \
		exit 1; \
	fi
	@if [ -z "$(FIRESTORE_DATABASE_ID)" ]; then \
		echo "ERROR: FIRESTORE_DATABASE_ID is required in .env.production"; \
		exit 1; \
	fi
	@if [ -z "$(FIREBASE_PROJECT_ID_SECRET)" ]; then \
		echo "ERROR: FIREBASE_PROJECT_ID_SECRET is required in .env.production"; \
		exit 1; \
	fi
	@if [ -z "$(FIREBASE_CLIENT_EMAIL_SECRET)" ]; then \
		echo "ERROR: FIREBASE_CLIENT_EMAIL_SECRET is required in .env.production"; \
		exit 1; \
	fi
	@if [ -z "$(FIREBASE_PRIVATE_KEY_SECRET)" ]; then \
		echo "ERROR: FIREBASE_PRIVATE_KEY_SECRET is required in .env.production"; \
		exit 1; \
	fi

check-build-vars:
	@if [ -z "$(NEXT_PUBLIC_FIREBASE_API_KEY)" ]; then \
		echo "ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is required in .env.production."; \
		exit 1; \
	fi

build-image: check-vars check-build-vars
	gcloud builds submit \
		--config $(BUILD_CONFIG) \
		--substitutions _IMAGE=$(IMAGE),_NEXT_PUBLIC_FIREBASE_API_KEY=$(NEXT_PUBLIC_FIREBASE_API_KEY)

deploy: build-image
	gcloud run deploy $(SERVICE) \
		--image $(IMAGE) \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--set-env-vars FIRESTORE_DATABASE_ID='$(FIRESTORE_DATABASE_ID)' \
		--set-secrets $(SECRETS_BINDINGS)

logs: check-vars
	gcloud run services logs read $(SERVICE) \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--limit 100

describe: check-vars
	gcloud run services describe $(SERVICE) \
		--project $(PROJECT_ID) \
		--region $(REGION)
