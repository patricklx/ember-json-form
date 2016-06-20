import Ember from 'ember';
import template from './template'

export default Ember.Component.extend({
  layout: template,
  ajax: Ember.inject.service(),
  tagName: '',
  selectClassNames: Ember.computed('classNames.[]', function () {
    if (Ember.isArray(this.get('classNames'))) {
      return this.get('classNames').join(' ');
    }
    return this.get('classNames');
  }),

  options: Ember.computed.alias('field.options'),
  hasIds: Ember.computed('options.firstObject.id', 'selected.firstObject.id', 'selected.id', function() {
    return this.get('options.firstObject.id') !== undefined
      || this.get('selected.firstObject.id') !== undefined
      || this.get('selected.id') !== undefined;
  }),

  searchEnabled: Ember.computed('field.searchEnabled', function () {
    var enabled = this.get('field.searchEnabled');
    var hasUrl = this.get('field.ask_server.url');
    if ( (enabled || enabled===undefined) && hasUrl) {
      return true;
    } else {
      return false;
    }
  }),

  getSelectedOptionsById() {
    var selected, value, options;
    value = this.get('value');
    options = this.get('field.options');
    if( this.get('field.multiple') ){
      selected = [];
      if (value && Ember.isArray(value)) {
        if (options) {
          if (this.get('hasIds')) {
            selected = options.filter(function (item) {
              return value.isAny('id',(Ember.get(item, 'id')));
            });
          } else {
            selected = value;
          }
        } else {
          selected = value;
        }
      }
    } else {
      if (options) {
        var findFn;
        if (this.get('hasIds')) {
          selected = options.findBy('id', value);
        } else {
          selected = value;
        }
      }
    }
    return selected;
  },

  init(){
    this._super();
    this.set('selected', this.getSelectedOptionsById());
  },

  actions: {
    onSelected(item) {
      var value;
      this.set('selected', item);
      if( this.get('field.multiple') && this.get('hasIds')){
        value = item.mapBy('id');
      } else {
        value = Ember.get(item, 'id') || item;
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
      if (this.attrs.onChange) this.attrs.onChange(item);
    },

    searchUrl(term) {
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
        if (this.get('hasIds')) {
          this.get('selected').forEach((item) => {
            var id = Ember.get(item, 'id');
            items = Ember.A(json.items);
            var obj = items.findBy('id', id);
            if (obj) {
              var i = items.indexOf(obj);
              items[i] = item;
            }
          });
        }
        return items;
      });
    },

    handleFocus(select, e) {
      select.actions.open();
    }
  }
});
