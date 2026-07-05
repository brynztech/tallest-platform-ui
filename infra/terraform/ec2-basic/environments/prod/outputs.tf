output "frontend_instance_id" {
  description = "Frontend EC2 instance ID."
  value       = module.ec2_pair.frontend_instance_id
}

output "frontend_public_ip" {
  description = "Frontend Elastic IP address."
  value       = module.ec2_pair.frontend_public_ip
}

output "frontend_url_web" {
  description = "Public candidate site URL on the frontend EC2 host."
  value       = "http://${module.ec2_pair.frontend_public_ip}:3000"
}

output "frontend_url_console" {
  description = "Internal console URL on the frontend EC2 host."
  value       = "http://${module.ec2_pair.frontend_public_ip}:3001"
}

output "backend_instance_id" {
  description = "Backend EC2 instance ID."
  value       = module.ec2_pair.backend_instance_id
}

output "backend_public_ip" {
  description = "Backend Elastic IP address."
  value       = module.ec2_pair.backend_public_ip
}

output "backend_api_url" {
  description = "Backend API URL on the backend EC2 host."
  value       = "http://${module.ec2_pair.backend_public_ip}:8000"
}
