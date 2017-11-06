#!/bin/bash
docker stop ikilledmypc/timmostaat
docker build -t ikilledmypc/timmostaat .
docker run -d -p 3000:3000 --device /dev/ttyUSB0 ikilledmypc/timmostaat
