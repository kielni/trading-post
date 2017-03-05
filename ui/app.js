/* global config, firebase, Vue, _, $ */
var db = firebase.initializeApp(config.firebase).database();

Vue.component('list-item', {
  template: '#list-item-template',
  props: ['item'],
  data: function () {
    return {
      editable: false
    };
  },

  computed: {
    checked: function () {
      return !this.item.need;
    },
  },

  methods: {
    check: function () {
      this.$emit('check', this.item);
    },

    startTap: function ($ev) {
      // don't track long press for buttons
      if ($ev.target.nodeName.toLowerCase() === 'button') {
        return;
      }
      this.mousedown = (new Date()).getTime();
    },

    endTap: function ($ev) {
      // don't track long press for buttons
      if ($ev.target.nodeName.toLowerCase() === 'button') {
        return;
      }
      var ms = 0;
      if (this.item.need && this.mousedown) {
        ms = (new Date()).getTime() - this.mousedown;
      }
      this.editable = (ms > 750);
      this.mousedown = null;
    },

    add: function () {
      this.$emit('quantity', this.item, this.item.need + 1);
    },

    remove: function () {
      if (!this.item.need) {
        return;
      }
      this.$emit('quantity', this.item, this.item.need - 1);
    },
  },
});

// use vm for console debugging
// eslint-disable-next-line no-unused-vars
var vm = new Vue({
  el: '#app',

  data: {
    storeId: config.defaultStore,
    newItem: '',
    show: { confirm: false, undo: true },
    last: {},
    itemsLoaded: []
  },

  firebase: function () {
    return {
      ref: {
        source: db.ref(),
        asObject: true
      },
    };
  },

  methods: {
    quantity: function (itemObj, quantity) {
      this.$firebaseRefs.ref.child('need/' + itemObj.store + '/' + itemObj.name).set(quantity);
    },

    check: function (itemObj) {
      var storeId = itemObj.store;
      var item = itemObj.name;
      var ts = (new Date()).toISOString().replace(/\..*/, '');
      this.last = {
        store: storeId,
        item: item,
        was: this.ref.need[storeId][item],
        ts: ts
      };
      var newVal = this.ref.need[storeId][item] ? 0 : 1;
      var path = storeId + '/' + item;
      this.$firebaseRefs.ref.child('need/' + path).set(newVal);
      if (!newVal) {
        var log = {};
        log[ts] = true;
        this.$firebaseRefs.ref.child('log/' + path).set(log);
      }
    },

    clickAddItem: function (ev) {
      this.addItem($(ev.target).closest('.list-group-item').attr('data-store'));
    },

    addItem: function (storeId) {
      var item = this.newItem.toLowerCase();
      console.log('enter item ' + item + ' to ', storeId);
      this.$firebaseRefs.ref.child('need/' + storeId + '/' + item).set(1);
      this.show = { confirm: true };
      var _this = this;
      setTimeout(function () {
        _this.show = { undo: true };
      }, 2000);
      this.last = {
        store: storeId,
        item: item,
        was: 0
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
      this.$firebaseRefs.ref.child('need/' + path).set(last.was);
      if (last.ts) {
        this.$firebaseRefs.ref.child('log/' + path + '/' + last.ts).remove();
      }
      this.last = {};
    },
  },

  watch: {
    itemsLoaded: function (val) {
      var _this = this;
      val.forEach(function (storeId) {
        if (!_this.ref.need[storeId]) {
          return;
        }
        $('#' + _this.storeMeta[storeId].cssId + ' .form-control.add').typeahead({
          source: _.without(Object.keys(_this.ref.need[storeId] || {}), '.key'),
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
      return _.without(Object.keys(this.ref.stores || {}), '.key');
    },

    storeMeta: function () {
      var meta = {};
      var ref = this.ref;
      var activeId = this.storeId;
      this.storeIds.forEach(function (storeId) {
        meta[storeId] = {
          id: storeId,
          cssId: 'store-' + storeId.replace(/[^\w\d]/g, ''),
          name: ref.stores[storeId],
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
      var ref = this.ref;
      var count = {};
      this.storeIds.forEach(function (storeId) {
        count[storeId] = Object.keys(ref.need[storeId] || {}).filter(function (item) {
          return ref.need[storeId][item];
        }).length;
      });
      return count;
    },

    sortedNeed: function () {
      var ref = this.ref;
      var items = {};
      this.storeIds.forEach(function (storeId) {
        items[storeId] = _.without(Object.keys(ref.need[storeId] || {}), '.key').map(function (item) {
          return {
            delivery: ref.delivery && ref.delivery[storeId] && ref.delivery[storeId][item],
            need: ref.need[storeId][item],
            name: item,
            id: storeId + '-' + item.replace(/[^\w\d]/g, ''),
            store: storeId,
            sortKey: (ref.need[storeId][item] ? '0' : '1') + item,
          };
        });
        items[storeId] = _.sortBy(items[storeId], 'sortKey');
      });
      this.itemsLoaded = Object.keys(items);
      return items;
    }
  }
});
