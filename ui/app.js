/* global config, firebase, Vue, _ */
var db = firebase.initializeApp(config.firebase).database();

// use vm for console debugging
// eslint-disable-next-line no-unused-vars
var vm = new Vue({
  el: '#app',

  data: {
    storeId: config.defaultStore,
    form: {}
  },

  firebase: function () {
    return {
      storesRef: db.ref('stores'),
      needRef: db.ref('need'),

      storesRefObject: {
        source: db.ref('stores'),
        asObject: true
      },
      needRefObject: {
        source: db.ref('need'),
        asObject: true
      }
    };
  },

  methods: {
    change: function (storeId, item) {
      var checked = this.form[storeId + ':' + item];
      this.needRefObject[storeId][item] = !checked;
    }
  },

  computed: {
    storeIds: function () {
      return _.without(Object.keys(this.storesRefObject), '.key');
    },

    storeMeta: function () {
      var meta = {};
      var activeId = this.storeId;
      var stores = this.storesRefObject;
      this.storeIds.forEach(function (storeId) {
        meta[storeId] = {
          id: storeId,
          cssId: 'store-' + storeId.replace(/[^\w\d]/g, ''),
          name: stores[storeId],
          active: storeId === activeId,
          icon: 'assets/' + config.icons[storeId]
        };
      });
      return meta;
    },

    loadedStores: function () {
      return this.storeIds.length;
    },

    sortedNeed: function () {
      var need = this.needRefObject;
      var form = this.form;
      var items = {};
      this.storeIds.forEach(function (storeId) {
        items[storeId] = _.without(Object.keys(need[storeId] || {}), '.key').map(function (item) {
          form[storeId + ':' + item] = !need[storeId][item];
          return {
            need: need[storeId][item],
            name: item,
            id: item.replace(/[^\w\d]/g, ''),
            path: storeId + ':' + item,
            sortKey: (need[storeId][item] ? '0' : '1') + item
          };
        });
        items[storeId] = _.sortBy(items[storeId], 'sortKey');
      });
      return items;
    }
  }
});
