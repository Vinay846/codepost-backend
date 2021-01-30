const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
});


const dataSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    Syntax_Highlighting: {
        type: String,
        default: 'None',
    },
    password: {
        type: String,
        default: null,
    },
    isPassword: {
        type: Boolean,
        default: false,
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
    },
    path: {
        type: String,
        required: true,
    },
    Post_Security: {
        type: String,
    },
    Expiration: {
        type: String
    },
    expire10Min: { 
        type: Date, 
        default: Date.now, 
    },
    expire1Hour: { 
        type: Date, 
        default: Date.now, 
    },
    expire1Day: { 
        type: Date, 
        default: Date.now, 
    },
    expire1Week: { 
        type: Date, 
        default: Date.now, 
    },
    expire1Month: { 
        type: Date, 
        default: Date.now, 
    },
    expire1Year: { 
        type: Date, 
        default: Date.now, 
    },
    userId: mongoose.Types.ObjectId

});


dataSchema.index(
    { expire10Min: 1 },
    { expireAfterSeconds: 10*60, partialFilterExpression: { Expiration: '1M' } }
);
dataSchema.index(
    { expire1Hour: 1 },
    { expireAfterSeconds: 1*60*60, partialFilterExpression: { Expiration: '5H' } }
);
dataSchema.index(
    { expire1Day: 1 },
    { expireAfterSeconds: 24*60*60, partialFilterExpression: { Expiration: '1D' } }
);
dataSchema.index(
    { expire1Week: 1 },
    { expireAfterSeconds: 7*24*60*60, partialFilterExpression: { Expiration: '1W' } }
);
dataSchema.index(
    { expire1Month: 1 },
    { expireAfterSeconds: 7*24*60*60, partialFilterExpression: { Expiration: '1MON' } }
);
dataSchema.index(
    { expire1Year: 1 },
    { expireAfterSeconds: 365*24*60*60, partialFilterExpression: { Expiration: '1Y' } }
);


const userModel = mongoose.model("user", userSchema);
const appModel = mongoose.model("data", dataSchema);


module.exports = {
    userModel: userModel,
    appModel: appModel,

};