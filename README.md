# KernotecUDPParser

Proyecto para editar svg y crear firmas png para kernotec en NodeJs 17+

# Requisito 
    - Nodejs +17
# Uso

```
git clone https://gitlab.pragmainvest.com.bo/jtordoya/udptest.git udptest
cd udptest
npm install
node index.js
```

puertos por defecto :  TCP 8989, 7777

## Docker

En base a node18:

Ejemplo:

`docker build . -t udptestdocker`

`docker run -p 8989:8989 -p 7777:7777 --name udptest -d udptestdocker`

