import commandLineArgs from 'command-line-args';
import dns from 'native-dns';
import Agent from 'socks5-https-client/lib/Agent';
import request from 'request';
import memory from 'memory-cache';
import isRoot from 'is-root';

import {makeAnswer} from './utils';

const GOOGLE_DNS = 'dns.google.com';

let cli = commandLineArgs([
  {name: 'socks_host', alias: 's', type: String,
   description: 'Host of socks proxy(optional)', defaultValue: null},
  {name: 'socks_port', alias: 'p', type: Number,
   description: 'Port of socks proxy(default 1080)', defaultValue: 1080},
  {name: 'lookup', alias: 'l', type: String,
   description: 'DNS to reslove Google DNS address once(Default 8.8.8.8)', defaultValue: '8.8.8.8'},
  {name: 'cache_time', alias: 't', type: Number,
   description: 'Cache time(ms, Default 3000)', defaultValue: 3000}
]);

const app = {
  title: 'dns-proxy-https',
  description: 'DNS proxy server over Google HTTPS DNS Service with socks supported',
  synopsis: [
    '$ sudo dns-proxy-https -s 127.0.0.1 -p 1081',
    '$ sudo dns-proxy-https -s 127.0.0.1 -p 1081 -l 8.8.8.8 -t 5000'
  ],
  footer: 'Project home: [dns-proxy-https]{https://github.com/CodeFalling/dns-proxy-https}'
};

let option = cli.parse();

console.log(cli.getUsage(app));

// help end

// check sudo
if (!isRoot()) {
  throw new Error('Please run dns-proxy-https with sudo!');
}

function requestOverHTTPS(name){
  return new Promise((reslove, reject) => {
    request({
      url: `https://${GOOGLE_DNS}/resolve?name=${name}`,
      agentClass: option.socks_host ? Agent : null,
      agentOptions: {
        socksHost: option.socks_host,
        socksPort: option.socks_port
      }
    }, function(err, res){
      if (err) {
        reject(err);
      } else {
        reslove(res);
      }
    });
  });
}

function handleRequest(req, response){
  console.log(`Request ${req.question[0].name}`);
  let question = req.question[0];
  let cacheValue = memory.get(question.name);
  if (cacheValue) {
    response.answer.push(cacheValue);
    response.send();
    return;
  }
  requestOverHTTPS(question.name, option)
    .then(res => {
      if (res.statusCode === 200) {
        let json = JSON.parse(res.body);
        let a = json.Answer[0];
        let record = {
          name: a.name,
          type: a.type,
          ttl: a.TTL
        };
        switch (a.type)
        {
        case 1: case 28: // A & AAAA
          record.address = a.data;
          break;
        case 5: // CNAME
          record.data = a.data;
          break;
        case 15: // MX
          // For example "5 hotmail.com" is a response by the API in case of an MX type.
          record.priority = a.data.charAt(0);
          record.exchange = a.data.substring(2);
          break;
        }
        let answer = makeAnswer(record);
        response.answer.push(answer);
        memory.put(question.name, answer, option.cache_time);
      }
      response.send();
    }).catch(err => {
      console.log(err);
      response.send();
    });
}


let server = dns.createServer();
server.on('listening', () => console.log('server listening', server.address()));
server.on('close', () => console.log('server closed', server.address()));
server.on('error', (err) => console.error(err.stack));
server.on('socketError', (err) => console.error(err));

// init
// Reslove GOOGLE_DNS then Start
console.log(`Resloving Google DNS Service using ${option.lookup}...`);

dns.resolve(GOOGLE_DNS, 'A', option.lookup, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log(`Now start server`);
    server.on('request', handleRequest);
    server.serve(53);
  }
});
