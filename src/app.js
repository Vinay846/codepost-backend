const express = require('express');
const crypto = require("crypto");
const mongoose = require('mongoose');
const app = express();
const multer = require('multer');
const upload = multer();
const cors = require('cors');

const bcrypt = require('bcrypt');
const session = require('express-session');

const session_secret = "major";

app.use(session({
    secret: session_secret
}));

app.use(cors({
    credentials: true,
    origin: "http://localhost:3000"
}));

app.use(express.json());

app.use(upload.array());
app.use(express.static('public'));

const { userModel, appModel } = require('./models/model');

const isNullOrUndefined = val => val===null || val === undefined;

const SALT = 5;

const randomPath = async () => {
    const path = crypto.randomBytes(4).toString('hex');
    if(path === await appModel.findOne({path})){
        randomPath();
    }
    return path;
}


const AuthMiddleware = async (req, res, next) => {
    if(isNullOrUndefined(req.session) || isNullOrUndefined(req.session.userId)){
        res.status(401).send({error: 'Signin again !'});
    }else{
        next();
    }
}

const FetchPostMiddleware = async (req, res, next) => {
    const path = req.params.path;
    const data = await appModel.findOne({path});
    try{
        if(!isNullOrUndefined(data)){
            
            if(data.Post_Security === 'private'){
                if(data.userId == req.session.userId){
                next();
            }else{
                res.status(401).send({error: 'This is private Post !'});
            }
        }else{
            next();
        }
    }else{
        res.sendStatus(404);
    }
    }catch(error){
        // console.log(error);
        res.sendStatus(404);
    }
}

app.post("/signup", async (req, res)=>{
    const {userName, password, name, email} = req.body;
    // console.log(req.body);
    const existingUser = await userModel.findOne({ userName });
    if(isNullOrUndefined(existingUser)){
        //save user signup data
        const hashedPwd = bcrypt.hashSync(password, SALT);
        const newUser = new userModel({userName, password: hashedPwd, name, email});
        await newUser.save();
        req.session.userId = newUser._id;
        res.status(201).send({success: "Signed up"});
    }else{
        res.status(400).send({error: `Username ${userName} already exists. Please choose another.`})
    }
});

app.post("/login", async (req, res)=>{
    const {userName, password} = req.body;
    const existingUser = await userModel.findOne({userName});

    if(isNullOrUndefined(existingUser)){
        res.status(401).send({error: 'Username does not exists'});
    }else{
        const hashedPwd = existingUser.password;
        if(bcrypt.compareSync(password, hashedPwd)){
            req.session.userId = existingUser._id;
            res.status(200).send({success: 'Logged in'});
        }else{
            res.status(401).send({error: 'Password is incorrect'});
        }
    }
});

app.get('/', async (req, res)=>{
    if(isNullOrUndefined(req.session) || isNullOrUndefined(req.session.userId)){
        res.send("bina login wala");
    }else{
        res.send("login wala");
    }
})


app.post('/new_post', async (req, res)=>{
    const post = req.body;
    try {
        post.path =await randomPath();
        post.userId = req.session.userId;
        if(!isNullOrUndefined(post.password) && post.password.length > 0){
            post.isPassword = true;
        }
        const new_post = new appModel(post);
        await new_post.save();
        // console.log(new_post);
        res.status(201).send(new_post);
    }catch(error){
        // console.log(error);
        res.sendStatus(400);
    }
})

app.post('/post/:path', FetchPostMiddleware, async (req, res)=>{
    const path = req.params.path;
    try{
        const data = await appModel.findOne({path});
        // console.log(data);
        if(isNullOrUndefined(data)){
            res.sendStatus(400);
        }
        else if(data.Expiration !== 'B' && !data.isPassword){
            res.send(data);
        }
        else{
            if(!data.isPassword){
                if(data.Expiration === "B" && req.body.permission === 'true'){
                    await appModel.deleteOne({path});
                    res.status(202).send(data)
                }else{
                    const burnPost = await appModel.aggregate([
                        {$match: {path}},
                        {$project: {isPassword: 1, Expiration: 1, _id: 0}}
                    ])
                    res.send(burnPost);
                }
            }else{
                if(data.Expiration === "B"){
                    if(data.isPassword && req.body.password === data.password  && req.body.permission === 'true'){
                        await appModel.deleteOne({path});
                        res.status(202).send(data)
                    }else{
                        const burnPost = await appModel.aggregate([
                            {$match: {path}},
                            {$project: {isPassword: 1, Expiration: 1, _id: 0}}
                        ])
                        res.send(burnPost);
                    }
                    
                }else{
                    if(req.body.password === data.password){
                        res.send(data);
                    }else{
                        const burnPost = await appModel.aggregate([
                            {$match: {path}},
                            {$project: {isPassword: 1, Expiration: 1, _id: 0}}
                        ])
                        res.send(burnPost);
                    }
                    
                }
            }
        }
    }catch(e){
        sendStatus(400);
    }
})


app.delete('/post/:postId', AuthMiddleware, async (req, res) => {
    const path = req.params.postId;
    try {
        await appModel.deleteOne({path, userId: req.session.userId});
        res.sendStatus(200);
        
    } catch (error) {
        res.sendStatus(404);
    }
});

app.put('/post/:postId', AuthMiddleware, async (req, res) => {
    const path = req.params.postId;
    const post = req.body;
    try {
        const existingPost = await appModel.findOne({path, userId: req.session.userId});
        // console.log("existingPost", existingPost);
        if(isNullOrUndefined(post)){
            res.sendStatus(400);
        }else{
            // console.log(post.password);
            if(!isNullOrUndefined(post.password) && post.password.length > 0){
                post.isPassword = true;
            }else if(!isNullOrUndefined(post.password) && post.password.length <= 0){
                post.isPassword = false;
            }
            const modifyPost = Object.assign(existingPost, post);
            await modifyPost.save();
            res.send(modifyPost);
        }
    } catch (error) {
        res.sendStatus(404);
    }

})



app.get('/editpost/:path', AuthMiddleware, async (req, res)=>{
    const path = req.params.path;
    const Post = await appModel.aggregate([
        {$match: {userId: new mongoose.Types.ObjectId(req.session.userId), path}},
        {$project: {title: 1, code:1, password: 1, path: 1, isPassword: 1, Post_Security:1, Expiration: 1, createdAt: 1, Syntax_Highlighting: 1, _id: 0}}
    ])
    res.send(Post);  
});

app.get('/user_post', AuthMiddleware, async (req, res)=>{
    const allPost = await appModel.aggregate([
        {$match: {userId: new mongoose.Types.ObjectId(req.session.userId)}},
        {$project: {title: 1, path: 1, isPassword: 1, createdAt: 1, Syntax_Highlighting: 1, _id: 0}}
    ])
    res.send(allPost);  
});

app.get("/public_post", async (req, res)=>{
    const allPost = await appModel.aggregate([
        {$match: {Post_Security: "public"}},
        {$project: {title: 1, path: 1, isPassword: 1, createdAt: 1, Syntax_Highlighting: 1, _id: 0}}
    ])
    res.send(allPost);
})

app.get('/userinfo', AuthMiddleware, async (req, res) => {
    const user = await userModel.findById(req.session.userId);
    res.send({user});
})

app.get('/logout', (req, res) => {
    if(!isNullOrUndefined(req.session)){
        req.session.destroy(() => {
            res.sendStatus(200);
        });
    }else{
        res.sendStatus(200);
    }
}); 


module.exports = app;