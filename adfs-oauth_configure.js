Template.configureLoginServiceDialogForAdfsoauth.helpers({
  siteUrl: function () {
    return Meteor.absoluteUrl();
  }
});

Template.configureLoginServiceDialogForAdfsoauth.fields = function () {
  return [
    {property: 'clientId', label: 'Client ID'},
    {property: 'secret', label: 'Client secret', value: 'none'},
    {property: 'publicCertPath', label: 'ADFS Public Certificate Path'},
    {property: 'resource', label: 'Relying Party Trust Identifier'},
    {property: 'profileNameField', label: 'Field for profile name mapping'},
    {property: 'oauthAdfsUrl', label: 'URL to ADFS backend'}
  ];
};
