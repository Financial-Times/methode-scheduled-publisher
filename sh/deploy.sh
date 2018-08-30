#!/bin/bash

# Get the package version and the name
PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
MODULE_NAME=$(cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
FILE_NAME=${MODULE_NAME}-${PACKAGE_VERSION}.zip

# Set aws keys to deploy assets
aws configure set aws_access_key_id $1
aws configure set aws_secret_access_key $2
aws configure set default.region eu-west-1
aws configure set default.output json

# Upload the lamdba job
aws lambda update-function-code --function-name methodeScheduledPublish --zip-file fileb:///home/circleci/project/build/${FILE_NAME}