'use strict';

angular.module('copayApp.controllers').controller('AddressesController',
  function($scope, $rootScope, $timeout, $modal, controllerUtils) {
    $scope.loading = false;
    var w = $rootScope.wallet;

    $scope.newAddr = function() {
      $scope.loading = true;
      w.generateAddress(null, function() {
        $timeout(function() {
          controllerUtils.setSocketHandlers();
          controllerUtils.updateAddressList();
          $scope.loading = false;
        }, 1);
      });
    };

    $scope.openAddressModal = function(address) {
      var ModalInstanceCtrl = function ($scope, $modalInstance, address) {
        $scope.address = address;

        $scope.openExternal = function(address) {
          var url = 'bitcoin:' + address;
          if (window.cordova) return window.open(url, '_blank');

          window.location = url;
        }

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };
      };

      $modal.open({
        templateUrl: 'views/modals/qr-address.html',
        windowClass: 'tiny',
        controller: ModalInstanceCtrl,
        resolve: {
          address: function() { return address; }
        }
      });
    };

    $rootScope.$watch('addrInfos', function() {
      $scope.addressList();
    });

    $scope.addressList = function() {
      $scope.addresses = [];
      var addrInfos = $rootScope.addrInfos;
      if (addrInfos) {
        for (var i = 0; i < addrInfos.length; i++) {
          var addrinfo = addrInfos[i];
          $scope.addresses.push({
            'address': addrinfo.addressStr,
            'balance': $rootScope.balanceByAddr ? $rootScope.balanceByAddr[addrinfo.addressStr] : 0,
            'isChange': addrinfo.isChange,
            'owned': addrinfo.owned
          });
        }
      }
    }
  }
);
