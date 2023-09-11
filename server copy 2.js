const axios = require('axios');
const accessToken = process.env.REACT_APP_API_TOKEN;

// Array com os IDs ou IDs externos dos produtos que você deseja obter
const productIds = ["id_produto_1", "id_produto_2", "id_produto_3"];

// Função para obter informações de um produto
async function getProductInfo(productId) {
  try {
    const response = await axios.get(`https://api.printful.com/store/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao obter informações do produto:', error);
    throw error;
  }
}

// Array para armazenar as informações dos produtos
const productInfoArray = [];

// Fazer chamadas GET para obter informações de cada produto
for (const productId of productIds) {
  try {
    const productInfo = await getProductInfo(productId);
    productInfoArray.push(productInfo);
  } catch (error) {
    // Lidar com erros, se necessário
  }
}

// Agora, productInfoArray conterá as informações dos três produtos
console.log('Informações dos produtos:', productInfoArray);
