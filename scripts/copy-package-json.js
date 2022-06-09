#!/usr/bin/env node

const fs = require('fs');
const _ = require('underscore');

const packageJsonString = fs.readFileSync('./package.json').toString();
let packageJson = JSON.parse(packageJsonString);

packageJson = _.omit(packageJson, 'scripts', 'config', 'importSort','devDependencies');

fs.writeFileSync('./build/package.json', JSON.stringify(packageJson, undefined, 2));
