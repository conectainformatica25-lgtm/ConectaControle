import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/store/authStore';
import { Box, Heading, HStack, Text, VStack, Divider, Image } from '@gluestack-ui/themed';
import { useState } from 'react';
import { Alert, Clipboard } from 'react-native';
import { apiPost, apiGet } from '@/services/api/http';

// O PAGBANK_TOKEN agora é mantido apenas no Backend por segurança.

export function SubscriptionScreen() {
  const company = useAuthStore((s: any) => s.company);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [pixData, setPixData] = useState<{ text: string; imageUrl?: string; orderId?: string } | null>(null);

  if (!company) return null;

  const now = new Date();
  const expiresAt = company.status === 'trial' ? new Date(company.trial_ends_at) : (company.expires_at ? new Date(company.expires_at) : now);
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = diffDays <= 0;

  async function handlePay() {
    if (!company) return;
    setLoading(true);
    try {
      // Chamada agora é feita para o NOSSO Backend
      const data: any = await apiPost('/payments/pix', {
        customer: {
          name: company.name || 'Cliente ConectaControle',
          email: 'contato@conectacontrole.com.br',
          tax_id: '00000000000'
        },
        items: [
          {
            reference_id: "plan_mensal",
            name: "Assinatura Mensal ConectaControle",
            quantity: 1,
            unit_amount: 3999
          }
        ]
      });

      if (data.qr_codes && data.qr_codes.length > 0) {
        const qrCode = data.qr_codes[0];
        const imageUrl = qrCode.links?.find((l: any) => l.rel === 'QRCODE.PNG')?.href;
        setPixData({ 
          text: qrCode.text, 
          imageUrl,
          orderId: data.id // Guardamos o ID do pedido para consulta posterior
        });
        setShowQR(true);
      } else {
        console.error('PagBank Erro:', data);
        Alert.alert('Erro', 'Não foi possível gerar a cobrança. Tente novamente mais tarde.');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', error.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmPayment() {
    if (!company || !pixData?.orderId) return;
    setLoading(true);
    
    try {
      // Verifica o status REAL no PagBank via nosso Backend
      const result: any = await apiGet(`/payments/pix/status/${pixData.orderId}`);
      
      if (result.status === 'PAID') {
        // O Backend já cuidou de atualizar o banco de dados.
        // Vamos apenas recarregar os dados da empresa/perfil.
        // Para fins de UX imediata, podemos simular a atualização no estado local também.
        
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        
        const updatedCompany = {
          ...company,
          status: 'active' as const,
          expires_at: newExpiry.toISOString()
        };

        // Atualiza estado global
        useAuthStore.getState().setSession({
          profile: useAuthStore.getState().profile,
          company: updatedCompany
        });

        setShowQR(false);
        Alert.alert('Sucesso', 'Seu pagamento foi confirmado! Assinatura ativa por mais 30 dias.');
      } else {
        Alert.alert('Aguardando', 'Ainda não recebemos a confirmação do pagamento. Tente novamente em instantes.');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível verificar o pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <VStack space="xl" py="$6">
        <Box>
          <Heading size="xl" color="$primary500">Assinatura</Heading>
          <Text color="$textLight500">Gerencie seu acesso ao ConectaControle</Text>
        </Box>

        <Box bg="$white" p="$5" borderRadius="$xl" borderWidth={1} borderColor="$borderLight50">
          <VStack space="md">
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="$bold">Status atual:</Text>
              <Box bg={company.status === 'active' ? '$green100' : (isExpired ? '$red100' : '$blue100')} px="$3" py="$1" borderRadius="$full">
                <Text size="xs" fontWeight="$bold" color={company.status === 'active' ? '$green700' : (isExpired ? '$red700' : '$blue700')}>
                  {company.status === 'trial' ? 'TESTE GRÁTIS' : (company.status === 'active' ? 'ATIVO' : 'EXPIRADO')}
                </Text>
              </Box>
            </HStack>
            
            <HStack justifyContent="space-between">
              <Text color="$textLight500">Validade:</Text>
              <Text fontWeight="$bold">
                {isExpired ? 'Expirado' : `${diffDays} dias restantes`}
              </Text>
            </HStack>

            <Divider my="$2" />
            
            <Text size="sm" color="$textLight500">
               {company.status === 'trial' 
                 ? 'Aproveite seus 7 dias de teste gratuito para conhecer todas as ferramentas.'
                 : 'Sua assinatura mensal garante acesso ilimitado ao PDV, estoque e relatórios.'}
            </Text>
          </VStack>
        </Box>

        {!showQR ? (
          <VStack space="md">
            <Box bg="$primary50" p="$4" borderRadius="$lg" borderWidth={1} borderColor="$primary200">
              <VStack space="xs">
                <Text fontWeight="$bold" color="$primary700">Plano Mensal Profissional</Text>
                <Text size="sm" color="$primary600">Acesso completo por apenas R$ 39,99/mês</Text>
              </VStack>
            </Box>
            
            <AppButton 
              label={loading ? 'Processando...' : 'Ativar Assinatura (Mês)'} 
              onPress={handlePay}
              disabled={loading}
            />
          </VStack>
        ) : (
          <VStack space="xl" alignItems="center" bg="$white" p="$6" borderRadius="$xl" borderWidth={1} borderColor="$primary200">
            <Heading size="md">Pagamento via PIX</Heading>
            {pixData?.imageUrl ? (
              <Image 
                source={{ uri: pixData.imageUrl }} 
                alt="QR Code PIX" 
                style={{ width: 200, height: 200, borderRadius: 8 }}
              />
            ) : (
              <Box bg="$gray100" width={200} height={200} justifyContent="center" alignItems="center" borderRadius="$lg">
                 <Text textAlign="center" size="xs" color="$textLight400">QR CODE</Text>
              </Box>
            )}
            
            <VStack space="sm" w="$full" alignItems="center">
              <Text textAlign="center" size="sm" color="$textLight600">
                Ou utilize o recurso "Pix Copia e Cola":
              </Text>
              {pixData?.text && (
                <Box bg="$gray100" p="$3" borderRadius="$md" borderWidth={1} borderColor="$gray200" w="$full">
                  <Text size="xs" color="$textLight600" numberOfLines={2}>
                    {pixData.text}
                  </Text>
                </Box>
              )}
              {pixData?.text && (
                <AppButton 
                  variant="outline"
                  label="Copiar Código PIX" 
                  onPress={() => {
                    Clipboard.setString(pixData.text);
                    Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência.');
                  }}
                />
              )}
            </VStack>

            <Text textAlign="center" size="sm" color="$textLight600" mt="$4">
              Após o pagamento, clique no botão abaixo para liberar o acesso:
            </Text>
            <AppButton 
              label={loading ? 'Verificando...' : 'Já realizei o pagamento'} 
              onPress={confirmPayment}
              disabled={loading}
            />
            <Text size="xs" color="$primary500" onPress={() => setShowQR(false)}>
              Voltar
            </Text>
          </VStack>
        )}

        <Box alignItems="center" mt="$4">
           <Text size="xs" color="$textLight400" textAlign="center">
             Pagamento processado com segurança via PagSeguro.
           </Text>
        </Box>
      </VStack>
    </Screen>
  );
}
