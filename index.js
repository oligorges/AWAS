const express = require('express')
const exec = require('exec');
const fs = require('fs');
const bodyparser = require('body-parser')
const session = require('express-session')
const app = express();
const multer = require('multer')();
const mongoose = require('mongoose')

app.use('/', express.static('public/'))
mongoose.connect('mongodb://localhost:27017/AWAS', {useNewUrlParser: true})

const File = mongoose.model('Files', { name: String, desc: String, path: String, user: String });

app.use(session({secret: " ", saveUninitialized: true,resave: true}))
app.use(bodyparser());
app.use((req, res, next)=>{
  console.log(req.method, ' ', req.originalUrl, ' ' , req.session.user,  ' ', req.query, ' ', req.params, ' ', req.body);
  next()
})

const login = (req, res, next) => {
  if(!req.session.user){
    res.redirect('/')
  }
  next();
}

app.post('/login', (req, res) => {
  if(req.body.username == "test" || true){
    if(req.body.password == "test" || true){
      req.session.user = Buffer.from(req.body.username).toString('base64')
      res.redirect('/Dashboard.html')
    }
  }
})

app.get('/logout', (req, res)=>{
  req.session.destroy();
  res.redirect('/')
})

app.post('/upload', login, multer.single('doc'), (req, res) =>{
  user = Buffer.from(req.session.user, 'base64').toString('utf8')
  console.log(req.body.doc, ' ', user);
  if(!fs.existsSync('files/'+user)){
    fs.mkdirSync('files/'+user)
  }
  fs.writeFile('files/'+user+'/'+req.file.originalname, req.file.buffer, (err) =>{
    if(err){res.json(err)} 
    else{ 
      File.create(new File({name: "Name", desc: "Desc", path: 'files/'+user+'/'+req.file.originalname, user: user}))
      res.redirect('/dashboard.html') 
    }
  })
  
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
    fs.readdir('files/'+req.query.username, (err, data)=>{
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

app.listen('8170', (msg)=>{ console.log('Server started on http://localhost:8170') })