//
// test/unit/controllers/controllersSpec.js
//

var sinon = require('sinon');

// Replace saveAs plugin
saveAsLastCall = null;
saveAs = function(o) {
  saveAsLastCall = o;
};


describe("Unit: Controllers", function() {
  var invalidForm = {
    $invalid: true
  };

  var scope;

  beforeEach(module('copayApp.services'));
  beforeEach(module('copayApp.controllers'));

  var config = {
    requiredCopayers: 3,
    totalCopayers: 5,
    spendUnconfirmed: 1,
    reconnectDelay: 100,
    networkName: 'testnet'
  };

  describe('Backup Controller', function() {
    var ctrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();

      $rootScope.wallet = new FakeWallet(config);
      ctrl = $controller('BackupController', {
        $scope: scope,
        $modal: {},
      });
    }));

    it('Backup controller #download', function() {
      scope.wallet.setEnc('1234567');
      expect(saveAsLastCall).equal(null);
      scope.downloadBackup();
      expect(saveAsLastCall.size).equal(7);
      expect(saveAsLastCall.type).equal('text/plain;charset=utf-8');
    });

    it('Backup controller #delete', function() {
      expect(scope.wallet).not.equal(undefined);
      scope.deleteWallet();
      expect(scope.wallet).equal(undefined);
    });
  });

  describe('Setup Controller', function() {
    var setupCtrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      setupCtrl = $controller('SetupController', {
        $scope: scope,
      });
    }));

    describe('#getNumber', function() {
      it('should return an array of n undefined elements', function() {
        var n = 5;
        var array = scope.getNumber(n);
        expect(array.length).equal(n);
      });
    });
    describe('#create', function() {
      it('should work with invalid form', function() {
        scope.create(invalidForm);
      });
    });

  });

  describe('Address Controller', function() {
    var addressCtrl;
    beforeEach(angular.mock.module('copayApp'));
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      addressCtrl = $controller('AddressesController', {
        $scope: scope,
      });
    }));

    it('should have a AddressesController controller', function() {
      expect(scope.loading).equal(false);
    });
  });

  describe('Transactions Controller', function() {
    var transactionsCtrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      transactionsCtrl = $controller('TransactionsController', {
        $scope: scope,
      });
    }));

    it('should have a TransactionController controller', function() {
      expect(scope.loading).equal(false);
    });

    it('should return an empty array of tx from insight', function() {
      scope.getTransactions();
      expect(scope.blockchain_txs).to.be.empty;
    });
  });

  describe('Send Controller', function() {
    var scope, form, sendForm;
    beforeEach(angular.mock.module('copayApp'));
    beforeEach(angular.mock.inject(function($compile, $rootScope, $controller) {
      scope = $rootScope.$new();
      $rootScope.wallet = new FakeWallet(config);
      var element = angular.element(
        '<form name="form">' +
        '<input type="text" id="newaddress" name="newaddress" ng-disabled="loading" placeholder="Address" ng-model="newaddress" valid-address required>' +
        '<input type="text" id="newlabel" name="newlabel" ng-disabled="loading" placeholder="Label" ng-model="newlabel" required>' +
        '</form>'
      );
      scope.model = {
        newaddress: null,
        newlabel: null,
        address: null,
        amount: null
      };
      $compile(element)(scope);

      var element2 = angular.element(
        '<form name="form2">' +
        '<input type="text" id="address" name="address" ng-model="address" valid-address required>' +
        '<input type="number" id="amount" name="amount" ng-model="amount" min="1" max="10000000000" required>' +
        '<textarea id="comment" name="comment" ng-model="commentText" ng-maxlength="100"></textarea>' +
        '</form>'
      );
      $compile(element2)(scope);
      $controller('SendController', {
        $scope: scope,
        $modal: {},
      });

      scope.$digest();
      form = scope.form;
      sendForm = scope.form2;
    }));

    it('should have a SendController controller', function() {
      expect(scope.loading).equal(false);
    });

    it('should have a title', function() {
      expect(scope.title).equal('Send');
    });

    it('should return true if wallet has addressBook', function() {
      expect(scope.showAddressBook()).equal(true);
    });

    it('should validate address with network', function() {
      form.newaddress.$setViewValue('1JqniWpWNA6Yvdivg3y9izLidETnurxRQm');
      expect(form.newaddress.$invalid).to.equal(false);
    });

    it('should not validate address with other network', function() {
      form.newaddress.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      expect(form.newaddress.$invalid).to.equal(true);
    });

    it('should not validate random address', function() {
      form.newaddress.$setViewValue('thisisaninvalidaddress');
      expect(form.newaddress.$invalid).to.equal(true);
    });

    it('should validate label', function() {
      form.newlabel.$setViewValue('John');
      expect(form.newlabel.$invalid).to.equal(false);
    });

    it('should not validate label', function() {
      expect(form.newlabel.$invalid).to.equal(true);
    });

    it('should create a transaction proposal', function() {
      sendForm.address.$setViewValue('1JqniWpWNA6Yvdivg3y9izLidETnurxRQm');
      sendForm.amount.$setViewValue(1000);

      var spy = sinon.spy(scope.wallet, 'createTx');
      var spy2 = sinon.spy(scope.wallet, 'sendTx');
      scope.submitForm(sendForm);
      sinon.assert.callCount(spy, 1);
      sinon.assert.callCount(spy2, 0);
    });

    it('should create and send a transaction proposal', function() {
      sendForm.address.$setViewValue('1JqniWpWNA6Yvdivg3y9izLidETnurxRQm');
      sendForm.amount.$setViewValue(1000);

      scope.wallet.totalCopayers = scope.wallet.requiredCopayers = 1;
      var spy = sinon.spy(scope.wallet, 'createTx');
      var spy2 = sinon.spy(scope.wallet, 'sendTx');

      scope.submitForm(sendForm);
      sinon.assert.callCount(spy, 1);
      sinon.assert.callCount(spy2, 1);
    });

  });

  describe("Unit: Sidebar Controller", function() {
    var scope, $httpBackendOut;
    var GH = 'https://api.github.com/repos/bitpay/copay/tags';
    beforeEach(inject(function($controller, $injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.when('GET', GH)
        .respond([{
          name: "v100.1.6",
          zipball_url: "https://api.github.com/repos/bitpay/copay/zipball/v0.0.6",
          tarball_url: "https://api.github.com/repos/bitpay/copay/tarball/v0.0.6",
          commit: {
            sha: "ead7352bf2eca705de58d8b2f46650691f2bc2c7",
            url: "https://api.github.com/repos/bitpay/copay/commits/ead7352bf2eca705de58d8b2f46650691f2bc2c7"
          }
        }]);
    }));

    var rootScope;
    beforeEach(inject(function($controller, $rootScope) {
      rootScope = $rootScope;
      scope = $rootScope.$new();
      headerCtrl = $controller('SidebarController', {
        $scope: scope,
      });
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });



    it('should hit github for version', function() {
      $httpBackend.expectGET(GH);
      scope.$apply();
      $httpBackend.flush();
    });

    it('should check version ', inject(function($injector) {
      notification = $injector.get('notification');
      var spy = sinon.spy(notification, 'version');
      $httpBackend.expectGET(GH);
      scope.$apply();
      $httpBackend.flush();
      spy.calledOnce.should.equal(true);
    }));

    it('should check blockChainStatus', function() {
      $httpBackend.expectGET(GH);
      $httpBackend.flush();
      rootScope.insightError = 1;
      scope.$apply();
      expect(rootScope.insightError).equal(1);
      scope.$apply();
      expect(rootScope.insightError).equal(1);
      scope.$apply();
    });

    it('should return an array of n undefined elements', function() {
      $httpBackend.flush(); // need flush
      var n = 5;
      var array = scope.getNumber(n);
      expect(array.length).equal(n);
    });

  });

  describe('Send Controller', function() {
    var sendCtrl, form;
    beforeEach(inject(function($compile, $rootScope, $controller) {
      scope = $rootScope.$new();
      $rootScope.availableBalance = 123456;

      var element = angular.element(
        '<form name="form">' +
        '<input type="number" id="amount" name="amount" placeholder="Amount" ng-model="amount" min="0.0001" max="10000000" enough-amount required>' +
        '</form>'
      );
      scope.model = {
        amount: null
      };
      $compile(element)(scope);
      scope.$digest();
      form = scope.form;

      sendCtrl = $controller('SendController', {
        $scope: scope,
        $modal: {},
      });
    }));

    it('should have a SendController', function() {
      expect(scope.isMobile).not.to.equal(null);
    });
    it('should autotop balance correctly', function() {
      scope.topAmount(form);
      form.amount.$setViewValue(123356);
      expect(scope.amount).to.equal(123356);
      expect(form.amount.$invalid).to.equal(false);
      expect(form.amount.$pristine).to.equal(false);
    });
    it('should return available amount', function() {
      var amount = scope.getAvailableAmount();
      expect(amount).to.equal(123356);
    });
  });

  describe('Import Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      what = $controller('ImportController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });
  });

  describe('Open Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      what = $controller('OpenController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });
    describe('#open', function() {
      it('should work with invalid form', function() {
        scope.open(invalidForm);
      });
    });
  });

  describe('Join Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      what = $controller('JoinController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });
    describe('#join', function() {
      it('should work with invalid form', function() {
        scope.join(invalidForm);
      });
    });
  });

  describe('UriPayment Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      var routeParams = {
        data: 'bitcoin:19mP9FKrXqL46Si58pHdhGKow88SUPy1V8%3Famount=0.1&message=a%20bitcoin%20donation'
      };
      what = $controller('UriPaymentController', {
        $scope: scope,
        $routeParams: routeParams
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });

    it('should parse url correctly', function() {
      should.exist(what);
      scope.protocol.should.equal('bitcoin');
      scope.address.should.equal('19mP9FKrXqL46Si58pHdhGKow88SUPy1V8');
      scope.amount.should.equal(0.1);
      scope.message.should.equal('a bitcoin donation');
    });
  });

});
