import React, {PropTypes, Component} from 'react';
import ToolbarItem from './ToolbarItem';

/**
 * Toolbar represents a component to group together a set of functions
 * as ToobarItems.
 *
 * Properties:
 *
 * {array} toolbarItems - An array of ToolbarItems that will be rendered
 * in the Toolbar.
 */
export default class Toolbar extends Component {
  static propTypes = {
    toolbarItems: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        label: PropTypes.string.isRequired,
        imageUrl: PropTypes.string,
        action: PropTypes.func.isRequired,
        enabled: PropTypes.bool,
      })
    ),
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="Toolbar">
        <div className="ToolbarItems">
          {this.props.toolbarItems.map((item, i) => {
            return (<ToolbarItem
              key={i}
              label={item.label}
              action={item.action}
              imageUrl={item.imageUrl}
              disabled={item.disabled}
            />);
          })}
        </div>
      </div>
    );
  }
}
