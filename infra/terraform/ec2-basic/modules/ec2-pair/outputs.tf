output "frontend_instance_id" {
  description = "Frontend EC2 instance ID."
  value       = aws_instance.frontend.id
}

output "frontend_public_ip" {
  description = "Frontend Elastic IP address."
  value       = aws_eip.frontend.public_ip
}

output "frontend_public_dns" {
  description = "Frontend EC2 public DNS name."
  value       = aws_instance.frontend.public_dns
}

output "backend_instance_id" {
  description = "Backend EC2 instance ID."
  value       = aws_instance.backend.id
}

output "backend_public_ip" {
  description = "Backend Elastic IP address."
  value       = aws_eip.backend.public_ip
}

output "backend_public_dns" {
  description = "Backend EC2 public DNS name."
  value       = aws_instance.backend.public_dns
}

output "frontend_security_group_id" {
  description = "Frontend security group ID."
  value       = aws_security_group.frontend.id
}

output "backend_security_group_id" {
  description = "Backend security group ID."
  value       = aws_security_group.backend.id
}

output "documents_bucket_name" {
  description = "Private S3 bucket for application documents (resumes, uploaded JDs)."
  value       = aws_s3_bucket.documents.bucket
}
