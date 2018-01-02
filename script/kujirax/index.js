'use strict';

import program from 'commander';
import path from 'path';

import Caravan from './Caravan';
import SetupAsync from './Setup';

const { version } = require(path.join(__dirname, '..', 'package.json'));

program
    .version(version)
    .option('-c, --caravan <path>', 'Folder to become a caravan.')
    .parse(process.argv);

SetupAsync(Caravan(program.caravan)).catch(console.error);