<#
.SYNOPSIS
Creates the PostgreSQL database and tables for the coin-iq application based on the schema scripts.
#>

$ErrorActionPreference = "Continue"

$EnvFilePath = Join-Path $PSScriptRoot "coin-iq\.env.local"
$DbUser = "postgres"
$DbHost = "localhost"
$DbName = "coin_iq"
$DbPassword = "123"
$DbPort = "5432"

# Parse .env.local if it exists
if (Test-Path $EnvFilePath) {
    Write-Host "Reading database configuration from $EnvFilePath"
    $envContent = Get-Content $EnvFilePath
    foreach ($line in $envContent) {
        if ($line -match "^DB_USER=(.*)$") { $DbUser = $matches[1].Trim() }
        if ($line -match "^DB_HOST=(.*)$") { $DbHost = $matches[1].Trim() }
        if ($line -match "^DB_NAME=(.*)$") { $DbName = $matches[1].Trim() }
        if ($line -match "^DB_PASSWORD=(.*)$") { $DbPassword = $matches[1].Trim() }
        if ($line -match "^DB_PORT=(.*)$") { $DbPort = $matches[1].Trim() }
    }
} else {
    Write-Host "Could not find .env.local, using default values."
}

# Set PGPASSWORD environment variable for psql authentication
$env:PGPASSWORD = $DbPassword

# Check if psql is in PATH
if (-not (Get-Command "psql" -ErrorAction SilentlyContinue)) {
    Write-Error "psql is not recognized as a command. Please ensure PostgreSQL is installed and added to your system PATH."
    exit 1
}

Write-Host "Connecting to PostgreSQL to ensure database '$DbName' exists..."
$dbExists = psql -U $DbUser -h $DbHost -p $DbPort -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$DbName'"

if (-not $dbExists -or $dbExists.Trim() -ne "1") {
    Write-Host "Database '$DbName' does not exist. Creating..."
    psql -U $DbUser -h $DbHost -p $DbPort -d postgres -c "CREATE DATABASE `"$DbName`";"
    Write-Host "Database '$DbName' created successfully."
} else {
    Write-Host "Database '$DbName' already exists."
}

# The schema files to execute in order
$Schemas = @(
    "coin-iq\src\lib\schema.sql",
    "coin-iq\src\lib\lms-schema.sql",
    "coin-iq\src\lib\lms-schema-v2.sql",
    "coin-iq\src\lib\predictions-schema.sql"
)

foreach ($schema in $Schemas) {
    $schemaPath = Join-Path $PSScriptRoot $schema
    if (Test-Path $schemaPath) {
        Write-Host "Executing schema script: $schema"
        psql -U $DbUser -h $DbHost -p $DbPort -d $DbName -f $schemaPath
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to execute $schema. Continuing to next file..."
        } else {
            Write-Host "Successfully executed $schema"
        }
    } else {
        Write-Warning "Schema file not found: $schemaPath"
    }
}

Write-Host "Database table creation process completed!"
# Remove PGPASSWORD environment variable
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
