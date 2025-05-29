# Get the full path of the current script
$currentDirUnlinked = (Get-Item -Path $MyInvocation.MyCommand.Path).FullName
$currentDir = Split-Path -Path $currentDirUnlinked -Parent

# Display a message indicating the start of the build process
Write-Host "Building release..."

# Set the environment variable for the Vue CLI service configuration path
$env:VUE_CLI_SERVICE_CONFIG_PATH = "$currentDir\gwsse-app\vue.config.build.js"

# Execute the Vue CLI service build command
# Using Start-Process to run the command in a new process
Start-Process -FilePath "npx" -ArgumentList "vue-cli-service build" -Wait

# Display a message indicating the successful completion of the build process
Write-Host "Success building release!"
