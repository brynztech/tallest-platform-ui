variable "project" {
  description = "Project name used in AWS resource names and tags."
  type        = string
}

variable "environment" {
  description = "Deployment environment name, for example dev or prod."
  type        = string
}

variable "aws_region" {
  description = "AWS region where EC2 resources are created."
  type        = string
}

variable "key_name" {
  description = "Existing EC2 key pair name for SSH access."
  type        = string
}

variable "ubuntu_ami_id" {
  description = "Optional Ubuntu AMI ID. Leave empty to use the latest Ubuntu 24.04 LTS amd64 AMI."
  type        = string
  default     = ""
}

variable "ssh_allowed_cidrs" {
  description = "CIDR ranges allowed to SSH to both instances."
  type        = list(string)

  validation {
    condition     = length(var.ssh_allowed_cidrs) > 0
    error_message = "ssh_allowed_cidrs must include at least one CIDR range."
  }
}

variable "frontend_allowed_cidrs" {
  description = "CIDR ranges allowed to access frontend HTTP ports."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "backend_allowed_cidrs" {
  description = "CIDR ranges allowed to access backend API ports."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "frontend_instance_type" {
  description = "EC2 instance type for the frontend host."
  type        = string
  default     = "t3.small"
}

variable "backend_instance_type" {
  description = "EC2 instance type for the backend host."
  type        = string
  default     = "t3.medium"
}

variable "frontend_root_volume_size_gb" {
  description = "Frontend host root EBS volume size in GiB."
  type        = number
  default     = 30
}

variable "backend_root_volume_size_gb" {
  description = "Backend host root EBS volume size in GiB."
  type        = number
  default     = 80
}

variable "frontend_subnet_index" {
  description = "Index into default VPC subnets for the frontend instance."
  type        = number
  default     = 0
}

variable "backend_subnet_index" {
  description = "Index into default VPC subnets for the backend instance."
  type        = number
  default     = 1
}
