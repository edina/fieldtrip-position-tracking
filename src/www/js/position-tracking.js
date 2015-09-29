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
            '<div class="editor-label"><%-name%></div>' +
            '<div style="display: none;" class="save-track">' +
                '<input class="record-name" type="text" placeholder="give the track a name"/>' +
            '</div>' +
            '<div class="controls">' +
                '<div class="control-button record off" data-action="start"></div>' +
                '<div class="control-button more" data-action="more"></div>' +
                '<div style="display: none;" class="control-button back" data-action="back"></div>' +
                '<div style="display: none;" class="control-button save disabled" data-action="save"></div>' +
                '<div style="display: none;" class="control-button discard disabled" data-action="discard"></div>' +
            '</div>' +
        '</li>'
    );

    /**
     * Goes through the list of editors and enable/disable the convenient controls
     * according to the status of the recorders
     */
    var updateEditorControls = function(editor) {
        var $editor = $(editor);
        var $controls = $editor.find('.controls');
        var editorId = $editor.data('editor-id');
        var groupId = $editor.data('group-id');
        var recorder = recorderManager.getRecorder(editorId, groupId);

        if (recorder) {
            if (recorder.isRecording()) {
                $controls.find('.control-button.record')
                    .removeClass('off')
                    .addClass('on')
                    .data('action', 'pause');
            }
            else {
                $controls.find('.control-button.record')
                .removeClass('on')
                .addClass('off')
                .data('action', 'start');
            }
        }
        else {
            $controls.find('.control-button.record')
                .removeClass('on')
                .addClass('off')
                .data('action', 'start');
        }
    };

    /**
     * Check if there is any recorder running and update the tracking icon in
     * the header
     */
    var toggleTrackingRunningIcon = function() {
        var recorders = recorderManager.getRecorders();
        var isRecording = function(recorder) {
            return recorder.isRecording();
        };
        if (_.some(recorders, isRecording)) {
            $('.position-tracking-running').show();
        }
        else {
            $('.position-tracking-running').hide();
        }
    };

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
            .trigger('update-controls')
            .listview('refresh');
    };

    var registerControlEvents = function() {
        $('#position-tracking-editors-list').on('input', 'input.record-name', function(event) {
            $(event.target).removeClass('error');
        });

        $('#position-tracking-editors-list').on('update-controls', function() {
            $(this)
                .find('li.editor')
                .each(function(index, editor) {
                    updateEditorControls(editor);
                });
            toggleTrackingRunningIcon();
        });

        var changeEditorViewState = function($editor, state) {
            var editorView = ['.editor-label', '.control-button.more', '.control-button.record'];
            var savingView = ['.save-track', '.control-button.back', '.control-button.save', '.control-button.discard'];

            switch (state) {
                case 'saving-view':
                    _(editorView).forEach(function(selector) {
                        $editor.find(selector).hide();
                    });
                    _(savingView).forEach(function(selector) {
                        $editor.find(selector).show();
                    });
                    break;
                case 'list-view':
                    _(editorView).forEach(function(selector) {
                        $editor.find(selector).show();
                    });
                    _(savingView).forEach(function(selector) {
                        $editor.find(selector).hide();
                    });
                    break;
            }
        };

        $('#position-tracking-editors-list').on('vclick', '.control-button', function(event) {
            var recorder;
            var $targetButton = $(event.target);
            var $editor = $targetButton.closest('li.editor');
            var editorId = $editor.data('editor-id');
            var groupId = $editor.data('group-id');
            var action = $targetButton.data('action');

            switch (action) {
                case 'start':
                    recorder = recorderManager.startRecorder(editorId, groupId);
                    break;
                case 'pause':
                    recorder = recorderManager.pauseRecorder(editorId, groupId);
                    break;
                case 'more':
                    changeEditorViewState($editor, 'saving-view');
                    break;
                case 'back':
                    changeEditorViewState($editor, 'list-view');
                    break;
                case 'discard':
                    recorder = recorderManager.disposeRecorder(editorId, groupId);
                    changeEditorViewState($editor, 'list-view');
                    break;
                case 'save':
                    var recordName = '';
                    var $input = $editor.find('input.record-name');

                    recordName = $input.val();
                    if (recordName.length > 0) {
                        $input.attr('disabled', 'disabled');
                        recorderManager.saveRecorder(editorId, groupId, recordName);
                        recorderManager.disposeRecorder(editorId, groupId);

                        $targetButton.addClass('rotate');

                        setTimeout(function() {
                            changeEditorViewState($editor, 'list-view');

                            $input
                                .val('')
                                .removeAttr('disabled');
                            $targetButton.removeClass('rotate');
                        }, 800);
                    }
                    else {
                        $input
                            .addClass('error')
                            .focus();
                    }
                    break;
            }

            $('#position-tracking-editors-list').trigger('update-controls');

            event.stopPropagation();
            return false;
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

        $(document).on('vclick', '.position-tracking-running', function(event) {
            event.preventDefault();
            $('body').pagecontainer('change', 'position-tracking-main-page.html');
        });

        $(document).on('pagebeforeshow', '#position-tracking-main-page', function() {
            registerControlEvents();
            renderEditorsList();
        });

        // Make the running icon visible in all pages
        $(document).on('pagebeforeshow', function() {
            toggleTrackingRunningIcon();
        });
    };

    initPlugin();
});
