# gnome-extension-all-ip-addresses

This is the code behind the GNOME Shell Extension called **ALL IP Addresses**, ~~available in the GNOME Shell Extension store at https://extensions.gnome.org/extension/3994/all-ip-addresses/~~

## Introduction

This extension is based upon the lan-ip-address extension. I added the switch between LAN ipv4, LAN ipv6, WAN ipv4 and WAN IPv6.
This extension will only show the IP-addresses your workstation will use to communicate to the internet or your LAN. Virtual host-only interfaces (like e.g. Docker or VirtualBox interfaces) will not show.

## How it works
To get the different IP addresses, internally this extension runs a shell command to find the interface the workstation will use to reach an addrress in the internet.

## Known limitations
In the atypical case that you are working on a LAN not connected to the Internet (such as an isolated lab), you have no route that could reach public ip-addresses, so things will not work the way this extension is currently designed.

## Credits
This code is based upon a fork of https://github.com/phavekes/gnome-extension-all-ip-addresses , which is based on a fork of https://github.com/Josholith/gnome-extension-lan-ip-address

The changes:
- changed dig to curl to determine public ip, and avoid using google dns
- added wan ipv6 address
- set default to wan ipv4
- fix error/warning message
