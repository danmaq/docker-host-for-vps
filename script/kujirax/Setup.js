'use strict';

import Docker from 'dockerode';
import fs from 'fs';
import net from 'net';
import temp from 'temp';

import PreDeploy from './PreDeploy';

import './type';

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
            stream.on(
                'data',
                data =>
                console.debug(
                    '    ' +
                    Object
                    .values(JSON.parse(data.toString()))
                    .map(
                        v =>
                        typeof v === 'string' ? v.trim() :
                        JSON.stringify(v))
                    .join(' ')));
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
        const preDeploy = new PreDeploy(setup);
        console.info('Correct items...');
        await preDeploy.runAsync(caravan);
        console.info('Create temporary image...');
        await createImageAsync(setup, image, tempImage);
        temp.cleanupSync();
        console.info('Run setup image...');
        await runImageAsync(tempImage, name);
    }

export default setupAsync;