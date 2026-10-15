#!/usr/bin/env bash
set -euo pipefail

compose_file="observability/compose.yaml"
env_file=".env"
app_url="http://127.0.0.1:8085"

cleanup() {
  docker compose --env-file "$env_file" --file "$compose_file" down
}
trap cleanup EXIT

docker compose --env-file "$env_file" --file "$compose_file" up --build --detach

for _ in $(seq 1 90); do
  if curl --fail --silent "$app_url/actuator/health/readiness" >/dev/null; then
    break
  fi
  sleep 2
done

health="$(curl --fail --silent "$app_url/actuator/health/readiness")" || {
  docker compose --env-file "$env_file" --file "$compose_file" logs app database
  exit 1
}
printf '%s' "$health" | jq --exit-status '.status == "UP"' >/dev/null || {
  printf '%s\n' "$health"
  echo "Application or database health check did not report UP." >&2
  exit 1
}

curl --fail --silent "$app_url/" >/dev/null
metrics="$(curl --fail --silent "$app_url/actuator/prometheus")"
printf '%s\n' "$metrics" | grep --quiet 'http_server_requests_seconds_count' || {
  echo "Expected HTTP request metrics were not exposed." >&2
  exit 1
}

echo "PASS: application image started, connected to MySQL, and exposed Prometheus HTTP metrics."
