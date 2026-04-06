import 'dotenv/config';
const API = 'https://api.pagseguro.com/orders';
const dbToken = process.env.PAGBANK_TOKEN || 'dummy'; // Wait, I will supply the token when I run it

async function testPix() {
  const token = process.argv[2];
  if (!token) {
    console.log("Provide token as argument");
    return;
  }
  const response = await fetch(API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reference_id: `sub_test_${Date.now()}`,
      customer: {
        name: 'Cliente ConectaControle',
        email: 'contato@conectacontrole.com.br'
      },
      items: [
        {
          reference_id: "plan_mensal",
          name: "Assinatura Mensal ConectaControle",
          quantity: 1,
          unit_amount: 3999
        }
      ],
      qr_codes: [
        {
          amount: {
            value: 3999
          }
        }
      ]
    })
  });
  console.log("Status:", response.status);
  const data = await response.json();
  console.log("Data:", JSON.stringify(data, null, 2));
}

testPix();
