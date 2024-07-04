#!/bin/bash

source config.sh

USER="ubuntu"
HOST="ec2-3-137-174-20.us-east-2.compute.amazonaws.com"
REMOTE_DIR="~/app"

# Run rsync to sync files to the EC2 instance
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.env' \
-e "ssh -i $KEY_PATH" . $USER@$HOST:$REMOTE_DIR

# SSH into the EC2 instance and run the apply-changes.sh script
ssh -i $KEY_PATH $USER@$HOST "bash -c 'cd $REMOTE_DIR && ./apply-changes.sh'"

apply-changes.sh

echo "Changes applied successfully!"
