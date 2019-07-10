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
    let cmdRegex = /^!(.*)/g
    let cmdParse = cmdRegex.exec(msg.content)
    if (cmdParse && msg.channel.name == 'poe-price-checks') {
        let args = cmdParse[1].split(/\s+/)
        let cmdName = args.shift()
        switch (cmdName) {
            case "price":
                let name = args.join(' ')
                price(name).then(function (result) {
                    return new Promise(function (resolve, reject) {
                        let payload = {
                            baseUrl: 'https://www.pathofexile.com/api/trade/fetch',
                            uri: `${result.result.slice(0, 10).join()}?query=${result.id}`,
                            method: 'GET',
                            json: true
                        }
                        Request(payload, (err, response, body) => {
                            if (err) {
                                reject(err)
                            } else if (response.statusCode != 200) {
                                reject(`Error fetching results, status code ${response.statusCode} ${response.statusMessage}`)
                            } else {
                                //console.log(body)
                                resolve(body)
                            }
                        })
                    })
                }).then(function (resObj) {
                    msg.channel.send(`Found ${resObj.result.length} results for ${name}`)
                    console.log(resObj)
                    let priceText = "```\n"
                    for (let listing of resObj.result) {
                        let acct = listing.listing.account.name.padEnd(50, '.')
                        let price = `${listing.listing.price.amount} ${listing.listing.price.currency}`
                        priceText += `${acct}${price}\n`
                    }
                    priceText += "```"
                    msg.channel.send(priceText)
                }).catch(function (err) {
                    msg.channel.send(`Error retrieving search data for ${name}: ${err}`)
                    console.log(err)
                })
                break
            default:
                msg.channel.send("Invalid command")
        }
    }
})

bot.login(config.token)
