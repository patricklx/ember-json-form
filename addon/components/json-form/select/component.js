import Ember from 'ember';
import template from './template'

export default Ember.Component.extend({
  layout: template,
  ajax: Ember.inject.service(),

  searchEnabled: Ember.computed('field.searchEnabled', function () {
    if (this.get('field.searchEnabled')) {
      return true;
    } else {
      return false;
    }
  }),

  actions: {
    onSelected(item) {
      if (this.attrs.onchange) this.attrs.onchange(item || '');
      this.set('selected', item);
    },

    searchUrl(term) {
      if (Ember.isBlank(term)) { return []; }
      const url = this.get('field.url');

      return this.get('ajax').request(url, term).then(json => json.items);
    }
  }
});
