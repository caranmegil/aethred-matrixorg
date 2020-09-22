/*

index.js - code responsible for the Aethred bot on matrix

Copyright (C) 2020  William R. Moore <caranmegil@gmail.com>

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

*/

const sdk = require('matrix-js-sdk');
const request = require('superagent');
const moment = require('moment')

const client = sdk.createClient(process.env.HOST)
var startUp = moment()
client.on("Room.timeline", (evt, room, toStartOfTimeline) => {
    let content = evt.getContent()

    if (toStartOfTimeline) {
        return;
    }

    const evtOriginServerTS = moment(evt.event.origin_server_ts);
    
    if (startUp.isAfter(evtOriginServerTS)) {
        return;
    }

    startUp = evtOriginServerTS

    if (evt.getType() === "m.room.message" && content.body.startsWith("aethred:")) {
        request.get(`${process.env.PERMISSIONS_HOST}/matrix/${evt.event.sender}`).then((response) => {
            if (response.body.results.includes('commander') || response.body.results.includes('master')) {
                request.post(process.env.LINGUA_HOST, {
                    text: content.body
                }).then( (response) => {
                    let responses = response.body.response
                    responses.forEach((item) => {
                        var content = {
                            "body": item,
                            "msgtype": "m.text"
                        };

                        client.sendEvent(room.currentState.roomId, "m.room.message", content, "", (err, res) => {
                            console.log(err);
                        });
                    })
                })
            }
        })
    }
})

client.login("m.login.password", {"user": process.env.USER, "password": process.env.PASSWORD})
.then( (response) => {
    console.log(response)
    client.startClient()
}).catch( (err) => {
    console.log(err)
})