@echo off

docker-compose -f .\docker-compose-debug.yml down
if x%1 NEQ xstop docker-compose -f .\docker-compose-debug.yml run --service-ports --rm wekan
