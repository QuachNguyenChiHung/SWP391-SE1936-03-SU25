$ConnectionString = "Server=localhost;Database=DataLabelingSupportSystem;User Id=sa;Password=12345;TrustServerCertificate=True"

# Create a SQL connection
$SqlConnection = New-Object System.Data.SqlClient.SqlConnection
$SqlConnection.ConnectionString = $ConnectionString

try {
    $SqlConnection.Open()
    
    # Check if SpecializeIn column exists in User table
    $Query = @"
SELECT COUNT(*) as [Count] 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'User' AND COLUMN_NAME = 'SpecializeIn'
"@
    
    $SqlCommand = New-Object System.Data.SqlClient.SqlCommand($Query, $SqlConnection)
    $Result = $SqlCommand.ExecuteScalar()
    Write-Host "SpecializeIn column exists in User table: $($Result -gt 0)"
    
    # Check if AnnotatorDeadlineUtc column exists in TaskItem table
    $Query = @"
SELECT COUNT(*) as [Count] 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'TaskItem' AND COLUMN_NAME = 'AnnotatorDeadlineUtc'
"@
    
    $SqlCommand = New-Object System.Data.SqlClient.SqlCommand($Query, $SqlConnection)
    $Result = $SqlCommand.ExecuteScalar()
    Write-Host "AnnotatorDeadlineUtc column exists in TaskItem table: $($Result -gt 0)"
    
    # Check if ReviewerDeadlineUtc column exists in DataItem table
    $Query = @"
SELECT COUNT(*) as [Count] 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'DataItem' AND COLUMN_NAME = 'ReviewerDeadlineUtc'
"@
    
    $SqlCommand = New-Object System.Data.SqlClient.SqlCommand($Query, $SqlConnection)
    $Result = $SqlCommand.ExecuteScalar()
    Write-Host "ReviewerDeadlineUtc column exists in DataItem table: $($Result -gt 0)"
    
    # Check if Comments table exists
    $Query = @"
SELECT COUNT(*) as [Count] 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'Comment'
"@
    
    $SqlCommand = New-Object System.Data.SqlClient.SqlCommand($Query, $SqlConnection)
    $Result = $SqlCommand.ExecuteScalar()
    Write-Host "Comment table exists: $($Result -gt 0)"
    
    # Check applied migrations
    $Query = @"
SELECT MigrationId FROM [__EFMigrationsHistory] 
WHERE MigrationId LIKE '202603%' 
ORDER BY MigrationId DESC
"@
    
    $SqlCommand = New-Object System.Data.SqlClient.SqlCommand($Query, $SqlConnection)
    $Reader = $SqlCommand.ExecuteReader()
    Write-Host "`nApplied migrations (March 2026):"
    while ($Reader.Read()) {
        Write-Host "  - $($Reader['MigrationId'])"
    }
    $Reader.Close()
    
    Write-Host "`nDetailed Column Check:"
    $Query = @"
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('User', 'TaskItem', 'DataItem', 'Comment')
ORDER BY TABLE_NAME, ORDINAL_POSITION
"@

    $SqlCommand = New-Object System.Data.SqlClient.SqlCommand($Query, $SqlConnection)
    $Reader = $SqlCommand.ExecuteReader()
    while ($Reader.Read()) {
        $table = $Reader['TABLE_NAME']
        $col = $Reader['COLUMN_NAME']
        $type = $Reader['DATA_TYPE']
        $nullable = $Reader['IS_NULLABLE']
        Write-Host "  $table.$col ($type, Nullable: $nullable)"
    }
    $Reader.Close()

} finally {
    $SqlConnection.Close()
}
