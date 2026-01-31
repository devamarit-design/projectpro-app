#!/bin/bash

# Script to check Hipsloth project readiness
echo "🔍 Checking Hipsloth Project Status..."

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✅ Node.js Version: $NODE_VERSION"

# Check Dependencies
if [ -d "node_modules" ]; then
    echo "✅ node_modules found."
else
    echo "❌ node_modules missing. Run 'npm install'."
fi

# Check Firebase config
if [ -f ".firebaserc" ]; then
    PROJECT_ID=$(grep 'default' .firebaserc | cut -d '"' -f 4)
    echo "✅ Firebase Project: $PROJECT_ID"
else
    echo "⚠️ .firebaserc not found."
fi

# Check env variables
if [ -f ".env.local" ]; then
    echo "✅ .env.local found."
else
    echo "⚠️ .env.local missing. Some features might not work."
fi

echo "🚀 Hipsloth project check complete."
