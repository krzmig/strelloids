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
					if( typeof options.version !== 'undefined' )
					{
						if( compareVersionsNumber( options.version, '2019.8.16' ) === -1 )
							migrationTo2019_08_16();
					}

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

	function migrationTo2019_08_16()
	{
		var old_data = [
			[ "module.coloredLists.color.toDo", "#eff5d0" ],
			[ "module.coloredLists.color.sprint", "#d0dff6" ],
			[ "module.coloredLists.color.backlog", "#c0e8ed" ],
			[ "module.coloredLists.color.doing", "#bfe3c6" ],
			[ "module.coloredLists.color.done", "#d9f0bf" ],
			[ "module.coloredLists.color.test", "#f5f5c0" ],
			[ "module.coloredLists.color.fix", "#f9c0d0" ],
			[ "module.coloredLists.color.upgrade", "#e6ccf5" ],
			[ "module.coloredLists.color.helpdesk", "#f5d3f3" ]
		];
		var new_data = [
			{ "pattern": "todo", "color": "#eff5d0ff" },
			{ "pattern": "(sprint|stories)", "color": "#d0dff6ff" },
			{ "pattern": "backlog", "color": "#c0e8edff" },
			{ "pattern": "(progress|working|doing)", "color": "#bfe3c6ff" },
			{ "pattern": "(done|ready)", "color": "#d9f0bfff" },
			{ "pattern": "test", "color": "#f5f5c0ff" },
			{ "pattern": "fix", "color": "#f9c0d0ff" },
			{ "pattern": "upgrade", "color": "#e6ccf5ff" },
			{ "pattern": "helpdesk", "color": "#f5d3f3ff" }
		];
		var do_save = false;

		for( var i in options )
			if( options.hasOwnProperty( i ) )
				for( var j = old_data.length - 1; j >= 0; --j )
					if( i === old_data[j][0] && options[i] !== old_data[j][1] )
					{
						do_save = true;
						new_data[j].color = options[i] + 'ff';
						getApiObject().remove( i );
					}

		if( do_save )
			getApiObject().set({
				"module.coloredLists.scheme": new_data
			});
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

	function compareVersionsNumber( version1, version2 )
	{
		var parts1 = version1.split('.');
		var parts2 = version2.split('.');

		if( parts1.every( isNaN ) || parts2.every( isNaN ))
			return NaN;

		parts1 = parts1.map( Number );
		parts2 = parts2.map( Number );

		while( parts1.length < parts2.length )
			parts1.push( 0 );
		while( parts2.length < parts1.length )
			parts2.push( 0 );

		for( var i = 0; i < parts1.length; ++i )
			if( parts1[i] > parts2[i] )
				return 1;
			else if( parts1[i] < parts2[i] )
				return -1;

		return 0;
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
 * @param {Object} tab
 */
function checkIsCardEditOpened( tab )
{
	if( tab.status !== 'complete' )
		return;

	if( typeof tab.url !== 'undefined' && /^https?:\/\/trello.com\/c\//.test( tab.url ) )
		getBrowserObject().tabs.sendMessage(
			tab.id,
			{
				event: {
					code: 'onCardEditOpened'
				}
			}
		)
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
		checkIsCardEditOpened( change );
	} );
} );

getBrowserObject().tabs.onUpdated.addListener( function( tabId, change, tab ) {
	toggleIconByUrl( tab.url );
	checkIsCardEditOpened( tab );
} );


getBrowserObject().runtime.onInstalled.addListener( function() {
	settingsMigration();
});

//browser.storage.sync.clear();
toggleIconByUrl();
