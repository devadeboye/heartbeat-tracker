#!/bin/bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Setup project environment
echo "Infrastructure is ready for load testing."
