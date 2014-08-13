#!/usr/bin/env node

'use strict';

var fs = require('fs');
var browserify = require('browserify');
var browserPack = require('browser-pack');
var exec = require('child_process').exec;
var sys = require('sys');
var puts = function(error, stdout, stderr) {
  if (error) console.log(error);
  //sys.puts(stdout);
  //sys.puts(stderr);
};

var pack = function (params) {
  var file = require.resolve('soop');
  var dir = file.substr(0, file.length - String('soop.js').length);
  var preludePath = dir + 'example/custom_prelude.js';
  params.raw = true;
  params.sourceMapPrefix = '//#';
  params.prelude = fs.readFileSync(preludePath, 'utf8');
  params.preludePath = preludePath;
  return browserPack(params);
};

var createVersion = function() {
  var json = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  var content = 'module.exports="' + json.version + '";';
  fs.writeFileSync("./version.js", content);
};

var createBundle = function(opts) {
  opts.dir = opts.dir || 'js/';

  var bopts = {
    pack: pack,
    debug: true,
    standalone: 'copay',
    insertGlobals: true
  };
  var b = browserify(bopts);

  b.require('bitcore/node_modules/browserify-buffertools/buffertools.js', {
    expose: 'buffertools'
  });

  b.require('./copay', {
    expose: 'copay'
  });
  b.require('./version');
//  b.external('bitcore');
  b.require('./js/models/core/WalletFactory', {
    expose: '../js/models/core/WalletFactory'
  });
  b.require('./js/models/core/Wallet');
  b.require('./js/models/core/Wallet', {
    expose: '../js/models/core/Wallet'
  });
  b.require('./js/models/core/Wallet', {
    expose: '../../js/models/core/Wallet'
  });
  b.require('./test/mocks/FakeStorage', {
    expose: './mocks/FakeStorage'
  });
  b.require('./test/mocks/FakePayProServer', {
    expose: './mocks/FakePayProServer'
  });
  b.require('./test/mocks/FakePayProServer', {
    expose: '../../mocks/FakePayProServer'
  });
  b.require('./test/mocks/FakeBlockchain', {
    expose: './mocks/FakeBlockchain'
  });
  b.require('./test/mocks/FakeLocalStorage', {
    expose: './mocks/FakeLocalStorage'
  });
  b.require('./test/mocks/FakeNetwork', {
    expose: './mocks/FakeNetwork'
  });
  b.require('./js/models/network/WebRTC', {
    expose: '../js/models/network/WebRTC'
  });
  b.require('./js/models/blockchain/Insight', {
    expose: '../js/models/blockchain/Insight'
  });
  b.require('./js/models/core/PrivateKey', {
    expose: '../js/models/core/PrivateKey'
  });
  b.require('./js/models/core/PublicKeyRing', {
    expose: '../js/models/core/PublicKeyRing'
  });
  b.require('./js/models/core/Passphrase', {
    expose: '../js/models/core/Passphrase'
  });
  b.require('./js/models/core/Message', {
    expose: '../js/models/core/Message'
  });
  b.require('./config', {
    expose: '../config'
  });
  b.require('./js/models/core/HDPath', {
    expose: '../js/models/core/HDPath'
  });

  if (opts.debug) {
    //include dev dependencies
    b.require('sinon');
    b.require('blanket');
    b.require('soop');
  }

  if (!opts.debug) {
    b.transform({
      global: true
    }, 'uglifyify');
  }
  var bundle = b.bundle();
  return bundle;
};

if (require.main === module) {
  var list = function(val) {
    return val.split(',');
  };
  var program = require('commander');
  program
    .version('0.0.1')
    .option('-d, --debug', 'Development. Don\'t minify the codem and include debug packages.')
    .option('-o, --stdout', 'Specify output as stdout')
    .parse(process.argv);

  createVersion();
  var copayBundle = createBundle(program);
  copayBundle.pipe(program.stdout ? process.stdout : fs.createWriteStream('js/copayBundle.js'));
}

module.exports.createBundle = createBundle;
