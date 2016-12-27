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
  path: './db'  // defaults to './data'
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

## License

MIT

[aedes]: https://github.com/mcollina/aedes
[persistence]: https://github.com/mcollina/aedes-persistence
[nedb]: https://github.com/louischatriot/nedb
