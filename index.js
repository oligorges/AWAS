const express = require('express')
const exec = require('exec');
const fs = require('fs');
const bodyparser = require('body-parser')
const cookieparser = require('cookie-parser')
const session = require('express-session')
const app = express();
const multer = require('multer')();
const mongoose = require('mongoose')


mongoose.connect('mongodb://localhost:27017/AWAS', {useNewUrlParser: true})

const File = mongoose.model('Files', {  name: String, desc: String, path: String, user: String });
const User = mongoose.model('Users', {  username: {type:String,required:true}, 
                                        password: { type:String, required:true}, 
                                        admin:{ type:Boolean, default:false} });


const login = (req, res, next) => {
  if(!req.session.user){
    res.redirect('/')
  }
  next();
}
app.use(session({secret: " ", saveUninitialized: true,resave: true}))
app.use(bodyparser());
app.use(cookieparser());
app.use((req, res, next)=>{
  console.log(req.method, ' ', req.originalUrl, ' ' , req.session.user,  ' ', req.query, ' ', req.params, ' ', req.body);
  next()
})
app.use('/', express.static('public/general/'))
app.use('/dashboard', login, express.static('public/restricted/'))


app.post('/user', (req,res)=>{
  User.create(new User(req.body)).then(()=>res.redirect('/')).catch((err)=>{res.json(err)})
  req.session.user = Buffer.from(req.body.username).toString('base64')
  if(req.body.admin) res.cookie('type', Math.random()*1000) 
  res.redirect('/dashboard')
})

app.post('/login', (req, res) => {
  User.findOne({username: req.body.username}, (err, user) =>{
    console.log(err, user)
    if(err || !user){
      res.redirect('/')
      return 
    }
    if(req.body.password == user.password){
      req.session.user = Buffer.from(req.body.username).toString('base64')
      if(user.admin) res.cookie('type', Math.random()*1000) 
      res.redirect('/dashboard')
    }else{
      res.redirect('/')
    }
  })
  
})

app.get('/logout', (req, res)=>{
  req.session.destroy();
  res.redirect('/')
})

app.post('/upload', login,multer.single('doc'), (req, res) =>{
  console.log(req.body)
  user = Buffer.from(req.session.user, 'base64').toString('utf8')
  console.log(req.body, ' ', user);
  if(!fs.existsSync('files/'+user)){
    fs.mkdirSync('files/'+user)
  }
  fs.writeFile('files/'+user+'/'+req.file.originalname, req.file.buffer, (err) =>{
    if(err){res.json(err)} 
    else{ 
      File.create(new File({name: req.body.name, desc: req.body.desc, path: 'files/'+user+'/'+req.file.originalname, user: user}))
      res.redirect('/dashboard') 
    }
  })
  
})

app.post('/download', login, (req, res)=>{
    res.download(req.body.path);
})

app.get('/allfiles', login, (req, res) => {
  /*
  fs.readdir('files/', (err, data)=>{
    if(err) res.json(err)
    var all = []
    console.log(data)
    data.forEach((user)=>{
      names = fs.readdirSync('files/'+user)
      if(names){
        all.concat(names)
      }
    })
    res.json(all)
  }) */
  File.find({},(err, result) => {
    console.log(err, result)
    if(err) res.json(err)
    else res.json(result)
  })
});
app.get('/myfiles', login, (req, res) => {
    user = Buffer.from(req.session.user, 'base64').toString('utf8')
    fs.readdir('files/'+user, (err, data)=>{
      if(err) res.json(err)
      else res.json(data)
    });
    /*
    exec(['ls', `${req.query.folder}/`], function(err, out, code) {
        if (err instanceof Error)
          res.json(err);
        else{
          res.json(out);
        }
        
      });
    */
} )

app.post('/file', login, (req, res) => {
  fs.unlink(req.body.path, (err) => {
    if (err) {
      console.error(err)
      res.json(err)
    }
    File.deleteOne({path: req.body.path}, (err)=>{
      if (err) {
        console.error(err)
        res.json(err)
      }
      res.json("File Deleted")
    })
  })
})

app.post('/user/:name', login, (req, res) => {
  User.deleteOne({name:req.query.name}, (err)=>{
    if(err) res.json(err)
    res.json("User Deleted")
  })
})

app.get('/users', login, (req,res)=>{
  User.find({}, (err, data)=>{
    if(err) res.json(err)
    res.json(data)
  })
})

app.listen('8170', (msg)=>{ console.log('Server started on http://localhost:8170') })