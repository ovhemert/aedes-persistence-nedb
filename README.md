[![Travis](https://img.shields.io/travis/com/ovhemert/aedes-persistence-nedb.svg?branch=master&logo=travis)](https://travis-ci.com/ovhemert/aedes-persistence-nedb)
[![Azure Pipelines](https://ovhemert.visualstudio.com/aedes-persistence-nedb/_apis/build/status/ovhemert.aedes-persistence-nedb)](https://ovhemert.visualstudio.com/aedes-persistence-nedb/_build/latest?definitionId=2)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/36fb257bd6d241f9b95fe63d74c69a24)](https://www.codacy.com/app/ovhemert/aedes-persistence-nedb?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ovhemert/aedes-persistence-nedb&amp;utm_campaign=Badge_Grade)
[![Dependencies](https://img.shields.io/david/ovhemert/aedes-persistence-nedb.svg)]()
[![Known Vulnerabilities](https://snyk.io/test/npm/aedes-persistence-nedb/badge.svg)](https://snyk.io/test/npm/aedes-persistence-nedb)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

# aedes-persistence-nedb

[Aedes][aedes] persistence, backed by [NeDB][nedb].

See [aedes-persistence][persistence] for the full API, and [Aedes][aedes] for usage.

## Install

```sh
npm i aedes aedes-persistence-nedb --save
```

## API

### Persistence (options)

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

Osmond van Hemert
[![Github](https://img.shields.io/badge/-website.svg?style=social&logoColor=333&logo=github)](https://github.com/ovhemert/about)
[![Web](https://img.shields.io/badge/-website.svg?style=social&logoColor=333&logo=nextdoor)](https://www.osmondvanhemert.nl)

## Contributing

See the [CONTRIBUTING](./docs/CONTRIBUTING.md) file for details.

## License

MIT

[aedes]: https://github.com/mcollina/aedes
[persistence]: https://github.com/mcollina/aedes-persistence
[nedb]: https://github.com/louischatriot/nedb
