#!/usr/bin/env bash
set -euo pipefail

namespace="${1:-flight-management}"
deployment="flight-management"
prometheus_service="prometheus"
prometheus_port=19090
original_replicas="$(kubectl get deployment "$deployment" --namespace "$namespace" \
  --output=jsonpath='{.spec.replicas}')"

if [[ -z "$original_replicas" || "$original_replicas" -lt 1 ]]; then
  echo "The application deployment must have at least one replica before the demo." >&2
  exit 1
fi

kubectl port-forward --namespace "$namespace" "service/$prometheus_service" \
  "$prometheus_port:9090" >/tmp/flight-management-prometheus-port-forward.log 2>&1 &
port_forward_pid=$!

restore_application() {
  kubectl scale deployment "$deployment" --namespace "$namespace" \
    --replicas="$original_replicas" >/dev/null || true
  kubectl rollout status deployment "$deployment" --namespace "$namespace" \
    --timeout=180s || true
  kill "$port_forward_pid" 2>/dev/null || true
}
trap restore_application EXIT

for _ in $(seq 1 30); do
  if curl --fail --silent "http://127.0.0.1:${prometheus_port}/-/ready" >/dev/null; then
    break
  fi
  sleep 1
done
curl --fail --silent "http://127.0.0.1:${prometheus_port}/-/ready" >/dev/null || {
  echo "Prometheus port-forward did not become ready." >&2
  exit 1
}

echo "Scaling the application to zero; Prometheus should fire FlightManagementDown."
kubectl scale deployment "$deployment" --namespace "$namespace" --replicas=0

for _ in $(seq 1 90); do
  result="$(curl --fail --silent --get \
    --data-urlencode 'query=ALERTS{alertname="FlightManagementDown",alertstate="firing"}' \
    "http://127.0.0.1:${prometheus_port}/api/v1/query")"
  if printf '%s' "$result" | jq --exit-status '.data.result | length > 0' >/dev/null; then
    echo "PASS: Prometheus fired FlightManagementDown."
    echo "Open Grafana's Flight Management Reliability dashboard to observe availability drop."
    exit 0
  fi
  sleep 2
done

echo "Prometheus did not fire FlightManagementDown within 180 seconds." >&2
exit 1
