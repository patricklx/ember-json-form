import Ember from 'ember';
import template from './template';

export default Ember.Component.extend({
  layout: template,
  tagName: '',

  _value: Ember.computed('value', function () {
    return this.get('value');
  }),

  value: Ember.computed({
    get(){},
    set(key, val){
      Ember.run.next(() => {
        let eId = this.get('elementId');
        let e = Ember.$(`#${eId} textarea`);
        e.css({'height':'auto', 'overflow-y': 'hidden'}).height(e[0].scrollHeight);
        e.css({'overflow-y': 'auto'});
      });
      return val;
    }
  }),

  actions: {

    onChange(value) {
      this.attrs.onChange(value);
      let eId = this.get('elementId');
      let e = Ember.$(`#${eId} textarea`);
      e.css({'height':'auto', 'overflow-y': 'hidden'}).height(e[0].scrollHeight);
      e.css({'overflow-y': 'auto'});
    }
  }
});
