/* global config, firebase, Vue, _, $ */
var db = firebase.initializeApp(config.firebase).database();

// use vm for console debugging
// eslint-disable-next-line no-unused-vars
var vm = new Vue({
  el: '#app',

  data: {
    storeId: config.defaultStore,
    form: {},
    newItem: '',
    show: { confirm: false, undo: true },
    last: {},
    itemsLoaded: []
  },

  firebase: function () {
    return {
      storesRef: {
        source: db.ref('stores'),
        asObject: true
      },
      needRef: {
        source: db.ref('need'),
        asObject: true
      },
      logRef: {
        source: db.ref('log'),
        asObject: true
      },
      deliveryRef: {
        source: db.ref('delivery'),
        asObject: true
      }
    };
  },

  methods: {
    change: function (storeId, item) {
      var checked = this.form[storeId + ':' + item];
      var ts = (new Date()).toISOString().replace(/\..*/, '');
      this.last = {
        store: storeId,
        item: item,
        was: checked,
        ts: ts
      };
      this.$firebaseRefs.needRef.child(storeId + '/' + item).set(!checked);
      if (checked) {
        // TODO: set coordinates
        var log = {};
        log[ts] = true;
        this.$firebaseRefs.logRef.child(storeId + '/' + item).set(log);
      }
    },

    clickAddItem: function (ev) {
      this.addItem($(ev.target).closest('.list-group-item').attr('data-store'));
    },

    addItem: function (storeId) {
      var item = this.newItem.toLowerCase();
      console.log('enter item ' + item + ' to ', storeId);
      this.$firebaseRefs.needRef.child(storeId + '/' + item).set(true);
      this.show = { confirm: true };
      var _this = this;
      setTimeout(function () {
        _this.show = { undo: true };
      }, 2000);
      this.last = {
        store: storeId,
        item: item,
        was: false
      };
      this.newItem = '';
    },

    undo: function () {
      var last = this.last;
      if (!last) {
        return;
      }
      if (!last.store || !last.item) {
        return;
      }
      var path = last.store + '/' + last.item;
      this.$firebaseRefs.needRef.child(path).set(last.was);
      if (last.ts) {
        this.$firebaseRefs.logRef.child(path + '/' + last.ts).remove();
      }
      this.last = {};
    }
  },

  watch: {
    itemsLoaded: function (val) {
      var _this = this;
      // first time: val=[] oldVal=[target, ] but need[storeId] all undefined
      // second time: val[target,] oldVal=[target,] and need[storeId] set
      val.forEach(function (storeId) {
        if (!_this.needRef[storeId]) {
          return;
        }
        $('#' + _this.storeMeta[storeId].cssId + ' .form-control.add').typeahead({
          source: _.without(Object.keys(_this.needRef[storeId] || {}), '.key'),
          afterSelect: function (item) {
            _this.newItem = item;
            _this.addItem(this.$element.closest('.list-group-item').attr('data-store'));
          }
        });
      });
    }
  },

  computed: {
    undoDisabled: function () {
      return Object.keys(this.last).length ? false : 'disabled';
    },

    storeIds: function () {
      return _.without(Object.keys(this.storesRef || {}), '.key');
    },

    storeMeta: function () {
      var meta = {};
      var activeId = this.storeId;
      var stores = this.storesRef;
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

    needCount: function () {
      var need = this.needRef;
      var count = {};
      this.storeIds.forEach(function (storeId) {
        count[storeId] = Object.keys(need[storeId] || {}).filter(function (item) {
          return need[storeId][item];
        }).length;
      });
      return count;
    },

    sortedNeed: function () {
      var need = this.needRef;
      var delivery = this.deliveryRef;
      var form = this.form;
      var items = {};
      this.storeIds.forEach(function (storeId) {
        items[storeId] = _.without(Object.keys(need[storeId] || {}), '.key').map(function (item) {
          form[storeId + ':' + item] = !need[storeId][item];
          return {
            delivery: delivery && delivery[storeId] && delivery[storeId][item],
            need: need[storeId][item],
            name: item,
            id: item.replace(/[^\w\d]/g, ''),
            path: storeId + ':' + item,
            sortKey: (need[storeId][item] ? '0' : '1') + item
          };
        });
        items[storeId] = _.sortBy(items[storeId], 'sortKey');
      });
      this.itemsLoaded = Object.keys(items);
      return items;
    }
  }
});
