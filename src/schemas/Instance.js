import fields from './fields/index';
import * as validators from './fields/validators';
import SchemaDefinition from './SchemaDefinition';

import ParentDefinition from './Parent';
import MetadataDefinition from './Metadata';

const InstanceDefinition = new SchemaDefinition({
  id: [
    fields.id().required,
    'ID of the instance',
  ],
  parents: [
    fields.arrayOf(ParentDefinition).required,
    'Ancestral parents from which object is derived, with newest first',
  ],
  metadata: [
    MetadataDefinition,
    'Metadata for the object',
  ],
});

export default InstanceDefinition;
