const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv')
const bodyParser = require("body-parser");

const pool = require("././app/config/dbconfig")
const imageUploadRouter = require('./app/uploadimage');

const app = express();
// const io = socketIo(server);
const port = 5000;

dotenv.config();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
}));

app.use(express.json())

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check the 'type' field in the request to determine the folder
    const uploadType = req.body.type === 'broker' ? 'broker' : 'profile_image';
    const uploadPath = `./uploads/${uploadType}`;

    // Check if the directory exists, if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

// POST endpoint for uploading images
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: true, msg: 'No file uploaded.' });
  }

  const uploadType = req.body.type === 'broker' ? 'broker' : 'profile_image';
  const imageUrl = `uploads/${uploadType}/${req.file.filename}`;

  res.status(200).json({ error: false, imageUrl: imageUrl });
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/uploadimage', imageUploadRouter); 


app.use("/admin", require("./app/routes/admin/adminroutes"))
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
app.use("/crush", require("./app/routes/crush/crushroutes"));
app.use("/faqs", require("./app/routes/faq/faqroutes"));
app.use("/feedback", require("./app/routes/feedback/feedbackroutes"));
app.use("/payment", require("./app/routes/stripe/striperoutes"));
app.use("/calls", require("./app/routes/calling/callroutes"));

app.get('/', (req, res) => {
    res.json({ message: 'Flirt Waves !' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
}); 