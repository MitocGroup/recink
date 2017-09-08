provider "aws" {
  access_key    = "${var.access_key}"
  secret_key    = "${var.secret_key}"
  region        = "${var.region}"
}

resource "aws_instance" "example-recink" {
  ami           = "ami-2d39803a"
  instance_type = "t2.micro"
}
