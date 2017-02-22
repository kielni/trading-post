// include config.js and firebase.js before this
firebase.initializeApp(firebaseConfig);

var loaded = false;
var data = {};
var db = firebase.database();
var dbPath = '/order/target';
var currentTab = {};
var globalData = {};
var itemCount = 0;

// load items from firebase
db.ref(dbPath).on('value', function(snapshot) {
    data = snapshot.val() || {};
    itemCount = Object.keys(data).length;
    chrome.browserAction.setBadgeText({text: itemCount+''});
    loaded = true;
});

// add each item to cart, then go to cart
chrome.browserAction.onClicked.addListener(function(tab) {
    if (!loaded) {
        console.log('nothing loaded');
        return;
    }
    currentTab = tab;
    async.eachSeries(Object.keys(data), function(item, callback) {
        console.log('add '+item+' to cart');
        // so onUpdatedListener can see it
        globalData = {
            'callback': callback,
            'item': item
        };
        // load url in current tab
        chrome.tabs.update(currentTab.id, {url: data[item]});
    }, function() {
        console.log('done all');
        globalData.callback = null;
        chrome.tabs.update(currentTab.id, {url: 'https://www-secure.target.com/co-cart'});
        chrome.browserAction.setBadgeText({text: ''});
    });
});

// when tab complete, send message to content script to add to cart
chrome.tabs.onUpdated.addListener(function(tabId, info) {
    if (info.status !== 'complete' || !globalData.callback) {
        return;
    }
    console.log('tab '+tabId+' updated; sending message');
    // send message to content script to click add
    chrome.tabs.sendMessage(currentTab.id, {'add': globalData.item}, {}, function() {
        console.log('background sent message');
    });
});

// listen for message that content script added item to cart
chrome.runtime.onMessage.addListener(function(message) {
    console.log('extension received message', message);
    if (!message.status || !globalData.callback) {
        return;
    }
    // remove from firebase and go to next item
    db.ref(dbPath+'/'+globalData.item).remove();
    var log = {};
    var ts = (new Date()).toISOString().replace(/\..*/, '');
    log['log/target/'+globalData.item+'/'+ts] = true;
    db.ref().update(log);
    itemCount--;
    chrome.browserAction.setBadgeText({text: itemCount+''});
    globalData.callback();
});

