#!/bin/bash
# Fetch JSON data from the API
response=$(curl -s http://localhost:3001/api/backend-url)

# Extract the value of backendUrl using jq
backendUrl=$(echo $response | jq -r '.backendUrl')

# Check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq is not installed. Please install jq to continue."
    exit 1
fi

# Print extracted backendUrl
echo "Extracted backendUrl: $backendUrl"

# Update the .env file
# Create .env file if it does not exist
touch .env

# Check if REACT_APP_CONSUL_URL exists in the .env file
if grep -q "REACT_APP_CONSUL_URL=" .env; then
    # Update the existing value
    sed -i.bak "s|^REACT_APP_CONSUL_URL=.*|REACT_APP_CONSUL_URL=$backendUrl|g" .env
else
    # Add the new value
    echo "REACT_APP_CONSUL_URL=$backendUrl" >> .env
fi

echo ".env file updated successfully!"