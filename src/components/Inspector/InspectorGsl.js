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
import InputSimple from './../InputSimple';
import GslOperatorSchema from '../../schemas/GslOperator';
import InspectorRow from './InspectorRow';
import PickerItem from '../ui/PickerItem';

export class InspectorGsl extends Component {
  static propTypes = {
    instance: (props, propName) => {
      if (!GslOperatorSchema.validate((props[propName]))) {
        return new Error('must pass a valid GSL Operator');
      }
    },
    readOnly: PropTypes.bool.isRequired,
  };

  render() {
    const { instance, readOnly } = this.props;

    return (
      <div className="InspectorContent InspectorContentGsl">

        <InspectorRow heading="GSL Operator">
          <InputSimple placeholder="Project Name"
                       readOnly={readOnly}
                       value={instance.name}/>
        </InspectorRow>

        <InspectorRow heading="Type">
          <InputSimple placeholder="GSL Type"
                       readOnly={readOnly}
                       value={instance.type}/>
        </InspectorRow>


        <InspectorRow heading="Usage">
          <InputSimple placeholder="Description of usage"
                       useTextarea
                       readOnly={readOnly}
                       value={instance.description}/>
        </InspectorRow>

        <InspectorRow heading="Examples">
          {instance.examples.map(example => (<div className="InspectorContentGsl-example">{example}</div>))}
        </InspectorRow>

        <InspectorRow heading="Syntax Coloring">
          <PickerItem styles={{backgroundColor: instance.color}}/>
        </InspectorRow>

      </div>
    );
  }
}

export default connect(() => ({}), {
})(InspectorGsl);
