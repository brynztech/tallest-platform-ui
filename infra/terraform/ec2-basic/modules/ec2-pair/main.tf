locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  frontend_name = "${local.name_prefix}-frontend"
  backend_name  = "${local.name_prefix}-backend"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}

resource "aws_security_group" "frontend" {
  name        = "${local.frontend_name}-sg"
  description = "Frontend dev host access"
  vpc_id      = data.aws_vpc.default.id

  tags = merge(local.common_tags, {
    Name = "${local.frontend_name}-sg"
    Role = "frontend"
  })
}

resource "aws_security_group" "backend" {
  name        = "${local.backend_name}-sg"
  description = "Backend dev host access"
  vpc_id      = data.aws_vpc.default.id

  tags = merge(local.common_tags, {
    Name = "${local.backend_name}-sg"
    Role = "backend"
  })
}

resource "aws_vpc_security_group_ingress_rule" "frontend_ssh" {
  security_group_id = aws_security_group.frontend.id
  cidr_ipv4         = var.ssh_allowed_cidrs[0]
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
  description       = "SSH"
}

resource "aws_vpc_security_group_ingress_rule" "frontend_ssh_extra" {
  for_each = toset(slice(var.ssh_allowed_cidrs, 1, length(var.ssh_allowed_cidrs)))

  security_group_id = aws_security_group.frontend.id
  cidr_ipv4         = each.value
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
  description       = "SSH"
}

resource "aws_vpc_security_group_ingress_rule" "backend_ssh" {
  security_group_id = aws_security_group.backend.id
  cidr_ipv4         = var.ssh_allowed_cidrs[0]
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
  description       = "SSH"
}

resource "aws_vpc_security_group_ingress_rule" "backend_ssh_extra" {
  for_each = toset(slice(var.ssh_allowed_cidrs, 1, length(var.ssh_allowed_cidrs)))

  security_group_id = aws_security_group.backend.id
  cidr_ipv4         = each.value
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
  description       = "SSH"
}

resource "aws_vpc_security_group_ingress_rule" "frontend_http" {
  for_each = {
    for item in setproduct(var.frontend_allowed_cidrs, [80, 443, 3000, 3001]) :
    "${item[0]}-${item[1]}" => {
      cidr = item[0]
      port = item[1]
    }
  }

  security_group_id = aws_security_group.frontend.id
  cidr_ipv4         = each.value.cidr
  from_port         = each.value.port
  ip_protocol       = "tcp"
  to_port           = each.value.port
  description       = "Frontend HTTP access"
}

resource "aws_vpc_security_group_ingress_rule" "backend_api" {
  for_each = {
    for item in setproduct(var.backend_allowed_cidrs, [8000]) :
    "${item[0]}-${item[1]}" => {
      cidr = item[0]
      port = item[1]
    }
  }

  security_group_id = aws_security_group.backend.id
  cidr_ipv4         = each.value.cidr
  from_port         = each.value.port
  ip_protocol       = "tcp"
  to_port           = each.value.port
  description       = "Backend API access"
}

resource "aws_vpc_security_group_egress_rule" "frontend_all" {
  security_group_id = aws_security_group.frontend.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "All outbound"
}

resource "aws_vpc_security_group_egress_rule" "backend_all" {
  security_group_id = aws_security_group.backend.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "All outbound"
}

resource "aws_instance" "frontend" {
  ami                         = var.ubuntu_ami_id != "" ? var.ubuntu_ami_id : data.aws_ami.ubuntu.id
  instance_type               = var.frontend_instance_type
  subnet_id                   = element(data.aws_subnets.default.ids, var.frontend_subnet_index)
  vpc_security_group_ids      = [aws_security_group.frontend.id]
  key_name                    = var.key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true
  user_data                   = templatefile("${path.module}/user-data.sh", { role = "frontend" })

  root_block_device {
    volume_size = var.frontend_root_volume_size_gb
    volume_type = "gp3"
    encrypted   = true
  }

  tags = merge(local.common_tags, {
    Name = local.frontend_name
    Role = "frontend"
  })
}

resource "aws_instance" "backend" {
  ami                         = var.ubuntu_ami_id != "" ? var.ubuntu_ami_id : data.aws_ami.ubuntu.id
  instance_type               = var.backend_instance_type
  subnet_id                   = element(data.aws_subnets.default.ids, var.backend_subnet_index)
  vpc_security_group_ids      = [aws_security_group.backend.id]
  key_name                    = var.key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true
  user_data                   = templatefile("${path.module}/user-data.sh", { role = "backend" })

  root_block_device {
    volume_size = var.backend_root_volume_size_gb
    volume_type = "gp3"
    encrypted   = true
  }

  tags = merge(local.common_tags, {
    Name = local.backend_name
    Role = "backend"
  })
}

resource "aws_eip" "frontend" {
  domain   = "vpc"
  instance = aws_instance.frontend.id

  tags = merge(local.common_tags, {
    Name = "${local.frontend_name}-eip"
    Role = "frontend"
  })
}

resource "aws_eip" "backend" {
  domain   = "vpc"
  instance = aws_instance.backend.id

  tags = merge(local.common_tags, {
    Name = "${local.backend_name}-eip"
    Role = "backend"
  })
}
