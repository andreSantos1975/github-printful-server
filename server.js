// server/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors()); // Habilita o CORS para todas as rotas
const accessToken = process.env.REACT_APP_API_TOKEN;



app.get('/printful/stores', async (req, res) => {
  try {
    // Fazer a chamada GET para o servidor Printful
    const response = await axios.get('https://api.printful.com/store/products', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Enviar a resposta do Printful para o cliente
    console.log('response data server', response.data);//---------------RESPONSE DATA --------log

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao fazer a chamada para o servidor Printful:', error);
    res.status(500).json({ error: 'Erro ao acessar o servidor Printful' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor intermediário rodando na porta ${PORT}`);
});
