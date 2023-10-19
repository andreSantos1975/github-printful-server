const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const accessToken = process.env.REACT_APP_API_TOKEN_PRINTFUL;
accessTokenStripe = process.env.REACT_APP_API_TOKEN_STRIPE;

const stripe = require('stripe')(accessTokenStripe); 

const app = express();
app.use(express.json());

app.use(cors());



app.post('/printful/stores', async (req, res) => {
  try {
    const { productIds } = req.body;
    console.log('ProductId no server', productIds);

    const productInfoArray = [];

    for (const productId of productIds) {
      const response = await axios.get(`https://api.printful.com/store/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      productInfoArray.push(response.data);
    }

    res.json(productInfoArray);
  } catch (error) {
    console.error('Erro ao buscar informações de produtos:', error);
    res.status(500).json({ error: 'Erro ao acessar o servidor Printful' });
  }
});



app.post('/checkout', async (req, res) => {
  try {
      const { products } = req.body;  // Obtenha os produtos do corpo da solicitação POST
      const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: products.map(item => ({
              price_data: {
                  currency: 'usd',
                  product_data: {
                      name: item.title,
                  },
                  unit_amount: item.price * 100, // O valor precisa ser em centavos
              },
              quantity: item.quantity,
          })),
          mode: 'payment',
          success_url: process.env.CLIENT_URL +"?success=true",
          cancel_url: process.env.CLIENT_URL +"?success=false",
      });

      res.json({ checkoutUrl: session.url });
  } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor intermediário rodando na porta ${PORT}`);
});
