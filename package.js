Package.describe({
  name: 'snowping:adfs-oauth',
  version: '0.0.1',
  summary: 'Oauth2 authentication using Microsoft ADFS3 Oauth service (Active Directory)',
  // URL to the Git repository containing the source code for this package.
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');
  api.use(['underscore', 'random']);
  api.use('oauth2', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('http', ['server']);
  api.use(['underscore', 'service-configuration'], ['client', 'server']);
  api.use(['random', 'templating'], 'client');

  api.use('accounts-base', ['client', 'server']);

  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('accounts-oauth', ['client', 'server']);

  //Add npm module files
  api.addFiles(['adfs-oauth:package.js'], ['server']);

  api.addFiles(['adfs-oauth_configure.html', 'adfs-oauth_configure.js'], 'client');
  api.addFiles('adfs-oauth_server.js', 'server');
  api.addFiles('adfs-oauth_client.js', 'client');
  api.addFiles('adfs-oauth.js');

});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('snowping:adfs-oauth');
  api.addFiles('adfs-oauth-tests.js');
});

//NPM module dependencies
Npm.depends({
   'jwt-simple': '0.3.1'
});
