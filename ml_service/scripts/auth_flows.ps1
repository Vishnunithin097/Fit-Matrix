# Automated auth flows: register -> login -> forgot-password (set new) -> login with new -> onboard -> logout -> verify
$u = 'test.' + [guid]::NewGuid().ToString() + '@example.com'
$pwd = 'TestPass123!'
$newPwd = 'NewPass123!'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Write-Output "Registering: $u"
try {
  $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/register' -Method POST -Body (ConvertTo-Json @{ email = $u; password = $pwd; fullName = 'Auth Flow Test' }) -ContentType 'application/json' -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Register status: $($r.StatusCode)"
  Write-Output $r.Content

  Write-Output "Logging in with initial password"
  $r2 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/login' -Method POST -Body (ConvertTo-Json @{ email = $u; password = $pwd; rememberMe = $true }) -ContentType 'application/json' -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Login status: $($r2.StatusCode)"
  Write-Output $r2.Content

  Write-Output "Calling forgot-password to set a new password"
  $rf = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/forgot-password' -Method POST -Body (ConvertTo-Json @{ email = $u; newPassword = $newPwd }) -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
  Write-Output "Forgot-password status: $($rf.StatusCode)"
  Write-Output $rf.Content

  Write-Output "Logging in with new password"
  $r3 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/login' -Method POST -Body (ConvertTo-Json @{ email = $u; password = $newPwd; rememberMe = $true }) -ContentType 'application/json' -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Login (new) status: $($r3.StatusCode)"
  Write-Output $r3.Content

  Write-Output "Calling onboarding"
  $onboardPayload = @{
    full_name = 'Auth Flow Test'
    age = 28
    gender = 'Male'
    height = 175
    weight = 72
    fitness_goal = 'Muscle Gain'
    food_preference = 'Non-Vegetarian'
    region_preference = 'South'
    activity_level = 'Active'
    add_egg_today = $true
    today_veg_only = $false
  }
  $ron = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/onboard' -Method POST -Body (ConvertTo-Json $onboardPayload) -ContentType 'application/json' -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Onboard status: $($ron.StatusCode)"
  Write-Output $ron.Content

  Write-Output "Fetch profile after onboarding"
  $rme = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/me' -Method GET -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Me status: $($rme.StatusCode)"
  Write-Output $rme.Content

  Write-Output "Logging out (progressPercentage=80)"
  $rl = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/logout' -Method POST -Body (ConvertTo-Json @{ progressPercentage = 80 }) -ContentType 'application/json' -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Output "Logout status: $($rl.StatusCode)"
  Write-Output $rl.Content

  Write-Output "Verify /api/auth/me after logout (expected 401)"
  try {
    $rme2 = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/auth/me' -Method GET -WebSession $session -UseBasicParsing -ErrorAction Stop
    Write-Output "Me post-logout status: $($rme2.StatusCode)"
    Write-Output $rme2.Content
  } catch {
    Write-Output "Me post-logout returned error as expected: $_"
  }

} catch {
  Write-Output "ERROR: $_"
}
