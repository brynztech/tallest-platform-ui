# AWS EC2 Deployment Guide

This guide documents the basic EC2 deployment setup for the Brynzit frontend repo (`talent-platform-ui`) and backend repo (`talent-platform`). It is designed for dev first, with production scaffolded but not applied yet.

No Terraform resources should be applied until the user explicitly approves it.

## Topology

Region: `ap-south-1`

Planned EC2 hosts:

| Environment | Function | Repo | Branch | Public access |
| --- | --- | --- | --- | --- |
| dev | frontend | `talent-platform-ui` | `frontend-dev` | Elastic IP, ports `80` (nginx), `3000`, `3001` |
| dev | backend | `talent-platform` | `backend-dev` | Elastic IP, port `8000`; `80` (nginx) once the security group change is applied |
| prod | frontend | `talent-platform-ui` | `frontend-prod` | scaffolded only |
| prod | backend | `talent-platform` | `backend-prod` | scaffolded only |

There are no domains yet. Access is by Elastic IP:

- Public candidate site: `http://<frontend-dev-eip>` (nginx; `:3000` still answers during the switch)
- Internal console: `http://<frontend-dev-eip>:3001`
- Backend API/docs: `http://<backend-dev-eip>:8000/docs` (`http://<backend-dev-eip>/docs` once port 80 is open)

## Elastic IP Behavior

Terraform allocates an Elastic IP for each EC2 host and associates it with the instance. This keeps the public address stable if a dev instance is stopped and started manually.

Stopping an instance does not release the Elastic IP. Destroying Terraform resources does release it unless the EIP is first removed from Terraform management.

## Terraform Layout

Terraform lives in this frontend repo:

```text
infra/terraform/ec2-basic/
  modules/ec2-pair/
  environments/dev/
  environments/prod/
```

The shared module creates:

- two EC2 instances: frontend and backend
- two Elastic IPs
- frontend and backend security groups
- an IAM role and instance profile with `AmazonSSMManagedInstanceCore`
- encrypted gp3 root volumes
- simple Ubuntu user data for base packages

The current module uses the default VPC to keep the first dev setup small. A later production hardening pass should move this into an explicit VPC, private subnets, load balancers, TLS, backups, and managed databases/caches.

## Terraform State Bootstrap

The environment backends assume these S3 buckets and DynamoDB tables already exist:

```text
dev bucket:  brynzit-talent-platform-dev-tfstate
dev table:   brynzit-talent-platform-dev-tf-locks
prod bucket: brynzit-talent-platform-prod-tfstate
prod table:  brynzit-talent-platform-prod-tf-locks
```

Create them manually or with a separate bootstrap step before `terraform init`. Example commands are shown for review only; do not run them until AWS changes are approved.

```bash
export AWS_PROFILE=personal
export AWS_REGION=ap-south-1

aws s3api create-bucket \
  --bucket brynzit-talent-platform-dev-tfstate \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

aws s3api put-bucket-versioning \
  --bucket brynzit-talent-platform-dev-tfstate \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket brynzit-talent-platform-dev-tfstate \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws dynamodb create-table \
  --table-name brynzit-talent-platform-dev-tf-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

Repeat with the prod names only when production is approved.

## Dev Terraform Plan/Apply

From the frontend repo:

```bash
cd infra/terraform/ec2-basic/environments/dev
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

- set `key_name` to an existing EC2 key pair in `ap-south-1`
- set `ssh_allowed_cidrs` to your current IP/CIDR, for example `["x.x.x.x/32"]`
- keep app ports public for dev, or restrict them to a known CIDR

Plan:

```bash
export AWS_PROFILE=personal
terraform init
terraform fmt -recursive
terraform validate
terraform plan
```

Apply only after explicit approval:

```bash
export AWS_PROFILE=personal
terraform apply
```

After apply, copy outputs into GitHub repo secrets.

## GitHub Secrets

Frontend repo secrets (`talent-platform-ui`):

```text
FRONTEND_DEV_HOST=<frontend dev EIP>
FRONTEND_DEV_SSH_USER=ubuntu
FRONTEND_DEV_SSH_KEY=<private key matching the EC2 key pair>
DEV_NEXT_PUBLIC_API_URL=http://<backend dev EIP>:8000

FRONTEND_PROD_HOST=<frontend prod EIP>
FRONTEND_PROD_SSH_USER=ubuntu
FRONTEND_PROD_SSH_KEY=<prod private key>
PROD_NEXT_PUBLIC_API_URL=http://<backend prod EIP>:8000
```

Backend repo secrets (`talent-platform`):

```text
BACKEND_DEV_HOST=<backend dev EIP>
BACKEND_DEV_SSH_USER=ubuntu
BACKEND_DEV_SSH_KEY=<private key matching the EC2 key pair>
BACKEND_DEV_ENV_FILE=<full backend .env file contents>

BACKEND_PROD_HOST=<backend prod EIP>
BACKEND_PROD_SSH_USER=ubuntu
BACKEND_PROD_SSH_KEY=<prod private key>
BACKEND_PROD_ENV_FILE=<full prod backend .env file contents>
```

The backend workflow writes the env file to `/opt/brynzit/talent-platform/.env` on the EC2 host.

## Branches And Deployment

Desired branches:

- frontend repo: `frontend-dev`, `frontend-prod`
- backend repo: `backend-dev`, `backend-prod`

Do not create these branches from a dirty worktree. Safest flow after local work is committed or stashed:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c frontend-dev
git push -u origin frontend-dev
git switch main
git switch -c frontend-prod
git push -u origin frontend-prod
```

Use the equivalent branch names in the backend repo.

Dev deployment triggers:

- frontend: push to `frontend-dev`, or manual `workflow_dispatch`
- backend: push to `backend-dev`, or manual `workflow_dispatch`

Prod deployment is manual-only and requires typing `deploy-prod` in the workflow input.

## Frontend Runtime

The frontend workflow:

1. SSHes to the frontend EC2 host.
2. Installs Git, Node.js 22, and `pnpm` via Corepack if needed.
3. Clones or updates `https://github.com/bhuvan777/talent-platform-ui.git`.
4. Checks out `frontend-dev` or `frontend-prod`.
5. Writes `.env.production` for both Next.js apps.
6. Runs `pnpm install --frozen-lockfile`.
7. Builds `@brynzit/web` and `@brynzit/console`.
8. Starts them with systemd:
   - `brynzit-web` on port `3000`
   - `brynzit-console` on port `3001`
9. Installs nginx and serves `brynzit-web` on port `80` (`infra/nginx/web.conf`).

Useful EC2 commands:

```bash
sudo systemctl status brynzit-web
sudo systemctl status brynzit-console
sudo journalctl -u brynzit-web -f
sudo journalctl -u brynzit-console -f
```

## Backend Runtime

The backend workflow:

1. SSHes to the backend EC2 host.
2. Installs Git and Docker if needed.
3. Clones or updates `https://github.com/bhuvan777/talent-platform.git`.
4. Checks out `backend-dev` or `backend-prod`.
5. Writes `.env` from a GitHub secret.
6. Runs Docker Compose with `docker-compose.prod.yml`.
7. Runs `alembic upgrade head`.
8. Smoke checks `http://localhost:8000/docs`.

The production Compose override changes the API command from local dev reload mode:

```bash
uvicorn platform.main:app --host 0.0.0.0 --port 8000 --reload
```

to deployment mode:

```bash
uvicorn platform.main:app --host 0.0.0.0 --port 8000
```

Add a real `/health` endpoint before using this for production traffic; `/docs` is only a temporary smoke check.

## Reverse Proxy (nginx)

Dev only so far (2026-09-25). Goal: the plain IP instead of IP plus port, then a
domain per service (backend, candidate site, console). One backend serves both
sites.

- **Frontend host:** nginx on port `80` serves the candidate site (`infra/nginx/web.conf`,
  passes `Host`/`X-Forwarded-*` for Next.js and Clerk). The console stays on
  `:3001` until it gets its own domain.
- **Backend host:** nginx on port `80` serves the API (`talent-platform/infra/nginx/api.conf`).
- Both deploys run `nginx -t` before reloading and check the proxied URL
  (`MARKER: nginx proxy passed`).

Remaining steps, in order:

1. Apply the backend security group change (port `80` added to `backend_api`
   in `modules/ec2-pair/main.tf`; purely additive, the existing `8000` rule is
   untouched):
   ```bash
   cd infra/terraform/ec2-basic/environments/dev
   terraform plan    # expect: 1 to add (backend ingress 0.0.0.0/0 port 80), 0 to change, 0 to destroy
   terraform apply
   ```
2. Point the sites at the backend's port 80: set GitHub `development`
   environment secrets `DEV_NEXT_PUBLIC_API_URL` and `DEV_BACKEND_API_URL` to
   `http://<backend-dev-eip>`, then re-run the frontend deploy (both apps bake
   the URL in at build time).
3. Once nothing uses them, close `3000` and `8000` to the internet.
4. Domains: point DNS at each Elastic IP, add `server_name` blocks and TLS
   (then `443`), and update the backend's `CORS_ALLOWED_ORIGINS`.

## Stop And Start Dev EC2

To reduce dev cost after the instances exist:

```bash
export AWS_PROFILE=personal
aws ec2 stop-instances --instance-ids <frontend-instance-id> <backend-instance-id> --region ap-south-1
aws ec2 start-instances --instance-ids <frontend-instance-id> <backend-instance-id> --region ap-south-1
```

Elastic IPs keep the public addresses stable after restart.

## Production Before Apply

Before any prod apply:

- restrict SSH and app ingress CIDRs
- add domains and TLS
- decide how the console is protected before auth exists
- add a real backend `/health` endpoint
- move stateful production data to managed services or document backups
- consider RDS for Postgres, ElastiCache for Redis, Qdrant Cloud or a backed-up Qdrant host, and Temporal Cloud or a dedicated Temporal deployment
