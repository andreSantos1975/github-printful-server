const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const accessToken = process.env.REACT_APP_API_TOKEN_PRINTFUL;
const accessTokenStripe = process.env.REACT_APP_API_TOKEN_STRIPE;
const stripe = require('stripe')(accessTokenStripe);

const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;

  // Você deve validar a assinatura da webhook para garantir que as notificações são realmente do Stripe.
  // Normalmente, isso envolve verificar a assinatura usando sua chave secreta do Stripe.

  // Aqui você pode lidar com diferentes tipos de eventos, como pagamento bem-sucedido.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Agora você sabe que o pagamento foi bem-sucedido. Você pode lidar com a criação do pedido no Printful ou outras ações necessárias.
    console.log('Pagamento bem-sucedido:', session);
  } else {
    console.log('Evento desconhecido:', event.type);
  }

  res.sendStatus(200); // Responda ao Stripe para confirmar o recebimento da webhook.
});

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
    const { products, recipient } = req.body; // Adicione recipient aos parâmetros da solicitação
    // Obtenha os produtos do corpo da solicitação POST

    const name = recipient.name;
    const address = recipient.address;
    const city = recipient.city;
    const state_code = recipient.state_code;
    const country_code = recipient.country_code;
    const zip = recipient.zip;

    const line_items = products.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
        },
        unit_amount: item.price * 100, // O valor precisa ser em centavos
      },
      quantity: item.quantity,
    }));

    console.log('name no server.js:', name);
    console.log('Address no server.js:', address);
    console.log('city no server.js:', city);
    console.log('state_code  no server.js:', state_code);
    console.log('country_code no server.js:', country_code);
    console.log('zip  no server.js:', zip);

    // Crie a sessão de checkout com a linha de itens estendida
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: process.env.CLIENT_URL + "?success=true",
      cancel_url: process.env.CLIENT_URL + "?success=false",
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
  }
});

app.post('/printful/order', async (req, res) => {
  try {
    const { recipient, items } = req.body; // Obtenha recipient e items do corpo da solicitação POST

    // Crie o objeto de pedido com base nos campos fornecidos
    const order = {
      recipient: {
        name: recipient.name,
        address: recipient.address,
        city: recipient.city,
        state_code: recipient.state_code,
        country_code: recipient.country_code,
        zip: recipient.zip,
      },
      items: items,
    };

    // Realize a solicitação POST para o servidor da Printful
    const response = await axios.post('https://api.printful.com/orders', order, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Responda com a resposta do servidor da Printful
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao fazer o pedido para a Printful:', error);
    res.status(500).json({ error: 'Erro ao fazer o pedido para o servidor Printful' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor intermediário rodando na porta ${PORT}`);
});