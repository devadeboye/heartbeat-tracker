#!/bin/bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Fix permissions for the current session (proactive)
sudo chmod 666 /var/run/docker.sock

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin apache2-utils

# Setup project environment
echo "Infrastructure is ready for load testing."
