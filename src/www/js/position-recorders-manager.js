'use strict';

/* global cordova */

define(function(require) {
    var PositionRecorder = require('./position-recorder');
    var positionUtils = require('./position-utils');
    var records = require('records');

    var SESSION_PREFIX = 'track-';

    /**
     * Extend a geoJSON object as a record and wrap it in an annotation
     *
     * @param geoJSON {Object} a geoJSON object
     * @param editorId {String} an editor id
     * @param groupId {String} a group id
     * @param name {String} a record name
     * @returns {Object} an annotation
     */
    var geoJSONAsAnnotation = function(geoJSON, editorId, groupId, name) {
        var record;
        var annotation;

        // Add the mandatory properties for the record
        record = geoJSON;
        record.properties = record.properties || {};
        record.name = name;
        record.properties.editor = editorId;
        record.properties.fields = [];

        // Wrap the record as an annotation
        annotation =  {
            record: geoJSON,
            type: editorId,
            isSynced: false,
            editorGroup: groupId
        };

        return annotation;
    };

    /**
     * The position recorders are stored using a combined key groupId plus editorId
     * this is a helper function to store them under that scheme.
     * @returns {Object} exporting the get, getAll, put and remove functions
     */
    var PositionRecorders = function() {
        var recorders = {};

        var makeId = function(editorId, groupId) {
            return groupId + '#' + editorId;
        };

        /**
         * Returns the list of recorders
         * @returns {Object} list of {PositionRecorder} sessions
         */
        var getAll = function() {
            return recorders;
        };

        /**
         * Get the position recorder stored in the combined keys
         * @param editorId {String} an editor id
         * @param groupId {String} a group id
         * @returns {PositionRecorder} a position recorder
         */
        var get = function(editorId, groupId) {
            return recorders[makeId(editorId, groupId)];
        };

        /**
         * Put a position recorder in the combined keys
         * @param recorder
         * @param editorId {String} an editor id
         * @param groupId {String} a group id
         */
        var put = function(recorder, editorId, groupId) {
            recorders[makeId(editorId, groupId)] = recorder;
        };

        /**
         * Remove a position recorder stored in that combined keys
         * @param editorId {String} an editor id
         * @param groupId {String} a group id
         */
        var remove = function(editorId, groupId) {
            delete recorders[makeId(editorId, groupId)];
        };

        return {
            get: get,
            getAll: getAll,
            put: put,
            remove: remove
        };
    };

    /**
     * A function to store and handle the position recorders
     * @returns {Object} exporting the startRecorder, pauseRecorder, stopRecorder
     * and getRecorders functions
     */
    var PositionRecordersManager = function() {
        var recorders = new PositionRecorders();

        /**
         * Return the position recorders registered
         * @returns {Object} of {PositionRecorder} recorders
         */
        var getRecorders = function(editorId, groupId) {
            return recorders.getAll();
        };

        /**
         * Return the position recorders registered
         * @returns {Object} of {PositionRecorder} recorders
         */
        var getRecorder = function(editorId, groupId) {
            return recorders.get(editorId, groupId);
        };

        /**
         * Start or continue a position recorder
         * @param editorId {String} an editor id
         * @param groupId {String} a group id
         * @returns {PositionRecorder} a position recorded recording
         */
        var startRecorder = function(editorId, groupId) {
            var recorder;
            recorder = recorders.get(editorId, groupId);

            if (!recorder) {
                recorder = new PositionRecorder();
                recorders.put(recorder, editorId, groupId);
            }

            if (!recorder.isRecording()) {
                recorder.startRecording();
            }

            return recorder;
        };

        /**
         * Pause a position recorder
         * @param editorId {String} an editor id
         * @param groupId {String} a group id
         * @returns {PositionRecorder} a position recorded recording
         */
        var pauseRecorder = function(editorId, groupId) {
            var recorder;
            recorder = recorders.get(editorId, groupId);

            if (recorder) {
                recorder.stopRecording();
            }

            return recorder;
        };

        /**
         * Save the positions of the position recorder as a record
         * @param recorder {PositionRecorder} a position recorder
         * @param editorId {String} an editor id
         * @param groupId {String} a group id
         */
        var saveRecorder = function(editorId, groupId, recordName) {
            var positions = [];
            var geoJSON;
            var annotation;
            var recorder = recorders.get(editorId, groupId);

            if (recorder) {
                positions = recorder.getRecordedPositions();
            }
            else {
                console.warn('Not recorder found (' + editorId + ', ' + groupId + ')');
            }

            if (positions.length > 0) {
                if (positions.length == 1) {
                    geoJSON = positionUtils.
                        positionToGeoJSONPoint(positions[0], true);
                }
                else {
                    geoJSON = positionUtils
                        .positionsToLineString(positions, true);
                }

                annotation = geoJSONAsAnnotation(
                    geoJSON, SESSION_PREFIX + editorId, groupId, recordName);

                records.saveAnnotation(undefined, annotation);

            }
            else {
                console.warn('0 Positions recorded');
            }
        };

        /**
         * Stops a position recorder
         * @param editorId {String} an editor id
         * @param groupId {String} a group id
         * @returns {PositionRecorder} a position recorded recording
         */
        var stopRecorder = function(editorId, groupId) {
            var recorder;

            recorder = recorders.get(editorId, groupId);

            if (recorder) {
                recorder.stopRecording();
            }

            return recorder;
        };

        var disposeRecorder = function(editorId, groupId) {
            stopRecorder(editorId, groupId);
            recorders.remove(editorId, groupId);
        };

        return {
            startRecorder: startRecorder,
            pauseRecorder: pauseRecorder,
            stopRecorder: stopRecorder,
            getRecorders: getRecorders,
            getRecorder: getRecorder,
            saveRecorder: saveRecorder,
            disposeRecorder: disposeRecorder
        };
    };

    return {
        PositionRecordersManager: new PositionRecordersManager()
    };
});
