const express = require('express')
const exec = require('exec');
const app = express.createServer()

app.use('/', express.static('public/'))

app.get('/files/:folder', (req, res) => {
    exec(['ls', `${req.params.folder}/`], function(err, out, code) {
        if (err instanceof Error)
          res.json(err);
        res.json(out);
        res.json(code);
      });
} )

app.listen('8170', (msg)=>{ console.log('Server started on http://localhost:8170') })