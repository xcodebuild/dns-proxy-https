import commandLineArgs from 'command-line-args';
import dns from 'native-dns';
import Agent from 'socks5-https-client/lib/Agent';
import request from 'request';
import memory from 'memory-cache';
import isRoot from 'is-root';
import fs from 'fs';
import mm from 'micromatch';
import process from 'process';
import winston from 'winston';

import {makeAnswer, makeQuestion} from './utils';

const GOOGLE_DNS = 'dns.google.com';

let cli = commandLineArgs([
  {name: 'socks_host', alias: 's', type: String,
   description: 'Host of socks proxy(optional)', defaultValue: null},
  {name: 'socks_port', alias: 'p', type: Number,
   description: 'Port of socks proxy(default 1080)', defaultValue: 1080},
  {name: 'fallback', alias: 'f', type: String,
   description: 'DNS to resolve Google DNS address once and whitelist(Default 8.8.8.8)', defaultValue: '8.8.8.8'},
  {name: 'cache_time', alias: 't', type: Number,
   description: 'Cache time(ms, Default 300000)', defaultValue: 300000},
  {name: 'whitelist_file', alias: 'w', type: String,
   description: 'Whitelist file contains domains to resolve by fallback directly', defaultValue: null}
]);

const app = {
  title: 'dns-proxy-https',
  description: 'DNS proxy server over Google HTTPS DNS Service with socks supported',
  synopsis: [
    '$ sudo dns-proxy-https -s 127.0.0.1 -p 1081',
    '$ sudo dns-proxy-https -s 127.0.0.1 -p 1081 -f 114.114.114.114 -t 500000',
    '$ sudo dns-proxy-https -s 127.0.0.1 -p 1081 -w whitelist.txt'
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

// read whitelist if existed
let whitelist = [];
if (option.whitelist_file) {
  fs.readFile(option.whitelist_file, 'utf8', function (err, data) {
    if (err) {
      winston.info(err);
      return;
    }
    whitelist = data.split('\n').filter(line => {
      return line[0] !== '#'; // ignore comment
    });
  });
}

function requestOverHTTPS(name){
  return new Promise((resolve, reject) => {
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
        resolve(res);
      }
    });
  });
}

function handleRequest(req, response){
  winston.info(`Request ${req.question[0].name}`);
  let question = req.question[0];

  // cache check
  let cacheValue = memory.get(question.name);
  if (cacheValue) {
    winston.info(`${question.name} hit cache`);
    response.answer.push(cacheValue);
    response.send();
    return;
  }

  // whitelist check
  if (mm.any(question.name, whitelist)) {
    // query on fallback DNS
    winston.info(`${req.question[0].name} hit whitelist`);
    let dnsReq = new dns.Request({
      question: makeQuestion(question),
      server: option.fallback,
      timeout: 6000
    });

    dnsReq.on('message', (err, answer) => {
      if (!err) {
        response.answer.push(makeAnswer(answer.answer[0]));
      } else {
        winston.info(err);
      }
      response.send();
    });

    dnsReq.send();
    return;
  }

  // query over https
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
    winston.info(err);
    response.send();
  });
}


let server = dns.createServer();
server.on('listening', () => winston.info('server listening', server.address()));
server.on('close', () => winston.info('server closed', server.address()));
server.on('error', (err) => console.error(err.stack));
server.on('socketError', (err) => console.error(err));

// init
// Resolve GOOGLE_DNS then Start
winston.info(`Resolving Google DNS Service using ${option.fallback}...`);

dns.resolve(GOOGLE_DNS, 'A', option.fallback, function (err) {
  if (err) {
    winston.info(err);
  } else {
    winston.info(`Now start server`);
    server.on('request', handleRequest);
    server.serve(53);
  }
});

// catch all exception
process.on('uncaughtException', function(err) {
  winston.info('Caught exception: ' + err);
});
