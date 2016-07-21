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
import invariant from 'invariant';
import * as regions from './regions';
import { downloadExtension, isDownloaded } from './downloadExtension';

//simply import this to kick off loading them all
import './loadExtensions';

//map of extensions
export const registry = {};

//listeners when an extension registers
const callbacks = [];

function safelyRunCallback(callback, ...args) {
  try {
    callback.apply(null, args);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('error running callback');
      console.error(err);
    }
  }
}

function safelyRunCallbacks(...args) {
  const callbackArgs = args.length ? args : [registry];
  callbacks.forEach(cb => safelyRunCallback(cb, ...callbackArgs));
}

export const validRegion = (region) => region === null || regions.hasOwnProperty(region);

//returns an array
export const extensionsByRegion = (region) => {
  return Object.keys(registry)
    .filter(key => {
      const manifest = registry[key];
      return manifest.region === region;
    })
    .map(key => registry[key])
    .sort((one, two) => one.name < two.name ? -1 : 1)
    .map(manifest => manifest.name);
};

/**
 * Validate + register an extension manifest
 * If invalid, error is caught and logged
 * called by loadExtensions to add the manifests
 * @private
 * @param {Object} manifest A valid manifest
 * @returns {Object} registry
 * @throws If manifest is invalid
 */
export const registerManifest = (manifest) => {
  try {
    const { name, region } = manifest;
    invariant(name, 'Name is required');
    invariant(region || region === null, 'Region (manifest.region) is required to register a client-side extension, or null for non-visual extensions');
    invariant(validRegion(region), 'Region must be a valid region');

    Object.assign(registry, { [name]: manifest });

    safelyRunCallbacks(registry, name, region);
  } catch (err) {
    console.log(`could not register extension ${manifest.name}:`);
    console.error(err);
  }
};

/**
 * Register the render() function of an extension
 * Extension manifest must already registered
 * used by registerExtension
 * @private
 * @param key
 * @param render
 * @throws If extension manifest not already registered
 */
export const registerRender = (key, render) => {
  invariant(registry[key], 'manifest must exist for extension ' + key + ' before registering');

  Object.assign(registry[key], {
    render,
  });
};

/**
 * Register a callback for when extensions are registered
 * @param {Function} cb Callback, called with signature (registry, key, region) where key is last registered extension key
 * @param {boolean} [skipFirst=false] Execute on register?
 * @returns {Function} Unregister function
 */
export const onRegister = (cb, skipFirst = false) => {
  callbacks.push(cb);
  !skipFirst && safelyRunCallback(cb, registry);
  return function unregister() { callbacks.splice(callbacks.findIndex(cb), 1) };
};

export const getExtensionName = (key) => {
  const manifest = registry[key];
  if (!manifest) {
    return null;
  }
  return manifest.readable || manifest.name;
};

export const downloadAndRender = (key, container, options) => {
  return downloadExtension(key)
    .then(() => {
      const manifest = registry[key];
      if (typeof manifest.render !== 'function') {
        console.warn(`Extension ${name} did not specify a render() function, even though it defined a region. Check Extension manifest definition.`)
        return;
      }
      manifest.render(container, options);
    });
};

export
default
registry;
