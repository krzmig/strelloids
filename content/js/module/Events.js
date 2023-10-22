/**
 * Module will trigger local script events for automation modules logic.
 * @param strelloids
 * @constructor
 */
function ModuleEvents( strelloids )
{
	let self = this;
	let events_list = {
		onUpdate: [],
		onSettingsLoaded: [],
		onGlobalSettingsChange: [],
		onBoardSettingsChange: [],
		onListSettingsChange: [],
		onBoardSwitch: [],
		onListTitleChanged: [],
		onCardEditOpened: [],
		onCardTitleChanged: [],
		onCardDescriptionChanged: [],
		onCardCommentChanged: [],
		onCardDescriptionKeyDown: [],
		onCardCommentKeyDown: [],
		onCardDescriptionKeyUp: [],
		onCardCommentKeyUp: [],
		onCollapseAllLists: [],
		onExpandAllLists: []
	};

	function init()
	{
		getBrowserObject().runtime.onMessage.addListener( function( message )
		{
			if( typeof message.event === 'undefined' || typeof message.event.code === 'undefined' )
				return;

			if( typeof events_list[message.event.code] !== 'undefined' )
				self.trigger( message.event.code );
		});
		$d.addEventListener( 'change', function( e )
		{
			if( e.target.classList.contains( 'mod-card-back-title' ))
				self.trigger( 'onCardTitleChanged', e );
			else if( e.target.classList.contains( 'list-header-name' ))
				self.trigger( 'onListTitleChanged', e );
			else if( e.target.classList.contains( 'comment-box-input' ))
				self.trigger( 'onCardCommentChanged', e );
			else if( e.target.classList.contains( 'card-description' ))
				self.trigger( 'onCardDescriptionChanged', e );
		});
		$d.addEventListener( 'keydown', function( e )
		{
			if( e.target.classList.contains( 'card-description' ))
			{
				self.trigger( 'onCardDescriptionKeyDown', e );
				if( e.key === 'Enter' && e.ctrlKey )
					self.trigger( 'onCardDescriptionChanged', e );
			}
			else if( e.target.classList.contains( 'comment-box-input' ))
			{
				self.trigger( 'onCardCommentKeyDown', e );
				if( e.key === 'Enter' && e.ctrlKey )
					self.trigger( 'onCardCommentChanged', e );
			}
		}, true );
		$d.addEventListener( 'keyup', function( e )
		{
			if( e.target.classList.contains( 'card-description' ))
				self.trigger( 'onCardDescriptionKeyUp', e );
			else if( e.target.classList.contains( 'comment-box-input' ))
				self.trigger( 'onCardCommentKeyUp', e );
		} );
	}

	/**
	 * @param {string} event
	 * @param {function} callback
	 */
	this.add = function( event, callback )
	{
		if( typeof events_list[event] === 'undefined' )
			$err( 'Strelloids: Unknown event: ', event );
		if( typeof callback !== 'function' )
			$err( 'Strelloids: Wrong callback type' );

		events_list[event].push( callback );
	};

	/**
	 * @param {string} event
	 * @param {function} callback
	 */
	this.remove = function( event, callback )
	{
		if( typeof events_list[event] === 'undefined' )
			$err( 'Strelloids: Unknown event: ', event );

		for( let i = events_list[event].length - 1; i >= 0; --i )
			if( events_list[event][i] === callback )
				events_list = events_list.splice( i, 1 );
	};

	/**
	 * @param {string} event
	 */
	this.trigger = function( event )
	{
		if( typeof events_list[event] === 'undefined' )
			$err( 'Strelloids: Unknown event: ', event );

		let args = Array.prototype.slice.call( arguments, 1 );

		for( let i = events_list[event].length - 1; i >= 0; --i )
			events_list[event][i].apply( null, args );
	};

	init();
}