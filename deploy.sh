#!/bin/bash
# Deploy to Google Cloud Run
echo "Deploying ProjectPro App to Google Cloud Run..."
echo "Project: projectpro-app-76535"
echo "Region: asia-southeast1"

gcloud run deploy projectpro-app \
  --project projectpro-app-76535 \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 1024Mi

echo "Deployment command sent."
