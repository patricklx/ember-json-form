import Ember from 'ember';
import template from './template';
import {getOperators} from 'ember-json-form/utils/functions';

export default Ember.Component.extend({
  layout: template,
  form: null,
  object: null,
  tagName: '',
  operators: {},

  _operators: Ember.computed(function () {
    let operators = this.get('operators');
    let defaultOps = getOperators();

    for (let k in Object.keys(operators)) {
      defaultOps[k] = operators[k];
    }
    return defaultOps;
  }),

  init() {
    this._super();
    let root, onlyIf, path, form, object, args;
    form = this.get('form');
    object = this.get('object');

    root = form.rootPath;
    onlyIf = Ember.get(object, 'only_if');
    if (!onlyIf) {
      this.set('ifIsTrue', true);
      return;
    }

    //get the paths for computed dependency
    args = [];
    for (path of Object.keys(onlyIf)) {
      args.push('form.'+root+'.'+path);
    }

    //define the computed function
    args.push(function () {
      let root, onlyIf, path, form, object, allPas;
      form = this.get('form');
      object = this.get('object');
      root = form.rootPath;
      onlyIf = Ember.get(object, 'only_if');
      if (!onlyIf) {
        return true;
      }

      allPas = true;
      for (path of Object.keys(onlyIf)) {
        let rule, operator, value, op;
        rule = onlyIf[path];
        [operator, value] = rule.split(':');

        path = root+'.'+path;
        op = this.get('_operators.' + operator);
        allPas = allPas && op(Ember.get(form, path), value);
      }
      return allPas;
    });
    Ember.defineProperty(this, 'ifIsTrue', Ember.computed.apply(null, args));
  }
});
