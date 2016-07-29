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
/**
 * @module Actions_Inventory
 * @memberOf module:Actions
 */
import * as ActionTypes from '../constants/ActionTypes';
import { getSources } from '../inventory/registry';
import * as searchApi from '../middleware/search';

//note - expects this to be static
const searchSources = getSources('search');

//if immediate, call on leading edge, prevent subsequence calls until timeout clears
//will not resolve when debounced. note that not rejected, could probably write to handle that with a pending state
let timeout;
function debouncer(wait = 250, immediate = false) {
  return new Promise((resolve, reject) => {
    const later = () => {
      timeout = null;
      if (!immediate) {
        resolve();
      }
    };
    const callNow = immediate === true; // || !timeout; --- un comment to enable on leading edge
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) resolve();
  });
}

/**
 * Set the inventory search term, without actually running a search
 * @function
 * @param {string} searchTerm
 * @returns {string} Search term
 */
export const inventorySetSearchTerm = (searchTerm) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.INVENTORY_SET_SEARCH_TERM,
      searchTerm,
    });
    return searchTerm;
  };
};

/**
 * Search for a term across active search sources
 * @function
 * @param {string} inputTerm Term to search for
 * @param {Object} [options=null]
 * @param {boolean} [skipDebounce=false]
 * @returns {Promise}
 * @resolve {Array} Search results
 * @reject {null}
 */
export const inventorySearch = (inputTerm = '', options = null, skipDebounce = false) => {
  return (dispatch, getState) => {
    const state = getState();
    const { sourceList } = state.inventory;
    const searchTerm = (typeof inputTerm !== 'undefined') ? inputTerm : state.inventory.searchTerm;

    dispatch({
      type: ActionTypes.INVENTORY_SEARCH,
      sourceList,
      searchTerm,
    });

    if (!inputTerm.length) {
      return Promise.resolve();
    }

    //debounce initiation of searches
    return debouncer(500, skipDebounce)
      .then(() => searchApi.search(searchTerm, options, sourceList))
      .then(searchResults => {
        dispatch({
          type: ActionTypes.INVENTORY_SEARCH_RESOLVE,
          searchResults,
          searchTerm,
          sourceList,
        });
        return searchResults;
      })
      .catch(err => {
        dispatch({
          type: ActionTypes.INVENTORY_SEARCH_REJECT,
          searchTerm,
        });
        return null;
      });
  };
};

/**
 * Toggle whether the sources view is open
 * @function
 * @param {boolean} [forceState] Ignore to toggle
 * @returns {boolean} Whether showing now
 */
export const inventoryShowSourcesToggling = (forceState) => {
  return (dispatch, getState) => {
    const state = getState();
    const { sourcesToggling, sourceList, lastSearch, searchTerm } = state.inventory;

    const nextState = (forceState !== undefined) ? !!forceState : !sourcesToggling;
    dispatch({
      type: ActionTypes.INVENTORY_SOURCES_VISIBILITY,
      nextState,
    });

    //if not toggling any more, check if need to run a new search
    if (!nextState) {
      if (sourceList.some(source => lastSearch.sourceList.indexOf(source) < 0)) {
        dispatch(inventorySearch(searchTerm, null, true));
      }
    }

    return nextState;
  };
};

/**
 * Set the list of active search sources
 * @function
 * @param {Array} sourceList List of sources
 * @returns {Array} Sources now using
 */
export const inventorySetSources = (sourceList = []) => {
  return (dispatch, getState) => {
    if (!(sourceList.length && sourceList.every(source => searchSources.indexOf(source) >= 0))) {
      return getState().inventory.sourceList;
    }

    dispatch({
      type: ActionTypes.INVENTORY_SET_SOURCES,
      sourceList,
    });

    return sourceList;
  };
};

/**
 * Toggle whether a search source is active
 * @function
 * @param {string} source
 * @returns {Array} List of active sources
 */
export const inventoryToggleSource = (source) => {
  return (dispatch, getState) => {
    if (searchSources.indexOf(source) < 0) {
      return null;
    }

    const sourceList = getState().inventory.sourceList.slice();

    //xor, reset if empty
    const indexOfSource = sourceList.indexOf(source);
    if (indexOfSource >= 0) {
      sourceList.splice(indexOfSource, 1);
      if (sourceList.length === 0) {
        sourceList.push(...getSources('search'));
      }
    } else {
      sourceList.push(source);
    }

    return dispatch(inventorySetSources(sourceList));
  };
};

/**
 * Toggle whether an inventory Source is visible. This controls whether its results are visible, not whether the source is active.
 *
 * don't check this for source being in source list since currently use this for also handling whether a role is visible (see inventory component, depends on how grouped)
 * @function
 * @param {string} source
 * @returns {Object} Map of sources to whether they are visible
 */
export const inventoryToggleSourceVisible = (source) => {
  return (dispatch, getState) => {
    const { sourcesVisible } = getState().inventory;
    const nextState = Object.assign({}, sourcesVisible, { [source]: !sourcesVisible[source] });

    dispatch({
      type: ActionTypes.INVENTORY_SOURCES_VISIBLE,
      sourcesVisible: nextState,
    });

    return nextState;
  };
};
