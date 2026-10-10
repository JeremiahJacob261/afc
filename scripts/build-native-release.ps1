param(
    [Parameter(Mandatory = $true)][ValidateRange(1, 2147483647)][int]$VersionCode,
    [Parameter(Mandatory = $true)][ValidatePattern('^[0-9]+\.[0-9]+\.[0-9]+$')][string]$VersionName,
    [Parameter(Mandatory = $true)][uri]$DownloadUrl,
    [string]$DependencyRepository,
    [switch]$EnableMinification
)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($env:UCL_API_BASE_URL) -and
    (Test-Path -LiteralPath (Join-Path $env:LOCALAPPDATA 'UclNative/build-inputs.json'))) {
    . (Join-Path $PSScriptRoot 'load-native-build-inputs.ps1')
}
if ($DownloadUrl.Scheme -ne 'https' -or $DownloadUrl.UserInfo -or $DownloadUrl.Query -or $DownloadUrl.Fragment -or
    -not $DownloadUrl.AbsolutePath.EndsWith('.apk')) {
    throw 'DownloadUrl must be a public HTTPS APK URL without credentials, query or fragment.'
}
$requiredInputs = @('UCL_API_BASE_URL', 'UCL_SUPABASE_URL', 'UCL_SUPABASE_ANON_KEY',
    'UCL_FIREBASE_APP_ID', 'UCL_FIREBASE_API_KEY', 'UCL_FIREBASE_PROJECT_ID', 'UCL_FIREBASE_SENDER_ID',
    'EFC_RELEASE_STORE_FILE', 'EFC_RELEASE_STORE_PASSWORD', 'EFC_RELEASE_KEY_ALIAS', 'EFC_RELEASE_KEY_PASSWORD')
foreach ($requiredInput in $requiredInputs) {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($requiredInput))) {
        throw ('Missing protected build input: ' + $requiredInput)
    }
}
$apiOrigin = [uri]$env:UCL_API_BASE_URL
if ($apiOrigin.Scheme -ne 'https' -or $apiOrigin.GetLeftPart([UriPartial]::Authority) -ne $DownloadUrl.GetLeftPart([UriPartial]::Authority)) {
    throw 'The APK download must be hosted on the configured HTTPS API origin.'
}
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$nativeProject = Join-Path $repositoryRoot 'android/native'
Push-Location -LiteralPath $nativeProject
try {
    $buildArguments = @('--console=plain', '--max-workers=2', "-PuclVersionCode=$VersionCode", "-PuclVersionName=$VersionName")
    if ($EnableMinification) { $buildArguments += '-PuclMinifyRelease=true' }
    if ($DependencyRepository) { $buildArguments += ('-PuclDependencyRepository=' + [IO.Path]::GetFullPath($DependencyRepository)) }
    & '.\gradlew.bat' @buildArguments 'assembleProductionRelease'
    if ($LASTEXITCODE -ne 0) { throw 'Native release build failed.' }
} finally { Pop-Location }
$builtApk = Join-Path $nativeProject 'app/build/outputs/apk/production/release/app-production-release.apk'
if (-not (Test-Path -LiteralPath $builtApk -PathType Leaf)) { throw 'Signed production APK was not generated.' }
$metadataPath = Join-Path (Split-Path -Parent $builtApk) 'output-metadata.json'
$metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
if ($metadata.applicationId -ne 'com.pro.uclfootball' -or $metadata.elements.Count -ne 1 -or
    $metadata.elements[0].versionCode -ne $VersionCode -or $metadata.elements[0].versionName -ne $VersionName) {
    throw 'Generated APK identity or version does not match this release.'
}
& (Join-Path $PSScriptRoot 'verify-native-apk.ps1') -ApkPath $builtApk
$artifactDirectory = Join-Path $repositoryRoot 'artifacts/native'
New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
$releaseApk = Join-Path $artifactDirectory "ucl-$VersionName-$VersionCode.apk"
Copy-Item -LiteralPath $builtApk -Destination $releaseApk
$manifest = [ordered]@{
    applicationId = 'com.pro.uclfootball'
    versionCode = $VersionCode
    versionName = $VersionName
    downloadUrl = $DownloadUrl.AbsoluteUri
    sha256 = (Get-FileHash -LiteralPath $releaseApk -Algorithm SHA256).Hash.ToLowerInvariant()
}
$manifestPath = Join-Path $artifactDirectory "release-$VersionCode.json"
[System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json) + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Output ('APK prepared: ' + $releaseApk)
Write-Output ('Manifest prepared: ' + $manifestPath)
Write-Output 'Publishing and device installation/upgrade verification remain separate release steps.'
