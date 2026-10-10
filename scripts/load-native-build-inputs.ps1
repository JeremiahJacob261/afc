param(
    [string]$ConfigurationPath = (Join-Path $env:LOCALAPPDATA 'UclNative/build-inputs.json'),
    [string]$SigningDirectory = (Join-Path $env:LOCALAPPDATA 'UclNative/signing')
)
# Dot-source this script in the same PowerShell process that invokes Gradle.
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ConfigurationPath)) { throw 'Native build configuration has not been prepared.' }
$configuration = Get-Content -LiteralPath $ConfigurationPath -Raw | ConvertFrom-Json
$allowedNames = @('UCL_API_BASE_URL','UCL_SUPABASE_URL','UCL_SUPABASE_ANON_KEY',
    'UCL_FIREBASE_APP_ID','UCL_FIREBASE_API_KEY','UCL_FIREBASE_PROJECT_ID','UCL_FIREBASE_SENDER_ID',
    'UCL_DEV_API_BASE_URL','UCL_DEV_SUPABASE_URL','UCL_DEV_SUPABASE_ANON_KEY',
    'UCL_DEV_FIREBASE_APP_ID','UCL_DEV_FIREBASE_API_KEY','UCL_DEV_FIREBASE_PROJECT_ID','UCL_DEV_FIREBASE_SENDER_ID')
foreach ($property in $configuration.PSObject.Properties) {
    if ($property.Name -notin $allowedNames) { throw ('Unexpected native configuration field: ' + $property.Name) }
    [Environment]::SetEnvironmentVariable($property.Name, [string]$property.Value, 'Process')
}
$credentialsPath = Join-Path $SigningDirectory 'credentials.xml'
if (Test-Path -LiteralPath $credentialsPath) {
    $signing = Import-Clixml -LiteralPath $credentialsPath
    $env:EFC_RELEASE_STORE_FILE = $signing.StoreFile
    $env:EFC_RELEASE_KEY_ALIAS = $signing.KeyAlias
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($signing.Password)
    try {
        $env:EFC_RELEASE_STORE_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        $env:EFC_RELEASE_KEY_PASSWORD = $env:EFC_RELEASE_STORE_PASSWORD
    } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
Write-Output 'Native build inputs loaded for this process; no server key is loaded into the Android build.'
