$ErrorActionPreference = 'Stop'
$configurationPath = Join-Path $env:LOCALAPPDATA 'UclNative/build-inputs.json'
if (Test-Path -LiteralPath $configurationPath) { . (Join-Path $PSScriptRoot 'load-native-build-inputs.ps1') }
$nativeProject = Join-Path (Split-Path -Parent $PSScriptRoot) 'android/native'
Push-Location -LiteralPath $nativeProject
try {
    & '.\gradlew.bat' '--console=plain' '--max-workers=2' 'assembleDevelopmentDebug' 'assembleProductionDebug'
    if ($LASTEXITCODE -ne 0) { throw 'Native debug build failed.' }
} finally { Pop-Location }
