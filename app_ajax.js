// Requires Express.js

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var crossfilter = require("./crossfilter.v1.min.js").crossfilter;
var fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));



var visual_attributes = [];
var filtering_attributes = [];

//Read the schema
var schema = fs.readFileSync("public/backend-schema.json");
schema = JSON.parse(schema);
//console.log(schema)
for(var attribute in schema){
	console.log(attribute)
	if(schema[attribute]["visual-attribute"])
		visual_attributes.push(schema[attribute]["name"]);
  if(schema[attribute]["filtering-attribute"])
    filtering_attributes.push(schema[attribute]["name"]);
}
//console.log(visual_attributes)
// Read the CSV file into flights
var dataraw = fs.readFileSync("data/small-data.json");
//var dataraw = fs.readFileSync("250_data.json")
data = JSON.parse(dataraw)
var dimensions = {};
var groups = {};
var ndx = crossfilter(data);
for(var attr in filtering_attributes){
  console.log(filtering_attributes[attr])
  dimension = ndx.dimension(function(d){return d[filtering_attributes[attr]]});
  dimensions[filtering_attributes[attr]] = dimension;
  group = dimension.group();
  groups[filtering_attributes[attr]] = group;
}
  size = ndx.size(),
  all = ndx.groupAll();

// Handle the AJAX requests
app.use("/data",function(req,res,next) {
  
  console.log("Getting /data")
  filter = req.param("filter") ? JSON.parse(req.param("filter")) : {}
  // Loop through each dimension and check if user requested a filter

  // Assemble group results and and the maximum value for each group
  var results = {} 
  var filter_dim;
  var filter_range=[];
  //console.log(filter[dim])
  for(var key in filter){
    filter_dim= key;
  }
  
  Object.keys(dimensions).forEach(function (dim) {

    if (filter[dim]) {
      // In this example the only string variables in the filter are dates
      //console.log("here")
      //console.log(dim)
      console.log(filter[dim])
    
      
      dimensions[dim].filter(filter[dim])
    } else {
      dimensions[dim].filterAll(null)
    }
  })
  
  if(Object.keys(filter).length === 0){
      //dimensions["Ai"].filter(null)
      results["table_data"] = {data:dimensions["Ai"].top(100)}
  }
  else{
      //dimensions[filter_dim].filterRange(filter_range)
      results["table_data"] = {data:dimensions[filter_dim].top(100)}
  }
  Object.keys(groups).forEach(function(key) {
      results[key] = {values:groups[key].all(),top:groups[key].top(1)[0].value}
  })
  //console.log(results)
  //console.log(dimensions["age"].top(100))  
  // Send back as json
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end((JSON.stringify(results)))
})

// Change this to the static directory of the index.html file
app.get('/', routes.index);
app.get('/index2.html', routes.index2)
app.get('/index3.html', routes.index3)
app.get('/index4.html', routes.index4)
app.get('/test.html', routes.test)
app.get('/users', user.list);

var port = process.env.PORT || 3000;
app.listen(port,function() {
  console.log("listening to port "+port)  
})
