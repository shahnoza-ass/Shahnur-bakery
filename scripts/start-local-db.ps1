$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$localDir = Join-Path $projectRoot '.local'
$databaseDir = Join-Path $localDir 'mongodb'
New-Item -ItemType Directory -Path $databaseDir -Force | Out-Null
$mongoCommand = Get-Command mongod -ErrorAction SilentlyContinue
if ($mongoCommand) {
    $mongoBinary = $mongoCommand.Source
} else {
    $mongoBinary = 'C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe'
}
if (-not (Test-Path -LiteralPath $mongoBinary)) {
    throw 'mongod topilmadi. MongoDB o‘rnating yoki README dagi Docker usulidan foydalaning.'
}
$logPath = Join-Path $localDir 'mongodb.log'
$mongoArgs = @('--dbpath', ('"' + $databaseDir + '"'), '--logpath', ('"' + $logPath + '"'), '--logappend', '--replSet', 'bakery-rs', '--bind_ip', '127.0.0.1', '--port', '27018')
$existing = Get-NetTCPConnection -LocalPort 27018 -State Listen -ErrorAction SilentlyContinue
if (-not $existing) {
    $mongoProcess = Start-Process -FilePath $mongoBinary -ArgumentList $mongoArgs -WindowStyle Hidden -PassThru
    Set-Content -LiteralPath (Join-Path $localDir 'mongodb.pid') -Value $mongoProcess.Id
}
node (Join-Path $PSScriptRoot 'setup-local-db.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Mahalliy bazani tayyorlash tugallanmadi.' }
node (Join-Path $PSScriptRoot 'migrate-local-indexes.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Mahalliy indeks migratsiyasi tugallanmadi.' }
