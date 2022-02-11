const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const St = imports.gi.St;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const ShellToolkit = imports.gi.St;

const regexIp4and6 = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/;

// Start with IPv4 WAN address as default
var type=24;

function _get_lan_ip4() {
    // Ask the IP stack what route would be used to reach 1.1.1.1 (Cloudflare DNS)
    // Specifically, what src would be used for the 1st hop?
    var command_output_bytes = GLib.spawn_command_line_sync('ip route get 1.1.1.1')[1];
    var command_output_string = '';

    for (var current_character_index = 0;
        current_character_index < command_output_bytes.length;
        ++current_character_index)
    {
        var current_character = String.fromCharCode(command_output_bytes[current_character_index]);
        command_output_string += current_character;
    }

    // Output of the "ip route" command will be a string
    // " ... src 1.2.3.4 ..."
    // So basically we want the next token (word) immediately after the "src"
    // word, and nothing else. This is considerd our LAN IP address.
    var Re = new RegExp(/src [^ ]+/g);
    var matches = command_output_string.match(Re);
    var lanIpAddress;
    if (matches) {
        lanIpAddress = matches[0].split(' ')[1];
    } else {
        lanIpAddress = '';
    }

    return lanIpAddress;
}

function _get_lan_ip6() {
    // Ask the IP stack what route would be used to reach 2001:: (random ipv6 address)
    // Specifically, what src would be used for the 1st hop?
    var command_output_bytes = GLib.spawn_command_line_sync('ip route get 2001::')[1];
    var command_output_string = '';

    for (var current_character_index = 0;
        current_character_index < command_output_bytes.length;
        ++current_character_index)
    {
        var current_character = String.fromCharCode(command_output_bytes[current_character_index]);
        command_output_string += current_character;
    }

    // Output of the "ip route" command will be a string
    // " ... src 2001:xxx:yyy:..."
    // So basically we want the next token (word) immediately after the "src"
    // word, and nothing else. This is considerd our LAN IP address.
    var Re = new RegExp(/src [^ ]+/g);
    var matches = command_output_string.match(Re);
    var lanIpAddress;
    if (matches) {
        lanIpAddress = matches[0].split(' ')[1];
    } else {
        lanIpAddress = '';
    }
    return lanIpAddress;
}

function _get_wan_ip(ipVersion) {
    var command_output_bytes = GLib.spawn_command_line_sync(`curl -sS https://ip${ipVersion}.anysrc.net/plain/clientip`)[1];
    var command_output_string = '';

    for (var current_character_index = 0;
        current_character_index < command_output_bytes.length;
        ++current_character_index)
    {
        var current_character = String.fromCharCode(command_output_bytes[current_character_index]);
        command_output_string += current_character;
    }
    command_output_string=command_output_string.replace('"','').replace('"','').replace('\n','');
    // Validate the result looks like an ipv4 or ipv6 address
    var Re = new RegExp(regexIp4and6);
    var matches = command_output_string.match(Re);
    var wanIpAddress;
    if (matches) {
        wanIpAddress = command_output_string;
    } else {
        wanIpAddress = '';
    }
    return wanIpAddress;
}

const AllIpAddressesIndicator = new Lang.Class({
    Name: 'AllIpAddresses.indicator',
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(0.0, "All IP Addresses Indicator", false);
        this.buttonText = new St.Label({
            text: 'Loading...',
            y_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(this.buttonText);
        this._updateLabel();
    },

    _updateLabel : function(){
        const refreshTime = 10 // in seconds

        if (this._timeout) {
                Mainloop.source_remove(this._timeout);
                this._timeout = null;
        }
        this._timeout = Mainloop.timeout_add_seconds(refreshTime, Lang.bind(this, this._updateLabel));
        // Show the right format
        if (type===14) {
            this.buttonText.set_text("LAN4: "+_get_lan_ip4());            
        } else if (type===16) {
            this.buttonText.set_text("LAN6: "+_get_lan_ip6());
        } else if (type===24) {
            this.buttonText.set_text("WAN4: "+_get_wan_ip('4'));
        } else {  // if (type===26) {
            this.buttonText.set_text("WAN6: "+_get_wan_ip('6'));
        }
    },

    _removeTimeout: function () {
        if (this._timeout) {
            this._timeout = null;
        }
    },

    stop: function () {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
        }
        this._timeout = undefined;

        this.menu.removeAll();
    }
});

let _indicator;

function init() {
    log('All IP Addresses extension initialized');
}

function enable() {
    log('All IP Addresses extension enabled');
    _indicator = new AllIpAddressesIndicator();
    Main.panel.addToStatusArea('all-ip-addresses-indicator', _indicator);
    _indicator.connect('button-press-event', _toggle);
}

function disable() {
    log('All IP Addresses extension disabled');
    _indicator.stop();
    _indicator.destroy();
}

function _toggle() {
    if (type===14) {
        type=16;
    } else if (type===16) {
        type=24;
    } else if (type===24) {
        type=26;
    } else {
        type=14;
    }
    _indicator._updateLabel();
}
