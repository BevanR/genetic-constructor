import { expect } from 'chai';
import { runNode } from '../../extensions/compute/runNode';
const fs = require('fs');

describe('Genbank', () => {
  const blocks = {
    '1': {
      'id': '1',
      'components': ['2', '3', '4'],
      'sequence': {
        'sequence': '',
        'features': [],
      },
    },
    '2': {
      'id': '2',
      'components': ['5', '6'],
      'sequence': {
        'sequence': '',
        'features': [],
      },
    },
    '3': {
      'id': '3',
      'components': ['7'],
      'sequence': {
        'sequence': '',
        'features': [],
      },
    },
    '4': {
      'id': '4',
      'components': [],
      'sequence': {
        'sequence': 'TT',
        'features': [{
          'start': 0,
          'end': 1,
          'type': 'Double T',
        }],
      },
    },
    '5': {
      'id': '5',
      'components': ['8', '9'],
      'sequence': {
        'sequence': '',
        'features': [],
      },
    },
    '6': {
      'id': '6',
      'components': [],
      'sequence': {
        'sequence': 'G',
        'features': [],
      },
    },
    '7': {
      'id': '7',
      'components': [],
      'sequence': {
        'sequence': 'G',
        'features': [],
      },
    },
    '8': {
      'id': '8',
      'components': [],
      'sequence': {
        'sequence': 'A',
        'features': [],
      },
    },
    '9': {
      'id': '9',
      'components': ['10'],
      'sequence': {
        'sequence': '',
        'features': [],
      },
    },
    '10': {
      'id': '10',
      'components': [],
      'sequence': {
        'sequence': 'C',
        'features': [],
      },
    },
  };

  const sampleBlocks = {
    'block': blocks['1'],
    'blocks': blocks,
  };

  const sampleGenbank = 'LOCUS       1                          6 bp    DNA              UNK 01-JAN-1980\nDEFINITION  .\nACCESSION   1\nVERSION     1\nKEYWORDS    .\nSOURCE      .\n  ORGANISM  .\n            .\nFEATURES             Location/Qualifiers\n     block           1..3\n                     /parent_block="1,0"\n                     /block_id="2"\n     block           1..2\n                     /parent_block="2,0"\n                     /block_id="5"\n     block           1\n                     /parent_block="5,0"\n                     /block_id="8"\n     block           2\n                     /parent_block="5,1"\n                     /block_id="9"\n     block           2\n                     /parent_block="9,0"\n                     /block_id="10"\n     block           3\n                     /parent_block="2,1"\n                     /block_id="6"\n     block           4\n                     /parent_block="1,1"\n                     /block_id="3"\n     block           4\n                     /parent_block="3,0"\n                     /block_id="7"\n     block           5..6\n                     /parent_block="1,2"\n                     /block_id="4"\n     Double_T        5\n                     /parent_block\n                     /block_id="4"\nORIGIN\n        1 acggtt\n//\n';

  const blockFile = process.cwd() + '/tempBlock.json';
  const genbankFile = process.cwd() + '/tempGenbank.gb';
  const input1 = {block: blockFile};
  const input2 = {genbank: genbankFile};

  it('should convert from block to genbank', function writeGenbank(done) {
    this.timeout(8000); //only needed when running all the tests together, for some reason

    fs.writeFile(blockFile, JSON.stringify(sampleBlocks), err => {
      if (err) {
        expect(false);
        done();
      }
      runNode('block_to_genbank', input1, {})
      .then(result => {
        expect(result.genbank === sampleGenbank);
        done();
      })
      .catch(err => {
        expect(false);
        done();
      });
    });
  });

  it('should convert from genbank to blocks', function readGenbank(done) {
    this.timeout(8000); //only needed when running all the tests together, for some reason

    fs.writeFile(genbankFile, sampleGenbank, err => {
      if (err) {
        expect(false);
      }
      runNode('genbank_to_block', input2, {})
      .then(result => {
        expect(result.block !== undefined);
        const output = result.block;
        expect(output.blocks.length === 10);
        expect(output.block.id === '1');
        expect(output.block.components.length === 3);
        expect(output.block.components[0] === 2);
        expect(output.blocks['5'].components[0] === 8);
        expect(output.blocks['5'].components[1] === 9);
        done();
      })
      .catch(err => {
        expect(false);
        done();
      });
    });
  });
});
