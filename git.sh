#/bin/sh

# Fetch the newest code
git fetch origin main

# Hard reset
git reset --hard origin/main

# Force pull
git pull origin main --force
