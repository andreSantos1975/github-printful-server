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

let temporaryRecipientData = null;

app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;
  const recipient = temporaryRecipientData; // Mova a declaração da variável para o início

  console.log('Webhook Stripe recebida.');//----------------------------------------------------------log
  console.log('recipient recebida no endpoint webhooks/stripe.', recipient);//-----------------------------log



  if (event.type === 'checkout.session.completed') {
    console.log('Início da criação do pedido no Printful.');
    const session = event.data.object;

    console.log('recipient2 recebida2 no2 endpoint2 webhooks2/stripe2.', recipient);
    
    // Resto do código...

    /// Mova a declaração da variável para o início
      recipientData = recipient  || {
      name: '',
      address1: '',
      city: '',
      state_code: '',
      country_code: '',
      zip: '',
    };

    const items = [
      {
        "variant_id": 11513,
        "quantity": 1,
        "files": [
          {
            "url": "http://example.com/files/posters/poster_1.jpg"
          }
        ]
      }
    ];

    const printfulOrder = {
      recipient: recipientData,
      items: items,
    };

    console.log('Conteúdo de printfulOrder:', printfulOrder); // ----------------------------------------log

    try {
      const response = await axios.post('https://api.printful.com/orders',  printfulOrder, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('Pedido criado no Printful:', response.data);
    } catch (error) {
      console.error('Erro ao criar pedido no Printful:', error);
      // Lide com erros apropriadamente
    }

    console.log('Fim da criação do pedido no Printful.');//---------------------------------------------log
    console.log('Pagamento bem-sucedido:', session);//----------------------------------------------------------log
  } else {
    console.log('Evento desconhecido:', event.type);
  }

  console.log('Webhook Stripe processada.');//-----------------------------------------------------log
  res.sendStatus(200); // Responda ao Stripe para confirmar o recebimento da webhook.
});


app.post('/printful/stores', async (req, res) => {
  try {
    const { productIds } = req.body;
    console.log('ProductId no server', productIds);//-------------------------------------------------------log

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

    temporaryRecipientData = recipient; // Armazena o recipient globalmente


    console.log('temporaryRecipientData no endpoint checkout', temporaryRecipientData);//-----------------------------------------log

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor intermediário rodando na porta ${PORT}`);
});