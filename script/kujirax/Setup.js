'use strict';

import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import tar from 'tar';

import { AnsibleHosts, Dockerfile } from './Template';

import './type';

const { kujirax, author } =
require(path.join(__dirname, '..', 'package.json'));

/** Root directory of temporary container for setup. */
const setupHome = path.join(__dirname, '..', '.setup');

/**
 * Create an argument to tar.
 * @param {string} fileName Filename.
 * @param {string} cwd Current path.
 * @return {{cwd: string, file: string, gzip: boolean}} Argument for tar.
 */
const createTarParams =
    (fileName, cwd) => ({
        file: path.join(setupHome, `${fileName}.tar.gz`),
        gzip: true,
        cwd,
    });

/**
 * Deploy that temporary container for setup.
 * @param {Caravan} caravan Settings of the user project.
 */
const preDeployAsync =
    async(caravan) => {
        const { root } = caravan;
        await tar.c(createTarParams('caravan', root), fs.readdirSync(root));
        const setupSrc = path.join(__dirname, '..', 'script', 'setup');
        await tar.c(
            createTarParams('script', setupSrc), fs.readdirSync(setupSrc));
        fs.writeFileSync(
            path.join(setupHome, kujirax.defaultCaravan),
            JSON.stringify(caravan, null, 4));
    };

/**
 * Create a Dockerfile for the temporary container for deployment.
 * @param {string} image Docker image.
 */
const createDockerfileAsync =
    async(image) =>
    fs.writeFileSync(
        path.join(setupHome, 'Dockerfile'), Dockerfile(image));

/**
 *
 * @param {string} host
 * @param {Caravan.SSH} ssh
 */
const createAnsibleHostsFileAsync =
    async(host, ssh) =>
    fs.writeFileSync(
        path.join(setupHome, 'hosts'), AnsibleHosts(host, ssh));

/**
 * Create docker instance.
 * @return {Docker} Docker instance.
 */
const createDocker =
    () =>
    (params => new Docker(params))(
        /^win/.test(process.platform) ?
        ({ socketPath: '//./pipe/docker_engine' }) : undefined);

/**
 * Create a Docker image for the temporary container for deployment.
 * @param {string} src Docker image.
 * @param {string} dst Docker image.
 */
const createImageAsync =
    async(src, dst) => {
        const docker = createDocker();
        // FIXME: not wait?
        await docker.pull(src);
        try {
            await docker.getImage(dst).remove();
            console.log('Container exists. Replacing...');
        } catch (e) {
            console.log('Container did not found. Creating...');
        }
        const ctx = { context: setupHome, src: fs.readdirSync(setupHome) };
        // FIXME: not wait?
        await docker.buildImage(ctx, { t: dst });
    };

/**
 * Run a Docker image for the temporary container for deployment.
 * @param {string} image Docker image.
 * @param {string} name
 */
const runImageAsync =
    async(image, name) => {
        const container =
            await createDocker().run(
                image,
                undefined,
                process.stdout, { name }, {});
        await container.remove();
    };

/**
 * @param {Caravan} caravan Settings of the user project.
 */
const setupAsync =
    async(caravan) => {
        const { host, ssh, setup: { image, tempImage, name } } =
        caravan;
        console.info('Correct items...');
        await preDeployAsync(caravan);
        await createDockerfileAsync(image);
        await createAnsibleHostsFileAsync(host, ssh);
        console.info('Create temporary image...');
        await createImageAsync(image, tempImage);
        // XXX: Wait until the Docker image becomes available here.
        // However, It is more correct to wait until the Docker image is retrieved.
        await new Promise(r => setTimeout(r, 3000));
        console.info('Run setup image...');
        await runImageAsync(tempImage, name);
    }

export default setupAsync;