[![Build Status](https://img.shields.io/travis/ovhemert/aedes-persistence-nedb.svg)](https://travis-ci.org/ovhemert/aedes-persistence-nedb)
[![Dependencies](https://img.shields.io/david/ovhemert/aedes-persistence-nedb.svg)]()
[![Known Vulnerabilities](https://snyk.io/test/npm/aedes-persistence-nedb/badge.svg)](https://snyk.io/test/npm/aedes-persistence-nedb)
[![npm](https://img.shields.io/npm/v/aedes-persistence-nedb.svg)]()
[![npm](https://img.shields.io/npm/dm/aedes-persistence-nedb.svg)]()
[![Greenkeeper badge](https://badges.greenkeeper.io/ovhemert/aedes-persistence-nedb.svg)](https://greenkeeper.io/)

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
## Donations

Want to help me out by giving a donation? Check out these options:

[![Patreon](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/ovhemert)
[![Coinbase](https://img.shields.io/badge/coins-donate-yellow.svg)](https://commerce.coinbase.com/checkout/fd177bf0-a89a-481b-889e-22bfce857b75)
[![PayPal](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.me/osmondvanhemert)
[![BuyMeACoffee](https://img.shields.io/badge/coffee-donate-yellow.svg)](https://buymeacoff.ee/ovhemert)
[![Beerpay](https://img.shields.io/badge/beer-donate-yellow.svg)](https://beerpay.io/ovhemert/aedes-persistence-nedb)

## License

MIT

[aedes]: https://github.com/mcollina/aedes
[persistence]: https://github.com/mcollina/aedes-persistence
[nedb]: https://github.com/louischatriot/nedb
