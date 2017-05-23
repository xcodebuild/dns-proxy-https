## dns-proxy-https

DNS proxy server over [Google Public DNS](https://dns.google.com/) with socks proxy supported

Give you a pollution-free and safe local DNS Server(0.0.0.0:53)，but maybe not so fast.
## Usage

``` shell
sudo npm install -g dns-proxy-https
sudo dns-proxy-https -s 127.0.0.1 -p 1080
# sudo dns-proxy-https -s 127.0.0.1 -p 1080 -f 223.5.5.5 -t 5000
# sudo dns-proxy-https -s 127.0.0.1 -p 1080 -f 223.5.5.5 -t 5000 -w whitelist.txt
```

Then set your DNS Server to `127.0.0.1`

## Whitelist

Maybe you would like to have a whitelist of domains with your fallback DNS(such as `223.5.5.5`) to be CDN friendly.

There is already a list file for Chinese user: [https://raw.githubusercontent.com/CodeFalling/dns-proxy-https/master/chainWhiteList.txt](https://raw.githubusercontent.com/CodeFalling/dns-proxy-https/master/chainWhiteList.txt)

You can download it and use with dns-proxy-https.

## Options

``` shell
Options

  -s, --socks_host string       Host of socks proxy(optional)
  -p, --socks_port number       Port of socks proxy(default 1080)
  -f, --fallback string         DNS to resolve Google DNS address once and
                                whitelist(Default 8.8.8.8)
  -t, --cache_time number       Cache time(ms, Default 300000)
  -w, --whitelist_file string   Whitelist file contains domains to resolve by
                                fallback directly
```
