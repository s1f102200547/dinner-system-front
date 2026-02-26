ifneq (,$(wildcard config.mk))
include config.mk
endif

PROJECT_ID ?=
REGION ?= asia-northeast1
SERVICE ?= dinner-system-front
IMAGE ?= gcr.io/$(PROJECT_ID)/$(SERVICE)
FIRESTORE_DATABASE_ID ?= (default)

.PHONY: help check-vars build-image deploy logs describe

help:
	@echo "Usage:"
	@echo "  cp config.mk.example config.mk"
	@echo "  edit config.mk"
	@echo "  make deploy"
	@echo "Override examples:"
	@echo "  make deploy PROJECT_ID=<gcp-project-id>"
	@echo "Variables:"
	@echo "  PROJECT_ID            GCP project id (required, from config.mk or CLI)"
	@echo "  REGION                Cloud Run region (default: asia-northeast1)"
	@echo "  SERVICE               Cloud Run service name (default: dinner-system-front)"
	@echo "  FIRESTORE_DATABASE_ID Runtime env for Firestore DB (default: (default))"

check-vars:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "ERROR: PROJECT_ID is required. Example: make deploy PROJECT_ID=my-project"; \
		exit 1; \
	fi

build-image: check-vars
	gcloud builds submit --tag $(IMAGE)

deploy: build-image
	gcloud run deploy $(SERVICE) \
		--image $(IMAGE) \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--set-env-vars FIRESTORE_DATABASE_ID='$(FIRESTORE_DATABASE_ID)'

logs: check-vars
	gcloud run services logs read $(SERVICE) \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--limit 100

describe: check-vars
	gcloud run services describe $(SERVICE) \
		--project $(PROJECT_ID) \
		--region $(REGION)
