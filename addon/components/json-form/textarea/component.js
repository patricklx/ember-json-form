import Ember from 'ember';

export default Ember.Component.extend({

  _value: Ember.computed('value', function () {
    return this.get('value');
  })
});
