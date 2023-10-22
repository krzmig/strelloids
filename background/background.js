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

/**
 * Toggle icon activity by current tab url
 * @param {null|string} current_url
 */
function toggleIconByUrl( current_url= null )
{
	if( typeof current_url !== 'undefined' && /^https?:\/\/trello.com\/b\//.test( current_url ) )
		getBrowserObject().action.enable();
	else
		getBrowserObject().action.disable();
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

getBrowserObject().storage.onChanged.addListener(function( changes )
{
	getBrowserObject().tabs.query(
		{
			url: "*://trello.com/*"
		},
		function( tabs)
		{
			for( let i in tabs )
			{
				if( !tabs.hasOwnProperty( i ))
					continue;

				for( let j in changes )
				{
					if( !changes.hasOwnProperty( j ))
						continue;

					getBrowserObject().tabs.sendMessage(
						tabs[i].id,
						{
							event: {
								code: 'onSettingChanged',
								key: j,
								oldValue: changes[j].oldValue,
								newValue: changes[j].newValue
							}
						}
					);
				}
			}
		}
	);
});

getBrowserObject().runtime.onInstalled.addListener( function() {
	settingsMigration();
});

getBrowserObject().runtime.onMessage.addListener( function( message )
{
	if( typeof message.event === 'undefined' || typeof message.event.code === 'undefined' )
		return;

	if( message.event.code === 'settingsImported' )
		settingsMigration();
});

toggleIconByUrl();




/**
 * I moved this here because chrome is a stupid browser, and I am not able to use standard modules like in Firefox...
 * Chrome is a new IE...
 */

/**
 * Function to migrate settings from older versions and to save current version in these settings.
 */
function settingsMigration()
{
	const manifest = getBrowserObject().runtime.getManifest();
	let settings;

	function init()
	{
		getSyncApiObject().get(
			null,
			function( result )
			{
				if( typeof result !== 'undefined' && result )
				{
					settings = result;
					if( typeof settings.version !== 'undefined' )
					{
						if( compareVersionsNumber( settings.version, '2019.8.16' ) === -1 )
							migrationTo2019_08_16();
						if( compareVersionsNumber( settings.version, '2020.9.27' ) === -1 )
							migrationTo2020_09_27();
					}

					cleanUp();
					updateVersion();
				}
			}
		);
	}

	function updateVersion()
	{
		getSyncApiObject().set({
			'version': manifest.version
		});
	}

	function migrationTo2019_08_16()
	{
		const old_data = [
			["module.coloredLists.color.toDo", "#eff5d0"],
			["module.coloredLists.color.sprint", "#d0dff6"],
			["module.coloredLists.color.backlog", "#c0e8ed"],
			["module.coloredLists.color.doing", "#bfe3c6"],
			["module.coloredLists.color.done", "#d9f0bf"],
			["module.coloredLists.color.test", "#f5f5c0"],
			["module.coloredLists.color.fix", "#f9c0d0"],
			["module.coloredLists.color.upgrade", "#e6ccf5"],
			["module.coloredLists.color.helpdesk", "#f5d3f3"]
		];
		const new_data = [
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
		let do_save = false;

		for( let i in settings )
			if( settings.hasOwnProperty( i ) )
				for( let j = old_data.length - 1; j >= 0; --j )
					if( i === old_data[j][0] && settings[i] !== old_data[j][1] )
					{
						do_save = true;
						new_data[j].color = settings[i] + 'ff';
						getSyncApiObject().remove( i );
					}

		if( do_save )
			getSyncApiObject().set({
				"module.coloredLists.scheme": new_data
			});
	}

	/**
	 * Moving all settings for lists to local storage
	 */
	function migrationTo2020_09_27()
	{
		let i;
		if( getSyncApiObject() === getLocalApiObject() )
			return;

		let do_save = false;
		const data = {};

		for( let i in settings )
			if( settings.hasOwnProperty( i ) )
				if( i.indexOf( 'list.' ) === 0 )
				{
					data[i] = settings[i];
					do_save = true;
				}

		if( do_save )
		{
			getSyncApiObject().remove( Object.keys( data ));

			for( let i in data )
				if( data.hasOwnProperty( i ) )
					if( typeof data[i] === 'object' && Object.keys( data[i] ).length === 0 )
						delete data[i];
			getLocalApiObject().set( data );
		}
	}

	/**
	 * Getting browser synchronize storage object to save/load settings and share it between connected browsers.
	 * @return {null|chrome.storage.SyncStorageArea}
	 */
	function getSyncApiObject()
	{
		const browser = getBrowserObject();
		if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
			if( typeof browser.storage.sync !== 'undefined' )
				return browser.storage.sync;
			else
				return getLocalApiObject();

		$err( 'No storage container found. Unable to save data!' );
	}

	/**
	 * Getting browser local storage object to save/load only on this browser.
	 * @return {null|chrome.storage.LocalStorageArea}
	 */
	function getLocalApiObject()
	{
		const browser = getBrowserObject();
		if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
			if( typeof browser.storage.local !== 'undefined' )
				return browser.storage.local;
			else
				return null;

		$err( 'No storage container found. Unable to save data!' );
	}

	function compareVersionsNumber( version1, version2 )
	{
		let parts1 = version1.split( '.' );
		let parts2 = version2.split( '.' );

		if( parts1.every( isNaN ) || parts2.every( isNaN ))
			return NaN;

		parts1 = parts1.map( Number );
		parts2 = parts2.map( Number );

		while( parts1.length < parts2.length )
			parts1.push( 0 );
		while( parts2.length < parts1.length )
			parts2.push( 0 );

		for( let i = 0; i < parts1.length; ++i )
			if( parts1[i] > parts2[i] )
				return 1;
			else if( parts1[i] < parts2[i] )
				return -1;

		return 0;
	}

	function cleanUp()
	{

	}

	init();
}