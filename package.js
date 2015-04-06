// package metadata file for Meteor.js
'use strict';

var packageName = 'xaiki:tasks';
Package.describe({
  name: packageName,
  summary: "implements 'tasks' over alanning:roles",
  version: '0.0.1',
  documentation: "README.org",
  git: 'https://github.com/xaiki/meteor-tasks.git'
});

Npm.depends({debug: "2.1.3"});

Package.onUse(function (api) {
  api.versionsFrom(['METEOR@0.9.0', 'METEOR@1.0']);

  api.use([
    'alanning:roles@1.2.13',
    'matb33:collection-hooks@0.7.11',
  ], 'server');

  api.addFiles([
    'server/tasks.js',
  ], 'server');

  api.export('Tasks', 'server')
});

Package.onTest(function (api) {
  api.use(packageName);
  api.use(['accounts-password', 'tinytest', 'alanning:roles@1.2.13']);

  api.addFiles('test.js');
});
