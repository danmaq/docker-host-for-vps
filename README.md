[![npm version](https://badge.fury.io/js/kujirax.svg)](https://badge.fury.io/js/kujirax)

# KUJIRAX

It's a multi-webapp setup system for a VPS.  

## Features

* The script helps that for easily installing __jwilder/nginx-proxy__ container in your VPS.
* It is deployed using Ansible, but because it runs on Docker, it can be executed even on Windows.

## Dependencies

* Docker (Client side and server side)
* NodeJS >= 6.12.2
* yarn (Recommend)
* Favorite your VPS server.
    * At the moment, only __Atomic Host (CentOS/Fedora/RHEL)__ OS are supported.

## Usage

1. Create some files.

    * __./__
        * `kujirax.json` (See later)
    * __./html__
        * `index.html`
        * Other dependencies to `index.html`.
    * __./certs__ _(Optional)_
        * `example.com.chain.crt`
        * `example.com.crt`
        * `example.com.key`
    * __./dhparam__ _(Optional)_
        * `dhparam.pem`

2. Edit `kujirax.json`.

```JavaScript
{
    "host": "example.com",
    "ssh": {
        "user": "kujirax",
        "pass": "lolitomo",
        "key": "", // Set private key file if using.
        "port": 10005, // If you specify an arbitrary port, it will be changed automatically from 22.
    }
}
```
3. Install KUJIRAX.

```SH
$ yarn global add kujirax
```

or

```SH
$ npm i -g kujirax
```

4. Start script.

```SH
$ kujirax
```
