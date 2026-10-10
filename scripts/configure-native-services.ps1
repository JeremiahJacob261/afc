param(
    [Parameter(Mandatory = $true)][ValidatePattern('^1:[0-9]+:android:[a-f0-9]+$')][string]$FirebaseAppId,
    [Parameter(Mandatory = $true)][string]$FirebaseApiKey,
    [string]$ApiBaseUrl = 'https://www.europeanfc01.com',
    [string]$FirebaseProjectId = 'atalanta-77824',
    [string]$FirebaseSenderId = '99712962887'
)
$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$publicInputs = @{}
foreach ($line in [IO.File]::ReadAllLines((Join-Path $repositoryRoot '.env'))) {
    if ($line -match '^\s*(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY)\s*=\s*(.*?)\s*$') {
        $publicInputs[$Matches[1]] = $Matches[2].Trim('"', "'")
    }
}
if (-not $publicInputs.NEXT_PUBLIC_SUPABASE_URL -or -not $publicInputs.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw 'Existing public Supabase configuration is missing.'
}
$clientKey = $publicInputs.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (-not $clientKey.StartsWith('sb_publishable_')) {
    $keyParts = $clientKey.Split('.')
    if ($keyParts.Length -ne 3) { throw 'Only a public Supabase client key can be configured.' }
    $payload = $keyParts[1].Replace('-', '+').Replace('_', '/')
    $payload = $payload.PadRight($payload.Length + ((4 - $payload.Length % 4) % 4), '=')
    $claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
    if ($claims.role -ne 'anon') { throw 'A server Supabase key must never enter the Android build.' }
}
if ([uri]$ApiBaseUrl -and ([uri]$ApiBaseUrl).Scheme -ne 'https') { throw 'Native API must use HTTPS.' }
$configuration = [ordered]@{
    UCL_API_BASE_URL = $ApiBaseUrl
    UCL_SUPABASE_URL = $publicInputs.NEXT_PUBLIC_SUPABASE_URL
    UCL_SUPABASE_ANON_KEY = $publicInputs.NEXT_PUBLIC_SUPABASE_ANON_KEY
    UCL_FIREBASE_APP_ID = $FirebaseAppId
    UCL_FIREBASE_API_KEY = $FirebaseApiKey
    UCL_FIREBASE_PROJECT_ID = $FirebaseProjectId
    UCL_FIREBASE_SENDER_ID = $FirebaseSenderId
}
# Development deliberately uses the approved existing service for read-only integration.
# Supply a separately registered Firebase app for development before push delivery checks.
$configuration.UCL_DEV_API_BASE_URL = $ApiBaseUrl
$configuration.UCL_DEV_SUPABASE_URL = $publicInputs.NEXT_PUBLIC_SUPABASE_URL
$configuration.UCL_DEV_SUPABASE_ANON_KEY = $publicInputs.NEXT_PUBLIC_SUPABASE_ANON_KEY
$configurationDirectory = Join-Path $env:LOCALAPPDATA 'UclNative'
New-Item -ItemType Directory -Path $configurationDirectory -Force | Out-Null
$configurationPath = Join-Path $configurationDirectory 'build-inputs.json'
[IO.File]::WriteAllText($configurationPath, ($configuration | ConvertTo-Json) + "`n", [Text.UTF8Encoding]::new($false))
Write-Output ('Public native service configuration saved outside the repository: ' + $configurationPath)
