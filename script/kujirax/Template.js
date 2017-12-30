'use strict';

import './type';

/**
 * Create body of Dockerfile.
 * @param {string} image Image name on which to base temporary container for deployment.
 * @returns {string} body of Dockerfile.
 */
export const Dockerfile =
    image =>
    `
FROM ${image}
LABEL authors="Shuhei Nomura <info@danmaq.com>"

ADD script.tar.gz /root/
ADD caravan.tar.gz /root/
ADD kujirax.json /root/
ADD hosts /root/
RUN cd /root && chmod 755 start.sh
CMD ["/root/start.sh"]
`
    .trim();

/**
 * Create body of hosts for Ansible.
 * @param {string} host Target hostname.
 * @param {Caravan.SSH} ssh Setting for target SSH connection.
 * @param {string} ssh.key Private key file.
 * @param {string} ssh.pass Password.
 * @param {number} ssh.port SSH port.
 * @param {string} ssh.user User ID.
 * @returns {string} body of hosts for Ansible.
 */
export const AnsibleHosts =
    (host, { key, pass, port, user }) =>
    ((keySetting) =>
        `
[kujirax]
${host}

[all:vars]
ansible_port=${port}
ansible_user=${user}
ansible_ssh_pass=${pass}
ansible_become_pass=${pass}
${keySetting}
`
    )(key ? `ansible_private_key_file=/root/${key}` : '').trim();