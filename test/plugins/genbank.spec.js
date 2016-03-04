import { expect } from 'chai';
import path from 'path';
import { importProject, importBlock } from '../../plugins/convert/import';
import { exportProject, exportBlock } from '../../plugins/convert/export';
const fs = require('fs');

const sampleGenbank = `LOCUS       1                          6 bp    DNA              UNK 01-JAN-1980
DEFINITION  .
ACCESSION   1
VERSION     1
KEYWORDS    .
SOURCE      .
  ORGANISM  .
            .
FEATURES             Location/Qualifiers
     block           1..3
                     /parent_block="1,0"
                     /block_id="2"
     block           1..2
                     /parent_block="2,0"
                     /block_id="5"
     block           1
                     /parent_block="5,0"
                     /block_id="8"
     block           2
                     /parent_block="5,1"
                     /block_id="9"
     block           2
                     /parent_block="9,0"
                     /block_id="10"
     block           3
                     /parent_block="2,1"
                     /block_id="6"
     block           4
                     /parent_block="1,1"
                     /block_id="3"
     block           4
                     /parent_block="3,0"
                     /block_id="7"
     block           5..6
                     /parent_block="1,2"
                     /block_id="4"
     Double_T        5
                     /parent_block
                     /block_id="4"
ORIGIN
        1 acggtt
//`;

describe('Plugins', () => {
  describe('Genbank Plugin', () => {
    it('should import Genbank file that has nested blocks', function importGB(done) {
      importBlock('genbank', sampleGenbank)
        .then(output => {
          expect(output.block !== undefined).to.equal(true);
          expect(output.block.components.length === 3).to.equal(true);
          expect(output.blocks['2'].components.length === 2).to.equal(true);
          done();
        })
        .catch(done);
    });

    it('should import Genbank file with multiple entries as a project', function importGB(done) {
      fs.readFile(path.resolve(__dirname, '../res/sampleMultiGenbank.gb'), 'utf8', (err, sampleStr) => {
        importProject('genbank', sampleStr)
          .then(output => {
            expect(output.project !== undefined).to.equal(true);
            expect(output.project.components.length === 4).to.equal(true);
            expect(output.blocks['2'].components.length === 2).to.equal(true);
            done();
          })
          .catch(done);
      });
    });

    it('should be able convert Genbank features to Block', function importGB(done) {
      fs.readFile(path.resolve(__dirname, '../res/sampleGenbank.gb'), 'utf8', (err, sampleStr) => {
        importBlock('genbank', sampleStr)
          .then(data => {
            expect(data.block !== undefined).to.equal(true);
            expect(data.blocks !== undefined).to.equal(true);
            expect(data.block.components.length === 2).to.equal(true);

            //check that CDS types were converted to Blocks
            expect(data.blocks[data.block.components[0]] !== undefined).to.equal(true);
            expect(data.blocks[data.block.components[1]] !== undefined).to.equal(true);
            expect(data.blocks[data.block.components[0]].metadata.tags.sbol === 'cds').to.equal(true);
            expect(data.blocks[data.block.components[1]].metadata.tags.sbol === 'cds').to.equal(true);

            //check that other features were imported as features for the main block
            expect(data.block.sequence.features.length === 2).to.equal(true);
            expect(data.block.sequence.features[1].type === 'rep_origin').to.equal(true);
            done();
          })
          .catch(done);
      });
    });

    //todo - this should use a more correct example file, and should validate the blocks
    //fixme - this test looks like it should fail? what is 'genbank' into exportBlock()?
    it.skip('should export block to Genbank', function exportGB(done) {
      fs.readFile(path.resolve(__dirname, '../res/sampleBlocks.json'), 'utf8', (err, sampleBlocksJson) => {
        const sampleBlocks = JSON.parse(sampleBlocksJson);
        exportBlock('genbank', sampleBlocks)
          .then(result => {
            console.log(result);

            expect(result.indexOf('acggtt') !== -1).to.equal(true);
            expect(result.indexOf('Double_T') !== -1).to.equal(true);
            expect(result.indexOf('block           5..6') !== -1).to.equal(true);
            done();
          })
          .catch(done);
      });
    });

    it('should export project to multi-record Genbank', function exportGB(done) {
      fs.readFile(path.resolve(__dirname, '../res/sampleProject.json'), 'utf8', (err, sampleProjJson) => {
        const sampleProj = JSON.parse(sampleProjJson);
        exportProject('genbank', sampleProj)
          .then(result => {
            //LOCUS 1, LOCUS 2, LOCUS 3, and LOCUS 4
            expect((result.match(/\/\//g) || []).length).to.equal(4);
            expect((result.match(/LOCUS\s+\d/g) || []).length).to.equal(4);
            done();
          })
          .catch(done);
      });
    });
  });
});