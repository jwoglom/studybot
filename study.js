var config = {
    channel: "",
    server: "",
    botName: "studybot"
};
try {
var fs = require("fs");
var irc = require("irc");
var bot = new irc.Client(config.server, config.botName, {
    channels: [config.channel],
    port: 6697,
    secure: true,
    certExpired: true,
    selfSigned: true
});

userList = []
// minutes
studyTime = 30;
freeTime = 10;

fs.readFile("userlist.txt", function(e, data) {
    if(e) throw e;
    if(data.length > 0) {
        userList = (""+data).split('\n');
        console.log("Loaded user list");
    }
});

write = function() {
    fs.writeFile("userlist.txt", userList.join('\n'), function(e) {
        if(e) console.log(e);
        else console.log("OK, wrote user list");
    });
}

bot.addListener("message", function(from, to, text, message) {
    console.log("from: "+from+" to: "+to+" text: "+text+" message: "+message);
    console.log(message);
    if(from == config.botName) return;
    if(text.indexOf(config.botName) != -1) {
        //bot.say(message.args[0], message.nick+" said "+text);
        var msg = text.split(config.botName)[1];
        msg = msg.replace(': ','');
        msg = msg.trim();
        console.log("command: "+msg);
        var msgs = msg.split(' ');
        if(msgs[0] == "help") {
            bot.say(message.args[0], "Studybot version 1.0 by jwoglom");
            bot.say(message.args[0], "Commands: (add|remove) [user], clear, list, start, restart, swap, (free|study) [mins]");
        } else if(msgs[0] == "add") {
            if(msgs.length > 1) {
                for(var i=1; i<msgs.length; i++) {
                    if(userList.indexOf(msgs[i]) == -1) {
                        userList.push(msgs[i]);
                        bot.say(message.args[0], "Added "+msgs[i]);
                    }
                }
            } else {
                if(userList.indexOf(message.nick) != -1) {
                    bot.say(message.args[0], message.nick+", you were already in the list.");
                } else {
                    userList.push(message.nick);
                    bot.say(message.args[0], "Added "+message.nick);
                }
            }
            write();
        } else if(msgs[0] == "remove") {
            if(msgs.length > 1) u = msgs[1];
            else u = message.nick;
            var ol = userList;
            userList = [];
            for(i in ol) {
                if(ol[i] != u) {
                    userList.push(ol[i]);
                } else {
                    bot.say(message.args[0], "Removed "+u);
                }
            }
            write();
        } else if(msgs[0] == "clear") {
            userList = [];
            bot.say(message.args[0], "Cleared list")
        } else if(msgs[0] == "list") {
            bot.say(message.args[0], "Current user list: "+userList.join(', '));
        } else if(msgs[0] == "study") {
            if(msgs.length > 1) {
                studyTime = parseInt(msgs[1]);
                bot.say(message.args[0], "Study time is now "+studyTime+" minutes");
            } else bot.say(message.args[0], "Study time is currently "+studyTime+" minutes");
        } else if(msgs[0] == "free") {
            if(msgs.length > 1) {
                freeTime = parseInt(msgs[1]);
                bot.say(message.args[0], "Free time is now "+freeTime+" minutes");
            } else bot.say(message.args[0], "Free time is currently "+freeTime+" minutes");
        } else if(msgs[0] == "start") {
            bot.say(message.args[0], "Starting -- study time = "+studyTime+" minutes, free time = "+freeTime+" minutes");
            ch = message.args[0];
            start();
        } else if(msgs[0] == "stop") {
            bot.say(message.args[0], "Ending timer");
            stop();
        } else if(msgs[0] == "restart") {
            stop();
            start();
        } else if(msgs[0] == "swap") {
            studying = !studying;
            bot.say(message.args[0], "Mode is now "+(studying?'study':'free')+" time");
        } else if(msgs[0] == "status") {
            if(studying) {
                var d = (+new Date() - ltime) / 1000;
                bot.say(message.args[0], "Mode is currently studying for "+studyTime+" minutes.");
                bot.say(message.args[0], "Started "+(d/60)+":"+(d%60)+" ago");
            } else {
                var d = (+new Date() - ltime) / 1000;
                bot.say(message.args[0], "Mode is currently free for "+freeTime+" minutes.");
                bot.say(message.args[0], "Started "+parseInt(d/60)+":"+parseInt(d%60)+" ago");
            }
        }
    }
});

studying = 0;
timeout = null;
ltime = +new Date();
start = function() {
    ltime = +new Date();
    var pings = " -- pinging: "+userList.join(', ');
    var mult = 1000 * 60;
    if(studying) {
        bot.say(ch, "Study time is over -- free time for "+freeTime+" minutes"+pings);
        studying = !studying;
        timeout = setTimeout(start, freeTime * mult);
        bot.send('MODE', config.channel, '-m');
    } else {
        bot.say(ch, "Free time is over -- study time for "+studyTime+" minutes"+pings);
        studying = !studying;
        timeout = setTimeout(start, studyTime * mult);
        bot.send('MODE', config.channel, '+m');
    }
}

stop = function() {
    clearTimeout(timeout);
}

bot.addListener('error', function(message) {
        console.log('error: ', message);
});

} catch(e) {
    console.log(e);
    bot.say(config.channel, "An error occurred: "+e);
}
