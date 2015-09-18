'use strict';

/* global cordova */

define(function(require) {
    var _ = require('underscore');
    var location = require('./location');
    var utils = require('./utils');
    var recorderManager = require('./position-recorders-manager').PositionRecordersManager;

    //Constants
    var PLUGIN_PATH = 'plugins/position-tracking';

    var templates = {};
    templates.groupItem = _.template(
        '<li class="group">' +
            '<span><%-name%></span>' +
        '</li>'
    );

    templates.editorItem = _.template(
        '<li class="editor" data-editor-id="<%=editorId%>" data-group-id="<%=groupId%>">' +
            '<div class="recording">' +
                '<div class="editor-label"><%-name%></div>' +
                '<div class="controls">' +
                    '<div class="control-button record off" data-action="start"></div>' +
                    '<div class="control-button more" data-action="more"></div>' +
                '</div>' +
            '</div>' +
            '<div class="saving" style="display: none">' +
                '<div class="session">' +
                    '<input type="text" />' +
                '</div>' +
                '<div class="controls">' +
                    '<div class="control-button back" data-action="back"></div>' +
                    '<div class="control-button add" data-action="add"></div>' +
                    '<div class="control-button discard" data-action="discard"></div>' +
                '</div>' +
            '</div>' +
        '</li>'
    );

    /**
     * Render the list of editors and the recording controls
     */
    var renderEditorsList = function() {
        var editorsMetadata = utils.getLocalItem('editors-metadata');
        var html = '';

        _.forEach(editorsMetadata, function(editors, group) {
            // Add a group separator if has items
            if (_.keys(editors).length > 0) {
                html += templates.groupItem({
                    name: group
                });
            }

            // Add the editors
            _.forEach(editors, function(editor) {
                html += templates.editorItem({
                    name: editor.title,
                    editorId: editor.type,
                    groupId: editor.group
                });
            });
        });

        $('#position-tracking-editors-list')
            .html(html)
            .listview('refresh');
    };

    var registerControlEvents = function() {

        var toggleRecordButton = function($control, recorder) {
            var $recordButton = $control.find('.control-button.record');

            if (recorder && recorder.isRecording()) {
                $recordButton
                    .removeClass('off')
                    .addClass('on');
            }
            else {
                $recordButton
                    .removeClass('on')
                    .addClass('off');
            }
        };

        var getActionName = function($target) {
            var controlTypes = ['record', 'pause', 'stop'];
            var action;

            action = _.find(controlTypes, function(className) {
                return $target.hasClass(className);
            });

            return action;
        };

        $('#position-tracking-editors-list').on('vclick', '.control-button', function(event) {
            var recorder;
            var $targetButton = $(event.target);
            var $controls = $targetButton.parent('.controls');
            var editorId = $controls.data('editor-id');
            var groupId = $controls.data('group-id');

            switch (getActionName($targetButton)) {
                case 'record':
                    recorder = recorderManager.startRecorder(editorId, groupId);
                    break;
                case 'pause':
                    recorder = recorderManager.pauseRecorder(editorId, groupId);
                    break;
                case 'stop':
                    recorder = recorderManager.stopRecorder(editorId, groupId);
                    break;
            }

            toggleRecordButton($controls, recorder);
        });
    };

    /**
     * Initialize the plugin
     */
    var initPlugin = function() {
        // Inject the plugin styles
        $('head').prepend('<link rel="stylesheet" href="' + PLUGIN_PATH + '/css/style.css" type="text/css" />');

        $(document).on('vclick', '.position-tracking-page-button', function(event) {
            event.preventDefault();
            $('body').pagecontainer('change', 'position-tracking-main-page.html');
        });

        $(document).on('pagebeforeshow', '#position-tracking-main-page', function() {
            renderEditorsList();
            registerControlEvents();
        });
    };

    initPlugin();
});
