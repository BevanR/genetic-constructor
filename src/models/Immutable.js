/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import { set as pathSet, unset as pathUnset, cloneDeep, merge } from 'lodash';
import invariant from 'invariant';

/**
 * The Immutable class creates Immutable objects, whose properties are immutable and cannot be modifed except through their defined API.
 * @name Immutable
 * @class
 */
export default class Immutable {
  constructor(input = {}) {
    invariant(typeof input === 'object', 'must pass an object Immutable constructor');

    merge(this,
      input,
    );

    if (process.env.NODE_ENV !== 'production') {
      require('deep-freeze')(this);
    }

    return this;
  }

  /**
   * Change the value of a property, returning a new Immutable
   * Uses {@link https://lodash.com/docs#set lodash _.set()} syntax for path, e.g. `a[0].b.c`
   * @param {string} path Path of property to change
   * @param {*} value New value
   * @returns {Immutable} A new instance
   * @example
   * const initial = new Immutable({some: {value: 9}});
   * initial.some.value; //9
   * const next = initial.mutate('some.value', 10);
   * next.some.value; //10
   * initial.some.value; //9
   */
  mutate(path, value) {
    //use cloneDeep and perform mutation prior to calling constructor because constructor may freeze object
    const base = cloneDeep(this);
    pathSet(base, path, value);
    return new this.constructor(base);
  }

  /**
   * Return a new Immutable with input object merged into it
   * Uses {@link https://lodash.com/docs#merge lodash _.merge()} for performing a deep merge
   * @param {object} obj Object to merge into instance
   * @returns {Immutable} A new instance, with `obj` merged in
   * @example
   * const initial = new Immutable();
   * const next = initial.merge({new: 'stuff'});
   */
  merge(obj) {
    //use cloneDeep and perform mutation prior to calling constructor because constructor may freeze object
    const base = cloneDeep(this);
    merge(base, obj);
    return new this.constructor(base);
  }
}
