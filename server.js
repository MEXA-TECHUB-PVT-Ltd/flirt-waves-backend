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

const createDirectory = (directory) => {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  };
  
  // Directory for uploads
  const uploadDirectory = './uploads';
  createDirectory(uploadDirectory); // Create the directory if it doesn't exist
  
  // Set storage engine
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
  });
  
  // Initialize multer upload
  const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size if needed
    fileFilter: function (req, file, cb) {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images are allowed'));
      }
    }
  });
  
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Your existing endpoint for uploading images
app.post('/upload', upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: true, msg: 'No images uploaded' });
  }

  const filepaths = req.files.map(file => file.path);
  res.status(200).json({ error: false, msg: 'Images uploaded successfully', files: filepaths });
});
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
app.use("/crush", require("./app/routes/crush/crushroutes"));

app.get('/', (req, res) => {
    res.json({ message: 'Flirt Waves !' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
}); 