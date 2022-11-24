const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;

require('dotenv').config();

const app = express()

app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kkoxxt5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionsCollection = client.db('doctorsPortal').collection('appointmentOptions')

        const bookingsCollection = client.db('doctorsPortal').collection('bookings')

        //use aggregate to query multiple collection and then merge data

        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date
            const query = {}
            const options = await appointmentOptionsCollection.find(query).toArray();

            //get the bookings of the provided date
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            //code carefully
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;

            })

            res.send(options)
        })

        // API naming convention
        // bookings
        // app.get('/bookings')
        // app.get('/bookings/:id')
        // app.post('/bookings')
        // app.patch('/bookings/:id')
        // app.delete('/bookings/:id')

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            console.log(email)
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();

            res.send(bookings)


        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking.appointmentDate}`;
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingsCollection.insertOne(booking)
            res.send(result);

        })

    }
    finally {


    }
}
run().catch(console.log)

app.get('/', async (req, res) => {
    res.send('doctors portal server is running')
})

app.listen(port, () => console.log(`Doctors portal running on ${port}`))