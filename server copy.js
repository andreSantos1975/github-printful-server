// server/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(cors()); // Habilita o CORS para todas as rotas
const accessToken = process.env.REACT_APP_API_TOKEN_PRINTFUL;

// Rota para obter informações sobre uma categoria específica
app.get('/printful/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;

    const response = await axios.get(`https://api.printful.com/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const categoryInfo = response.data.result;

    res.json(categoryInfo);
  } catch (error) {
    console.error('Erro ao buscar informações da categoria:', error);
    // Se a categoria não for encontrada ou ocorrer algum erro, você pode enviar um status 404
    res.status(404).json({ error: 'Categoria não encontrada' });
  }
});

// Rota para obter informações de produtos de uma loja
app.post('/printful/stores', async (req, res) => {
  try {
    const { productIds } = req.body;
    console.log('ProductId no server', productIds);//-------------------------------------------log
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor intermediário rodando na porta ${PORT}`);
});

//----------------------------------------------------------------
