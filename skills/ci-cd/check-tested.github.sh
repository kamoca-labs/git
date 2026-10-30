#!/bin/sh
set -u

echo "skip=false" >> "$GITHUB_OUTPUT"

second="$(git rev-parse --verify --quiet "$GITHUB_SHA^2")" || exit 0

[ "$(git rev-parse "$GITHUB_SHA^{tree}")" = "$(git rev-parse "$second^{tree}")" ] || exit 0

passed="$(gh api "repos/$GITHUB_REPOSITORY/actions/runs?head_sha=$second&event=pull_request&status=success" --jq '.total_count')" || exit 0

[ "${passed:-0}" -gt 0 ] || exit 0

echo "skip=true" >> "$GITHUB_OUTPUT"
echo "Same tree as $second, which already passed"
