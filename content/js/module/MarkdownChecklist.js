/**
 * Module allow to create checklist in markdown style.
 *
 * Like this:
 * - [x] task done!
 * 		- [x] sub-task done
 * - [ ] task not done...
 * 		- [x] another sub-task done
 *
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleMarkdownChecklist( strelloids )
{
	let self = this;
	const settingName = 'global.enableMarkdownChecklist';

	function init()
	{
		strelloids.modules.events.add( 'onCardEditOpened', cardEditOpened );
		strelloids.modules.events.add( 'onCardCommentChanged', cardEditOpened );
		strelloids.modules.events.add( 'onCardDescriptionChanged', cardEditOpened );
		$w.addEventListener( 'click', () => {
			if( self.isEnabled() )
				cardEditOpened();
		}, true );
	}


	/**
	 * @returns {boolean}
	 */
	this.isEnabled = function()
	{
		return strelloids.modules.settings.getGlobal( settingName );
	};

	function cardEditOpened()
	{
		if( !self.isEnabled() )
			return;

		createChecklists();
		// because first time not working after editing, probably trello needs time to update preview from textarea
		setTimeout( createChecklists, 1000 );
		setTimeout( createChecklists, 2000 );
	}

	function createChecklists()
	{
		$$( '.card-detail-window .markeddown li' ).forEach(( marked_down ) => {
			let text_node = findTextNode( marked_down );
			let input;
			if( !text_node )
				return;
			else if( text_node.nodeValue.indexOf( '[x]' ) === 0 )
				input = createNode( 'input', { type: 'checkbox', checked: true, disabled: true } );
			else if( text_node.nodeValue.indexOf( '[ ]' ) === 0 )
				input = createNode( 'input', { type: 'checkbox', disabled: true } );
			else
				return;

			text_node.nodeValue = text_node.nodeValue.substring( 3 );
			marked_down.prepend( input );
			marked_down.classList.add( 'checklist' );
		});
	}

	init();
}