var pss = require("./index");
var pssApi = pss.api;
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var api = new pssApi();
rl.on('line', line => promptRunCmd(line));
async function promptRunCmd(line) {
    let args = line.split(' ');
    switch (args[0]) {
        default:
            console.log('Missing subcmd');
            break;
        case `help`:
            console.log(`Bruh, check me out yourself. Its really not that complicated!`);
            break;
        case `exit`:
            process.exit();
            break;
        case 'api':
            result = await api.get_api_settings();
            console.log(result);
            break;
        case 'ops':
            result = await api.get_live_ops();
            console.log(result);
            break;
        case 'capi':
            console.log(api.api_settings);
            break;
        case `save`:
            console.log(`Saved ${api.saveDevices()} devices`);
            break;
        case `load`:
            api.devices = await api.loadDevices();
            console.log(`Loaded ${api.devices.length}  devices`);
            break;
        case `devs`:
            var devs = `Devices:`;
            api.devices.forEach(x => devs += `\n${x.key}|${x.checksum}|${x.token}|${x.expires_at.getTime()}`);
            console.log(devs);
            break;
        case `searchuser`:
            var fullArgs = "";
            args.slice(1).forEach((x, i) => { fullArgs += `${x}`; if (i != args.slice(1).length - 1) fullArgs += ` `; });
            if (!fullArgs) return console.log(`No username given!`);
            var result = await api.search_users(fullArgs, true);
            console.log(result);
            break;
        case `searchuserid`:
            var fullArgs = "";
            args.slice(1).forEach((x, i) => { fullArgs += `${x}`; if (i != args.slice(1).length - 1) fullArgs += ` `; });
            if (!fullArgs) return console.log(`No username given!`);
            var result = await api.search_usersid(fullArgs, true);
            console.log(result);
            break;
        case `searchfleet`:
            var fullArgs0 = "";
            args.slice(1).forEach((x, i) => { fullArgs0 += `${x}`; if (i != args.slice(1).length - 1) fullArgs0 += ` `; });
            if (!fullArgs0) return console.log(`No username given!`);
            var result = await api.search_alliances(fullArgs0, true);
            break;
        case `sprites`:
            result = await api.get_sprites();
            console.log(result);
            break;
        case `sprite`:
            var sprite = api.sprites.find(x => x.id == parseInt(args[1]));
            console.log(sprite);
            break;
        case `downsprites`:
            function msToTime(duration) {
                var milliseconds = Math.floor((duration % 1000) / 100),
                    seconds = Math.floor((duration / 1000) % 60),
                    minutes = Math.floor((duration / (1000 * 60)) % 60),
                    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

                hours = (hours < 10) ? "0" + hours : hours;
                minutes = (minutes < 10) ? "0" + minutes : minutes;
                seconds = (seconds < 10) ? "0" + seconds : seconds;

                return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
            }

            result = api.sprites;
            //result = await api.get_sprites();
            console.log(`sprites ${result.length}`);
            var waitTime = 500; //ms
            var exWaitTime = waitTime * result.length; //ms
            const startTime = new Date();
            var doneCount = 0;
            var errorCount = 0;
            var force = (args[1] == "f");
            if (force)
                console.log(`Forcing downloads...`);
            download();
            function download(i = 0, backup = false) {
                var num = result[i] ? result[i].fileid : undefined;
                if (!num) return console.log(`Finished ${i}`);
                var url = `http://dokfcbc7esdbx.cloudfront.net/${num}.png`;
                if (backup)
                    url = `https://pixelstarships.s3.amazonaws.com/${num}.png`;


                var https = require('http');
                if (url.includes(`https://`))
                    https = require('https');
                const fs = require('fs');

                const path = `${__dirname}/pss/${num}.png`;
                if ((!fs.existsSync(path) || force) && num) {
                    console.log(`Downloading ${num}`);
                    const req = https.get(url, (res) => {
                        const filePath = fs.createWriteStream(path);
                        const type = res.headers['content-type'];
                        const size = res.headers['content-length'];
                        res.pipe(filePath);
                        filePath.on('finish', () => {
                            filePath.close();
                            doneCount++;
                            console.log(`\nDownloaded ${result[i].key} ${num}\n${((doneCount / result.length) * 100).toFixed(2)}% ${result.length}/${doneCount}\nWait time: ${msToTime(new Date().getTime() - startTime.getTime())}\nErrors: ${errorCount} ${((errorCount / result.length) * 100).toFixed(2)}%`);
                            if (backup)
                                errorCount--;
                        });
                    });
                    req.on('error', (err) => {
                        //console.log(`FAILED TO DOWNLOAD ${num}`);
                        errorCount++;
                        setTimeout(() => download(i, true), 5000);
                    });
                    setTimeout(() => {
                        i++;
                        if (i <= result.length)
                            download(i);
                    }, waitTime);
                } else {
                    doneCount++;
                    i++;
                    if (i <= result.length)
                        setTimeout(() => download(i), 50);
                    //console.log(`Download Excists ${num}\n${((doneCount / result.length) * 100).toFixed(2)}% ${result.length}/${doneCount}\nExcpected wait time: ${msToTime(startTime.getTime() + new Date().getTime())}`);
                };
            }
            break;
        case `roomsprites`:
            result = await api.get_rooms_sprites();
            console.log(result);
            break;
        case `iship`:
            if (!args[1] || isNaN(args[1])) return console.log(`No user id given.`);
            result = await api.inspect_ship(parseInt(args[1]));
            console.log(result);
            break;
        /*case `getship`:
            if (!args[1] || isNaN(args[1])) return console.log(`No user id given.`);
            result = await api.get_ship(parseInt(args[1]));
            console.log(result);
            break;*/
        case `ships`:
            result = await api.get_ships();
            console.log(result);
            break;
        case `researches`:
            result = await api.get_researches();
            console.log(result);
            break;
        case `roomspurchase`:
            result = await api.get_rooms_purchase();
            console.log(result);
            break;
        case `rooms`:
            result = await api.get_rooms();
            console.log(result);
            break;
        case `characters`:
            result = await api.get_characters();
            console.log(result);
            break;
        case `collections`:
            result = await api.get_collections();
            console.log(result);
            break;
        case `items`:
            result = await api.get_items();
            console.log(result);
            break;
        case `alliances`:
            result = await api.get_alliances();
            console.log(result);
            break;
        case `sales`:
            if (!args[1] || isNaN(args[1])) return console.log(`No item id given.`);
            result = await api.get_sales(parseInt(args[1]));
            console.log(result);
            break;
        case `market`:
            result = await api.market();
            console.log(result);
            break;
        case `allianceusers`:
            if (!args[1] || isNaN(args[1])) return console.log(`No fleet id given.`);
            result = await api.get_alliance_users(parseInt(args[1]));
            console.log(result);
            break;
        case `genkey`:
            result = await api.generate_key();
            console.log(result);
            break;
        case `login`:
            /*const formData = { __RequestVerificationToken: `d3TNKrmzPnzGyCTj_3CAss3vfbm7j9-UHrZGPfh5sbb_A2gWaDsJ_DVLXyfYn90z-ih-qX0Q2HKS947dR-ko1kXwWqrJk41FZ9lkSKWVR641`, token: ``, Email: 'tsambu.kersna@gmail.com', Password: `Im on the duck side13`, RememberMe: 'false' };
            request.post({ url: 'https://pixelstarships.com/Account/Login', formData: formData }, function optionalCallback(err, httpResponse, body) {
                if (err)
                    return console.error('upload failed:', err);
                console.log(formData);
                console.log('Upload successful!  Server responded with:', body);
            });*/
            result = await api.login(``,``);
            console.log(result);
            break;
        case `device`:
            console.log(api.devices);
            var device = new pss.Device();//await api.get_device();
            console.log(device);
            if (device && !device.token) {
                console.log(`Getting access token...`);
                device.cycle_token(api);
                console.log(device);
            }
            break;
    }
}