"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyparser = require("body-parser");
var metrics_1 = require("./metrics");
var app = express();
var port = process.env.PORT || '8080';
var dbMetrics = new metrics_1.MetricsHandler("./db");
app.use(bodyparser.json());
app.use(bodyparser.urlencoded());
app.get('/', function (req, res) {
    res.write('Hello Bob');
    res.end();
});
app.get('/metrics/:id', function (req, res) {
    dbMetrics.get(req.params.id, function (err, result) {
        if (err) {
            throw err;
        }
        res.json(result);
    });
});
app.post('/metrics/:id', function (req, res) {
    console.log(req.body);
    dbMetrics.save(req.params.id, req.body, function (err, result) {
        if (err) {
            res.status(500).send(err.message);
        }
        res.status(200).send();
    });
});
app.listen(port, function (err) {
    if (err) {
        throw err;
    }
    console.log("server is listening on port " + port);
});
