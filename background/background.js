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

getBrowserObject().storage.onChanged.addListener(function( changes )
{
	getBrowserObject().tabs.query(
		{
			url: "*://trello.com/*"
		},
		function( tabs)
		{
			for( var i in tabs )
			{
				if( !tabs.hasOwnProperty( i ))
					continue;

				for( var j in changes )
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

toggleIconByUrl();
