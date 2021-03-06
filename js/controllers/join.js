'use strict';

angular.module('copayApp.controllers').controller('JoinController',
  function($scope, $rootScope, $timeout, walletFactory, controllerUtils, Passphrase, notification) {
    $scope.loading = false;

   // QR code Scanner
    var cameraInput;
    var video;
    var canvas;
    var $video;
    var context;
    var localMediaStream;

    var _scan = function(evt) {
      if (localMediaStream) {
        context.drawImage(video, 0, 0, 300, 225);

        try {
          qrcode.decode();
        } catch (e) {
          //qrcodeError(e);
        }
      }

      $timeout(_scan, 500);
    };

    var _successCallback = function(stream) {
      video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
      localMediaStream = stream;
      video.play();
      $timeout(_scan, 1000);
    };

    var _scanStop = function() {
      $scope.showScanner = false;
      if (!$scope.isMobile) {
        if (localMediaStream && localMediaStream.stop) localMediaStream.stop();
        localMediaStream = null;
        video.src = '';
      }
    };

    var _videoError = function(err) {
      _scanStop();
    };

    qrcode.callback = function(data) {
      _scanStop();

      $scope.$apply(function() {
        $scope.connectionId = data;
      });
    };

    $scope.cancelScanner = function() {
      _scanStop();
    };

    $scope.openScanner = function() {
      if (window.cordova) return $scope.scannerIntent();

      $scope.showScanner = true;

      // Wait a moment until the canvas shows
      $timeout(function() {
        canvas = document.getElementById('qr-canvas');
        context = canvas.getContext('2d');

        if ($scope.isMobile) {
          cameraInput = document.getElementById('qrcode-camera');
          cameraInput.addEventListener('change', _scan, false);
        } else {
          video = document.getElementById('qrcode-scanner-video');
          $video = angular.element(video);
          canvas.width = 300;
          canvas.height = 225;
          context.clearRect(0, 0, 300, 225);

          navigator.getUserMedia({
            video: true
          }, _successCallback, _videoError);
        }
      }, 500);
    };

    $scope.scannerIntent = function() {
      cordova.plugins.barcodeScanner.scan(
        function onSuccess(result) {
          if (result.cancelled) return;

          $scope.connectionId = result.text;
          $rootScope.$digest();
        },
        function onError(error) {
          alert('Scanning error');
        });
    }


    $scope.join = function(form) {
      if (form && form.$invalid) {
        notification.error('Error', 'Please enter the required fields');
        return;
      }

      $scope.loading = true;
      walletFactory.network.on('badSecret', function() {});

      Passphrase.getBase64Async($scope.joinPassword, function(passphrase) {
        walletFactory.joinCreateSession($scope.connectionId, $scope.nickname, passphrase, function(err, w) {
          $scope.loading = false;
          if (err || !w) {
            if (err === 'joinError')
              notification.error('Can\'t find peer.');
            else if (err === 'walletFull')
              notification.error('The wallet is full');
            else if (err === 'badNetwork')
              notification.error('Network Error', 'The wallet your are trying to join uses a different Bitcoin Network. Check your settings.');
            else if (err === 'badSecret')
              notification.error('Bad secret', 'The secret string you entered is invalid');
            else
              notification.error('Unknown error');
            controllerUtils.onErrorDigest();
          } else {
            controllerUtils.startNetwork(w, $scope);
          }
        });
      });
    }
  });
