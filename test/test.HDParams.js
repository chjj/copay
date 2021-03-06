'use strict';

var chai = chai || require('chai');
var should = chai.should();
var bitcore = bitcore || require('bitcore');
var Address = bitcore.Address;
var buffertools = bitcore.buffertools;
try {
  var copay = require('copay'); //browser
} catch (e) {
  var copay = require('../copay'); //node
}
var PublicKeyRing = copay.PublicKeyRing;
var HDParams = copay.HDParams;
var HDPath = copay.HDPath;


var config = {
  networkName: 'livenet',
};

var createAI = function() {
  var i = new HDParams();
  should.exist(i);

  i.copayerIndex = 1;

  return i;
};

describe('HDParams model', function() {

  it('should create an instance (livenet)', function() {
    var i = new HDParams();
    should.exist(i);
  });

  it('should init indexes', function() {
    var is = HDParams.init(2);
    should.exist(is);
    is.length.should.equal(3);

    var cosigners = is.map(function(i) { return i.copayerIndex; });
    cosigners.indexOf(HDPath.SHARED_INDEX).should.not.equal(-1);
    cosigners.indexOf(0).should.not.equal(-1);
    cosigners.indexOf(1).should.not.equal(-1);
    cosigners.indexOf(2).should.equal(-1);
  });

  it('should serialize to object list and back', function() {
    var is = HDParams.init(3);
    should.exist(is);
    is.length.should.equal(4);

    var list = HDParams.serialize(is);
    list.length.should.equal(4);

    var is2 = HDParams.fromList(list);
    is2.length.should.equal(4);
  });

  it('show be able to store and read', function() {
    var i = createAI();
    var changeN = 2;
    var addressN = 2;
    for (var j = 0; j < changeN; j++) {
      i.increment(true);
    }
    for (var j = 0; j < addressN; j++) {
      i.increment(false);
    }

    var data = i.toObj();
    should.exist(data);

    var i2 = HDParams.fromObj(data);
    i2.copayerIndex.should.equal(i.copayerIndex);

    i2.getChangeIndex().should.equal(changeN);
    i2.getReceiveIndex().should.equal(addressN);
  });

  it('should count generation indexes', function() {
    var j = createAI();
    for (var i = 0; i < 3; i++)
    j.increment(true);
    for (var i = 0; i < 2; i++)
    j.increment(false);

    j.changeIndex.should.equal(3);
    j.receiveIndex.should.equal(2);
  });

  it('#merge tests', function() {
    var j = createAI();

    for (var i = 0; i < 15; i++)
    j.increment(true);
    for (var i = 0; i < 7; i++)
    j.increment(false);
    var j2 = new HDParams({
      copayerIndex: j.copayerIndex,
    });
    j2.merge(j).should.equal(true);
    j2.changeIndex.should.equal(15);
    j2.receiveIndex.should.equal(7);

    j2.merge(j).should.equal(false);
  });

  it('#merge should fail with different copayerIndex index', function() {
    var j1 = new HDParams({ walletId: '1234', copayerIndex: 2 });
    var j2 = new HDParams({ walletId: '1234', copayerIndex: 3 });

    var merge = function() { j2.merge(j1); };
    merge.should.throw(Error);
  })

});
