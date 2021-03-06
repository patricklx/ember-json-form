import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  ajax: Ember.inject.service(),
  tagName: '',

  init() {
    this._super();
  },

  actions: {
    onChange(value) {
      var file;
      if (value instanceof Event) {
        file = value ? value.target.files[0] : null;
        this.onChange(file);
      }
    }
  }
});
