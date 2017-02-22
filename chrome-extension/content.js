var added = [];

chrome.runtime.onMessage.addListener(function(message) {
    // wait for add to cart button
    document.arrive('#AddToCartAreaId', function() {
        if (added.indexOf(message.add) < 0) {
            added.push(message.add);
            // click add
            $('button.sbc-add-to-cart.btn.btn-primary').click();
        }
    });
    document.arrive('.modal-addToCart.modal-shown', function() {
        chrome.runtime.sendMessage({'status': 1, 'add': message.add});
    });
});
