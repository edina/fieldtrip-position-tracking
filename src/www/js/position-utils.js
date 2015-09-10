'use strict';

define(function(require) {
    var _ = require('underscore');
    var map = require('map');

    /**
     * Creates a geoJSON Feature with a Point geometry from a position
     * @param {Position} a position
     * @param {Boolean} project the point
     * @returns {GeoJSON} containing a Feature
     */
    var positionToGeoJSONPoint = function(position, project) {
        var geometry;
        var point;
        var coordinates;
        var properties = {};
        var ignoredProperties = ['longitude', 'latitude'];

        coordinates = [position.coords.longitude, position.coords.latitude];
        if (project === true) {
            point = map.pointToInternal(coordinates);
            coordinates = [point.lon, point.lat];
        }

        // Extract the geometry
        geometry = {
            type: 'Point',
            coordinates: coordinates
        };

        // Copy the properties
        _.forEach(position.coords, function(value, key) {
            if (ignoredProperties.indexOf(key) > -1) {
                return;
            }
            properties[key] = value;
        });

        // Create the feature
        var feature = {
            type: 'Feature',
            properties: properties,
            geometry: geometry
        };

        return feature;
    };

    /**
     * Creates a geoJSON Feature with a LineString geometry from
     * a list of positions
     * @param positions {Array} a list of {Position}
     * @param {Boolean} project the point
     * @returns {GeoJSON} containing a FeatureCollection
     */
    var positionsToLineString = function(positions, project) {
        var geometry;
        var properties = {};
        var ignoredProperties = ['longitude', 'latitude'];

        geometry = {
            type: 'LineString',
            coordinates: []
        };

        _.forEach(positions, function(position) {
            var coordinates = [position.coords.longitude, position.coords.latitude];
            var point;

            if (project === true) {
                point = map.pointToInternal(coordinates);
                coordinates = [point.lon, point.lat];
            }
            geometry.coordinates.push(coordinates);
        });

        // Create the feature
        var feature = {
            type: 'Feature',
            properties: properties,
            geometry: geometry
        };

        return feature;
    };

    /**
     * Creates a geoJSON FeatureCollection from a list of positions
     * @param positions {Array} a list of {Position}
     * @returns {GeoJSON} containing a FeatureCollection
     */
    var positionsToFeatureCollection = function(positions, project) {
        var geoJSON = {
            type: 'FeatureCollection',
            features: []
        };

        _.forEach(positions, function(position) {
            geoJSON.features.push(positionToGeoJSONPoint(position, project));
        });

        return geoJSON;
    };

    return {
        positionToGeoJSONPoint: positionToGeoJSONPoint,
        positionsToFeatureCollection: positionsToFeatureCollection,
        positionsToLineString: positionsToLineString
    };
});
