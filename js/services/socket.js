'use strict';

angular.module('copayApp.services').factory('Socket',
  function($rootScope) {
    var listeners = [];
    var url = (config.socket.schema || 'http') + '://' + config.socket.host + ':' + config.socket.port;
    var opts = {
      'reconnection': true,
      'reconnectionDelay': config.socket.reconnectDelay || 500,
      'secure': config.socket.schema === 'https' ? true : false,
    };

    var socket = io(url, opts);

    return {
      on: function(event, callback) {
        var wrappedCallback = function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        };
        socket.on(event, wrappedCallback);
        if (event !== 'connect') {
          listeners.push({
            event: event,
            fn: wrappedCallback
          });
        }
      },
      sysOn: function(event, callback) {
        var wrappedCallback = function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        };
        socket.io.on(event, wrappedCallback);
      },
      getListeners: function() {
        var ret = {};

        var addrList = listeners
          .filter(function(i) {
            return i.event != 'block';
          })
          .map(function(i) {
            return i.event;
          });

        for (var i in addrList) {
          ret[addrList[i]] = 1;
        }
        return ret;
      },
      isListeningBlocks: function() {
        return listeners.filter(function(i) {
          return i.event == 'block';
        }).length > 0;
      },
      emit: function(event, data, callback) {
        socket.emit(event, data, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      },
      removeAllListeners: function() {
        for (var i = 0; i < listeners.length; i++) {
          var details = listeners[i];
          socket.removeAllListeners(details.event);
        }

        listeners = [];
      }
    };
  });
