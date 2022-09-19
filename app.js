const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Add your mongoDB connection in the "" below or use your local mongoDB
mongoose.connect("", {useNewUrlParser: true});
// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});


const itemsSchema = new mongoose.Schema ({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Willkommen zur To Do Liste."
});
const item2 = new Item({
    name: "Klicke den + Button für eine neue Aufgabe."
});
const item3 = new Item({
    name: "<-- Klicke hier um eine Aufgabe zu entfernen."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res){

    Item.find({}, function(err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Standardaufgaben hinzugefügt.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Heute",
                newListItems: foundItems
            });
        }

    });

});

app.get("/:customListName", function(req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })

                list.save(function(err) {
                    if (!err) {
                        res.redirect("/" + customListName);
                    }
                });
            } else {
                // Show an existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            };
        };
    });

});

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Heute") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

})

app.post("/loeschen", function(req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Heute") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                res.redirect("/");
            };
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            };
        });
    };

});




let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
    console.log("Server gestartet.");
});