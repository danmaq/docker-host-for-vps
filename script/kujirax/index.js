'use strict';

import appRoot from 'app-root-path';
import program from 'commander';
import path from 'path';

import Caravan from './Caravan';
import SetupAsync from './Setup';

const { version } = require(path.join(appRoot.path, 'package.json'));

program
    .version(version)
    .option('-c, --caravan <path>', 'Folder to become a caravan.')
    .parse(process.argv);

SetupAsync(Caravan(program.caravan)).catch(console.error);