import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  tagName: '',

  _value: Ember.computed('value', function () {
    return this.get('value') || false;
  }),

  actions: {

    onChange(value) {
      this.attrs.onChange(value);
    }
  }
});
