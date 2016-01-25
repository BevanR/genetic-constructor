const exec = require('child_process').exec;
const fs = require('fs');
const uuid = require('node-uuid');

module.exports = exports = {};

function runCmd(cmd, input, inputFile, outputFile) {
  const promise = new Promise((resolve, reject) => {

    function readOutput() {
      try {
        fs.readFile(outputFile, 'utf8', (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(data);
        });
      } catch (exception) {
        reject("input format is incorrect");
      }
    }

    function runPy() {
      exec(cmd, (err, stdout) => {
        readOutput();
      });
    }

    fs.writeFile(inputFile, input, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      runPy();
    });
  });

  return promise;
}

exports.exportBlock = function exportBlock(block, blocks) {
  const proj = {
    'id': uuid.v4(),
    'metadata': {
      'authors': [],
      'tags': {},
      'version': '',
    },
    'components': [block.id],
  };
  blocks[block.id] = block;
  return exports.exportProject(proj, blocks);
};

exports.importBlock = function importBlock(gbstr) {
  return exports.importProject(gbstr)
        .then(result => {
          if (result && result.project && result.blocks &&
              result.project.components && result.project.components.length > 0) {
            const bid = result.project.components[0];
            const block = result.blocks[bid];
            return Promise.resolve({ block: block, blocks: result.blocks });
          }
          return Promise.reject("invalid input string")
        });
};

exports.exportProject = function exportProject(proj, blocks) {
  const input = {
    project: proj,
    blocks: blocks,
  };
  const cmd = 'python extensions/convert/genbank/convert.py to_genbank temp.json temp.gb';
  return runCmd(cmd, JSON.stringify(input), 'temp.json', 'temp.gb');
};

exports.importProject = function importProject(gbstr) {
  const cmd = 'rm temp.json; python extensions/convert/genbank/convert.py from_genbank temp.gb temp.json';
  return runCmd(cmd, gbstr, 'temp.gb', 'temp.json')
          .then(resStr => {
            try {
              const res = JSON.parse(resStr);
              return Promise.resolve(res);
            } catch(exp) {
              return Promise.reject(exp.message);
            }
          });
};
