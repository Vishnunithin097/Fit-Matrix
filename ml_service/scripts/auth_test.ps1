$u = 'test.' + [guid]::NewGuid().ToString() + '@example.com'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Write-Output "Registering: $u"
try {
  $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/register' -Method POST -Body (ConvertTo-Json @{ email = $u; password = 'TestPass123!'; fullName = 'Automated Test' }) -ContentType 'application/json' -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Register status: $($r.StatusCode)"
  Write-Output $r.Content

  $r2 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/login' -Method POST -Body (ConvertTo-Json @{ email = $u; password = 'TestPass123!'; rememberMe = $true }) -ContentType 'application/json' -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Login status: $($r2.StatusCode)"
  Write-Output $r2.Content

  $r3 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/me' -Method GET -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Me status: $($r3.StatusCode)"
  Write-Output $r3.Content
} catch {
  Write-Output "ERROR: $_"
}
