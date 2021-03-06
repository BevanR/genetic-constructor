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
import fields from './fields/index';
import * as validators from './fields/validators';
import Schema from './SchemaClass';

const gslOperatorFields = {
  id: [
    fields.string().required,
    `ID of operator`,
  ],

  name: [
    fields.string().required,
    `Readable name`,
  ],

  type: [
    fields.string(),
    `Type of operator`,
  ],

  description: [
    fields.string(),
    `Operator description`,
  ],

  examples: [
    fields.arrayOf(validators.string()),
    `array of example strings of operator usage`,
  ],

  color: [
    fields.string(),
    `Color of syntax highlighting`,
  ],
};

export class GslOperatorSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, gslOperatorFields, fieldDefinitions));
  }
}

export default new GslOperatorSchemaClass();
