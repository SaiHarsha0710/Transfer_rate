const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Create a new MongoClient and connect to the MongoDB database
const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Access the database and collection
const db = client.db('Transfer_cal'); // Use the actual database name
const visitorsCollection = db.collection('visitors');

// Function to send an email and insert data into the database
function sendingMail(name, email, comment) {
  const site = "transferCalculator";

  // Configure the email transporter using Gmail
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASSWORD,
    },
  });

  // Set the email options
  let mailOptions = {
    from: process.env.USER,
    to: process.env.USER,
    subject: `New Comment from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nComment: ${comment}\nSite: ${site}`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Error sending email:', error);
    }
    console.log('Email sent:', info.response);
  });

  // Insert the comment into the MongoDB database
  visitorsCollection.insertOne(
    { name, email, comment, site },
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
      } else {
        console.log('Data inserted successfully');
      }
    }
  );
}

// Serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Handle form submissions
app.post("/sendMail", (req, res) => {
  const { name, email, comment } = req.body;
  sendingMail(name, email, comment);
  res.redirect("/");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
