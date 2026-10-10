# Dot-source only for the Next.js server process or approved deployment setup.
$ErrorActionPreference = 'Stop'
$path = Join-Path $env:LOCALAPPDATA 'UclNative/server-secrets/transaction-pin.xml'
$secret = Import-Clixml -LiteralPath $path
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret.Pepper)
try { $env:TRANSACTION_PIN_PEPPER = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
Write-Output 'Server PIN secret loaded for this process; it must never be passed to the Android build.'
