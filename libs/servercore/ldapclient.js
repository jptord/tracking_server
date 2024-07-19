const ldapjs = require('ldapjs');
const fs     = require("fs");
const ldapURL = [ 'ldap://192.168.0.23:389' ];  // Array can contain additional LDAP servers to try.
//const bindDN = 'uid=jtordoya,dc=PragmaInvest,dc=com';
const bindDN = 'user@domain.com';
const bindPassword = '123456';
const baseDN = 'DC=company,DC=com';
const usernameAttribute = 'sAMAccountName';
const filter = '(objectClass=person)';
//(&(objectClass=computer)(cn=apellido*))

var username = 'usuario';
var password = '123456';

class Ldapclient{
    
    constructor(){
        const client = ldapjs.createClient({
            url: ldapURL,
            reconnect: true
          });
          
          client.on('error', (err) => {
            console.error('LDAP error:', err.message); 
          });
          
          client.on('connect', () => {
            console.log("conectado");
            const opts = {
              ca: [fs.readFileSync('/etc/ssl/certs/ca-certificates.crt', 'utf-8')],
              rejectUnauthorized: false  // Helps with self-signed certs. 
            };
            client.bind(bindDN, bindPassword, (err) => {
                if (err) {
                    console.error(err);
                    client.unbind(() => {
                      console.log('Disconnecting.');
                    });
                }else {
                    const opts = {
                      attributes: usernameAttribute,
                      filter: `(&${filter}(${usernameAttribute}=${username}))`,
                      //filter: `&${filter}`,
                      scope: 'sub'
                    };
                    console.log("filtro ", opts.filter);
                    console.debug('Searching', baseDN, 'for:', `${usernameAttribute}=${username}`);
                    client.search(`${baseDN}`, opts, (err, res) => {
                      let numMatch = 0;
                      let userDN = '';
          
                      if (err) {
                        console.error(err.message);
                        client.unbind(() => {
                          console.log('Disconnecting.');
                        });
                      }
          
                      res.on('error', (err) => {
                        console.error('Error:', err.message);
                        client.unbind(() => {
                          console.log('Disconnecting.');
                        });
                      });
          
                      res.on('searchEntry', (entry) => {  // There was a match.
                        numMatch++;
                        console.log("--entry--");
                        console.log(entry);
                        userDN = entry.object.dn;
                      });
          
                      res.on('end', () => {
                        if (numMatch == 1) {
                          console.debug('Rebinding as:', userDN);
                          client.bind(userDN, password, (err) => {
                            if (err) {
                              console.error('Error:', err.message);
                            }
                            else {
                              process.exitCode = 0;
                              console.log('Authenticated.');
                            }
                          });
                        }
                        else if (numMatch > 1) {
                          console.error('Multiple matches returned.');
                        }
                        else {
                          console.error('Not found.');
                        }
                        client.unbind(() => {
                          console.log('Disconnecting.');
                        });
                      });
                    });
                  }
            });
            /*
            client.starttls(opts, client.controls, (err) => {
              if (err) {
                console.error("tls",err.message);
                client.unbind(() => {
                  console.log('Disconnecting.');
                });
              }
              else {
                console.debug('TLS started.');
                console.debug('Binding as:', bindDN);
                client.bind(bindDN, bindPassword, (err) => {
                  if (err) {
                    console.error(err.message);
                    client.unbind(() => {
                      console.log('Disconnecting.');
                    });
                  }
                  else {
                    const opts = {
                      attributes: usernameAttribute,
                      filter: `&${filter}(${usernameAttribute}=${username})`,
                      scope: 'sub'
                    };
                    console.debug('Searching', baseDN, 'for:', `${usernameAttribute}=${username}`);
                    client.search(`${baseDN}`, opts, (err, res) => {
                      let numMatch = 0;
                      let userDN = '';
          
                      if (err) {
                        console.error(err.message);
                        client.unbind(() => {
                          console.log('Disconnecting.');
                        });
                      }
          
                      res.on('error', (err) => {
                        console.error('Error:', err.message);
                        client.unbind(() => {
                          console.log('Disconnecting.');
                        });
                      });
          
                      res.on('searchEntry', (entry) => {  // There was a match.
                        numMatch++;
                        userDN = entry.object.dn;
                      });
          
                      res.on('end', () => {
                        if (numMatch == 1) {
                          console.debug('Rebinding as:', userDN);
                          client.bind(userDN, password, (err) => {
                            if (err) {
                              console.error('Error:', err.message);
                            }
                            else {
                              process.exitCode = 0;
                              console.log('Authenticated.');
                            }
                          });
                        }
                        else if (numMatch > 1) {
                          console.error('Multiple matches returned.');
                        }
                        else {
                          console.error('Not found.');
                        }
                        client.unbind(() => {
                          console.log('Disconnecting.');
                        });
                      });
                    });
                  }
                });
              }
            });*/
          });
    }
}


module.exports = { Ldapclient } ;