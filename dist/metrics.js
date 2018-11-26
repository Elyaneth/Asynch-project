"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var leveldb_1 = __importDefault(require("./leveldb"));
var level_ws_1 = __importDefault(require("level-ws"));
var Metric = /** @class */ (function () {
    function Metric(ts, v) {
        this.timestamp = new Date(ts);
        this.value = v;
    }
    return Metric;
}());
exports.Metric = Metric;
var MetricsHandler = /** @class */ (function () {
    function MetricsHandler(dbPath) {
        this.db = leveldb_1.default.open(dbPath);
    }
    MetricsHandler.prototype.save = function (key, metrics, callback) {
        var stream = level_ws_1.default(this.db);
        stream.on('error', callback);
        stream.on('close', callback);
        metrics.forEach(function (m) {
            stream.write({ key: "metric:" + key + ":" + m.timestamp, value: m.value });
        });
        stream.end();
    };
    MetricsHandler.prototype.get = function (key, callback) {
        var stream = this.db.createReadStream();
        var results = [];
        stream.on('error', callback);
        stream.on('end', function (err) { callback(null, results); });
        stream.on('data', function (data) {
            var _a = data.key.split(":"), k = _a[1], timestamp = _a[2];
            var value = data.value;
            if (k != key) {
                console.log(k, key);
                console.log("levedb error: " + data.key + " key does not match");
            }
            else {
                results.push(new Metric(timestamp, value));
            }
        });
    };
    return MetricsHandler;
}());
exports.MetricsHandler = MetricsHandler;
