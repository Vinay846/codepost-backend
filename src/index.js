const mongoose = require('mongoose');
const port = 9999
const app = require('./app');

const url = 'mongodb://localhost:27017/Major';

mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
const connection = mongoose.connection;

connection.once("open", ()=>{
    console.log("Database connected");
})

app.listen(process.env.PORT || port, ()=>{
    console.log(`Connected Port ${port}`);
})