'use strict';

import Docker from 'dockerode';
import fs from 'fs';
import net from 'net';
import path from 'path';
import tar from 'tar';
import temp from 'temp';

import { AnsibleHosts, Dockerfile } from './Template';

import './type';

const { kujirax, author } =
require(path.join(__dirname, '..', 'package.json'));

/**
 * Create an argument to tar.
 * @param {string} setup Path of setup.
 * @param {string} fileName Filename.
 * @param {string} cwd Current path.
 * @return {{cwd: string, file: string, gzip: boolean}} Argument for tar.
 */
const createTarParams =
    (setup, fileName, cwd) => ({
        file: path.join(setup, `${fileName}.tar.gz`),
        gzip: true,
        cwd,
    });

/**
 * Deploy that temporary container for setup.
 * @param {string} setup Path of setup.
 * @param {Caravan} caravan Settings of the user project.
 */
const preDeployAsync =
    async(setup, caravan) => {
        const { root } = caravan;
        await tar.c(createTarParams(setup, 'caravan', root), fs.readdirSync(root));
        const setupSrc = path.join(__dirname, '..', 'script', 'setup');
        await tar.c(
            createTarParams(setup, 'script', setupSrc), fs.readdirSync(setupSrc));
        fs.writeFileSync(
            path.join(setup, kujirax.defaultCaravan),
            JSON.stringify(caravan, null, 4));
    };

/**
 * Create a Dockerfile for the temporary container for deployment.
 * @param {string} setup Path of setup.
 * @param {string} image Docker image.
 */
const createDockerfileAsync =
    async(setup, image) =>
    fs.writeFileSync(
        path.join(setup, 'Dockerfile'), Dockerfile(image));

/**
 *
 * @param {string} setup Path of setup.
 * @param {string} host
 * @param {Caravan.SSH} ssh
 */
const createAnsibleHostsFileAsync =
    async(setup, host, ssh) =>
    fs.writeFileSync(
        path.join(setup, 'hosts'), AnsibleHosts(host, ssh));

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
 * Wait until Docker processing is completed.
 * @param {Promise<net.Socket>} promiseStream Result of docker function.
 */
const waitDocker =
    promiseStream =>
    new Promise(
        async(resolve) => {
            const stream = await promiseStream;
            stream.pipe(process.stdout);
            stream.once('end', resolve);;
        });

/**
 * Create a Docker image for the temporary container for deployment.
 * @param {string} setup Path of setup.
 * @param {string} src Docker image.
 * @param {string} dst Docker image.
 */
const createImageAsync =
    async(setup, src, dst) => {
        const docker = createDocker();
        await waitDocker(docker.pull(src));
        try {
            await docker.getImage(dst).remove();
            console.log('Container exists. Replacing...');
        } catch (e) {
            console.log('Container did not found. Creating...');
        }
        const ctx = {
            context: setup,
            src: fs.readdirSync(setup)
        };
        await waitDocker(docker.buildImage(ctx, { t: dst }));
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
        const setup = temp.mkdirSync('.kujirax');
        console.info('Correct items...');
        await preDeployAsync(setup, caravan);
        await createDockerfileAsync(setup, image);
        await createAnsibleHostsFileAsync(setup, host, ssh);
        console.info('Create temporary image...');
        await createImageAsync(setup, image, tempImage);
        temp.cleanupSync();
        console.info('Run setup image...');
        await runImageAsync(tempImage, name);
    }

export default setupAsync;