param([string]$SigningDirectory = (Join-Path $env:LOCALAPPDATA 'UclNative/signing'))
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This signing setup uses Windows user protection.' }
$SigningDirectory = [IO.Path]::GetFullPath($SigningDirectory)
$keystore = Join-Path $SigningDirectory 'ucl-release.p12'
$credentials = Join-Path $SigningDirectory 'credentials.xml'
if (Test-Path -LiteralPath $credentials) {
    if (-not (Test-Path -LiteralPath $keystore)) { throw 'Protected credentials exist but the signing key is missing. Restore its backup.' }
    Write-Output ('Existing signing key preserved: ' + $keystore)
    return
}
if (Test-Path -LiteralPath $keystore) { throw 'A signing key already exists without its credentials. Do not replace it.' }
New-Item -ItemType Directory -Path $SigningDirectory -Force | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$acl = Get-Acl -LiteralPath $SigningDirectory
$acl.SetAccessRuleProtection($true, $false)
$acl.SetAccessRule([Security.AccessControl.FileSystemAccessRule]::new($identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'))
Set-Acl -LiteralPath $SigningDirectory -AclObject $acl
$randomBytes = New-Object byte[] 48
$generator = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $generator.GetBytes($randomBytes) } finally { $generator.Dispose() }
$password = [Convert]::ToBase64String($randomBytes)
$previousPassword = $env:UCL_KEYTOOL_PASSWORD
try {
    $env:UCL_KEYTOOL_PASSWORD = $password
    & keytool '-genkeypair' '-storetype' 'PKCS12' '-keystore' $keystore '-alias' 'ucl-release' '-keyalg' 'RSA' '-keysize' '3072' '-validity' '10000' '-dname' 'CN=ucl Android Release' '-storepass:env' 'UCL_KEYTOOL_PASSWORD' '-keypass:env' 'UCL_KEYTOOL_PASSWORD' '-noprompt'
    if ($LASTEXITCODE -ne 0) { throw 'Signing key generation failed.' }
    [pscustomobject]@{
        StoreFile = $keystore
        KeyAlias = 'ucl-release'
        Password = (ConvertTo-SecureString $password -AsPlainText -Force)
    } | Export-Clixml -LiteralPath $credentials
} finally {
    $env:UCL_KEYTOOL_PASSWORD = $previousPassword
    $password = $null
    [Array]::Clear($randomBytes, 0, $randomBytes.Length)
}
Write-Output ('Signing key created: ' + $keystore)
Write-Output 'Credentials are protected for this Windows user. Back up the key and export its password through an approved password manager before distribution.'
