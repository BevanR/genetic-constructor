import invariant from 'invariant';
import path from 'path';
import { merge, values, forIn } from 'lodash';
import { errorDoesNotExist, errorAlreadyExists, errorInvalidModel, errorVersioningSystem } from '../utils/errors';
import { validateBlock, validateProject, validateOrder } from '../utils/validation';
import * as filePaths from './../utils/filePaths';
import * as versioning from './versioning';
import * as commitMessages from './commitMessages';
import {
  fileExists,
  fileRead,
  fileWrite,
  fileDelete,
  fileMerge,
  directoryMake,
  directoryDelete,
  directoryMove,
} from '../utils/fileSystem';
import * as permissions from './permissions';

/*********
 Helpers
 *********/

// EXISTENCE

const _projectExists = (projectId, sha) => {
  const manifestPath = filePaths.createProjectManifestPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);

  if (!sha) {
    return fileExists(manifestPath);
  }
  return versioning.versionExists(projectDataPath, sha);
};

//this is kinda expensive, so shouldnt just call it all the time all willy-nilly
const _blocksExist = (projectId, sha = false, ...blockIds) => {
  invariant(blockIds.length > 0, 'must pass block ids');

  const manifestPath = filePaths.createBlockManifestPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const relativePath = path.relative(projectDataPath, manifestPath);

  if (!sha) {
    return fileRead(manifestPath)
      .then(blocks => blockIds.every(blockId => !!blocks[blockId]));
  }

  versioning.checkout(projectDataPath, relativePath, sha)
    .then(string => JSON.parse(string))
    .then(blocks => blockIds.every(blockId => !!blocks[blockId]));
};

const _orderExists = (orderId, projectId) => {
  const manifestPath = filePaths.createOrderManifestPath(orderId, projectId);
  return fileExists(manifestPath);
};

// READING

const _projectRead = (projectId, sha) => {
  const manifestPath = filePaths.createProjectManifestPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const relativePath = path.relative(projectDataPath, manifestPath);

  if (!sha) {
    return fileRead(manifestPath);
  }

  //todo - should forcibly assign sha version to the project
  return versioning.checkout(projectDataPath, relativePath, sha)
    .then(string => JSON.parse(string));
};

//if any block doesnt exist, then reject
const _blocksRead = (projectId, sha = false, ...blockIds) => {
  const manifestPath = filePaths.createBlockManifestPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const relativePath = path.relative(projectDataPath, manifestPath);

  if (!sha) {
    return fileRead(manifestPath)
      .then(blocks => {
        if (blockIds.length && !blockIds.every(blockId => !!blocks[blockId])) {
          return Promise.reject(errorDoesNotExist);
        }

        return blockIds.length ?
          blockIds.reduce((acc, blockId) => Object.assign(acc, { [blockId]: blocks[blockId] }), {}) :
          blocks;
      });
  }

  //untested
  console.warn('untested - getting blocks with a sha');
  return versioning.checkout(projectDataPath, relativePath, sha)
    .then(string => JSON.parse(string))
    .then(blocks => {
      return blockIds.length ?
        blockIds.reduce((acc, blockId) => Object.assign(acc, { [blockId]: blocks[blockId] }), {}) :
        blocks;
    });
};

const _orderRead = (orderId, projectId) => {
  const manifestPath = filePaths.createOrderManifestPath(orderId, projectId);
  return fileRead(manifestPath);
};

// SETUP

const _projectSetup = (projectId, userId) => {
  const projectPath = filePaths.createProjectPath(projectId);
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const orderDirectory = filePaths.createOrderDirectoryPath(projectId);
  const blockDirectory = filePaths.createBlockDirectoryPath(projectId);

  return directoryMake(projectPath)
    .then(() => directoryMake(projectDataPath))
    .then(() => directoryMake(orderDirectory))
    .then(() => directoryMake(blockDirectory))
    .then(() => permissions.createProjectPermissions(projectId, userId))
    .then(() => versioning.initialize(projectDataPath, userId));
};

const _orderSetup = (orderId, projectId) => {
  const orderDirectory = filePaths.createOrderPath(orderId, projectId);
  return directoryMake(orderDirectory);
};

// WRITING

const _projectWrite = (projectId, project = {}) => {
  const manifestPath = filePaths.createProjectManifestPath(projectId);
  return fileWrite(manifestPath, project);
};

const _blocksWrite = (projectId, blockMap = {}, replace = false) => {
  const manifestPath = filePaths.createBlockManifestPath(projectId);
  invariant(typeof blockMap === 'object', 'must pass a map of block ids to blocks');

  return (replace === true) ?
    fileWrite(manifestPath, blockMap) :
    fileMerge(manifestPath, blockMap);
};

const _orderWrite = (orderId, order = {}, projectId) => {
  const manifestPath = filePaths.createOrderManifestPath(orderId, projectId);
  return fileWrite(manifestPath, order);
};

const _orderRollupWrite = (orderId, rollup, projectId) => {
  const orderPath = filePaths.createOrderProjectManifestPath(orderId, projectId);
  return fileWrite(orderPath, rollup);
};

// COMMITS

//expects a well-formed commit message from commitMessages.js
const _projectCommit = (projectId, userId, message) => {
  const projectDataPath = filePaths.createProjectDataPath(projectId);
  const commitMessage = !message ? commitMessages.messageProject(projectId) : message;
  return versioning.commit(projectDataPath, commitMessage, userId)
    .then(sha => versioning.getCommit(projectDataPath, sha));
};

/*********
 API
 *********/

//EXISTS

export const projectExists = (projectId, sha) => {
  return _projectExists(projectId, sha);
};

export const blocksExist = (projectId, sha = false, ...blockIds) => {
  return _blocksExist(projectId, sha, ...blockIds);
};

export const orderExists = (orderId, projectId) => {
  return _orderExists(orderId, projectId);
};

const projectAssertNew = (projectId) => {
  return projectExists(projectId)
    .then(() => Promise.reject(errorAlreadyExists))
    .catch((err) => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(projectId);
      }
      return Promise.reject(err);
    });
};

const blockAssertNew = (blockId, projectId) => {
  return blocksExist(projectId, false, blockId)
    .then(() => Promise.reject(errorAlreadyExists))
    .catch((err) => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(blockId);
      }
      return Promise.reject(err);
    });
};

const orderAssertNew = (orderId, projectId) => {
  return orderExists(orderId, projectId)
    .then(() => Promise.reject(errorAlreadyExists))
    .catch((err) => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(orderId);
      }
      return Promise.reject(err);
    });
};

//GET
//resolve with null if does not exist

export const projectGet = (projectId, sha) => {
  return _projectRead(projectId, sha)
    .catch(err => {
      console.log('(persistence.projectGet) error reading project ' + projectId, err);
      if (err === errorDoesNotExist && !sha) {
        return Promise.resolve(null);
      }
      //let the versioning error fall through, or uncaught error
      return Promise.reject(err);
    });
};

export const blocksGet = (projectId, sha = false, ...blockIds) => {
  return _blocksRead(projectId, sha, ...blockIds)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(null);
      }
      return Promise.reject(err);
    });
};

export const orderGet = (orderId, projectId) => {
  return _orderRead(orderId, projectId)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.resolve(null);
      }
      return Promise.reject(err);
    });
};

//CREATE

export const projectCreate = (projectId, project, userId) => {
  invariant(typeof userId !== 'undefined', 'user id is required');

  return projectAssertNew(projectId)
    .then(() => _projectSetup(projectId, userId))
    .then(() => _projectWrite(projectId, project))
    //MAY keep this initial commit message, even when not auto-commiting for all atomic operations
    //since create is a different operation than just called projectWrite / projectMerge
    //.then(() => _projectCommit(projectId, userId, commitMessages.messageCreateProject(projectId)))
    .then(() => project);
};

//SET (WRITE + MERGE)

export const projectWrite = (projectId, project, userId) => {
  const idedProject = Object.assign({}, project, { id: projectId });

  if (!validateProject(idedProject)) {
    return Promise.reject(errorInvalidModel);
  }

  //create directory etc. if doesn't exist
  return projectExists(projectId)
    .catch(() => _projectSetup(projectId, userId))
    .then(() => _projectWrite(projectId, idedProject))
    //.then(() => _projectCommit(projectId, userId))
    .then(() => idedProject);
};

export const projectMerge = (projectId, project, userId) => {
  return projectGet(projectId)
    .then(oldProject => {
      const merged = merge({}, oldProject, project, { id: projectId });
      return projectWrite(projectId, merged, userId);
    });
};

export const blocksWrite = (projectId, blockMap) => {
  if (!values(blockMap).every(block => validateBlock(block))) {
    return Promise.reject(errorInvalidModel);
  }

  //todo - re-enable
  //force projectid
  //forIn(blockMap, (block, blockId) => Object.assign(block, { projectId }));

  return _blocksWrite(projectId, blockMap, true);
};

export const blocksMerge = (projectId, blockMap) => {
  if (!values(blockMap).every(block => validateBlock(block))) {
    return Promise.reject(errorInvalidModel);
  }

  //todo - re-enable
  //force projectID
  //forIn(blockMap, (block, blockId) => Object.assign(block, { projectId }));

  return _blocksWrite(projectId, blockMap, false);
};

//to write a single block... but in general you should write many at once using blocksMerge / blocksWrite
export const blockMerge = (projectId, blockId, patch) => {
  return blocksGet(projectId, false, blockId)
    .then(blockMap => {
      const oldBlock = blockMap[blockId];
      const merged = merge({}, oldBlock, patch, {
        projectId,
        id: blockId,
      });
      return blocksMerge(projectId, merged);
    })
    .then(blockMap => blockMap[blockId]);
};

//prefer blocksWrite, but for atomic operations this is ok
export const blockWrite = (projectId, block) => {
  return blocksMerge(projectId, { [ block.id]: block })
    .then(blockMap => blockMap[block.id]);
};

export const orderWrite = (orderId, order, projectId, roll) => {
  const idedOrder = Object.assign({}, order, {
    projectId,
    id: orderId,
  });

  if (!validateOrder(idedOrder)) {
    return Promise.reject(errorInvalidModel);
  }

  return orderAssertNew(orderId, projectId)
    .then(() => _orderSetup(orderId, projectId))
    .then(() => Promise.all([
      _orderWrite(orderId, idedOrder, projectId),
      _orderRollupWrite(orderId, roll, projectId),
    ]))
    .then(() => idedOrder);
};

//DELETE

export const projectDelete = (projectId, forceDelete = false) => {
  const projectPath = filePaths.createProjectPath(projectId);
  const trashPath = filePaths.createTrashPath(projectId);

  if (forceDelete === true) {
    return directoryDelete(projectPath)
      .then(() => projectId);
  }

  return projectExists(projectId)
    .then(() => projectGet(projectId))
    .then(project => {
      if (project.isSample) {
        return Promise.reject('cannot delete sample projects');
      }
    })
    .then(() => {
      // DEPRECATED - ACTUALLY DELETE
      //const projectPath = filePaths.createProjectPath(projectId);
      //return directoryDelete(projectPath);

      /*
       //DEPRECATED - CHANGE PERMISSIONS FILE
       //dont want to actually delete it.. just delete the permissions (move to a new file)
       const projectPermissionsPath = filePaths.createProjectPermissionsPath(projectId);
       const deletedOwnerPath = filePaths.createProjectPath(projectId, filePaths.permissionsDeletedFileName);
       return fileRead(projectPermissionsPath)
       .then(contents => {
       return fileWrite(projectPermissionsPath, [])
       //but also should track somewhere who used to own it...
       .then(() => fileWrite(deletedOwnerPath, contents));
       });
       */

      //MOVE TO TRASH FOLDER
      return directoryMove(projectPath, trashPath);
    })
    //no need to commit... its deleted (and permissions out of scope of data folder)
    .then(() => projectId);
};

export const blocksDelete = (projectId, ...blockIds) => {
  return blocksGet(projectId)
    .then(blockMap => {
      blockIds.forEach(blockId => {
        delete blockMap[blockId];
      });
      return blocksWrite(projectId, blockMap);
    })
    .then(() => blockIds);
};

//not sure why you would do this...
export const orderDelete = (orderId, projectId) => {
  const orderPath = filePaths.createOrderManifestPath(orderId, projectId);
  return orderId(orderId, projectId)
    .then(() => fileDelete(orderPath))
    .then(() => orderId);
};

//SAVE

//e.g. autosave
export const projectSave = (projectId, userId, messageAddition) => {
  const message = commitMessages.messageSave(projectId, messageAddition);
  return _projectCommit(projectId, userId, message)
    .then(commit => {
      //not only create the commit, but then save the project so that is has the right commit (but dont commit again)
      //but still return the commit
      return projectMerge(projectId, {
        version: commit.sha,
        lastSaved: commit.time,
      }, userId)
        .then(() => commit);
    });
};

//explicit save aka 'snapshot'
export const projectSnapshot = (projectId, userId, messageAddition) => {
  const message = commitMessages.messageSnapshot(projectId, messageAddition);
  return _projectCommit(projectId, userId, message);
};

//sequence

export const sequenceExists = (md5) => {
  const sequencePath = filePaths.createSequencePath(md5);
  return fileExists(sequencePath)
    .then(() => sequencePath);
};

export const sequenceGet = (md5) => {
  return sequenceExists(md5)
    .then(path => fileRead(path, false));
};

//blockId and projectId optional, will create commit if provided
export const sequenceWrite = (md5, sequence, blockId, projectId) => {
  const sequencePath = filePaths.createSequencePath(md5);
  return fileWrite(sequencePath, sequence, false)
    .then(() => sequence);
};

//probably dont want to let people do this, since sequence may be referenced by multiple blocks...
export const sequenceDelete = (md5) => {
  return sequenceExists(md5)
    .then(path => fileDelete(path));
};

