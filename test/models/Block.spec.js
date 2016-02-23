import { expect, assert } from 'chai';
import { writeFile } from '../../src/middleware/api';
import Block from '../../src/models/Block';
import AnnotationDefinition from '../../src/schemas/Annotation';
import md5 from 'md5';

import * as fileSystem from '../../server/utils/fileSystem';
import * as filePaths from '../../server/utils/filePaths';

describe('Model', () => {
  describe('Block', () => {
    let block;
    beforeEach(() => {
      block = new Block();
    });

    describe('Constructor', () => {
      it('accepts initial model', () => {
        const existing = {
          metadata: {
            name: 'blah',
          },
        };
        const inst = new Block(existing);

        expect(inst.metadata.name).to.equal('blah');
      });
    });

    describe('Annotations', () => {
      const annotation = AnnotationDefinition.scaffold();

      it('annotate() should validate invalid annotations', () => {
        const clone = Object.assign({}, annotation);
        delete clone.id;
        expect(block.annotate.bind(block, clone)).to.throw();
      });

      it('annotate() should add the annotation', () => {
        const annotated = block.annotate(annotation);
        expect(annotated.sequence.annotations.length).to.equal(1);
      });

      it('removeAnnotation() should find by ID', () => {
        const annotated = block.annotate(annotation);
        const unannotated = annotated.removeAnnotation(annotation.id);
        expect(unannotated.sequence.annotations.length).to.equal(0);
      });
    });

    describe('Sequence', () => {
      const withoutSequence = new Block();
      const oneSequence = 'acgtacgt';
      const twoSequence = 'aacccgggggttttt';
      const invalidSequence = 'qwertyuiop';

      const oneMd5 = md5(oneSequence);
      const twoMd5 = md5(twoSequence);

      const sequenceFilePath = filePaths.createSequencePath(oneMd5);
      const withSequence = withoutSequence.mutate('sequence.md5', oneMd5);

      before(() => {
        return fileSystem.fileWrite(sequenceFilePath, oneSequence, false);
      });

      it('getSequence() returns promise -> null when there is no sequence', (done) => {
        return withoutSequence.getSequence()
          .then((result) => {
            expect(result).to.eql(null);
            done();
          });
      });

      it('getSequence() retrieves the sequence as promise', () => {
        return withSequence.getSequence()
          .then(result => {
            expect(result).to.eql(oneSequence);
          });
      });

      it('setSequence() will reject on invalid sequence', () => {
        return withSequence.setSequence(invalidSequence)
          .then(() => assert(false, 'sequence was invalid...'))
          .catch(err => assert(err.indexOf('invalid') >= 0, 'got wrong error...'));
      });

      it('setSequence() returns the updated block, with md5 and length', () => {
        return withSequence.setSequence(twoSequence)
          .then(block => {
            expect(block.sequence.md5).to.equal(twoMd5);
            expect(block.sequence.length).to.equal(twoSequence.length);
          });
      });

      it('setSequence() -> getSequence() gets the same sequence', () => {
        const newSequence = 'acgtacgtcagtcatcgac';
        return withSequence.setSequence(newSequence)
          .then(block => block.getSequence())
          .then(sequence => {
            expect(sequence).to.equal(newSequence);
          });
      });
    });
  });
});
