'use strict';

/**
 * @typedef Caravan.Setup
 * @type {Object}
 * @property {string} image Specified container as the base of the setup container.
 * @property {string} tempImage Temporary container image name for setup.
 * @property {string} name Name of the setup container.
 * @property {string[]} shell
 */

/**
 * @typedef Caravan.SSH
 * @type {Object}
 * @property {number} default Default SSH port.
 * @property {number} alt Alt SSH port.
 */

/**
 * @typedef Caravan
 * @type {Object}
 * @property {string} root Root directory of the user project.
 * @property {string} user User ID.
 * @property {string} pass Password.
 * @property {Caravan.Setup} setup Setting for setup container.
 * @property {Caravan.SSH} ssh Setting for target SSH connection.
 */