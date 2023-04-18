//jshint esversion:6
//adding express,body-parser and mongoose
const express = require("express");
const bodyParser = require("body-parser");
const _= require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err=> console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
}
// making item schema
const itemsSchema = {
  Name: String,
};

// making 3 Default items with the schema
const Item = mongoose.model("Item" , itemsSchema);

const item1 = new Item({
  Name:"Study MongoDB:("
});
const item2 = new Item({
  Name:"Study JS"
});
const item3 = new Item({
  Name:"Study Python"
});

// insert the default items into arrey
const defaultItems = [item1,item2,item3];

//creating list schema
const listSchema={
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {
  Item.find().then(function(foundItems){
    if (foundItems.length === 0) {
      //check if the default items already exist  
      Item.insertMany(defaultItems).then(function(){
        console.log("Succesfully saved all the items to todolistDB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    } else {
      //if already exist render the 
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){
// adding with the + to the list
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    Name: itemName
  });
  if(listName==="Today")
  {
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName})
    .then((foundList)=>
    {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch((err)=>{
      console.log(err);
    })
  }
});

app.post("/delete", function(req,res){
  // deleting the lines when the checkbox checked
  const checkedItemId= req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today")
  {
    Item.findByIdAndRemove(checkedItemId).then(function(){
      console.log("Succesfully removed");
    })
    .catch(function (err) {
      console.log(err);
    });
    res.redirect("/");

  }
  else
  {
    let doc= List.findOneAndUpdate({name: listName},
      {$pull:{items: {_id: checkedItemId}}},{
        new: true
      }).then((foundList)=>
      {
        res.redirect("/" + listName);
      }).catch( err => console.log(err));
  }

});

app.get("/:customListName", (req,res) => {
  //adding new list that completed by the user
  customListName = _.capitalize(req.params.customListName) ;

  List.findOne({name: customListName}) 
  .then((foundList)=> 
  {
     if(!foundList)
     {
       //Creating a new list 
       const list = new List({
         name: customListName,
         item: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
     }
     else
     {
       //Show an existing list
       res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
     }
  })
  .catch((err)=>{
    console.log(err);
  })
 });  

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
