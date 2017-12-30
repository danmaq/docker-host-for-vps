'use strict';

/**
 * @typedef Caravan.Setup
 * @type {Object}
 * @property {string} image Specified container as the base of the setup container.
 * @property {string} tempImage Temporary container image name for setup.
 * @property {string} name Name of the setup container.
 */

/**
 * @typedef Caravan.SSH
 * @type {Object}
 * @property {number} port SSH port.
 * @property {string} key Private key file.
 * @property {string} user User ID.
 * @property {string} pass Password.
 */

/**
 * @typedef Caravan
 * @type {Object}
 * @property {string} host Target hostname.
 * @property {string} root Root directory of the user project.
 * @property {Caravan.Setup} setup Setting for setup container.
 * @property {Caravan.SSH} ssh Setting for target SSH connection.
 */