import Ember from 'ember';
import template from './template'

export default Ember.Component.extend({
  layout: template,
  ajax: Ember.inject.service(),
  tagName: '',
  searchDelay: 500,
  allowClear: true,
  isInitialized: false,
  isInitializing: false,
  options: Ember.computed.alias('field.options'),

  init() {
    this._super();
    this.updateIniSelected();
  },

  updateIniSelected: Ember.observer('value', 'form.iniData', function () {
    this.set('selected', this.getSelectedOptionsById());
  }),

  selectClassNames: Ember.computed('classNames.[]', function () {
    if (Ember.isArray(this.get('classNames'))) {
      return this.get('classNames').join(' ');
    }
    return this.get('classNames');
  }),


  hasIds: Ember.computed('options.firstObject.id', 'selected.firstObject.id', 'selected.id', function() {
    return this.get('options.firstObject.id') !== undefined
      || this.get('selected.firstObject.id') !== undefined
      || this.get('selected.id') !== undefined;
  }),

  searchEnabled: Ember.computed('field.search_enabled', function () {
    var initialize = this.get('field.initialize');
    var hasUrl = this.get('field.ask_server.url');
    if (!initialize && hasUrl) {
      return true;
    } else {
      return false;
    }
  }),

  getSelectedOptionsById() {
    var selected, value, options;
    value = this.get('value');
    if (value === undefined || value == null) {
      return null;
    }
    selected = value;
    options = this.get('field.options');
    if( this.get('field.multiple') ){
      if (value && Ember.isArray(value)) {
        if (options) {
          if (this.get('hasIds')) {
            selected = options.filter(function (item) {
              return value.isAny('id',(Ember.get(item, 'id')));
            });
          }
        }
      }
    } else if (options) {
      var findFn;
      if (this.get('hasIds')) {
        selected = options.findBy('id', Ember.get(value, 'id'));
      }
    }
    return selected;
  },

  runSearch: function (term, resolve, reject) {
    var data, params, key;
    if (Ember.isBlank(term)) { return []; }
    const url = this.get('field.ask_server.url');
    data = {
      search: term
    };
    params = this.get('field.ask_server.params') || {};
    for(key of Object.keys(params)) {
      var value;
      value = params[key];
      data[key] = this.get('form').get(value) || value;
    }
    return this.get('ajax').request(url, {data:data}).then((json) => {
      var items = json.items;
      items = Ember.A(json.items);
      if (this.get('hasIds') && this.get('selected')) {
        if( this.get('field.multiple') ) {
          this.get('selected').forEach((item) => {
            var id = Ember.get(item, 'id');
            var obj = items.findBy('id', id);
            if (obj) {
              var i = items.indexOf(obj);
              items[i] = item;
            }
          });
        } else {
          var id = Ember.get(this.get('selected'), 'id');
          var obj = items.findBy('id', id);
          if (obj) {
            var i = items.indexOf(obj);
            items[i] = this.get('selected');
          }
        }
      }
      if (resolve) {
        resolve(items);
      }
      return items;
    })
  },

  actions: {
    onSelected(item) {
      var value;
      this.set('selected', item);
      if( this.get('field.multiple') && this.get('hasIds')){
        value = item.mapBy('id');
      } else if (item) {
        value = Ember.get(item, 'id') || item;
      }
      if (value === undefined) {
        value = '';
      }
      if (this.attrs.onChange) this.attrs.onChange(item || '');
    },

    onclose() {
      var item = this.get('selected');
      var value;
      if( item && this.get('field.multiple') && this.get('hasIds')){
        value = item.mapBy('id');
      } else if (item) {
        value = Ember.get(item, 'id') || item;
      }
      if (value === undefined) {
        value = '';
      }
      if (this.attrs.onChange) this.attrs.onChange(item || '');
    },

    searchUrl(term) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        Ember.run.debounce(this, this.runSearch, term, resolve, reject, this.get('searchDelay'));
      })
    },

    handleFocus(select, e) {
      if (this.get('field.initialize') && !this.get('isInitialized') && !this.get('isInitializing')) {
        var p = this.runSearch('initialize')
        this.set('options', p);

        this.set('isInitializing', true);
        p.then(() => {
          this.set('isInitialized', true);
        });
        p.finally(() => {
          this.set('isInitializing', false);
        });
      }
      //select.actions.open();
    }
  }
});
