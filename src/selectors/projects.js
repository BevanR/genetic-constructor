import * as blockSelectors from './blocks';

const _getProjectFromStore = (projectId, store) => {
  return store.projects[projectId];
};

export const projectGet = (projectId) => {
  return (dispatch, getState) => {
    return _getProjectFromStore(projectId, getState());
  };
};

export const projectGetVersion = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());
    return project.version;
  };
};

//returns constructs first, then all blocks afterwards, order not guaranteed
export const projectListAllBlocks = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());
    const constructs = [];
    const blocks = project.components.reduce((acc, componentId) => {
      constructs.push(dispatch(blockSelectors.blockGet(componentId)));
      const constructChildren = dispatch(blockSelectors.blockGetChildrenRecursive(componentId));
      acc.push(...constructChildren);
      return acc;
    }, []);
    return constructs.concat(blocks);
  };
};

export const projectHasBlock = (projectId, blockId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());
    const blocks = project.components.reduce((acc, componentId) => {
      const constructChildren = dispatch(blockSelectors.blockGetChildrenRecursive(componentId));
      acc.push(...constructChildren);
      return acc;
    }, []);
    return blocks.includes(blockId);
  };
};

export const projectCreateRollup = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());
    const blocks = dispatch(projectListAllBlocks(projectId));

    return {
      project,
      blocks,
    };
  };
};
