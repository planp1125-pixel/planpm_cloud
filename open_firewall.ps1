
Write-Host "Opening Firewall Ports for Plan-PM Local Access..." -ForegroundColor Cyan

$ports = @(9002, 54321, 54322, 54323, 54324, 54325)
$ruleName = "PlanPM-Local-Access"

# Check if rule exists, delete if so to refresh
$exists = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($exists) {
    Remove-NetFirewallRule -DisplayName $ruleName
    Write-Host "Removed old firewall rule."
}

# Create new rule
New-NetFirewallRule -DisplayName $ruleName `
    -Direction Inbound `
    -LocalPort $ports `
    -Protocol TCP `
    -Action Allow `
    -Profile Any

Write-Host "Success! Ports opened: $($ports -join ', ')" -ForegroundColor Green
Write-Host "You should now be able to access the app from other devices."
