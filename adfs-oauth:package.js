var jwt = Npm.require('jwt-simple');
var fs = Npm.require('fs');

var projectPath = process.env.PWD;

verifyToken = function (sToken, sPublicCertPath, sSignature) {
    var publicCert = fs.readFileSync(projectPath + sPublicCertPath, 'utf8');
    var tokenDecoded = jwt.decode(sToken, publicCert, 'RS256');
    return tokenDecoded;
};
