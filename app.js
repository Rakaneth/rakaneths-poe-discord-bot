const Request = require('request')
const Discord = require('discord.js')
const config = require('./config.json')
const bot = new Discord.Client()

Commands = {}

function price(itemName) {
    let body = {
        query: {
            status: {
                option: "online"
            },
            name: itemName,
            stats: [{
                type: "and",
                filters: []
            }]
        },
        sort: {
            price: "asc"
        }
    }
    let payload = {
        url: config.searchURI,
        method: 'POST',
        json: true,
        body: body
    }
    return new Promise(function (resolve, reject) {
        Request(payload, (err, response, respBody) => {
            if (err) {
                reject(err)
            } else if (response.statusCode != 200) {
                reject(`Error contacting API, status code ${response.statusCode} ${response.statusMessage}`)
            } else {
                console.log(respBody)
                resolve(respBody)
            }
        })
    })
}

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.username}`)
})

bot.on('message', (msg) => {
    let cmdRegex = /!(.*)/g
    let cmdParse = cmdRegex.exec(msg.content)
    if (cmdParse) {
        let args = cmdParse[1].split(/\s+/)
        let cmdName = args.shift()
        switch (cmdName) {
            case "price":
                price().then(function (result) {
                    msg.channel.send(result.id)
                }).catch(function (err) {
                    msg.channel.send(err)
                })
                break
            default:
                msg.channel.send("Invalid command")
        }
    }
})

bot.login(config.token)
