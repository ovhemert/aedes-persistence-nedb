'use strict'

var test = require('tape').test
var database = require('./')
var abs = require('./abstract')

abs({
  test: test,
  persistence: database
})
