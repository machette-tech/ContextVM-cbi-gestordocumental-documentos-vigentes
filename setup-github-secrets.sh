#!/bin/bash

# Setup GitHub secrets for CI/CD

set -e

echo "🔐 Setting up GitHub secrets for CI/CD..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Please run: gh auth login"
    exit 1
fi

# Get repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"

# Set secrets
echo "Setting NOSTR_PRIVATE_KEY..."
if [ -z "$NOSTR_PRIVATE_KEY" ]; then
    echo "Enter NOSTR_PRIVATE_KEY:"
    read -s NOSTR_PRIVATE_KEY
fi
gh secret set NOSTR_PRIVATE_KEY --body "$NOSTR_PRIVATE_KEY"

echo "Setting DB_PASSWORD..."
if [ -z "$DB_PASSWORD" ]; then
    echo "Enter DB_PASSWORD:"
    read -s DB_PASSWORD
fi
gh secret set DB_PASSWORD --body "$DB_PASSWORD"

echo "Setting RELAY_URL..."
if [ -z "$RELAY_URL" ]; then
    echo "Enter RELAY_URL (e.g., ws://relay:7777):"
    read RELAY_URL
fi
gh secret set RELAY_URL --body "$RELAY_URL"

echo ""
echo "✅ All secrets have been set!"
echo ""
echo "You can verify with: gh secret list"
