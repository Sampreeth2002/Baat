const http = require("http");
var express = require("express");
var path = require("path");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
var mysql = require("mysql");
const { weekdays } = require("moment");
const { connect } = require("http2");
var fs = require("fs");
var pdfparse = require("pdf-parse");
var multer = require("multer");
var authenticated = false;
var user_id = -1;
const say = require("say");
const { speak } = require("say");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "gyan",
});

con.connect(function (error) {
  if (error) throw error;
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "")));

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/pdf_files");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage });

//Routes

app.get("/", function (req, res) {
  say.stop();
  say.speak(
    "Welcome to Home page. At any time to go to a different page please press f character on keyboard",
    "Alex",
    0.8
  );
  res.render("home");
});

app.get("/signup", function (req, res) {
  if (authenticated == false) {
    authenticated = false;
    res.render("register");
  } else {
    res.redirect("/landing");
  }
});

app.post("/register", function (req, res) {
  id = req.body.id;
  first_name = req.body.first_name;
  last_name = req.body.second_name;
  mobile_number = req.body.mobile_number;
  image1 = req.body.image1;
  image2 = req.body.image2;
  email = req.body.email;
  password = req.body.password;
  var insertQuery =
    "insert into users_image (id,first_name,last_name,mobile_number,image1,image2,email,password) values(?,?,?,?,?,?,?,?)";
  var query = mysql.format(insertQuery, [
    id,
    first_name,
    last_name,
    mobile_number,
    image1,
    image2,
    email,
    password,
  ]);
  console.log(query);
  con.query(query, function (err, result) {
    if (err) throw err;
    res.redirect("/");
  });
});

app.get("/upload", function (req, res) {
  if (authenticated == false) {
    say.stop();
    say.speak(
      "You are in Face Recognisation login page. Please wait 5 seconds to load this page!",
      "Alex",
      0.8
    );
    res.render("upload");
  } else {
    res.redirect("/landing");
  }
});

var loginFailure = false;
var userFirstName = "";
var userLastName = "";

app.post("/login", function (req, res) {
  if (authenticated == false) {
    var email = req.body.email;
    var password = req.body.password;
    var check = "Select * from users_image where email = ? and password = ?";
    var queryCheck = mysql.format(check, [email, password]);
    con.query(queryCheck, function (err, response) {
      if (err) throw err;
      if (response != "") {
        authenticated = true;
        user_id = response[0].id;
        console.log(user_id);
        userFirstName = response[0].first_name;
        userLastName = response[0].last_name;
        res.redirect("/landing");
      } else {
        res.render("login", {
          loginFailure: loginFailure,
        });
      }
    });
  }
});

app.get("/login", function (req, res) {
  if (authenticated) {
    res.redirect("/landing");
  } else {
    res.render("login.ejs");
  }
});

app.get("/logout", function (req, res) {
  say.stop();
  say.speak("You have succesfully logged out !");
  authenticated = false;
  user_id = -1;
  res.redirect("/");
});

app.get("/fetchImages", function (req, res) {
  var insertQuery = "select * from users_image";
  console.log(insertQuery);
  con.query(insertQuery, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/auth", function (req, res) {
  authenticated = req.body.authenticated;
  user_id = req.body.user_id;
  if (authenticated) {
    var check = "select * from users_image where id= ?";
    var queryCheck = mysql.format(check, [user_id]);
    con.query(queryCheck, function (err, response) {
      if (err) throw err;
      if (response != "") {
        userFirstName = response[0].first_name;
        userLastName = response[0].last_name;
        res.redirect("/landing");
      }
    });
  } else {
    res.redirect("/");
  }
});

app.get("/pdf", function (req, res) {
  res.send("I am PDF");
});

var count = 0;

app.get("/notes", function (req, res) {
  if (authenticated) {
    if (count == 0) {
      say.stop();
      say.speak(
        "You  are in notes page. Please press f button on keyboard to say an instruction or go to other page",
        "Alex",
        0.8
      );
    } else {
      say.stop();
      say.speak("You have succesfully saved note", "Alex", 0.8);
    }

    var insertQuery = "select * from user_notes";
    var query = mysql.format(insertQuery);
    console.log(query);
    con.query(query, function (err, result) {
      if (err) throw err;
      console.log(result);
      res.render("notes", {
        user_id: user_id,
        result: result,
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/pdfToText", function (req, res) {
  if (authenticated) {
    res.render("pdfToText");
  } else {
    res.redirect("/");
  }
});

app.post("/pdfToText", upload.single("file"), function (req, res) {
  if (authenticated) {
    var fileUploadedName = req.body.fileUploadedName;
    console.log(fileUploadedName);
    var pdffile = fs.readFileSync(
      path.resolve(__dirname, "./public/pdf_files/" + fileUploadedName)
    );
    pdfparse(pdffile).then(function (data) {
      var pdfData;
      pdfData = data.text;
      res.render("textToSpeech", {
        pdfData: pdfData,
      });
    });
  } else {
    res.redirect("/");
  }
});

app.post("/speechToText", function (req, res) {
  if (authenticated) {
    var insertQuery = "insert into user_notes (id,notes) values (?,?)";
    var query = mysql.format(insertQuery, [req.body.user_id, req.body.speech]);
    console.log(query);
    con.query(query, function (err, result) {
      if (err) throw err;
      res.redirect("/notes");
    });
  } else {
    res.redirect("/");
  }
});

app.get("/landing", function (req, res) {
  if (authenticated) {
    say.stop();
    say.speak("You have successfully login", "Alex", 0.8);
    res.render("landing", {
      userFirstName: userFirstName,
      userLastName: userLastName,
    });
  } else {
    res.redirect("/");
  }
});

app.get("/news", function (req, res) {
  if (authenticated) {
    res.render("news");
  } else {
    res.redirect("/");
  }
});

//Admin Login

app.get("/adminRegister", function (req, res) {
  res.render("adminRegister");
});

app.post("/adminRegister", function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var comapanyName = req.body.comapanyName;
  var insertQuery =
    "insert into admin (email,name,password,companyName) values(?,?,?,?)";
  var query = mysql.format(insertQuery, [email, name, password, comapanyName]);
  con.query(query, function (err, result) {
    if (err) throw err;
    res.redirect("/");
  });
});

app.get("/adminLogin", function (req, res) {
  res.render("adminLogin");
});

app.post("/adminLogin", (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  // console.log(email, password);
  var insertQuery = `select * from admin where email = ? and password = ?`;
  var query = mysql.format(insertQuery, [email, password]);
  con.query(query, function (err, result) {
    if (err) throw err;
    else if (result != "") {
      res.redirect("/adminLanding");
    } else {
      res.redirect("/adminLogin");
    }
  });
});

app.get("/adminLanding", function (req, res) {
  res.render("adminLanding");
});

app.get("/events", function (req, res) {
  var insertQuery = "select * from events";
  con.query(insertQuery, function (err, results) {
    if (err) throw err;
    else {
      // console.log(results);
      res.render("events", {
        results: results,
      });
    }
  });
});

app.post("/events", function (req, res) {
  var name = req.body.eventName;
  var eventDescription = req.body.eventDescription;
  var duration = req.body.duration;
  var dateTime = req.body.dateTime;
  var image = req.body.image;
  var dateTimeEnding = req.body.dateTimeEnding;
  var query =
    "insert into events (name,eventDescription,duration,dateTime,image,dateTimeEnding) values(?,?,?,?,?,?)";
  var insertQuery = mysql.format(query, [
    name,
    eventDescription,
    duration,
    dateTime,
    image,
    dateTimeEnding,
  ]);
  con.query(insertQuery, function (err, result) {
    if (err) throw err;
    res.redirect("/events");
  });
});

//Socket js Routes
app.get("/room", function (req, res) {
  res.render("index.ejs");
});

app.get("/chat", function (req, res) {
  res.render("chat");
});

//Socket.io Code

const botName = "ChatCord Bot";

//Set Static folder
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  // socket.on("joinRoom", ({ username, room }) => {
  //   const user = userJoin(socket.id, username, room);

  //   socket.join(user.room);

  // });

  socket.emit("message", formatMessage(botName, "Welcome to ChartCord!!"));

  //Broadcast when a user connects
  socket.broadcast.emit(
    "message",
    formatMessage(botName, `${userFirstName} has joined the chat`),
    say.speak(`${userFirstName} has joined the chat`)
  );

  //Runs when client disconnects
  socket.on("disconnect", () => {
    io.emit(
      "message",
      formatMessage(botName, `${userFirstName} has left the chat`),
      say.speak(`${userFirstName} has left the chat`)
    );
  });

  //Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    io.emit("message", formatMessage(userFirstName, msg));
    var mes = formatMessage(userFirstName, msg);
    console.log(mes.text, mes.username, mes.time);
    say.speak(userFirstName + " says " + mes.text);
    // Added into database
    con.query(
      `INSERT INTO messages (user,message,time) values ("${mes.username}","${mes.text}","${mes.time}")`,
      function (err, result) {
        if (err) throw err;
      }
    );
  });
});

// NEWLY ADDED
app.get("/get_messages", function (req, result) {
  con.query("SELECT * FROM messages", function (err, messages) {
    result.end(JSON.stringify(messages));
  });
});
// NEWLY ADDED

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("App listening on port 3000!");
});
