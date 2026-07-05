terraform {
  backend "s3" {
    bucket         = "brynzit-talent-platform-dev-tfstate"
    key            = "ec2-basic/dev/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "brynzit-talent-platform-dev-tf-locks"
    encrypt        = true
    profile        = "personal"
  }
}
