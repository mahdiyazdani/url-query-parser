/* eslint-env browser */
/* global chrome */

/**
 * Popup boot logic for URL Parser.
 * Saves/restores the last URL and its parsed params via chrome.storage.local.
 */
document.addEventListener( 'DOMContentLoaded', function () {
    // Elements.
    /** @type {HTMLTextAreaElement} */
    var urlInput = document.getElementById( 'urlInput' );
    var parseBtn = document.getElementById( 'parseBtn' );
    var clearBtn = document.getElementById( 'clearBtn' );
    var results = document.getElementById( 'results' );
    var tableBody = document.getElementById( 'tableBody' );
    var paramCount = document.getElementById( 'paramCount' );
    var errorEl = document.getElementById( 'error' );
    var urlInfo = document.getElementById( 'urlInfo' );
    var baseUrl = document.getElementById( 'baseUrl' );

    var STORAGE_KEY = 'urlParserData';
    var saveTimeout = null;

    /**
     * Save data to chrome.storage.local.
     *
     * @param {Object} data Data to store.
     * @return {Promise<void>} Promise that resolves after save completes.
     */
    function saveData( data ) {
        return new Promise( function ( resolve ) {
            chrome.storage.local.set( /** @type {Object<string, any>} */ ( { urlParserData: data } ), resolve );
        } );
    }

    /**
     * Load data from chrome.storage.local.
     *
     * @return {Promise<Object|null>} Stored data or null.
     */
    function loadData() {
        return new Promise( function ( resolve ) {
            chrome.storage.local.get( STORAGE_KEY, function ( obj ) {
                resolve( obj[ STORAGE_KEY ] || null );
            } );
        } );
    }

    /**
     * Clear saved data.
     *
     * @return {Promise<void>} Promise that resolves after removal.
     */
    function clearData() {
        return new Promise( function ( resolve ) {
            chrome.storage.local.remove( STORAGE_KEY, resolve );
        } );
    }

    /**
     * Escape text for safe HTML rendering.
     *
     * @param {string} text Input text.
     * @return {string} Escaped HTML.
     */
    function escapeHtml( text ) {
        var div = document.createElement( 'div' );
        div.textContent = String( text );
        return div.innerHTML;
    }

    /**
     * Show an error and hide results.
     *
     * @param {string} message Error message.
     */
    function showError( message ) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        results.style.display = 'none';
    }

    /**
     * Hide the error element.
     */
    function hideError() {
        errorEl.style.display = 'none';
    }

    /**
     * Render parsed results and persist state.
     *
     * @param {Array<{key:string,value:string}>} params Key/value pairs.
     * @param {{origin:string, pathname:string} | URL} urlLike URL or subset.
     * @return {Promise<void>} Promise after render and save.
     */
    function displayResults( params, urlLike ) {
        var origin = urlLike.origin || '';
        var pathname = urlLike.pathname || '';

        return saveData( {
            url: urlInput.value.trim(),
            params: params,
            parsedUrl: { origin: origin, pathname: pathname },
            ts: Date.now(),
        } ).then( function () {
            // Base info.
            baseUrl.textContent = origin + pathname;
            urlInfo.style.display = 'block';

            // Count.
            var count = params.length;
            paramCount.textContent = count + ' parameter' + ( count !== 1 ? 's' : '' );

            // Table.
            tableBody.innerHTML = '';
            if ( params.length === 0 ) {
                tableBody.innerHTML =
                    '<tr>' +
                    '<td colspan="2" class="no-params">' +
                    '<div class="no-params-icon">📝</div>' +
                    '<div>No query parameters found</div>' +
                    '</td>' +
                    '</tr>';
            } else {
                params.forEach( function ( p ) {
                    var row = document.createElement( 'tr' );
                    row.innerHTML =
                        '<td class="key-cell">' + escapeHtml( p.key ) + '</td>' +
                        '<td class="value-cell">' + escapeHtml( p.value ) + '</td>';
                    tableBody.appendChild( row );
                } );
            }

            results.style.display = 'block';
            hideError();
        } );
    }

    /**
     * Parse the URL in the input, persist, and render.
     *
     * @return {void}
     */
    function parseURL() {
        var urlString = urlInput.value.trim();

        if ( ! urlString ) {
            showError( 'Please enter a URL' );
            return;
        }

        try {
            var url = new URL( urlString );
            var searchParams = new URLSearchParams( url.search );
            var params = [];

            searchParams.forEach( function ( value, key ) {
                params.push( { key: key, value: value } );
            } );

            // Save immediately, then render.
            saveData( {
                url: urlString,
                params: params,
                parsedUrl: { origin: url.origin, pathname: url.pathname },
                ts: Date.now(),
            } ).then( function () {
                displayResults( params, url );
            } );
        } catch ( e ) {
            showError( 'Invalid URL format. Please enter a valid URL.' );
        }
    }

    /**
     * Debounced saver for the raw URL text so we remember user input even before parsing.
     */
    function saveCurrentURLDebounced() {
        var urlString = urlInput.value.trim();

        window.clearTimeout( saveTimeout );

        if ( ! urlString ) {
            return;
        }

        saveTimeout = window.setTimeout( function () {
            loadData().then( function ( existing ) {
                return saveData( {
                    url: urlString,
                    params: existing ? existing.params : null,
                    parsedUrl: existing ? existing.parsedUrl : null,
                    ts: Date.now(),
                } );
            } );
        }, 400 );
    }

    /**
     * Clear UI and storage.
     *
     * @return {void}
     */
    function clearAll() {
        urlInput.value = '';
        results.style.display = 'none';
        urlInfo.style.display = 'none';
        hideError();
        clearData();
        urlInput.style.height = '60px';
        urlInput.focus();
    }

    // Auto-resize + save on input.
    urlInput.addEventListener( 'input', function () {
        urlInput.style.height = 'auto';
        urlInput.style.height = Math.max( 60, urlInput.scrollHeight ) + 'px';
        saveCurrentURLDebounced();
    } );

    // Parse on Enter (no Shift).
    urlInput.addEventListener( 'keydown', function ( e ) {
        if ( e.key === 'Enter' && ! e.shiftKey ) {
            e.preventDefault();
            parseURL();
        }
    } );

    parseBtn.addEventListener( 'click', parseURL );
    clearBtn.addEventListener( 'click', clearAll );

    // Focus input on open.
    urlInput.focus();

    // Initialize: restore saved or fall back to current tab.
    ( function init() {
        loadData().then( function ( saved ) {
            if ( saved && saved.url ) {
                urlInput.value = saved.url;
                urlInput.style.height = 'auto';
                urlInput.style.height = Math.max( 60, urlInput.scrollHeight ) + 'px';

                if ( saved.params && saved.parsedUrl ) {
                    displayResults( saved.params, saved.parsedUrl );
                }

                return;
            }

            // No saved state: try current tab.
            try {
                if ( chrome && chrome.tabs && chrome.tabs.query ) {
                    chrome.tabs.query(
                        { active: true, currentWindow: true },
                        function ( tabs ) {
                            var current = tabs && tabs[ 0 ] ? tabs[ 0 ].url : '';

                            if ( ! current ) {
                                return;
                            }

                            urlInput.value = current;
                            urlInput.style.height = 'auto';
                            urlInput.style.height = Math.max( 60, urlInput.scrollHeight ) + 'px';

                            if ( current.indexOf( '?' ) !== -1 ) {
                                parseURL();
                                return;
                            }

                            // Persist base URL even without params.
                            try {
                                var u = new URL( current );
                                saveData( {
                                    url: current,
                                    params: [],
                                    parsedUrl: { origin: u.origin, pathname: u.pathname },
                                    ts: Date.now(),
                                } );
                            } catch ( e ) {
                                // Ignore invalid current tab URL.
                            }
                        }
                    );
                }
            } catch ( e ) {
                // Ignore if tabs API is unavailable.
            }
        } );
    }() );
} );