provider "aws" {
  access_key      = "${var.access_key}"
  secret_key      = "${var.secret_key}"
  region          = "${var.region}"
}

resource "aws_vpc" "test_recink_peer" {
  cidr_block      = "10.2.0.0/16"

  tags {
    Application   = "REciNK"
    Peer          = "true"
  }
}
