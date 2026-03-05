output "public_ip" {
  value = aws_spot_instance_request.worker.public_ip
}

output "ssh_command" {
  value = "ssh -i heartbeat-key.pem ubuntu@${aws_spot_instance_request.worker.public_ip}"
}
