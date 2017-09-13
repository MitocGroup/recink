variable "region" {
  type        = "string"
  description = "AWS Region"
  default     = "us-east-1"
}

variable "access_key" {
  type        = "string"
  description = "AWS Access Key Id"
}

variable "secret_key" {
  type        = "string"
  description = "AWS Secret Access Key"
}
