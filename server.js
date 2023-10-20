const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const accessToken = process.env.REACT_APP_API_TOKEN_PRINTFUL;
const accessTokenStripe = process.env.REACT_APP_API_TOKEN_STRIPE;
const stripe = require('stripe')(accessTokenStripe);

const app = express();
app.use(express.json());
app.use(cors());

app.get('/success', async (req, res) => {
  try {
    const { session_id } = req.query; // Obtenha o ID da sessão do Stripe

    // Lógica para criar pedido na Printful após o pagamento bem-sucedido
    // Você pode precisar obter informações do Stripe usando 'session_id'
    // e, em seguida, criar um pedido na Printful com base nessas informações.
    // Exemplo:
    const stripeSession = await stripe.checkout.sessions.retrieve(session_id);

    // Você pode usar informações de 'stripeSession' para criar um pedido na Printful
    const printfulResponse = await criarPedidoNaPrintful(stripeSession);

    console.log('Pedido criado na Printful:', printfulResponse);

    // Redirecionar para a página de sucesso no seu cliente
    res.redirect(process.env.CLIENT_URL + "?success=true");
  } catch (error) {
    console.error('Erro ao criar pedido na Printful:', error);
    res.redirect(process.env.CLIENT_URL + "?success=false");
  }
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
    const { products } = req.body;
    // Obtenha os produtos do corpo da solicitação POST
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
      success_url: process.env.CLIENT_URL + "/success?session_id={CHECKOUT_SESSION_ID}", // Redirecionar para '/success' com session_id
      cancel_url: process.env.CLIENT_URL + "?success=false",
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
  }
});

const criarPedidoNaPrintful = async (stripeSession) => {
  // Lógica para criar um pedido na Printful com base nas informações de stripeSession
  // Certifique-se de passar as informações corretas para a API da Printful e tratá-las adequadamente.
  // Exemplo:
  const printfulResponse = await axios.post('https://api.printful.com/orders', {
    // Preencha as informações necessárias com base em 'stripeSession'
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`, // Acesso com a chave de API da Printful
    },
  });

  return printfulResponse.data;
};

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor intermediário rodando na porta ${PORT}`);
});
