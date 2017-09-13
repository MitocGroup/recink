provider "aws" {
  access_key      = "${var.access_key}"
  secret_key      = "${var.secret_key}"
  region          = "${var.region}"
}

data "aws_vpc" "test_recink_peer" {
  tags {
    Application   = "REciNK"
    Peer          = "true"
  }
}

resource "aws_vpc" "test_recink" {
  cidr_block      = "10.1.0.0/16"

  tags {
    Application   = "REciNK"
    Peer          = "false"
  }
}

resource "aws_vpc_peering_connection" "test_recink_peering" {  
  vpc_id          = "${aws_vpc.test_recink.id}"
  peer_vpc_id     = "${data.aws_vpc.test_recink_peer.id}"
  auto_accept     = true

  tags {
    Application   = "REciNK"
  }
}
