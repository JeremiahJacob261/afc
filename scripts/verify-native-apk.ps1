param(
    [Parameter(Mandatory = $true)][string]$ApkPath,
    [string]$ExpectedCertificateSha256,
    [string]$SdkDirectory = $(if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android/Sdk' })
)
$ErrorActionPreference = 'Stop'
$buildTools = Get-ChildItem -LiteralPath (Join-Path $SdkDirectory 'build-tools') -Directory |
    Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
if (-not $buildTools) { throw 'Android SDK build tools are missing.' }
$signer = Join-Path $buildTools.FullName 'apksigner.bat'
$signatureOutput = & $signer 'verify' '--print-certs' $ApkPath
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
$certificateLine = $signatureOutput | Where-Object { $_ -match '^Signer #1 certificate SHA-256 digest:' } | Select-Object -First 1
if (-not $certificateLine) { throw 'APK signing certificate was not found.' }
$certificateHash = ($certificateLine -split ':', 2)[1].Trim().ToLowerInvariant()
if ($ExpectedCertificateSha256 -and $certificateHash -ne $ExpectedCertificateSha256.Replace(':','').ToLowerInvariant()) {
    throw 'APK signing identity does not match the expected release certificate.'
}
Write-Output ('Verified APK signature: ' + $certificateHash)
Write-Output ('APK SHA-256: ' + (Get-FileHash -LiteralPath $ApkPath -Algorithm SHA256).Hash.ToLowerInvariant())
