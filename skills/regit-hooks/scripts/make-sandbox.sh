#!/usr/bin/env bash
# Create a throwaway regit repository (with its own bare "origin") to try a hooks file
# without touching the real project.
#
#   make-sandbox.sh <sandbox-dir> [hooks-file]
#
# - <sandbox-dir>/origin.git  bare remote
# - <sandbox-dir>/repo        working clone, initialised with `regit init 1.0.0`
# - if [hooks-file] is given, it replaces .regit/hooks.js, is committed on stable and tagged
#   v1.0.1, so every branch regit creates afterwards (cut from the latest tag) contains it.
#
# Then: cd <sandbox-dir>/repo && regit feature start demo   (and any other command)
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "usage: $0 <sandbox-dir> [hooks-file]" >&2
    exit 1
fi

if ! command -v regit >/dev/null 2>&1; then
    echo "regit is not on PATH (npm install -g regit-cli)" >&2
    exit 1
fi

sandbox_dir=$1
hooks_file=${2:-}

if [ -e "$sandbox_dir" ] && [ -n "$(ls -A "$sandbox_dir" 2>/dev/null)" ]; then
    echo "$sandbox_dir already exists and is not empty" >&2
    exit 1
fi

if [ -n "$hooks_file" ] && [ ! -f "$hooks_file" ]; then
    echo "hooks file not found: $hooks_file" >&2
    exit 1
fi

mkdir -p "$sandbox_dir"
sandbox_dir=$(cd "$sandbox_dir" && pwd)
hooks_path=""
if [ -n "$hooks_file" ]; then
    hooks_path=$(cd "$(dirname "$hooks_file")" && pwd)/$(basename "$hooks_file")
fi

git init -q --bare "$sandbox_dir/origin.git"
git init -q "$sandbox_dir/repo"
cd "$sandbox_dir/repo"
git remote add origin "$sandbox_dir/origin.git"
git config user.name "regit sandbox"
git config user.email "sandbox@example.com"
git config commit.gpgsign false

# regit reads NODE_ENV / GIT_BASE_DIR to pick another repo: make sure it uses this one
env -u NODE_ENV -u GIT_BASE_DIR regit init 1.0.0 >/dev/null 2>&1

if [ -n "$hooks_path" ]; then
    cp "$hooks_path" .regit/hooks.js
    git add .regit/hooks.js
    git commit -q -m "hooks under test"
    git tag -a v1.0.1 -m "hooks under test"
    git push -q origin stable v1.0.1
fi

echo "sandbox ready: $sandbox_dir/repo (origin: $sandbox_dir/origin.git)"
