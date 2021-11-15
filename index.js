import "regenerator-runtime/runtime.js";
import * as Sphinx from "sphinx-bot";
//sqlite
const sqlite3 = require('sqlite3');
//sqlite
require("dotenv").config();
const msg_types = Sphinx.MSG_TYPE;

let initted = false;

const sphinxToken = process.env.SPHINX_TOKEN;

const PREFIX = "tix2";


function init() {
  if (initted) return;
  //sqlite
  let db = new sqlite3.Database('./sqlite3.db', (err) => {
    if(err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
  });
  //sqlite

  //create database
  let createTable = 
            "CREATE TABLE IF NOT EXISTS offers (ID TEXT, OPPONENT TEXT NOT NULL, PRICE INTEGER, NAME TEXT);";
            db.run(createTable, (err) => {
                if(err) {
                  console.error(err.message);
                }
                console.log('Table populated successfully.');
            });
  initted = true;
  //create database

  //set of possible games
  const games = new Set(["Northwestern", "Michigan_State", "Penn_State", "Maryland", "Ohio_State", "Indiana"]);

  const client = new Sphinx.Client();
  client.login(sphinxToken);

  client.on(msg_types.INSTALL, async (message) => {
    console.log("=> Received an install!");
    const embed = new Sphinx.MessageEmbed()
      .setAuthor("tix")
      .setDescription("Welcome to tix!")
      .addField({name: "tix", value: "type '/tix help' for instructions!", inline: true});
    message.channel.send({ embed });
  });

  client.on(msg_types.MESSAGE, async (message) => {
    console.log("=> Received a message!");
    const arr = message.content.split(" ");
    if (arr.length < 2) return;
    if (arr[0] !== "/" + PREFIX) return;
    const cmd = arr[1];

    const isAdmin = message.member.roles.find((role) => role.name === "Admin");
    console.log("isAdmin?", isAdmin);

    switch (cmd) {
      case "help":
        const embed1 = new Sphinx.MessageEmbed()
          .setAuthor("tix")
          .setTitle("Commands")
          .addFields([
            {name: "/tix schedule", value: "prints football schedule"},
            {name: "/tix list [opponent] [price in sats]", value: "lists your offer and asking price for your ticket"},
            {name: "/tix offers [opponent]", value: "produces a list of current ticket offers"},
            {name: "/tix close [opponent] [list price]", value: "remove your ticket offer"},
            {name: "/tix mylistings", value: "shows your active ticket listings"}
          ]);
          message.channel.send({ embed: embed1 });
          return;
      case "schedule":
          const embed2 = new Sphinx.MessageEmbed()
            .setAuthor("tix")
            .setTitle("Schedule")
            .addFields([
              {name: "Northwestern", value: "10/23 @Michigan", inline: true},
              {name: "Michigan_State", value: "10/30 @Michigan State", inline: true},
              {name: "Indiana", value: "11/6 @Michigan", inline: true},
              {name: "Penn_State", value: "11/13 @Penn State", inline: true},
              {name: "Maryland", value: "11/20 @Maryland", inline: true},
              {name: "Ohio_State", value: "11/27 @Michigan", inline: true}
            ]);
            message.channel.send({ embed: embed2 });
            return;
      case "list":
            if (arr.length != 4 || !Number.isInteger(Number.parseInt(arr[3]))) {
              const errorMessage = new Sphinx.MessageEmbed()
              .setAuthor("tix")
              .setTitle("Error")
              .addFields([
              {name: "Incorrect usage", value: "Please refer to /tix help", inline: true},
              ]);
              message.channel.send({ embed: errorMessage });
              return;
            }
            if (!games.has(arr[2])) {
              const errorMessage = new Sphinx.MessageEmbed()
              .setAuthor("tix")
              .setTitle("Error")
              .addFields([
              {name: "Invalid game", value: "Please enter a valid game", inline: true},
              ]);
              message.channel.send({ embed: errorMessage });
              return;
            }
            let id = message.member.id;
            let name = message.member.nickname;
            let insertOffer = 
            "INSERT INTO offers VALUES(?,?,?,?)";
            db.run(insertOffer, [message.member.id, arr[2], arr[3], name], (err) => {
                if(err) {
                  return console.log(err.message);
                }
                console.log('An offer has been inserted.');
            });
            const embed3 = new Sphinx.MessageEmbed()
            .setAuthor("tix")
            .setTitle("Listing")
            .addFields([
              {name: "Success!", value: "Your offer has been listed.", inline: true},
            ]);
            message.channel.send({ embed: embed3 });
            return;
      case "offers":
            if (arr.length != 3) {
              const errorMessage = new Sphinx.MessageEmbed()
              .setAuthor("tix")
              .setTitle("Error")
              .addFields([
              {name: "Incorrect usage", value: "Please refer to /tix help", inline: true},
              ]);
              message.channel.send({ embed: errorMessage });
              return;
            }
            if (!games.has(arr[2])) {
              const errorMessageOffers = new Sphinx.MessageEmbed()
              .setAuthor("tix")
              .setTitle("Error")
              .addFields([
              {name: "Invalid game", value: "Please enter a valid game", inline: true},
              ]);
              message.channel.send({ embed: errorMessageOffers });
              return;
            }

            //build off this embedded message
            const embed4 = new Sphinx.MessageEmbed()
            .setAuthor("tix")
            .setTitle("Offers: " + arr[2]);
            //build off this message

            let select = 
            'SELECT OPPONENT opp, NAME name, PRICE price FROM offers WHERE OPPONENT = ?';
            let opponent = arr[2]; 

            db.all(select, [opponent], (err, rows) => {
              if(err) {
                throw err;
              }
              if(rows.length == 0) {
                embed4.addFields([
                  {name: "No current offers: ", value: "Check back again soon!", inline: true}
                ]);
                message.channel.send({ embed: embed4 });
              }
              else {
                rows.forEach((row) => {
                embed4.addFields([
                  {name: row.name, value: "Price (Sats): " + row.price, inline: true}
                ]);
              });
              message.channel.send({ embed: embed4 });
              }
            });
            return;
      case "close":
            if (arr.length != 4) {
              const errorMessageCLOSE = new Sphinx.MessageEmbed()
              .setAuthor("tix")
              .setTitle("Error")
              .addFields([
              {name: "Incorrect usage", value: "Please refer to /tix help", inline: true},
              ]);
              message.channel.send({ embed: errorMessageCLOSE });
              return;
            }
            if (!games.has(arr[2])) {
              const errorMessageCLOSED = new Sphinx.MessageEmbed()
              .setAuthor("tix")
              .setTitle("Error")
              .addFields([
              {name: "Invalid game", value: "Please enter a valid game", inline: true},
              ]);
              message.channel.send({ embed: errorMessageCLOSED });
              return;
            }
            //fix so it only deletes 1
            let sqlDelete = 'DELETE FROM offers WHERE ROWID=?';
            let sqlFind = 'SELECT ROWID rowid FROM offers WHERE ID=? AND OPPONENT=? AND PRICE=?'
            let ident = message.member.id;
            
            db.all(sqlFind, [ident, arr[2], arr[3]], (err, rows) =>{
              if(err) {
                return console.log(err.message);
              }
              if(rows.length == 0) {
                const noOffer = new Sphinx.MessageEmbed()
                .setAuthor("tix")
                .setTitle("Removal")
                .addFields([
                  {name: "Incorrect usage: ", value: "No such offer exists", inline: true},
                ]);
                message.channel.send({ embed: noOffer });
                return;
              }
              else {
                db.run(sqlDelete, rows[0].rowid, (err, rows) => {
                  if(err) {
                    return console.log(err.message);
                  }
                  else {
                    const embed5 = new Sphinx.MessageEmbed()
                    .setAuthor("tix")
                    .setTitle("Removal")
                    .addFields([
                    {name: "Success!", value: "Your offer has been removed.", inline: true},
                    ]);
                    message.channel.send({ embed: embed5 });
                    console.log('deleted');
                    return;
                  }
                })
              }
            });
            return;
      case "mylistings":
          const listings = new Sphinx.MessageEmbed()
          .setAuthor("tix")
          .setTitle("My listings: ");
          //build off this message

          let selectListings = 
          'SELECT OPPONENT opp, NAME name, PRICE price FROM offers WHERE ID = ?';
          let listerID = message.member.id;

          db.all(selectListings, [listerID], (err, rows) => {
            if(err) {
              throw err;
            }
            rows.forEach((row) => {
              listings.addFields([
                {name: row.opp, value: "Price (Sats): " + row.price, inline: true}
              ]);
            });
            message.channel.send({ embed: listings });
          });
          return;
      default:
        const embed6 = new Sphinx.MessageEmbed()
          .setAuthor("tix")
          .setTitle("Help")
          .addFields([{ name: "Incorrect Usage", value: "type /tix help" }]);
        message.channel.send({ embed: embed6 });
        return;
    }
  });
}

init();
