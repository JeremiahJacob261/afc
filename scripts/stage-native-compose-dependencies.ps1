param([string]$RepositoryPath = (Join-Path $env:LOCALAPPDATA 'UclNative/maven'))
# Optional transport fallback for a JVM TLS failure. All files come from Maven Central.
$ErrorActionPreference = 'Stop'
$modules = @(
    @{ Group = 'org.jetbrains.kotlin'; Name = 'compose-group-mapping'; Version = '2.4.10' },
    @{ Group = 'org.jetbrains.kotlin'; Name = 'kotlin-stdlib'; Version = '2.2.21' },
    @{ Group = 'org.ow2.asm'; Name = 'asm-tree'; Version = '9.9.1' },
    @{ Group = 'org.ow2.asm'; Name = 'asm'; Version = '9.9.1' },
    @{ Group = 'org.ow2'; Name = 'ow2'; Version = '1.5.1'; PomOnly = $true }
)
foreach ($module in $modules) {
    $relativeDirectory = $module.Group.Replace('.', '/') + '/' + $module.Name + '/' + $module.Version
    $directory = Join-Path $RepositoryPath $relativeDirectory
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    $extensions = if ($module.PomOnly) { @('pom') } else { @('pom', 'jar') }
    foreach ($extension in $extensions) {
        $filename = $module.Name + '-' + $module.Version + '.' + $extension
        $destination = Join-Path $directory $filename
        $url = 'https://repo.maven.apache.org/maven2/' + $relativeDirectory + '/' + $filename
        if ((Test-Path -LiteralPath $destination) -and (Test-Path -LiteralPath ($destination + '.sha1'))) {
            $cachedExpected = ([IO.File]::ReadAllText($destination + '.sha1')).Trim().ToLowerInvariant()
            $cachedActual = (Get-FileHash -LiteralPath $destination -Algorithm SHA1).Hash.ToLowerInvariant()
            if ($cachedExpected -match '^[a-f0-9]{40}$' -and $cachedExpected -eq $cachedActual) { continue }
        }
        & curl.exe '-fsS' '--retry' '2' '--retry-all-errors' '--retry-delay' '1' '--max-time' '20' $url '-o' ($destination + '.partial')
        if ($LASTEXITCODE -ne 0) { throw ('Official dependency download failed: ' + $filename) }
        & curl.exe '-fsS' '--retry' '2' '--retry-all-errors' '--retry-delay' '1' '--max-time' '20' ($url + '.sha1') '-o' ($destination + '.sha1')
        if ($LASTEXITCODE -ne 0) { throw ('Published checksum download failed: ' + $filename) }
        $expected = ([IO.File]::ReadAllText($destination + '.sha1')).Trim().ToLowerInvariant()
        $actual = (Get-FileHash -LiteralPath ($destination + '.partial') -Algorithm SHA1).Hash.ToLowerInvariant()
        if ($expected -notmatch '^[a-f0-9]{40}$' -or $actual -ne $expected) { throw ('Dependency checksum mismatch: ' + $filename) }
        Move-Item -LiteralPath ($destination + '.partial') -Destination $destination -Force
    }
    Write-Output ('Verified Maven Central dependency: ' + $module.Name + ':' + $module.Version)
}
Write-Output ('Use -DependencyRepository "' + [IO.Path]::GetFullPath($RepositoryPath) + '" with the native release helper.')
