#!/bin/bash

npm install -g license-report
npx license-report --package=./backend/package.json --only=prod --output=table --config license-report.json > ./backend/LIBRARIES
npx license-report --package=./frontend/package.json --only=prod --output=table --config license-report.json > ./frontend/LIBRARIES
Footer
