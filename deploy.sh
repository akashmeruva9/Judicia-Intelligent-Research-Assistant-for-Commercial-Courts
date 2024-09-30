#!/bin/sh

IMAGE=registry.rajatjacob.com/osmosis;
SERVICE_NAME=osmosis;
TS=$(date +%s);

docker build . --push -t $IMAGE -t $IMAGE:$TS
docker stack deploy -c docker-compose.yml --prune $SERVICE_NAME;
