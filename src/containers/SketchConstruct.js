import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { blockCreate, blockAddComponent } from '../actions/blocks';
import { DropTarget } from 'react-dnd';
import { block as blockDragType, inventoryPart as inventoryPartDragType } from '../constants/DragTypes';

import SketchBlock from '../components/SketchBlock';

/**
 @name SketchConstruct
 @description SketchConstruct is the parent element for drawing a construct.
 */

const constructTarget = {
  drop(props, monitor) {
    const type = monitor.getItemType();
    const monitorItem = monitor.getItem();
    const block = (type === blockDragType) ?
      monitorItem.block :
      props.blockCreate({metadata: {name: monitorItem.item}});
    props.blockAddComponent(props.construct.id, block.id);
  },
};

@DropTarget([blockDragType, inventoryPartDragType], constructTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
}))
export class SketchConstruct extends Component {
  static propTypes = {
    construct: PropTypes.object.isRequired,
    components: PropTypes.array.isRequired,

    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired,
    lastDroppedItem: PropTypes.object,

    blockCreate: PropTypes.func.isRequired,
    blockAddComponent: PropTypes.func.isRequired,
  };

  handleClickAddBlock = (event) => {
    const { construct, blockCreate, blockAddComponent } = this.props;
    const block = blockCreate();
    blockAddComponent(construct.id, block.id);
  }

  render() {
    const { construct, components, connectDropTarget } = this.props;

    return connectDropTarget(
      <div>
        <div ref="constructTitle"
             className="SketchPart">
          {construct.metadata.name || 'My Construct'}
        </div>
        <div ref="constructComponents"
             className="SketchBlock">
          {components.map(comp =>
            <SketchBlock key={comp.id}
                         block={comp}/>
          )}
        </div>
        <div ref="constructActions"
             className="SketchPart"
             onClick={this.handleClickAddBlock}>
          Add Block
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const components = props.construct.components.map(componentId => state.blocks[componentId]);

  return {
    components,
  };
}

export default connect(mapStateToProps, {
  blockCreate,
  blockAddComponent,
})(SketchConstruct);
