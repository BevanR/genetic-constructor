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
import rejectingFetch from './utils/rejectingFetch';
import invariant from 'invariant';
import { headersGet, headersPost, headersPut, headersDelete } from './utils/headers';
import { extensionApiPath } from './utils/paths';
import uploadFiles from './utils/uploadFiles';

const extensionKey = 'genbank';

export function importFile(projectId = null, ...files) {
  const url = extensionApiPath(extensionKey, `import${!!projectId ? ('/' + projectId) : ''}`);

  return uploadFiles(url, {}, ...files)
    .then(resp => resp.json())
    .then(json => {
      invariant(json && json.projectId, 'expect a project ID');
      return json.projectId;
    });
}

//todo - need a route
function importStringBase(payload, projectId) {
  invariant(typeof payload === 'object', 'payload must be object');
  invariant(typeof payload.string === 'string', 'must pass string to import');

  const url = extensionApiPath(extensionKey, `import${projectId ? ('/' + projectId) : ''}`);

  return rejectingFetch(url, headersPost(JSON.stringify(payload)))
    .then(resp => resp.json());
}

/**
 * @private
 * import a CSV file into the given project or into a new project.
 * project ID is returned and should be reloaded if the current project or opened if a new project.
 * Promise resolves with projectId on success and rejects with fetch response
 */
export const importString = (genbankString, projectId, options = {}) => {
  invariant(typeof genbankString === 'string', 'must pass a genbank file as text. to use a file, use importFile.');

  const payload = Object.assign({}, options, { string: genbankString });
  return importStringBase(payload, projectId)
    .then(json => {
      invariant(json && json.projectId, 'expect a project ID');
      return json.projectId;
    });
};

//convert without creating a project, but will save sequences
export const convert = (genbankString, constructsOnly = false) => {
  invariant(typeof genbankString === 'string', 'must pass a genbank file as text. to use a file, use importGenbankFile.');

  const payload = {
    constructsOnly,
    string: genbankString,
  };

  return importStringBase(payload, 'convert');
};

export const exportConstruct = (projectId, constructId, options = {}) => {
  invariant(projectId, 'project ID is required');
  invariant(constructId, 'construct ID is required, otherwise export project');
  invariant(typeof options === 'object', 'options must be an object');

  const url = extensionApiPath(extensionKey, `export/${projectId}/${constructId}`);
  const opts = JSON.stringify(options);
  return rejectingFetch(url, headersPost(opts))
    .then(resp => resp.text());
};

export const exportProject = (projectId, options = {}) => {
  invariant(projectId, 'project ID is required');
  invariant(typeof options === 'object', 'options must be an object');

  const url = extensionApiPath(extensionKey, `export/${projectId}`);
  const opts = JSON.stringify(options);
  return rejectingFetch(url, headersPost(opts))
    .then(resp => resp.text());
};
