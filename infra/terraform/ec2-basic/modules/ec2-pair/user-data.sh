#!/usr/bin/env bash
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git unzip jq htop

if ! command -v aws >/dev/null 2>&1; then
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
fi

mkdir -p /opt/brynzit
chown ubuntu:ubuntu /opt/brynzit || true

cat >/etc/motd <<EOF
Brynzit ${role} host.

Application deployment is handled by GitHub Actions over SSH.
Terraform owns the instance, EIP, security group, and IAM instance profile.
EOF
