/**
 *
 * Defines the function
 *  + includesFile
 *
 * @param   path    name f file
 *
 * @return  true if qrc[path] is defined, false otherwise
 *
 */
global.qrc = {
    includesFile: function (path) {
        return typeof qrc[path] != 'undefined';
    }
};
