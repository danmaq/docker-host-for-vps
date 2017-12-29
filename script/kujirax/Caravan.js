'use strict';

import appRoot from 'app-root-path';
import path from 'path';
import merge from 'lodash.merge';

import './type';

const { kujirax } = require(path.join(appRoot.path, 'package.json'));

/** The path where the default JSON file is stored. */
const defaultSettingsPath =
    path.join(appRoot.path, 'script', 'setup', kujirax.defaultCaravan);

/**
 * Extract the configuration file of the user project.
 * @param {string} [dir] Directory of user project.
 * @returns {Caravan} Configuration of the user project.
 */
const caravan =
    dir => {
        const _dir = dir || '.';
        const absolute = path.isAbsolute(_dir);
        const root = absolute ? _dir : path.join(process.cwd(), _dir);
        const data =
            merge(
                require(defaultSettingsPath),
                require(path.join(root, kujirax.defaultCaravan)), { root });
        return data;
    };

export default caravan;