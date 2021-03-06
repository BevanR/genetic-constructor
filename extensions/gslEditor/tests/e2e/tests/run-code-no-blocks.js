var homepageRegister = require('../../../../../test-e2e/fixtures/homepage-register');
var newProject = require('../../../../../test-e2e/fixtures/newproject');
var clickElementText = require('../../../../../test-e2e/fixtures/click-element-text');
var size = require('../../../../../test-e2e/fixtures/size');

var runCode = require('../fixtures/run-code');
var blockCount = require('../fixtures/block-count');
var loadExtension = require('../fixtures/load-extension');
var constants = require('../fixtures/extension-constants');

module.exports = {
  'Test cases where GSL code is run producing no output blocks': function (browser) {

    size(browser);
    homepageRegister(browser);
    newProject(browser);
    
    blockCount(browser, 1);

    browser
      .pause(1000)
      .waitForElementPresent('.ProjectDetail-heading-extensionList', 3000, 'expected Extension list to appear');

    clickElementText(browser, 'GSL Editor');

    browser
      .waitForElementPresent('.GSLEditorLayout', 3000, 'expected extension to render')


    // Case 1 - Running code without any content
    runCode(
      browser,
      '',
      constants.codeExecuteSuccessString
    );

    browser
      .pause(2000)

    // Case 2 - Running invalid code.
    runCode(
      browser,
      'Invalid code',
      constants.codeExecuteFailureString
    )

    blockCount(browser, 1);

    browser
      .pause(2000)
      .end();
  }
};
