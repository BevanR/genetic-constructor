export const focusGetProject = () => {
  return (dispatch, getState) => {
    const { forceProject, project } = getState().focus;
    if (forceProject) {
      return forceProject;
    }
    return getState().projects[project];
  };
};

export const focusGetConstruct = () => {
  return (dispatch, getState) => {
    const state = getState();
    return state.blocks[state.focus.construct];
  };
};

export const focusGetBlocks = () => {
  return (dispatch, getState) => {
    const state = getState();
    const { forceBlocks, blocks } = state.focus;
    if (forceBlocks.length) {
      return forceBlocks;
    }
    return blocks.map(blockId => state.blocks[blockId]);
  };
};

export const focusGetBlockBounds = () => {
  return (dispatch, getState) => {
    //todo
    console.error('todo');
  };
};
