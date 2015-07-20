'use strict';

define(function(require) {
    var Bacon = require('./ext/Bacon');
    var _ = require('underscore');

    var geolocation = navigator.geolocation;

    /**
      * Wrap the navigator.getCurrentPosition as a streameable value
      *
      * @param {PositionOptions} options
      *   - {Number} maximumAge Maximum age acceptable for the position
      *   - {Number} timeout Maximim waiting time to get the position
      *   - {Boolean} enableHighAccuracy true use the GPS (default),
      *                                  false use Network location
      */
    var streamSinglePosition = function(options) {
        var defaultOptions = {
            enableHighAccuracy: true,
            timeout: Infinity,
            maximumAge: Infinity
        };

        var positionOptions = _.assign(defaultOptions, options);

        return new Bacon.fromBinder(function(sink) {
            geolocation.getCurrentPosition(
                // Success
                function(data) {
                    sink(new Bacon.Next(data));
                },
                // Error
                function(err) {
                    sink(new Bacon.Error(err));
                },
                positionOptions
            );

            // Unsubscribe function
            return Bacon.nop;
        });
    };

    /**
      * Wrap the navigator.watchPosition as a stream
      *
      * @param {PositionOptions} options
      *   - {Boolean} enableHighAccuracy true use the GPS (default)
      */
    var streamMultiplePositions = function(options) {
        var positionOptions = _.assign({ enableHighAccuracy: true}, options);

        return new Bacon.fromBinder(function(sink) {
            var watchID = geolocation.watchPosition(
                // Success
                function(data) {
                    sink(new Bacon.Next(data));
                },
                // Error
                function(err) {
                    sink(new Bacon.Error(err));
                },
                positionOptions
            );

            // Unsubscribe function
            return function() {
                geolocation.clearWatch(watchID);
            };
        });
    };

    /**
     * Fetch a position using the network location
     *
     * @param {Number} maximumAge
     * @param {Number} timeout in miliseconds
     * @retuns a stream with a single position
     */
    var fetchNetworkLocation = function(maximumAge, timeout) {
        return streamSinglePosition({
            maximumAge: maximumAge,
            timeout: timeout,
            enableHighAccuracy: false
        });
    };

    /**
     * Fetch a position using the network location
     *
     * @param {Number} maximumAge
     * @param {Number} timeout in miliseconds
     */
    var fetchGPSLocation = function(maximumAge, timeout) {
        return streamSinglePosition({
            maximumAge: maximumAge,
            timeout: timeout,
            enableHighAccuracy: true
        });
    };

    return {
        streamMultiplePositions: streamMultiplePositions,
        streamSinglePosition: streamSinglePosition,
        fetchNetworkLocation: fetchNetworkLocation,
        fetchGPSLocation: fetchGPSLocation
    };
});
