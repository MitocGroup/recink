# AWS Credentials Configuration

### Using your own account credentials

* Having AWS environment variables in your CI `AMAZON_ACCESS_KEY_ID, AMAZON_SECRET_ACCESS_KEY, AMAZON_SESSION_TOKEN` 
you can pass just the prefix `AMAZON` (default `AWS`):

```yaml
$:
  cache:
    driver: 's3'
    options:
      - 's3://your-s3-bucket'
      -
        region: 'region'
        envPrefix: 'AMAZON' # it's optional when you use default value
```

* Having AWS-CLI configured
 
```bash
[aws_prod]
aws_access_key_id=XXXXXXX8XXXXX8XXX8XX
aws_secret_access_key=xXX8xx8xxxXX8x8xxXXXXXXXxxxxXxxXXxXXXxxX
```
 
 you can pass just profile name `aws_prod` (default `default`):
 
```yaml
 $:
   cache:
     driver: 's3'
     options:
       - 's3://your-s3-bucket'
       -
         region: 'region'
         profile: 'aws_prod' # it's optional when you use default value
```

* Having credentials received from relative URI specified in the ECS container or from the metadata service on 
an EC2 instance you do not have to pass any credentials:

```yaml
 $:
   cache:
     driver: 's3'
     options:
       - 's3://your-s3-bucket'
       -
         region: 'region'
```

* If your CI environment does not have any AWS configurations you have to pass `accessKeyId` and `secretAccessKey`:

```yaml
 $:
   cache:
     driver: 's3'
     options:
       - 's3://your-s3-bucket'
       -
         region: 'region',
         accessKeyId: 'XXXXXXX8XXXXX8XXX8XX'
         secretAccessKey: 'xXX8xx8xxxXX8x8xxXXXXXXXxxxxXxxXXxXXXxxX'
```

### Using cross-account access

To use cross-account access role you have to pass your own credentials (see options above) and `roleArn` beside them:

```yaml
 $:
   cache:
     driver: 's3'
     options:
       - 's3://your-s3-bucket'
       -
         region: 'region'
         profile: 'aws_dev'
         roleArn: 'arn:aws:iam::[prod_account_id]:role/[cross-account-access-role]'
```
