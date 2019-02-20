/**
 * Function to migrate settings from older versions and to save current version in this settings.
 */
function settingsMigration()
{
	var manifest = getBrowserObject().runtime.getManifest();
	var options;

	function init()
	{
		getApiObject().get(
			null,
			function( result )
			{
				if( typeof result !== 'undefined' && result )
				{
					options = result;
					if( typeof options.version === 'undefined' )
						migrationTo2019_02_20();

					updateVersion();
				}
			}
		);
	}

	function updateVersion()
	{
		getApiObject().set({
			'version': manifest.version
		});
	}

	function migrationTo2019_02_20()
	{
		var data_to_save = {};
		for( var i in options )
		{
			if( !options.hasOwnProperty( i ) )
				continue;

			if( typeof options[i].cardsCounter !== 'undefined' )
			{
				options[i].showCardsCounter = options[i].cardsCounter;
				delete options[i].cardsCounter;
			}
			if( typeof options[i].shortId !== 'undefined' )
			{
				options[i].showCardShortId = options[i].shortId;
				delete options[i].shortId;
			}
			if( typeof options[i].hiddenLists !== 'undefined' )
			{
				for( var j = options[i].hiddenLists.length - 1; j >= 0; --j )
					data_to_save['list.'+options[i].hiddenLists[j]] = { hidden: true };

				delete options[i].hiddenLists;
			}
			if( typeof options[i].displayAsTable !== 'undefined' && options[i].displayAsTable )
			{
				options[i].displayMode = 'table';
				delete options[i].displayAsTable;
			}
			else if( typeof options[i].displayInMultiRows !== 'undefined' && options[i].displayInMultiRows )
			{
				options[i].displayMode = 'multi-rows';
				delete options[i].displayInMultiRows;
			}

			data_to_save['board.'+i] = options[i];
			getApiObject().remove( i );
		}
		if( data_to_save )
			getApiObject().set( data_to_save );
	}

	/**
	 * Getting browser storage object to save/load settings.
	 * If synchronize object is exists, will be return, if not local will be returned.
	 * @return {*}
	 */
	function getApiObject()
	{
		var browser = getBrowserObject();
		if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
			if( typeof browser.storage.sync !== 'undefined' )
				return browser.storage.sync;
			else if( typeof browser.storage.local !== 'undefined' )
				return browser.storage.local;
	}

	init();
}

/**
 * Toggle icon activity by current tab url
 * @param {string} current_url
 */
function toggleIconByUrl( current_url )
{
	if( typeof current_url !== 'undefined' && /^https?:\/\/trello.com\/b\//.test( current_url ) )
		getBrowserObject().browserAction.enable();
	else
		getBrowserObject().browserAction.disable();
}

/**
 * Return `browser` object, depending on current browser
 * @return {object}
 */
function getBrowserObject()
{
	if( typeof browser !== 'undefined' )
		return browser;
	else if( typeof chrome !== 'undefined' )
		return chrome;
	else if( typeof msBrowser !== 'undefined' )
		return msBrowser;
}


getBrowserObject().tabs.onActivated.addListener( function( info ) {
	getBrowserObject().tabs.get( info.tabId, function( change ) {
		toggleIconByUrl( change.url );
	} );
} );

getBrowserObject().tabs.onUpdated.addListener( function( tabId, change, tab ) {
	toggleIconByUrl( tab.url );
} );


getBrowserObject().runtime.onInstalled.addListener( function() {
	settingsMigration();
});

//browser.storage.sync.clear();
toggleIconByUrl();
