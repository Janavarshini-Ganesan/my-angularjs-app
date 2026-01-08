const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
// All routes first...

// ✅ Serve static files LAST — after routes
app.use(express.static(path.join(__dirname, '../client')));

// MongoDB connection URI
const uri = "mongodb+srv://janavarshini21:Varshini@cluster0.wvvyjcu.mongodb.net/?appName=Cluster0";

// Function to validate ObjectId format
function isValidObjectId(id) {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

// Connect to MongoDB
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log("MongoDB connected...");

        const db = client.db("tuitionApp");
        const tuitionsCollection = db.collection("tuitions");
        const contactsCollection = db.collection("contacts");
        const userTuitionsCollection = db.collection("userTuitions");
        const tutorsCollection = db.collection("tutors");

        // Serve homepage
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });

        // Fetch tuitions for a specific tutor
        app.get('/tuitions', (req, res) => {
            const tutorName = req.query.tutorName;

            if (!tutorName) {
                return res.status(400).json({ message: "Tutor name is required." });
            }

            tuitionsCollection.find({ tutorName }).toArray()
                .then(results => res.json(results))
                .catch(error => {
                    console.error("Error fetching tuitions:", error);
                    res.status(500).send("Error fetching tuitions.");
                });
        });

        // Fetch user-specific tuitions
        app.get('/api/userTuitions', (req, res) => {
            const tuitionName = req.query.tuitionName;

            if (!tuitionName) {
                return res.status(400).json({ message: "Tuition name is required." });
            }

            userTuitionsCollection.find({ tuitionName }).toArray()
                .then(results => {
                    if (!results.length) {
                        return res.status(404).json({ message: "No tuitions found for this name." });
                    }
                    res.json(results);
                })
                .catch(error => {
                    console.error("Error fetching user tuitions:", error);
                    res.status(500).json({ message: "Error fetching user tuitions.", error: error.message });
                });
        });

        // Add a contact
        app.post('/contact', (req, res) => {
            const contactDetails = req.body;

            contactsCollection.insertOne(contactDetails)
                .then(result => res.status(201).json(result))
                .catch(error => {
                    console.error("Error saving contact details:", error);
                    res.status(500).send("Error saving contact details.");
                });
        });

        // User login
        app.post('/api/login', (req, res) => {
            const { tuitionName, password } = req.body;

            contactsCollection.findOne({ tuitionName, password })
                .then(user => {
                    if (user) {
                        res.status(200).json({ message: 'Login successful' });
                    } else {
                        res.status(401).json({ message: 'Invalid tuition name or password' });
                    }
                })
                .catch(error => {
                    console.error("Error during login:", error);
                    res.status(500).json({ message: 'Error during login.' });
                });
        });

        // Add tuition details
app.post('/api/tuition', async (req, res) => {
    const { tuitionName, tuitions } = req.body;

    if (!tuitionName || !Array.isArray(tuitions)) {
        return res.status(400).json({ message: "Invalid data." });
    }

    try {
        const result = await userTuitionsCollection.updateOne(
            { tuitionName },
            { $push: { tuitions: { $each: tuitions } } },
            { upsert: true }
        );

        res.status(200).json({ message: "Tuition(s) added successfully.", result });
    } catch (err) {
        console.error("Insert error:", err);
        res.status(500).json({ message: "Insert failed.", error: err.message });
    }
});


        // Delete tuition by tuitionName and class
        // Delete tuition by tuitionName and class
app.post('/api/deleteTuition', async (req, res) => {
    const { tuitionName, class: className, subject, fees } = req.body;

    if (!tuitionName || !className || !subject || fees === undefined) {
        return res.status(400).json({ message: "Missing fields." });
    }

    const query = {
        class: className.toString().trim(),
        subject: subject.toString().trim(),
        fees: Number(fees)
    };

    console.log("🗑 Deleting from", tuitionName, "query:", query);

    try {
        const result = await userTuitionsCollection.updateOne(
            { tuitionName },
            { $pull: { tuitions: query } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "No matching tuition found for deletion." });
        }

        res.status(200).json({ message: "Tuition deleted successfully." });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Delete failed.", error: err.message });
    }
});




        
        
        app.get('/api/tuitions', (req, res) => {
            userTuitionsCollection.find({})
                .toArray()
                .then(tuitions => {
                    res.status(200).json(tuitions);
                })
                .catch(error => {
                    console.error("Error fetching tuitions:", error);
                    res.status(500).json({ message: "Error fetching tuitions." });
                });
        });
        
   
        // Edit tuition details
        app.put('/api/tuitions', (req, res) => {
            const { tuitionName, class: className, updatedData } = req.body;

            if (!tuitionName || !className || !updatedData) {
                return res.status(400).json({ message: "Tuition Name, Class, and updated data are required." });
            }

            userTuitionsCollection.updateOne(
                { tuitionName: tuitionName, "tuitions.class": className },
                { $set: { "tuitions.$": updatedData } }
            )
            .then(result => {
                if (result.modifiedCount === 0) {
                    return res.status(404).json({ message: "No matching tuition found for update." });
                }
                res.status(200).json({ message: "Tuition updated successfully." });
            })
            .catch(error => {
                console.error("Error updating tuition:", error);
                res.status(500).json({ message: "Error updating tuition." });
            });
        });

        // Fetch all tutors
        app.get('/api/tutors', (req, res) => {
            tutorsCollection.find().toArray()
                .then(tutors => res.json(tutors))
                .catch(error => {
                    console.error("Error fetching tutors:", error);
                    res.status(500).json({ error: "Failed to fetch tutors" });
                });
        });

        // Add a tutor
        app.post('/api/tutors', (req, res) => {
            const newTutor = req.body;

            tutorsCollection.insertOne(newTutor)
                .then(result => res.status(201).json(result.ops[0]))
                .catch(error => {
                    console.error("Error saving tutor:", error);
                    res.status(500).json({ error: "Failed to save tutor" });
                });
        });

        // Example endpoint to combine collections
app.get('/api/combinedDetails', async (req, res) => {
  try {
    const contacts = await contactsCollection.find().toArray();
    const userTuitions = await userTuitionsCollection.find().toArray();

    const combined = contacts.map(contact => {
      const tuitionEntry = userTuitions.find(t => t.tuitionName === contact.tuitionName);
      return {
        ...contact,
        tuitions: tuitionEntry ? tuitionEntry.tuitions : []
      };
    });

    res.json(combined);
  } catch (err) {
    console.error("Error fetching combined details:", err);
    res.status(500).send("Error fetching combined details.");
  }
});

app.get('/api/generateCombinedDetails', async (req, res) => {
    try {
        const combined = await db.collection('contacts').aggregate([
            {
                $lookup: {
                    from: "userTuitions",
                    localField: "tuitionName",
                    foreignField: "tuitionName",
                    as: "tuitionsData"
                }
            }
        ]).toArray();

        // Optionally drop and insert for fresh combinedDetails
        await db.collection('combinedDetails').deleteMany({});
        await db.collection('combinedDetails').insertMany(combined);

        res.json({ message: "Combined details generated successfully." });
    } catch (err) {
        console.error("Aggregation error:", err);
        res.status(500).send(err);
    }
});


app.get('/api/tuitions/:tuitionName', async (req, res) => {
    const tuitionName = req.params.tuitionName;

    try {
        const results = await db.collection('userTuitions')
            .find({ tuitionName: tuitionName })
            .toArray();

        if (results.length === 0) {
            return res.status(404).json({ message: "No tuitions found for this tuition name." });
        }

        res.json(results);
    } catch (err) {
        console.error("Error fetching tuitions by tuitionName:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

app.get('/api/flattenUserTuitions', async (req, res) => {
    try {
        const userTuitions = await db.collection('userTuitions').find({}).toArray();

        for (const doc of userTuitions) {
            let flattenedTuitions = [];

            // Recursive function to extract class, subject, fees
            function extractTuitions(tuitions) {
                if (!Array.isArray(tuitions)) return;
                for (const tuition of tuitions) {
                    if (tuition.class && tuition.subject && tuition.fees !== undefined) {
                        flattenedTuitions.push({
                            class: tuition.class,
                            subject: tuition.subject,
                            fees: tuition.fees
                        });
                    }
                    if (tuition.tuitions) {
                        extractTuitions(tuition.tuitions);
                    }
                }
            }

            extractTuitions(doc.tuitions);

            // Update the document with flattened tuitions
            await db.collection('userTuitions').updateOne(
                { _id: doc._id },
                { $set: { tuitions: flattenedTuitions } }
            );
        }

        res.status(200).json({ message: "Flattened all userTuitions successfully." });
    } catch (err) {
        console.error("Flattening error:", err);
        res.status(500).json({ message: "Failed to flatten userTuitions." });
    }
});
        
// Clean up userTuitions nested structure
app.get('/api/cleanupUserTuitions', async (req, res) => {
    try {
        const userTuitions = await userTuitionsCollection.find({}).toArray();

        for (const doc of userTuitions) {
            let flattenedTuitions = [];

            // Recursive function to extract tuitions
            function extractTuitions(tuitions) {
                if (!Array.isArray(tuitions)) return;
                for (const tuition of tuitions) {
                    if (tuition.class && tuition.subject && tuition.fees !== undefined) {
                        flattenedTuitions.push({
                            class: tuition.class,
                            subject: tuition.subject,
                            fees: tuition.fees
                        });
                    }
                    if (tuition.tuitions) {
                        extractTuitions(tuition.tuitions);
                    }
                }
            }

            extractTuitions(doc.tuitions);

            // Update the document with clean flat tuitions array
            await userTuitionsCollection.updateOne(
                { _id: doc._id },
                { $set: { tuitions: flattenedTuitions } }
            );
        }

        res.status(200).json({ message: "✅ UserTuitions cleaned up successfully." });
    } catch (err) {
        console.error("Cleanup error:", err);
        res.status(500).json({ message: "❌ Cleanup failed.", error: err.message });
    }
});


        // Cleanup route to flatten tuitions
app.get('/api/cleanupTuitions', async (req, res) => {
  try {
    const docs = await userTuitionsCollection.find({}).toArray();

    for (const doc of docs) {
      let newTuitions = [];

      for (const t of doc.tuitions) {
        if (t.tuitions) {
          // Nested structure found, flatten it
          newTuitions = newTuitions.concat(t.tuitions);
        } else {
          newTuitions.push(t);
        }
      }

      // Update document with cleaned tuitions
      await userTuitionsCollection.updateOne(
        { _id: doc._id },
        { $set: { tuitions: newTuitions } }
      );
    }

    res.send({ message: "✅ All tuition documents cleaned successfully." });
  } catch (err) {
    console.error("Cleanup error:", err);
    res.status(500).send({ message: "Cleanup failed." });
  }
});

            
        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    })
    .catch(error => {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    });
