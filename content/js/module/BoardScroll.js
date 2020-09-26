/**
 * Module will allow you to scroll board horizontally (in default view mode), without holding shift key.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleBoardScroll( strelloids )
{
	var scroll_started_on_board = false;
	var settingName = 'global.enableBoardScroll';

	function init()
	{
		strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
		strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
	}

	function globalSettingsChanged( key )
	{
		if( !key || key === settingName )
		{
			if( strelloids.modules.settings.getGlobal( settingName ) )
			{
				$w.addEventListener( 'wheel', doScroll );
				$w.addEventListener( 'mousemove', clearStartNode );
			}
			else
			{
				$w.removeEventListener( 'wheel', doScroll );
				$w.removeEventListener( 'mousemove', clearStartNode );
			}
		}
	}

	function doScroll( e )
	{
		if( strelloids.modules.settings.getForCurrentBoard( 'displayMode' ) !== 'default' )
			return;

		if( e.shiftKey )
			return;

		var target = e.target;

		while( target.parentNode )
		{
			if( scroll_started_on_board || target.id === 'board' )
			{
				e.preventDefault();
				var board = $_('board');
				board.scrollLeft = board.scrollLeft + Math.max( Math.min( e.deltaY * 16, 50 ), -50 );
				scroll_started_on_board = true;
				return;
			}
			else if( target.classList.contains( 'list' ))
			{
				scroll_started_on_board = false;
				return;
			}
			target = target.parentNode;
		}
	}

	function clearStartNode()
	{
		scroll_started_on_board = false;
	}

	init();
}