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

  console.log('Webhook Stripe recebida.');// ----------------------------------------------------------------log

  // Você deve validar a assinatura da webhook para garantir que as notificações são realmente do Stripe.
  // Normalmente, isso envolve verificar a assinatura usando sua chave secreta do Stripe.

  // Aqui você pode lidar com diferentes tipos de eventos, como pagamento bem-sucedido.
  if (event.type === 'checkout.session.completed') {
    console.log('Início da criação do pedido no Printful.');//---------------------------------------------log
    const session = event.data.object;
    
    // A partir daqui, você pode chamar o endpoint /printful/order para criar o pedido no Printful.

    const recipient = {
      name: session.shipping.name,
      address1: session.shipping.address.line1,
      city: session.shipping.address.city,
      state_code: session.shipping.address.state,
      country_code: session.shipping.address.country,
      zip: session.shipping.address.postal_code,
    };

    const items = session.display_items.map(item => ({
      variant_id: item.custom.amount, // Use o valor desejado do seu objeto de produto
      quantity: item.quantity,
      // Você pode adicionar outras informações do item, como a URL da imagem, se necessário.
    }));

    console.log('Detalhes do destinatário:', recipient);//--------------------------------------------log
    console.log('Itens do pedido:', items);//-----------------------------------------------------log

    const printfulOrder = {
      recipient: recipient,
      items: items,
    };

    try {
      const response = await axios.post('https://api.printful.com/orders', printfulOrder, {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor intermediário rodando na porta ${PORT}`);
});