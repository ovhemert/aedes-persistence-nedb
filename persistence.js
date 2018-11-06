'use strict';

var Buffer = require('buffer').Buffer;
var EventEmitter = require('events').EventEmitter;
var Path = require('path');
var Stream = require('stream');
var Util = require('util');

var NeDB = require('nedb');
var Packet = require('aedes-packet');

function transformPacket (packet) {
  var res = Object.assign({}, packet);
  if (packet.payload && Buffer.isBuffer(packet.payload)) {
    var obj = JSON.parse(JSON.stringify(packet.payload));
    res.payload = obj;
  } else if (packet.payload && packet.payload.type === 'Buffer') {
    var buffer = Buffer.from(packet.payload.data);
    res.payload = buffer;
  }
  return res;
}

function Persistence (options) {
  if (!(this instanceof Persistence)) {
    return new Persistence(options);
  }

  var self = this;
  self._options = options || {};
  self._path = self._options.path || './data';
  self._prefix = (self._options.prefix) ? (self._options.prefix + '.') : '';
  self._ready = { incoming: false, outgoing: false, retained: false, subscriptions: false, wills: false };
  self.ready = false;

  function _checkAllReady () {
    var allReady = true;
    for (var item in self._ready) {
      if (self._ready[item] === false) {
        allReady = false;
        return;
      }
    }
    self.ready = allReady;
    self.emit('ready');
  }

  function _getStorage (name) {
    var _name = name;
    var filename = Path.join(self._path, self._prefix + _name + '.db');
    var storage = new NeDB({
      filename: filename,
      autoload: true,
      onload: function () {
        self._ready[_name] = true;
        _checkAllReady();
      } });
    storage.persistence.setAutocompactionInterval(60 * 1000);
    return storage;
  }

  self.incoming = _getStorage('incoming');
  self.outgoing = _getStorage('outgoing');
  self.retained = _getStorage('retained');
  self.subscriptions = _getStorage('subscriptions');
  self.wills = _getStorage('wills');
  return self;
}
Util.inherits(Persistence, EventEmitter);

Persistence.prototype.storeRetained = function (packet, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.storeRetained.bind(self, packet, callback));
    return;
  }
  if (packet.payload.length > 0) {
    var pkt = transformPacket(packet);
    self.retained.update({ topic: packet.topic }, pkt, { upsert: true }, function (err, num, docs) {
      return callback(err);
    });
  } else {
    self.retained.remove({ topic: packet.topic }, { multi: true }, function (err, num) {
      return callback(err);
    });
  }
};

Persistence.prototype.createRetainedStream = function (pattern) {
  return this.createRetainedStreamCombi([pattern]);
};

Persistence.prototype.createRetainedStreamCombi = function (patterns) {
  var self = this;
  var topics = patterns.map(function (pattern) { return { topic: new RegExp(pattern.replace(/(#|\+).*$/, '')) }; });
  var readable = new Stream.Readable({ objectMode: true });
  readable.curIndex = 0;
  readable._read = function (size) {
    self.retained.find({ $or: topics }, { _id: 0 }).skip(readable.curIndex).limit(1).exec(function (err, docs) {
      if (err || docs.length === 0) { return readable.push(null); }
      readable.curIndex++;
      var packet = transformPacket(docs[0]);
      readable.push(packet);
    });
  };
  return readable;
};

Persistence.prototype.addSubscriptions = function (client, subs, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.addSubscriptions.bind(self, client, subs, callback));
    return;
  }
  var topics = subs.map(function (sub) { return sub.topic; });
  var criteria = { clientId: client.id, topic: { $in: topics } };
  self.subscriptions.remove(criteria, { multi: true }, function (err, count) {
    if (err) { return callback(err, client); }
    var inserts = subs.map(function (sub) { return { clientId: client.id, topic: sub.topic, qos: sub.qos }; });
    self.subscriptions.insert(inserts, function (err, inserted) {
      return callback(err, client);
    });
  });
};

Persistence.prototype.removeSubscriptions = function (client, subs, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.removeSubscriptions.bind(self, client, subs, callback));
    return;
  }
  var criteria = { clientId: client.id, topic: { $in: subs } };
  self.subscriptions.remove(criteria, { multi: true }, function (err, count) {
    return callback(err, client);
  });
};

Persistence.prototype.subscriptionsByClient = function (client, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.subscriptionsByClient.bind(self, client, callback));
    return;
  }
  self.subscriptions.find({ clientId: client.id }).sort({ topic: 1 }).exec(function (err, docs) {
    if (err) { return callback(err, null, client); }
    var subs = docs.map(function (doc) { return { topic: doc.topic, qos: doc.qos }; });
    var res = (subs.length > 0) ? subs : null;
    callback(null, res, client);
  });
};

Persistence.prototype.countOffline = function (callback) {
  var self = this;
  self.subscriptions.find({ qos: { $gt: 0 } }, function (err, docs) {
    if (err) { return callback(err, 0, 0); }
    var counts = docs.reduce(function (totals, doc) {
      if (totals.subs.indexOf(doc.topic) < 0) { totals.subs.push(doc.topic); }
      if (totals.clients.indexOf(doc.clientId) < 0) { totals.clients.push(doc.clientId); }
      return totals;
    }, { subs: [], clients: [] });
    return callback(err, counts.subs.length, counts.clients.length);
  });
};

Persistence.prototype.subscriptionsByTopic = function (pattern, callback) {
  var self = this;
  self.subscriptions.find({ topic: new RegExp(pattern.replace(/(#|\+).*$/, '')), qos: { $gt: 0 } }, { _id: 0 }).sort({ topic: -1 }).exec(function (err, docs) {
    return callback(err, docs);
  });
};

Persistence.prototype.cleanSubscriptions = function (client, callback) {
  var self = this;
  self.subscriptions.remove({ clientId: client.id }, { multi: true }, function (err, count) {
    return callback(err, client);
  });
};

Persistence.prototype.outgoingEnqueue = function (sub, packet, callback) {
  this.outgoingEnqueueCombi([sub], packet, callback);
};

Persistence.prototype.outgoingEnqueueCombi = function (subs, packet, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.outgoingEnqueue.bind(self, subs, packet, callback));
    return;
  }
  var docs = subs.map(function (sub) { return { clientId: sub.clientId, packet: transformPacket(new Packet(packet)) }; });
  self.outgoing.insert(docs, function (err, inserted) {
    return callback(err);
  });
};

Persistence.prototype.outgoingUpdate = function (client, packet, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.outgoingUpdate.bind(self, client, packet, callback));
    return;
  }
  var query = {}; var changes = {};
  if (packet.brokerId) {
    query = { clientId: client.id, 'packet.brokerId': packet.brokerId, 'packet.brokerCounter': packet.brokerCounter };
    changes = { $set: { 'packet.messageId': packet.messageId } };
  } else {
    query = { clientId: client.id, 'packet.messageId': packet.messageId };
    changes = { clientId: client.id, packet: packet };
  }
  self.outgoing.update(query, changes, { returnUpdatedDocs: true }, function (err, num, doc) {
    if (doc) {
      var pkt = transformPacket(doc.packet);
      return callback(err, client, pkt);
    } else {
      return callback(err, client, {});
    }
  });
};

Persistence.prototype.outgoingClearMessageId = function (client, packet, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.outgoingClearMessageId.bind(self, client, packet, callback));
    return;
  }
  var query = { clientId: client.id, 'packet.messageId': packet.messageId };
  self.outgoing.findOne(query, function (err, doc) {
    if (err) { return callback(err); }
    if (!doc) { return callback(null); }
    self.outgoing.remove(query, function (err, count) {
      return callback(err, transformPacket(doc.packet));
    });
  });
};

Persistence.prototype.outgoingStream = function (client) {
  var self = this;
  var readable = new Stream.Readable({ objectMode: true });
  readable.curIndex = 0;
  readable._read = function (size) {
    self.outgoing.find({ clientId: client.id }, { _id: 0 }).skip(readable.curIndex).limit(1).exec(function (err, docs) {
      if (err || docs.length === 0) { return readable.push(null); }
      readable.curIndex++;
      var packet = transformPacket(docs[0].packet);
      readable.push(packet);
    });
  };
  return readable;
};

Persistence.prototype.incomingStorePacket = function (client, packet, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.incomingStorePacket.bind(self, client, packet, callback));
    return;
  }
  var np = transformPacket(new Packet(packet));
  np.messageId = packet.messageId;
  var doc = { clientId: client.id, packet: np };
  self.incoming.insert(doc, function (err, inserted) {
    return callback(err);
  });
};

Persistence.prototype.incomingGetPacket = function (client, packet, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.incomingGetPacket.bind(self, client, packet, callback));
    return;
  }
  var query = { clientId: client.id, 'packet.messageId': packet.messageId };
  self.incoming.findOne(query, function (err, doc) {
    if (err) { return callback(err); }
    if (!doc) { return callback(new Error('packet not found'), null, client); }
    var pkt = transformPacket(doc.packet);
    return callback(null, pkt, client);
  });
};

Persistence.prototype.incomingDelPacket = function (client, packet, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.incomingDelPacket.bind(self, client, packet, callback));
    return;
  }
  var query = { clientId: client.id, 'packet.messageId': packet.messageId };
  self.incoming.remove(query, function (err, count) {
    return callback(err);
  });
};

Persistence.prototype.putWill = function (client, packet, callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.putWill.bind(self, client, packet, callback));
    return;
  }
  packet.clientId = client.id;
  packet.brokerId = self.broker.id;
  var pkt = transformPacket(packet);
  self.wills.insert({ clientId: client.id, packet: pkt }, function (err, inserted) {
    return callback(err, client);
  });
};

Persistence.prototype.getWill = function (client, callback) {
  var self = this;
  self.wills.findOne({ clientId: client.id }, function (err, doc) {
    if (err) { return callback(err); }
    if (!doc) { return callback(null, null, client); }
    var packet = transformPacket(doc.packet);
    return callback(null, packet, client);
  });
};

Persistence.prototype.delWill = function (client, callback) {
  var self = this;
  self.getWill(client, function (err, packet) {
    if (err || !packet) { return callback(err, null, client); }
    self.wills.remove({ clientId: client.id }, { multi: true }, function (err, count) {
      return callback(err, packet, client);
    });
  });
};

Persistence.prototype.streamWill = function (brokers) {
  var self = this;
  var readable = new Stream.Readable({ objectMode: true });
  readable.curIndex = 0;
  readable._read = function (size) {
    var query = (brokers) ? { 'packet.brokerId': { $nin: Object.keys(brokers) } } : {};
    self.wills.find(query).skip(readable.curIndex).limit(1).exec(function (err, docs) {
      if (err || docs.length === 0) { return readable.push(null); }
      readable.curIndex++;
      var packet = transformPacket(docs[0].packet);
      readable.push(packet);
    });
  };
  return readable;
};

Persistence.prototype.getClientList = function (topic) {
  var self = this;
  var readable = new Stream.Readable({ objectMode: true });
  readable.curIndex = 0;
  readable._read = function (size) {
    var query = (topic) ? { topic: topic } : {};
    self.subscriptions.find(query).sort({ clientId: 1 }).skip(readable.curIndex).limit(1).exec(function (err, docs) {
      if (err || docs.length === 0) { return readable.push(null); }
      readable.curIndex++;
      readable.push(docs[0].clientId);
    });
  };
  return readable;
};

Persistence.prototype.removeAll = function (callback) {
  var self = this;
  if (!self.ready) {
    self.once('ready', self.removeAll.bind(self, callback));
    return;
  }
  self.incoming.remove({}, { multi: true }, function (err) {
    if (err) { return callback(err); }
    self.outgoing.remove({}, { multi: true }, function (err) {
      if (err) { return callback(err); }
      self.retained.remove({}, { multi: true }, function (err) {
        if (err) { return callback(err); }
        self.subscriptions.remove({}, { multi: true }, function (err) {
          if (err) { return callback(err); }
          self.wills.remove({}, { multi: true }, function (err) {
            callback(err);
          });
        });
      });
    });
  });
};

Persistence.prototype.destroy = function (callback) {
  var self = this;
  if (self._destroyed) {
    throw new Error('destroyed called twice!');
  }
  self._destroyed = true;
  self.incoming = null;
  self.outgoing = null;
  self.retained = null;
  self.subscriptions = null;
  self.wills = null;
  self.removeAllListeners();

  if (callback) {
    return callback();
  }
};

module.exports = Persistence;
