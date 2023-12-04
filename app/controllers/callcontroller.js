const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const createCustomer = async (req, res) => {

    try {

        const customer = await stripe.customers.create({
            name: req.body.name,
            email: req.body.email,
        });

        res.status(200).send(customer);

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}

module.exports = { createCustomer };