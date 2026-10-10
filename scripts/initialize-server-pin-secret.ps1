$ErrorActionPreference = 'Stop'
$directory = Join-Path $env:LOCALAPPDATA 'UclNative/server-secrets'
$path = Join-Path $directory 'transaction-pin.xml'
if (Test-Path -LiteralPath $path) { Write-Output 'Existing protected PIN secret preserved.'; return }
New-Item -ItemType Directory -Path $directory -Force | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$acl = Get-Acl -LiteralPath $directory
$acl.SetAccessRuleProtection($true, $false)
$acl.SetAccessRule([Security.AccessControl.FileSystemAccessRule]::new($identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'))
Set-Acl -LiteralPath $directory -AclObject $acl
$bytes = New-Object byte[] 48
$generator = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $generator.GetBytes($bytes)
    [pscustomobject]@{ Pepper = (ConvertTo-SecureString ([Convert]::ToBase64String($bytes)) -AsPlainText -Force) } |
        Export-Clixml -LiteralPath $path
} finally { $generator.Dispose(); [Array]::Clear($bytes, 0, $bytes.Length) }
Write-Output ('Server PIN secret created under Windows user protection: ' + $path)
Write-Output 'Back up this secret through an approved password manager before deploying PIN hashes. It is not an Android build input.'
