// include config.js and firebase.js before this
firebase.initializeApp(firebaseConfig);

var loaded = false;
var data = {};
var db = firebase.database();
var currentTab = {};
var globalData = {};
var itemCount = 0;

// load items from firebase
db.ref('/').on('value', function(snapshot) {
    // need = /need/target order-able = /delivery/target
    var allData = snapshot.val() || {};
    var delivery = Object.keys(allData.delivery.target);
    var need = Object.keys(allData.need.target).filter(function(item) {
        return allData.need.target[item] && delivery.indexOf(item) >= 0;
    });
    need.forEach(function(item) {
        data[item] = allData.delivery.target[item];
    });
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
    // send message to content script to click add
    chrome.tabs.sendMessage(currentTab.id, {'add': globalData.item}, {});
});

// listen for message that content script added item to cart
chrome.runtime.onMessage.addListener(function(message) {
    if (!message.status || !globalData.callback) {
        return;
    }
    // mark as not needed and go to next item
    var update = {};
    update[globalData.item] = false;
    db.ref('need/target').update(update);
    update = {};
    var ts = (new Date()).toISOString().replace(/\..*/, '');
    update[globalData.item+'/'+ts] = true;
    db.ref('log/target').update(update);
    itemCount--;
    chrome.browserAction.setBadgeText({text: itemCount+''});
    globalData.callback();
});

