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
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { uiToggleDetailView, detailViewSelectExtension } from '../actions/ui';
import { focusDetailsExist } from '../selectors/focus';
import { extensionsByRegion, getExtensionName, onRegister } from '../extensions/clientRegistry';
import { throttle } from 'lodash';

import ExtensionView from './ExtensionView';

import '../styles/ProjectDetail.css';

const projectDetailExtensionRegion = 'sequenceDetail';

export class ProjectDetail extends Component {
  static propTypes = {
    uiToggleDetailView: PropTypes.func.isRequired,
    detailViewSelectExtension: PropTypes.func.isRequired,
    focusDetailsExist: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired,
    currentExtension: PropTypes.any, //todo - allow null or key
    project: PropTypes.object.isRequired,
  };

  state = {
    //default open height
    openHeight: 400,
  };

  extensions = [];

  componentDidMount() {
    //listen to get relevant manifests here
    this.extensionsListener = onRegister((registry, key, region) => {
      if (region === projectDetailExtensionRegion) {
        this.extensions = extensionsByRegion(projectDetailExtensionRegion);
        this.forceUpdate();
      }
    }, true);
  }

  componentWillUnmount() {
    this.extensionsListener();
  }

  openExtension = (key) => {
    if (!key) {
      return;
    }

    this.toggle(true);
    this.props.detailViewSelectExtension(key);
  };

  /** resize things (todo - make a component that handles this) **/

  throttledDispatchResize = throttle(() => window.dispatchEvent(new Event('resize')), 50);

  handleResizableMouseDown = evt => {
    evt.preventDefault();
    this.refs.resizeHandle.classList.add('dragging');
    document.addEventListener('mousemove', this.handleResizeMouseMove);
    document.addEventListener('mouseup', this.handleResizeMouseUp);
    this.dragStart = evt.pageY;
    //cringe-worthy query selector voodoo
    //leave at least 200 px in the design canvas
    this.dragMax = document.querySelector('.ProjectPage-content').getBoundingClientRect().height - 200;
    this.openStart = this.state.openHeight;
  };

  handleResizeMouseMove = evt => {
    evt.preventDefault();
    const delta = this.dragStart - evt.pageY;
    const minHeight = 200;
    const nextHeight = Math.min(this.dragMax, Math.max(minHeight, this.openStart + delta));
    this.setState({ openHeight: nextHeight });
    this.throttledDispatchResize();
  };

  handleResizeMouseUp = evt => {
    evt.preventDefault();
    this.refs.resizeHandle.classList.remove('dragging');
    this.dragStart = null;
    this.openStart = null;
    document.removeEventListener('mousemove', this.handleResizeMouseMove);
    document.removeEventListener('mouseup', this.handleResizeMouseUp);
    window.dispatchEvent(new Event('resize'));
  };

  /** end resize things **/

  canToggleExtension = () => {
    return true; //this.props.focusDetailsExist(); //we dont really care - just let extensions render
  };

  handleClickToggle = evt => {
    if (this.props.focusDetailsExist()) {
      this.toggle();
      this.loadExtension(this.extensions[0]);
    }
  };

  toggle = (forceVal) => {
    this.props.uiToggleDetailView(this.canToggleExtension() && forceVal);
  };

  render() {
    if (!this.extensions.length) {
      return null;
    }

    const { isVisible, currentExtension } = this.props;
    const currentExtensionName = getExtensionName(currentExtension);
    const detailsExist = this.canToggleExtension();

    const header = (isVisible && currentExtension) ?
      (
        <div className="ProjectDetail-heading">
          <a
            className="ProjectDetail-heading-extension visible">{currentExtensionName}</a>
          <a ref="close"
             className={'ProjectDetail-heading-close' + (!detailsExist ? ' disabled' : '')}
             onClick={() => this.toggle(false)}/>
        </div>
      ) :
      (
        <div className="ProjectDetail-heading">
          <a ref="open"
             className="ProjectDetail-heading-toggle"
             onClick={this.handleClickToggle}/>
          <div className="ProjectDetail-heading-extensionList">
            {this.extensions.map(key => {
              const name = getExtensionName(key);
              return (
                <a key={key}
                   className={'ProjectDetail-heading-extension' + (!detailsExist ? ' disabled' : '')}
                   onClick={() => detailsExist && this.openExtension(key)}>{name}</a>
              );
            })}
          </div>
        </div>
      );

    return (
      <div className={'ProjectDetail' + (isVisible ? ' visible' : '')}
           style={{ height: (isVisible ? `${this.state.openHeight}px` : null) }}>
        {(isVisible) && (<div ref="resizeHandle"
                              className="ProjectDetail-resizeHandle"
                              onMouseDown={this.handleResizableMouseDown}></div>)}
        {header}
        {currentExtension && (<ExtensionView region={projectDetailExtensionRegion}
                                             isVisible={isVisible}
                                             extension={currentExtension}/>) }
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { isVisible, currentExtension } = state.ui.detailView;
  const { constructId, forceBlocks, blockIds } = state.focus; //to force rendering (check for if details exist) on focus change
  return {
    isVisible,
    currentExtension,
    blockIds,
    constructId,
    forceBlocks,
  };
};

export default connect(mapStateToProps, {
  uiToggleDetailView,
  detailViewSelectExtension,
  focusDetailsExist,
})(ProjectDetail);
