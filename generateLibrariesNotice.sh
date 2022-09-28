#!/bin/bash

npm install -g license-report
npx license-report --package=./package.json --only=prod --output=table --config license-report.json > ./LIBRARIES
