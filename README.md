## dns-proxy-https

DNS proxy server over [Google Public DNS](https://dns.google.com/) with socks supported

Give you a pollution-free and safe local DNS Server(0.0.0.0:53)，but maybe not so fast.
## Usage

``` shell
(sudo) npm install -g dns-proxy-https
sudo dns-proxy-https -s 127.0.0.1 -p 1081
# sudo dns-proxy-https -s 127.0.0.1 -p 1081 -l 8.8.8.8 -t 5000
```

Then set your DNS Server to `127.0.0.1`

## Options

``` shell
-s, --socks_host string   Host of socks proxy(optional)
-p, --socks_port number   Port of socks proxy(default 1080)
-l, --lookup string       DNS to reslove Google DNS address once(Default
                          8.8.8.8)
-t, --cache_time number   Cache time(ms, Default 3000)
```
