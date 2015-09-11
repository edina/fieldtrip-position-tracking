'use strict';

/* global cordova */

define(function(require, exports) {
    var Bacon = require('./ext/Bacon');
    var location = require('./location');
    var positionStream = location.streamMultiplePositions();

    var PositionRecorder = function() {
        var recordingFlag = false;
        var positions = [];
        var recording;
        var control;
        var stream;

        /**
         * Return the status of the recorder
         * @returns {Boolean} true if recording, false if it not recording.
         */
        var isRecording = function() {
            return recordingFlag;
        };

        /**
         * Start to record positions
         * @returns a copy of the stream
         */
        var startRecording = function() {
            control =  new Bacon.Bus();
            stream = new Bacon.Bus();
            recordingFlag = true;

            positionStream
                .takeUntil(control)
                //.doLog()
                .onValue(function(position) {
                    positions.push(position);
                    stream.push(position);
                });

            return stream;
        };

        /**
         * Stop recording positions
         */
        var stopRecording = function() {
            control.push(new Bacon.End());
            recordingFlag = false;
        };

        /**
         * Get a list of positions recorded
         * @returns {Array} list of positions recorded
         */
        var getRecordedPositions = function() {
            return positions;
        };

        return {
            startRecording: startRecording,
            stopRecording: stopRecording,
            isRecording: isRecording,
            getRecordedPositions: getRecordedPositions
        };
    };

    return PositionRecorder;
});
