import dns from 'native-dns';

// Simple DNS RR type to string conversion to use with native-dns.
// Look here for a comprehensive list of RR types: http://www.zytrax.com/books/dns/ch8/
// copy from https://github.com/OmniscientJV/dns-proxy-for-google-dns-over-https-api/blob/master/app.js
function dnsRRTypeToString(type)
{
  // Default value.
  var t = 'A';
  switch(type)
  {
  case 1:
    t = 'A';
    break;
  case 28:
    t = 'AAAA';
    break;
  case 5:
    t = 'CNAME';
    break;
  case 15:
    t = 'MX';
    break;
  case 6:
    t = 'SOA';
    break;
  }

  return t;
}

export function makeAnswer(record){
  return dns[dnsRRTypeToString(record.type)](record);
}

export function makeQuestion(question){
  return new dns.Question({
    name: question.name,
    type: dnsRRTypeToString(question.type)
  });
}
