const express = require('express');

require('dotenv').config();
const app = express();
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 8000;

app.use(cors())
app.use(express.json());

/************ MongoDB Connection ************/
const uri = "mongodb+srv://mdabarik24:1QwkRLvtESJWSk3R@cluster0.lfhefzg.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



const dbConnect = async () => {
    try {
        // client.connect()
        console.log('DB Connected Successfully✅')
    } catch (error) {
        console.log(error.name, error.message)
    }
}
dbConnect()

/** -------- API's Route --------- **/
const usersCollection = client.db("TaskManagementApp").collection("users");
const tasksCollection = client.db("TaskManagementApp").collection("tasks");

app.get('/', (req, res) => {
    res.send("Root route ...");
})

/*--------JWT API---------*/
app.post('/jwt', async (req, res) => {
    console.log('jwt api ...');
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
    res.send({ token });
})

/*-------- users related api's ---------*/
app.post('/users', async (req, res) => {
    const user = req.body;
    const query = { userEmail: user?.userEmail };

    try {
        const existingUser = await usersCollection.findOne(query);

        if (existingUser) {
            return res.send({ message: 'user already exists', insertedId: null });
        } else {
            const result = await usersCollection.insertOne(user);
            return res.send(result);
        }
    } catch (error) {
        // console.error('Error processing user registration:', error);
        return res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.get('/users', async(req, res) => {
    const result = await usersCollection.find().toArray();
    res.send(result);
})

app.delete('/task', async (req, res) => {
    // console.log(req?.query);
    const query = {
        _id: new ObjectId(req?.query?.id)
    }
    const result = await tasksCollection.deleteOne(query);
    res.send(result);
})


app.get('/tasks', async (req, res) => {
    // const result = await tasksCollection.find({ email: req?.query?.email }).toArray();
    const result = await tasksCollection.find({ email: req?.query?.email }).sort({ status: -1 }).toArray();

    res.send(result);
})

// task?id=${id}&email=${user?.email}
app.get('/task', async (req, res) => {
    const result = await tasksCollection.findOne({ _id: new ObjectId(req?.query?.id), email: req?.query?.email });
    res.send(result);
})

app.post('/task', async (req, res) => {
    const task = req.body;
    const result = await tasksCollection.insertOne(task);
    res.send(result);
})

app.patch('/task', async (req, res) => {
    try {
        const id = req?.body?.id;

        // Check if the ID is valid
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }

        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
            $set: {
                title: req?.body?.title,
                description: req?.body?.description,
                deadline: req?.body?.deadline,
                priority: req?.body?.priority
            }
        };

        const result = await tasksCollection.updateOne(filter, updatedDoc, { upsert: true });

        res.send(result);
    } catch (error) {
        // console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.patch('/update', async (req, res) => {
    const filter = { _id: new ObjectId(req?.query?.id), email: req?.query?.email };
    const updatedDoc = {
        $set: {
            status: 'completed'
        }
    }
    const result = await tasksCollection.updateOne(filter, updatedDoc);
    res.send(result);
})


app.listen(port, () => {
    console.log('Server is running..');
})