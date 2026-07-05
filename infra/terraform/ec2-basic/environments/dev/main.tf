module "ec2_pair" {
  source = "../../modules/ec2-pair"

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  key_name               = var.key_name
  ubuntu_ami_id          = var.ubuntu_ami_id
  ssh_allowed_cidrs      = var.ssh_allowed_cidrs
  frontend_allowed_cidrs = var.frontend_allowed_cidrs
  backend_allowed_cidrs  = var.backend_allowed_cidrs

  frontend_instance_type       = var.frontend_instance_type
  backend_instance_type        = var.backend_instance_type
  frontend_root_volume_size_gb = var.frontend_root_volume_size_gb
  backend_root_volume_size_gb  = var.backend_root_volume_size_gb
}
