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
	var self = this;
	var settingName = 'global.enableMarkdownChecklist';

	function init()
	{
		strelloids.modules.events.add( 'onCardEditOpened', cardEditOpened );
		strelloids.modules.events.add( 'onCardCommentChanged', cardEditOpened );
		strelloids.modules.events.add( 'onCardDescriptionChanged', cardEditOpened );
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
		var input;
		var marked_down = $$( '.card-detail-window .markeddown li' );

		for( var i = marked_down.length - 1; i >= 0; --i )
		{
			var text_node = findTextNode( marked_down[i] );
			if( !text_node )
				continue;
			else if( text_node.nodeValue.indexOf( '[x]' ) === 0 )
				input = createNode( 'input', { type: 'checkbox', checked: true, disabled: true } );
			else if( text_node.nodeValue.indexOf( '[ ]' ) === 0 )
				input = createNode( 'input', { type: 'checkbox', disabled: true } );
			else
				continue;

			text_node.nodeValue = text_node.nodeValue.substr( 3 );
			marked_down[i].prepend( input );
			marked_down[i].classList.add( 'checklist' );
		}
	}

	init();
}