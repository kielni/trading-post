# Target shopping list Chrome extension

Click the icon to get items from Firebase shopping list and add to Target cart.

The background page loads data from Firebase.

When a user clicks the extension icon:
- saves the current tab
- for each item on the list
    - go to the item URL
    - `chrome.tabs.onUpdated` listener sends a message to the content script
    - on receiving the message, the content script clicks add to cart, waits for the add to cart modal, then sends a message back to the extension
    - on receiving the message, the background script removes the item from Firebase and calls the async for each callback to move to the next item in the list
- then go to shopping cart

## background page

[background.html](background.html) includes dependencies:
- [firebase-app.js and firebase-database.js](https://firebase.google.com/) - read and remove items from the Target shopping list
- [async](https://github.com/caolan/async) - iterate through list items 

## content script

[content.js](content.js) includes dependencies:
- [arrive.js](https://github.com/uzairfarooq/arrive) - wait for add to cart and modal item added
- [zepto.js](http://zeptojs.com/) - select add to cart button
