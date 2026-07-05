variable "aws_region" {
  description = "AWS region for this environment."
  type        = string
  default     = "ap-south-1"
}

variable "aws_profile" {
  description = "Local AWS profile used by Terraform."
  type        = string
  default     = "personal"
}

variable "project" {
  description = "Project name used in AWS resource names and tags."
  type        = string
  default     = "brynzit-talent-platform"
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "prod"
}

variable "key_name" {
  description = "Existing EC2 key pair name for SSH access."
  type        = string
}

variable "ubuntu_ami_id" {
  description = "Optional Ubuntu AMI ID. Leave empty to use latest Ubuntu 24.04 LTS."
  type        = string
  default     = ""
}

variable "ssh_allowed_cidrs" {
  description = "CIDR ranges allowed to SSH to both instances."
  type        = list(string)
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
  description = "Frontend EC2 instance type."
  type        = string
  default     = "t3.small"
}

variable "backend_instance_type" {
  description = "Backend EC2 instance type."
  type        = string
  default     = "t3.medium"
}

variable "frontend_root_volume_size_gb" {
  description = "Frontend host root EBS volume size in GiB."
  type        = number
  default     = 50
}

variable "backend_root_volume_size_gb" {
  description = "Backend host root EBS volume size in GiB."
  type        = number
  default     = 120
}
