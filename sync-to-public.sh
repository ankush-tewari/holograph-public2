#!/bin/bash

# Step 1: Ensure the latest code from the private repo is pulled
echo "Fetching latest changes from private repo..."
git checkout main
git pull origin main --no-rebase

# Step 2: Push the latest stable code to the public repo
echo "Pushing to public GitHub repository..."
git push public main --force

echo "✅ Sync to public repo completed!"
