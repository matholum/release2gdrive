#!/usr/bin/env node

import {readFileSync,writeFileSync} from 'fs';
import _ from 'underscore';

const packageJsonString = readFileSync('./package.json').toString();
let packageJson = JSON.parse(packageJsonString);

packageJson = _.omit(packageJson, 'scripts', 'config', 'importSort','devDependencies');

writeFileSync('./build/package.json', JSON.stringify(packageJson, undefined, 2));
