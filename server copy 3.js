const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors()); // Habilita o CORS para todas as rotas
app.use(express.json()); // Habilita o uso de JSON no corpo da solicitação

const accessToken = process.env.REACT_APP_API_TOKEN;

// Rota para receber os IDs dos produtos e buscar informações no Printful
app.post('/printful/getProducts', async (req, res) => {
  try {
    const { productIds } = req.body;
    const productInfoArray = [];

    for (const productId of productIds) {
      const response = await axios.get(`https://api.printful.com/store/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      productInfoArray.push(response.data);
    }

    console.log('Informações dos produtos:', productInfoArray); // producInfoArray console...................log

    res.json(productInfoArray);
  } catch (error) {
    console.error('Erro ao buscar informações de produtos no servidor Printful:', error);
    res.status(500).json({ error: 'Erro ao buscar informações de produtos no servidor Printful' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor intermediário rodando na porta ${PORT}`);
});
