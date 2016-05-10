## dns-proxy-https

DNS proxy server over [Google Public DNS](https://dns.google.com/) with socks proxy supported

Give you a pollution-free and safe local DNS Server(0.0.0.0:53)，but maybe not so fast.
## Usage

``` shell
sudo npm install -g dns-proxy-https
sudo dns-proxy-https -s 127.0.0.1 -p 1081
# sudo dns-proxy-https -s 127.0.0.1 -p 1081 -f 223.5.5.5 -t 5000
# sudo dns-proxy-https -s 127.0.0.1 -p 1081 -f 223.5.5.5 -t 5000 -w whitelist.txt
```

Then set your DNS Server to `127.0.0.1`

## Whitelist

Maybe you would like to have a whitelist of domains to reslove with your fallback DNS(such as `114.114.114.114`).


## Options

``` shell
Options

  -s, --socks_host string       Host of socks proxy(optional)
  -p, --socks_port number       Port of socks proxy(default 1080)
  -f, --fallback string         DNS to reslove Google DNS address once and
                                whitelist(Default 8.8.8.8)
  -t, --cache_time number       Cache time(ms, Default 300000)
  -w, --whitelist_file string   Whitelist file contains domains to reslove by
                                fallback directly
```
