'use strict';

/* global cordova */

define(function(require) {
    var _ = require('underscore');
    var location = require('./location');
    var PositionRecorder = require('./position-recorder');
    var utils = require('./utils');

    //Constants
    var PLUGIN_PATH = 'plugins/position-tracking';

    var templates = {};
    templates.groupItem = _.template(
        '<li class="group">' +
            '<span><%-name%></span>' +
        '</li>'
    );

    templates.editorItem = _.template(
        '<li class="editor">' +
            '<div class="editor-label"><%-name%></div>' +
            '<div class="controls" data-editor-id="<%=editorId%>" data-group-id="<%=groupId%>">' +
                '<div class="control-button record off"></div>' +
                '<div class="control-button pause"></div>' +
                '<div class="control-button stop"></div>' +
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
        });
    };

    initPlugin();
});
