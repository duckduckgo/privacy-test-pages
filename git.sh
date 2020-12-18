#/bin/sh

# Fetch the newest code
git fetch origin gh-pages

# Hard reset
git reset --hard origin/gh-pages

# Force pull
git pull origin gh-pages --force