provider "aws" {
  access_key      = "${var.access_key}"
  secret_key      = "${var.secret_key}"
  region          = "${var.region}"
}

resource "aws_kinesis_stream" "test_recink_stream_pre" {
  name             = "recink-terraform-kinesis-test-preprovision"
  shard_count      = 1
  retention_period = 48

  shard_level_metrics = [
    "IncomingBytes",
    "OutgoingBytes",
  ]

  tags {
    Environment   = "dev"
    Application   = "recink"
    Preprovision  = "true"
  }
}
