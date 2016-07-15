import express from 'express';
import bodyParser from 'body-parser';
import formidable from 'formidable';
import invariant from 'invariant';
import md5 from 'md5';

import convertFromFile from './convert';

//GC specific
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';
import * as fileSystem from '../../server/utils/fileSystem';
import * as filePaths from '../../server/utils/filePaths';
import * as persistence from '../../server/data/persistence';
import * as rollup from '../../server/data/rollup';
import { errorDoesNotExist } from '../../server/utils/errors';
import resetColorSeed from '../../src/utils/generators/color'; //necessary?

const storagePrefix = 'csvJS';

//make storage directory just in case...
fileSystem.directoryMake(filePaths.createStorageUrl(storagePrefix));

const createFilePath = (fileName) => {
  invariant(fileName, 'need a file name');
  return filePaths.createStorageUrl(storagePrefix, fileName);
};
const createFileUrl = (fileName) => {
  invariant(fileName, 'need a file name');
  return '/convert/csv/file/' + fileName;
};

//create the router
const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json({
  strict: false, //allow values other than arrays and objects
});

//route to download files
router.get('/file/:fileId', (req, res, next) => {
  const { fileId } = req.params;

  const path = createFilePath(fileId);

  fileSystem.fileExists(path)
    .then(() => res.download(path))
    .catch(err => {
      if (err === errorDoesNotExist) {
        return res.status(404).send();
      }

      next(err);
    });
});

router.post('/:projectId?', jsonParser, (req, resp, next) => {
  const { projectId } = req.params;

  let csvFile;
  // save incoming file then read back the string data.
  // If these files turn out to be large we could modify the import functions to take
  // file names instead but for now, in memory is fine.
  const form = new formidable.IncomingForm();

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  })
    .then(files => {
      const tempPath = files.data.path;

      if (!tempPath) {
        return Promise.reject('no file provided');
      }

      return fileSystem.fileRead(tempPath, false)
        .then((data) => {
          const fileName = md5(data);
          csvFile = createFilePath(fileName);
          return fileSystem.fileWrite(csvFile, data, false)
            .then(() => {
              resetColorSeed();
              return convertFromFile(csvFile, fileName, createFileUrl(fileName));
            });
        });
    })
    //todo - handle catch here for CSV failures
    //get maps of sequence hash and blocks, write sequences first
    .then(({ blocks, sequences }) => {
      return Promise.all(Object.keys(sequences).map(sequenceMd5 => {
        const sequence = sequences[sequenceMd5];
        return sequence.length > 0 ?
          persistence.sequenceWrite(sequenceMd5, sequence) :
          Promise.resolve();
      }))
        .then(() => blocks);
    })
    .then(blocks => {
      const blockIds = Object.keys(blocks);

      if (!blockIds.length) {
        return Promise.reject('no valid blocks');
      }

      if (!projectId) {
        const project = Project.classless({ components: blockIds });
        return Promise.resolve({
          project,
          blocks,
        });
      }

      return rollup.getProjectRollup(projectId)
        .then((existingRoll) => {
          existingRoll.project.components = existingRoll.project.components.concat(blockIds);
          Object.assign(existingRoll.blocks, blocks);
          return existingRoll;
        });
    })
    .then(roll => {
      return fileSystem.fileWrite(csvFile + '-converted', roll)
        .then(() => roll);
    })
    .then(roll => {
      return rollup.writeProjectRollup(roll.project.id, roll, req.user.uuid)
        .then(() => persistence.projectSave(roll.project.id, req.user.uuid))
        .then(commit => resp.status(200).json({ ProjectId: roll.project.id }))
        .catch(err => {
          console.log('Error in Import : ' + err);
          console.log(err.stack);
          resp.status(500).send(err);
        });
    })
    .catch(err => {
      console.log('Error in Import: ' + err);
      console.log(err.stack);
      resp.status(500).send(err);
    });
});

export default router;
