variable "region" {
  default = "eu-west-2"
}

variable "instance_type" {
  default = "t3.large"
}

variable "ssh_key_name" {
  description = "The name of the SSH key pair to use for the instance."
  type        = string
  default = "heartbeat-key"
}

variable "max_spot_price" {
  default = "0.05"
}
