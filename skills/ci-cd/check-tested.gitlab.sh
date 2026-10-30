#!/bin/sh
set -u

echo "SKIP_TESTS=0" > tested.env

second="$(git rev-parse --verify --quiet "$CI_COMMIT_SHA^2")" || exit 0

[ "$(git rev-parse "$CI_COMMIT_SHA^{tree}")" = "$(git rev-parse "$second^{tree}")" ] || exit 0

pipelines="$(curl -sf --header "JOB-TOKEN: $CI_JOB_TOKEN" "$CI_API_V4_URL/projects/$CI_PROJECT_ID/pipelines?sha=$second&status=success")" || exit 0

passed="$(echo "$pipelines" | grep -o '"web_url":"[^"]*"' | head -n 1)"

[ -n "$passed" ] || exit 0

echo "SKIP_TESTS=1" > tested.env
echo "Same tree as $second, which already passed in $passed"
