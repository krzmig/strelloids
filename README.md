# Strelloids
Browser extension for Trello that adds new features.

## Features
### Settings
Your settings are assigned to a specific board, so you can have at the same time couple different configurations depending on board.
Setting are stored in `storage.sync`, so if you have account signed to browser, you can have shared setting on different devices.

### Toggle list display
You can toggle visibility of list, by clicking in the triangle on the left top corner of the list.

### Display counter of cards
After enabling, counter of cards inside each list, will be display below list title.

### Display lists modes
Extension will give you two new modes of display board.  
First can show list in multiple rows, so you can scroll page vertically instead of horizontal.  
Second is table like view. Lists and cards will take whole page width.

### Show cards short ID
Showing short card ID, normally you can see it in expanded card view, after clicking share action.

### Custom cards tags
If you enable this setting, you can use tags in cards titles e.g. `[tag]`. Strelloids will replace this tag with colored label. Their color is depending on content inside, so if you use the same tag for different cards, their color will be the same. Tags are case-sensitive. Tag to be parsed must contain at least one letter, space, dash or underscore.

### Cards separator
To split list into a section, you can use separators. To makes them, you can start card title with three or more characters: - or = eg. `--- My separator` `===== Separator` `--== This works too ==--`. As in last example, you can add the same characters at the end of title, they will not display in list view.

### Cards prioritization
You can set card priority simply adding into title one of these keywords: `!1` `!2` `!3` `!4` or `!5`. `!1` is the highest priority and `!5` is the lowest. Cards with set priority will get colored left border.

### Colored lists
Strelloids can set background color for lists depending on their titles. You can change coloring schemes in global extension settings.

[More info (wiki)](https://github.com/krzmig/strelloids/wiki/Modules-%7C-Colored-lists)

### Scrum times
With extension, you can also rate cards in story points. For each card you can set estimation and consumption. Additionally, you are able to set this each value for two teams separately e.g. development and testing.

Estimations are inside round brackets and consumption in squares ones. Times you simply put inside card title.

`(2)` - estimation: 2 sp - _team 1_  
`(0.5)` - estimation: 0.5 sp - _team 1_ (dot, not comma)  
`(?)` - estimation: unknown - _team 1_  
`(0/1)` - estimation: 0 sp - _team 1_; 1 sp - _team 2_  
`[/3]` - consumption: not set - _team 1_; 3 sp - _team 2_

You can also turn on sum of this times for each list.

### More
- You can enable a scroll in default view mode, which will scroll page in horizontal without holding `shift` key.
- Support for Markdown checklist.
- Support for Markdown tables.
- Support for list indent by `tab` key in card description and comments.
- Import and export your settings.

## How to install
### Normal way
- [addons.mozilla.org](https://addons.mozilla.org/firefox/addon/strelloids/) for Firefox
- [chrome.google.com](https://chrome.google.com/webstore/detail/strelloids/modiglgpojgocbnehgegipohkfejddfo) for Chrome

### Temporary way
To try it, you can run it in extension local mode, but it is a temporary solution:

#### Firefox
1. Download extension to your device.
2. Open new tab and enter `about:debugging`.
3. Click "Load Temporary Add-on".
4. Select `manifest.json` file.

#### Chrome / Opera / Vivaldi
1. Download extension to your device.
2. Open new tab and enter one of this: `chrome://extensions` / `opera://extensions` / `vivaldi://extensions`.
3. Enable "Developer mode".
4. Click "Load unpacked extension".
5. Select folder with extension.

#### Edge / Safari
- Sorry, I don't have possibility right now to check if it is working, only Linux here.

## ToDo
- Possibility to manually set the color for each list.

## Why Strelloids?
Because Trello have official extensions, called "PowerUp", I wanted to do something similar. My first association was "vitamin", but it was too hard to use. If not Vitamin, so next thing was Steroids. "Tero" is similar to trello, so little makeup and that's the whole story. 
