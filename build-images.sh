#!/bin/bash

docker build -f Dockerfile.backend -t my-cookery-book-2-backend:latest .
docker build -f Dockerfile.frontend -t my-cookery-book-2-frontend:latest .