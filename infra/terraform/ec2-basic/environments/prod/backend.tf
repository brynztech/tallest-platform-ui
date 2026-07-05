terraform {
  backend "s3" {
    bucket         = "brynzit-talent-platform-prod-tfstate"
    key            = "ec2-basic/prod/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "brynzit-talent-platform-prod-tf-locks"
    encrypt        = true
    profile        = "personal"
  }
}
