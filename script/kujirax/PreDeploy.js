'use strict';

import fs from 'fs';
import path from 'path';
import tar from 'tar';

import { AnsibleHosts, Dockerfile } from './Template';

const { kujirax } = require(path.join(__dirname, '..', 'package.json'));

class PreDeploy {
    /**
     * Initialize this instance.
     * @param {string} dest Deploy dest.
     */
    constructor(dest) {
        this.dest = dest;
    }

    /**
     * Deploy that temporary container for setup.
     * @param {Caravan} caravan Settings of the user project.
     */
    async runAsync(caravan) {
        const { root, host, ssh, setup: { image } } = caravan;
        await this._createTarsAsync(root);
        this._createMergedSettings(caravan);
        this._createDockerfile(image);
        this._createAnsibleHostsFile(host, ssh);
    };

    /**
     * Create tar.gz file.
     * @param {string} root Source dir.
     */
    async _createTarsAsync(root) {
        await this._createTarAsync('caravan', root);
        const src = path.join(__dirname, '..', 'script', 'setup');
        await this._createTarAsync('script', src);
    }

    /**
     * Create tar.gz file.
     * @param {string} fileName Filename.
     * @param {string} cwd Current path.
     * @returns {Promise<void>}
     */
    _createTarAsync(fileName, cwd) {
        const params = {
            file: path.join(this.dest, `${fileName}.tar.gz`),
            gzip: true,
            cwd,
        };
        return tar.c(params, fs.readdirSync(cwd));
    }

    /**
     * Create merged setting.
     * @param {Caravan} caravan Settings of the user project.
     */
    _createMergedSettings(caravan) {
        const destJson = path.join(this.dest, kujirax.defaultCaravan);
        fs.writeFileSync(destJson, JSON.stringify(caravan, null, 4));
    }

    /**
     * Create a Dockerfile for the temporary container for deployment.
     * @param {string} image Docker image.
     */
    _createDockerfile(image) {
        fs.writeFileSync(
            path.join(this.dest, 'Dockerfile'), Dockerfile(image));
    }

    /**
     * Create a Ansible inventory file for deployment.
     * @param {string} host
     * @param {Caravan.SSH} ssh
     */
    _createAnsibleHostsFile(host, ssh) {
        fs.writeFileSync(
            path.join(this.dest, 'hosts'), AnsibleHosts(host, ssh));
    }
}

export default PreDeploy;