'use strict';

import appRoot from 'app-root-path';
import { spawn } from 'child_process';
import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import tar from 'tar';

import './type';

const { kujirax, author } =
require(path.join(appRoot.path, 'package.json'));

/**
 * Create body of Dockerfile.
 * @param {string} image Image name on which to base temporary container for deployment.
 * @returns {string} body of Dockerfile.
 */
const Dockerfile =
    image =>
    `
FROM ${image}
LABEL authors="Shuhei Nomura <info@danmaq.com>"

ADD caravan.tar.gz /root/caravan
ADD script.tar.gz /root/
ADD kujirax.json /root/
RUN cd /root && chmod 755 start.sh
CMD ["/root/start.sh"]
`
    .trim();

/** Root directory of temporary container for setup. */
const setupHome = path.join(appRoot.path, '.setup');

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
        const setupSrc = path.join(appRoot.path, 'script', 'setup');
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
    async(image) => {
        const text = Dockerfile(image);
        fs.writeFileSync(path.join(setupHome, 'Dockerfile'), text);
    }

/**
 * Create a Docker image for the temporary container for deployment.
 * @param {string} src Docker image.
 * @param {string} dst Docker image.
 */
const createImageAsync =
    async(src, dst) => {
        const docker = new Docker();
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
 * @param {string} shell
 */
const runImageAsync =
    async(image, name, shell) => {
        const docker = new Docker();
        const container =
            await docker.run(
                image,
                shell,
                process.stdout, { name }, {});
        await container.remove();
    };

/**
 * @param {Caravan} caravan Settings of the user project.
 */
const setupAsync =
    async(caravan) => {
        const { setup: { image, tempImage, name, shell } } = caravan;
        console.info('Correct items...');
        await preDeployAsync(caravan);
        await createDockerfileAsync(image);
        console.info('Create temporary image...');
        await createImageAsync(image, tempImage);
        // XXX: Wait until the Docker image becomes available here.
        // However, It is more correct to wait until the Docker image is retrieved.
        await new Promise(r => setTimeout(r, 3000));
        console.info('Run setup image...');
        await runImageAsync(tempImage, name, shell);
    }

export default setupAsync;