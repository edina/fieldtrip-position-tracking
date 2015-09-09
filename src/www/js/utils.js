'use strict';

define(function(require) {
    /*
     * Get an item from localStorage and returns a json object
     * @param key where the object is stored
     * @returns the object or null
     */
    var getLocalItem = function(key) {
        var object = null;
        var string = localStorage.getItem(key);
        if (string) {
            try {
                object = JSON.parse(string);
            }
            catch (ex) {
                console.warn('Invalid json stored in the key: ' + key);
            }
        }

        return object;
    };

    /*
     * Save a json object as a string in localStorage
     * @param key where to store the object
     * @param object the object
     */
    var setLocalItem = function(key, object) {
        var string;
        string = JSON.stringify(object);

        localStorage.setItem(key, string);
    };

    return {
        getLocalItem: getLocalItem,
        setLocalItem: setLocalItem
    };
});
