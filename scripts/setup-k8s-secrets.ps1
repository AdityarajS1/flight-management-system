$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env'
$namespace = if ($env:K8S_NAMESPACE) { $env:K8S_NAMESPACE } else { 'flight-management' }

if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Missing $envPath. Create it from .env.example before configuring Kubernetes."
}

$settings = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -match '^([A-Z0-9_]+)=(.*)$') {
        $settings[$matches[1]] = $matches[2]
    }
}

if (-not $settings['DB_ROOT_PASSWORD']) {
    $bytes = New-Object byte[] 32
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $random.GetBytes($bytes)
    }
    finally {
        $random.Dispose()
    }
    $settings['DB_ROOT_PASSWORD'] = [System.BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
    $updatedLines = @(Get-Content -LiteralPath $envPath) + "DB_ROOT_PASSWORD=$($settings['DB_ROOT_PASSWORD'])"
    [System.IO.File]::WriteAllText(
        $envPath,
        (($updatedLines -join "`n") + "`n"),
        (New-Object System.Text.UTF8Encoding($false))
    )
}

foreach ($name in @('DB_PASSWORD', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'GRAFANA_ADMIN_PASSWORD')) {
    if (-not $settings[$name] -or $settings[$name] -match '^replace-with-') {
        throw "Set a real local value for $name in .env before continuing."
    }
}

if ($settings['DB_PASSWORD'].Length -lt 16 -or
    $settings['DB_ROOT_PASSWORD'].Length -lt 16 -or
    $settings['JWT_SECRET'].Length -lt 32 -or
    $settings['ADMIN_PASSWORD'].Length -lt 12 -or
    $settings['GRAFANA_ADMIN_PASSWORD'].Length -lt 12) {
    throw 'DB passwords, JWT secret, admin password, or Grafana password do not meet the required minimum length.'
}

$context = & kubectl config current-context
if ($LASTEXITCODE -ne 0 -or $context -ne 'docker-desktop') {
    throw 'Select the docker-desktop Kubernetes context before creating the local demo secrets.'
}

& kubectl get nodes --no-headers | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'The docker-desktop Kubernetes cluster is not reachable.'
}

& kubectl get storageclass standard | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'The cluster has no standard StorageClass for the MySQL volume.'
}

$namespaceYaml = & kubectl create namespace $namespace --dry-run=client --output=yaml
if ($LASTEXITCODE -ne 0) {
    throw "Could not render namespace $namespace."
}
$namespaceYaml | & kubectl apply --filename=-
if ($LASTEXITCODE -ne 0) {
    throw "Could not create namespace $namespace."
}

$applicationSecretArguments = @(
    'create', 'secret', 'generic', 'flight-management-secrets',
    '--namespace', $namespace,
    '--from-literal=DB_URL=jdbc:mysql://flight-management-db:3306/flight_management',
    '--from-literal=DB_USERNAME=flight_app',
    "--from-literal=DB_PASSWORD=$($settings['DB_PASSWORD'])",
    "--from-literal=DB_ROOT_PASSWORD=$($settings['DB_ROOT_PASSWORD'])",
    "--from-literal=JWT_SECRET=$($settings['JWT_SECRET'])",
    "--from-literal=ADMIN_EMAIL=$($settings['ADMIN_EMAIL'])",
    "--from-literal=ADMIN_PASSWORD=$($settings['ADMIN_PASSWORD'])"
)
$applicationSecretYaml = & kubectl @applicationSecretArguments --dry-run=client --output=yaml
if ($LASTEXITCODE -ne 0) {
    throw 'Could not render the application secret.'
}
$applicationSecretYaml | & kubectl apply --filename=-
if ($LASTEXITCODE -ne 0) {
    throw 'Could not apply the application secret.'
}

$grafanaSecretArguments = @(
    'create', 'secret', 'generic', 'grafana-admin-credentials',
    '--namespace', $namespace,
    "--from-literal=admin-password=$($settings['GRAFANA_ADMIN_PASSWORD'])"
)
$grafanaSecretYaml = & kubectl @grafanaSecretArguments --dry-run=client --output=yaml
if ($LASTEXITCODE -ne 0) {
    throw 'Could not render the Grafana secret.'
}
$grafanaSecretYaml | & kubectl apply --filename=-
if ($LASTEXITCODE -ne 0) {
    throw 'Could not apply the Grafana secret.'
}

Write-Host "Kubernetes secrets are configured in namespace '$namespace'. Secret values were not displayed."
