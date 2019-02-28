[![Build Status](https://ovhemert.visualstudio.com/aedes-persistence-nedb/_apis/build/status/ovhemert.aedes-persistence-nedb)](https://ovhemert.visualstudio.com/aedes-persistence-nedb/_build/latest?definitionId=2)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/36fb257bd6d241f9b95fe63d74c69a24)](https://www.codacy.com/app/ovhemert/aedes-persistence-nedb?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ovhemert/aedes-persistence-nedb&amp;utm_campaign=Badge_Grade)
[![Dependencies](https://img.shields.io/david/ovhemert/aedes-persistence-nedb.svg)]()
[![Known Vulnerabilities](https://snyk.io/test/npm/aedes-persistence-nedb/badge.svg)](https://snyk.io/test/npm/aedes-persistence-nedb)
[![Greenkeeper badge](https://badges.greenkeeper.io/ovhemert/aedes-persistence-nedb.svg)](https://greenkeeper.io/)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)


# aedes-persistence-nedb


[Aedes][aedes] persistence, backed by [NeDB][nedb].

See [aedes-persistence][persistence] for the full API, and [Aedes][aedes] for usage.

## Install

```
npm i aedes aedes-persistence-nedb --save
```

## API

### Persistence ([options])

Creates a new instance of aedes-persistence-nedb.
Accepts an options object to override defaults.

```js
var NedbPersistence = require('aedes-persistence-nedb');
var persistence = new NedbPersistence({
  path: './db'      // defaults to './data',
  prefix: 'mqtt'    // defaults to ''
});
```

## Example

Creates a new Aedes instance that persists to NeDB. Connect to this instance with a MQTT client to see it working.

```js
var NedbPersistence = require('aedes-persistence-nedb');
var Aedes = require('aedes');
var net = require('net');

var db = new NedbPersistence();
var aedes = Aedes({ persistence: db });
var server = net.createServer(aedes.handle);
var port = 1883;

server.listen(port, function () {
  console.log('server listening on port', port);
});
```

## Maintainers

**Osmond van Hemert**

[![Github](https://img.shields.io/badge/style-github-333333.svg?logo=github&logoColor=white&label=)](https://github.com/ovhemert)
[![NPM](https://img.shields.io/badge/style-npm-333333.svg?logo=npm&logoColor=&label=)](https://www.npmjs.com/~ovhemert)
[![Twitter](https://img.shields.io/badge/style-twitter-333333.svg?logo=twitter&logoColor=&label=)](https://twitter.com/osmondvanhemert)
[![Web](https://img.shields.io/badge/style-website-333333.svg?logoColor=white&label=&logo=diaspora)](https://www.osmondvanhemert.nl)

## Contributing

See the [CONTRIBUTING.md](./docs/CONTRIBUTING.md) file for details.

## Donations

Want to help me out by giving a donation? Check out these options:

[![Patreon](https://img.shields.io/badge/style-patreon-333333.svg?logo=patreon&logoColor=&label=)](https://www.patreon.com/ovhemert)
[![Coinbase](https://img.shields.io/badge/style-bitcoin-333333.svg?logo=bitcoin&logoColor=&label=)](https://commerce.coinbase.com/checkout/fd177bf0-a89a-481b-889e-22bfce857b75)
[![PayPal](https://img.shields.io/badge/style-paypal-333333.svg?logo=paypal&logoColor=&label=)](https://www.paypal.me/osmondvanhemert)
[![Ko-fi](https://img.shields.io/badge/style-coffee-333333.svg?logo=ko-fi&logoColor=&label=)](http://ko-fi.com/ovhemert)

## License

MIT

[aedes]: https://github.com/mcollina/aedes
[persistence]: https://github.com/mcollina/aedes-persistence
[nedb]: https://github.com/louischatriot/nedb
