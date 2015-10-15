# Meteor package in order to authenticate using Microsoft ADFS3 Oauth service

**Do you want to achieve Active Directory authentication using your meteor web app?**

This meteor package allows you to authenticate to a Microsoft ADFS3 Oauth service. The package was greatly inspired by the offical oauth packages *accounts-google* and *google*. 

>>**Please note that this is a prototype implementation. Use it at your own risk**.

### Features
  - Compatibility with accounts-ui package
  - Online configuration using loginServiceConfiguration (accounts-ui)
  - Server Token Validation using jwt-simple

### Todo
- Add unit/integration tests
- Ability to receive encrypted tokens

### Side note
Oauth has been widely used as an authentication architecture for modern web applications, especially in order to integrate trusted third party accounts like Facebook, Twitter, Google etc. In Enterprise environments though the adoption is quite small. Microsoft however released the ability to use Oauth2 with the new version ADFS 3.0 (Active Directory Federation Services 3.0). It comes by default with Windows 2012 R2 Enterprise ([more details](https://technet.microsoft.com/en-us/library/dn633593.aspx)). Unfortunately, the oauth implementation of Microsoft slightly differs from standard specification ([RFC 6749](http://tools.ietf.org/html/rfc6749)) and implements only a [subset](http://blogs.technet.com/b/maheshu/archive/2015/04/28/oauth-2-0-support-in-adfs-on-windows-server-2012-r2.aspx) of the features. This package aims to help you get started using AD Authentication in your own meteor project. 

### Installation

#### Pre-Requirements
- Windows 2012 Domain
- Windows Server 2012 R2 Server with configured ADFS 3.0 server role
- For installation and configuration of ADFS 3 refer to: https://technet.microsoft.com/en-us/library/dn452410.aspx
- For lab installation you might need a self-signed SSL-Certificate for your ADFS service. For easy online generation of certificates I can recommend http://www.getacert.com/ (supports wildcard certifications) 

#### Setup ADFS for your meteor app

1. Start powershell console as Administrator
2. Create adfs client id for your meteor app 
    ```
    Add-ADFSClient -Name "Meteor Demo App" -ClientId "meteordemoapp" -RedirectUri="http://localhost:000/_oauth/adfsoauth"
    ```
3. Check your configuration using
    ```
    Get-ADFSClient
    ```
    => Example output
    ```
    RedirectUri : {http://localhost:3000/_oauth/adfsoauth}
    Name        : Meteor Demo App
    Description :
    ClientId    : meteordemoapp
    BuiltIn     : False
    Enabled     : True
    ClientType  : Public
    ```

4. Add Relying Party Trust
    ```
    AD FS Mangement -> Trust Relationships -> Relying Party Trusts -> Add Relying Party Trust...
    ```
    - Enter data about the relying party manually
    - Display name e.g. Meteor Demo App
    - AD FS Profile
    - Optional encryption: TODO! -> fow now skip with next
    - Relying party trust identifier e.g. meteordemoapp (name is used with resource param, see workflow below)
    - Rest leave default

5. Add user fields from Active Directory (e.g. commonname & email)
    ```
    AD FS Mangement -> Trust Relationships -> Relying Party Trusts -> <your meteor app> -> Edit Claim Rules... -> Add Rule...
    ```
    - Claim rule name: any name
    - Attribute store: Active Directory
    - Mapping of LDAP attributes to outgoing claim types
    | LDAP Atribute       | Outgoing Claim Type | 
    | ------------------- |--------------------:|
    | Given-Name          | Given Name          |
    | Surname             | Surname             |
    | User-Principal-Name | Common Name         |
    | E Mail-Addresses    | E-Mail Address      |

#### Setup oauth within meteor app
- Install package
    ```
    meteor add snowping:adfs-oauth
    ```
- Configure package - go to your app e.g. http://localhost:3000, click on 'Register' -> 'CONFIGURE ADFSOAUTH'
    - Client ID : meteordemoapp
    - Client secret: none 
    - ADFS Public Certificate Path : /private/certs/cert.cer
    - Relying Party Trust Identifier : meteordemoapp
    - Field for profile name mapping : commonname
    - URL to ADFS backend : https://<your-adfs-host>/adfs/oauth2
    
    > Client secret is not required by the ADFS Oauth but inherited by default from official oauth package, just use 'none' here
   
- Optional auto login code, useful when the only auth available => oauth workflow starts without requiring users to click sign in)
    ```
    if (Meteor.isClient) {
        Meteor.startup(function () {
           if (Meteor.user()) {
               console.log('User logged in!');
           } else {
               console.log('User logged out!');
               Meteor.loginWithAdfsoauth(); //Auto login using ADFS Oauth
           }
        });
    }
    ```
    
### Debugging/Troubleshooting ADFS Oauth worklow

#### Debug and analyze auth workflow
**When debugging with Chrome/Postman you should import the self signed certificate to the "System" key chain of your Chrome browser**

- Authorization request in order to get authorization code (GET request from your browser)
    ```
    https://<your-adfs-host>/adfs/oauth2/authorize?response_type=code&client_id=<your-clientid>>&redirect_uri=https://<your-app-host>/_oauth/adfsoauth&resource=<your-fake-resource>
    ```
  - Param 1 "response_type" => value "code" is required to request a new token
  - Param 2 "client_id" => value "123456" is a registered adfsclient, use command "Get-AdfsClient" to list all clients on server
  - Param 3 "redirect_uri" => where to redirect and apply the code param e.g. "http://localhost:3000/_oauth/adfsoauth&code=lsdkjflsjdflkjd8234lk324o7234kjn23kl4j..."
  - Param 4 "resource" => Relying Trusted Party (it is required in params but not used by your meteor app, you can use a fake one here) 
  
- If request is successful it should show you either a login form or redirect you straight away (kerberos auth when already within domain)
- Request new token
    ```
    https://<your-adfs-host>/adfs/oauth2/token
    ```
  - Param 1 "grant_type" => value "authorization_code" (token to access protected resource)
  - Param 2 "client_id" => value e.g. "123456" (registered adfs client)
  - Param 3 "redirect_uri" => value e.g. "http://localhost:3000/_oauth/adfsoauth" (where to send token to)
  - Param 4 "code" => value "<code>" received from step above through get param
  
  >This step should be done on server as recommended by Oauth definition (this meteor package does that) => grant_type: authorization_code. Normally in such request we have also a param "client_secret" included which should be saved somewhere safe within the server (backend). This makes the oauth autheration even more secure. Only trusted clients can issue tokens! However, ADFS 3 Oauth does currently not support "client_secret" parameter. Therefore, requests can be made on servers and clients (browser).

- Get JWT token as JSON response (example response)
    ```
    {
      "access_token": "eyJ0eXAiOiJKV1QiLCJhbG...",
      "token_type": "bearer",
      "expires_in": 3600
    }
    ```
  - JWT are encoded with Header and Payload data (not encrypted)
  - Resource server or protected resource must validate the signature using the public key of the used certificate to encode the token
  - Payload data can include username, email, address fields etc. - by default only the following fields are included (example response):
  ```
  {
    "aud": "microsoft:identityserver:meteorapptest",
    "iss": "http://<your-adfs-host>/adfs/services/trust",
    "iat": 1442853194,
    "exp": 1442856794,
    "auth_time": "2015-09-21T16:33:14.577Z",
    "authmethod": "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport",
    "ver": "1.0",
    "appid": "meteordemoapp"
  }
  ```
  Refer to *Setup ADFS for your meteor app* from above in order to extend the payload with user fields

#### Troubleshooting ADFS errors (eventlog on windows server)
- The Kerberos client received a KRB_AP_ERR_MODIFIED error from the server fs.service
    ```
    setspn -D http/srv2012r2test.dev.intra.domain.ch
    setspn -A http/srv2012r2test.dev.intra.domain.ch fs.service
    ```
    Refer to http://blogs.technet.com/b/dcaro/archive/2013/07/04/fixing-the-security-kerberos-4-error.aspx for more details.


License
----

MIT