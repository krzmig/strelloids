/**
 * Module allow to use tab key inside card description textarea and comment textarea.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleTabKeyInTextarea( strelloids )
{
	var self = this;
	var settingName = 'global.enableTabKeyInTextarea';

	function init()
	{
		strelloids.modules.events.add( 'onCardDescriptionKeyDown', keyDown );
		strelloids.modules.events.add( 'onCardCommentKeyDown', keyDown );
		strelloids.modules.events.add( 'onCardDescriptionKeyUp', keyUp );
		strelloids.modules.events.add( 'onCardCommentKeyUp', keyUp );
	}

	/**
	 * @returns {boolean}
	 */
	this.isEnabled = function()
	{
		return strelloids.modules.settings.getGlobal( settingName );
	};

	function keyDown( e )
	{
		if( !self.isEnabled() )
			return;

		if( e.key === 'Tab' )
		{
			var textarea = e.target;
			var text = textarea.value;
			var start_position = textarea.selectionStart;
			var end_position = textarea.selectionEnd;

			if( start_position === end_position )
			{
				e.preventDefault();

				if( !e.shiftKey )
				{
					var before_text = text.substr( 0, start_position );
					var after_text = text.substr( start_position );

					textarea.value = before_text + "\t" + after_text;
					textarea.selectionStart = textarea.selectionEnd = start_position + 1;
				}
			}
			else
			{
				e.preventDefault();

				if( text[start_position] === "\n" )
					++start_position;
				while( start_position > 0 && text[start_position-1] !== "\n" )
					--start_position;

				if( text[end_position-1] === "\n" )
					--end_position;
				while( end_position < text.length && text[end_position] !== "\n" )
					++end_position;

				var indent_text = e.shiftKey ?
					text.substring( start_position, end_position ).replace( /^\t/mg, '' ) :
					"\t" + text.substring( start_position, end_position ).replace( /\n/g, "\n\t" );

				textarea.value = text.substr( 0, start_position ) + indent_text + text.substr( end_position );
				textarea.selectionStart = start_position;
				textarea.selectionEnd = start_position + indent_text.length;
			}
		}
	}

	function keyUp( e )
	{
		if( !self.isEnabled() )
			return;

		if( e.key === 'Enter' )
		{
			var textarea = e.target;
			var start_position = textarea.selectionStart;
			var end_position = textarea.selectionEnd;

			if( start_position === end_position )
			{
				var text = textarea.value;
				var before_text = text.substr( 0, start_position );
				var after_text = text.substr( start_position );

				var last_line_indent = /(?:^|\n)(\t+).*?\n$/.exec( before_text );

				if( last_line_indent )
				{
					textarea.value = before_text + last_line_indent[1] + after_text;
					textarea.selectionStart = textarea.selectionEnd = Math.min(textarea.value.length, start_position + last_line_indent[1].length );
				}
			}
		}
	}

	init();
}