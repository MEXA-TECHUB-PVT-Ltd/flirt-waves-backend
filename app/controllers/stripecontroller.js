const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const createproduct = async (req, res) => {

    try {
        const product = await stripe.products.create({
          name: req.body.name,
          type: 'service',
          description: req.body.description,
        });
        res.status(200).json({ product });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }

}

const addNewCard = async (req, res) => {

    try {

        const {
            customer_id,
            card_Name,
            card_ExpYear,
            card_ExpMonth,
            card_Number,
            card_CVC,
        } = req.body;

        const card_token = await stripe.tokens.create({
            card: {
                name: card_Name,
                number: card_Number,
                exp_year: card_ExpYear,
                exp_month: card_ExpMonth,
                cvc: card_CVC
            }
        });

        const card = await stripe.customers.createSource(customer_id, {
            source: `${card_token.id}`
        });

        res.status(200).send({ card: card.id });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}

module.exports = { createproduct, addNewCard };