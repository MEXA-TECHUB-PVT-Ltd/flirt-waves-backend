const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv')
const bodyParser = require("body-parser");

const pool = require("././app/config/dbconfig")
const imageUploadRouter = require('./app/uploadimage');

const app = express();
// const io = socketIo(server);
const port = 4000;

dotenv.config();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
}));

app.use(express.json())

// app.use('/uploadimage', imageUploadRouter); 


// app.use("/admin", require("./app/routes/admin/adminroutes"))
app.use("/user", require("./app/routes/user/userroutes"));
app.use("/gender", require("./app/routes/gender/genderroutes"));
app.use("/relationship", require("./app/routes/relationship/relationshiproutes"));
app.use("/cookingskill", require("./app/routes/cookingskills/cookingskillsroutes"));
app.use("/habits", require("./app/routes/habits/habitsroutes"));
app.use("/exercises", require("./app/routes/exercise/exerciseroutes"));
app.use("/hobbies", require("./app/routes/hobby/hobbyroutes"));
app.use("/nightlife", require("./app/routes/nightlife/nightliferoutes"));
app.use("/kids", require("./app/routes/kids/kidsroutes"));
app.use("/smoking", require("./app/routes/smoking/smokingroutes"));
app.use("/report", require("./app/routes/reportusers/reportusersroutes"));
app.use("/matches", require("./app/routes/matches/matchesroutes"));
app.use("/favourites", require("./app/routes/favourite/favouriteroutes"));

app.get('/', (req, res) => {
    res.json({ message: 'Flirt Waves !' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
}); 